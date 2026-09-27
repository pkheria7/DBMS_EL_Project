import os
import secrets
import bcrypt
import resend
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, EmailStr
from dotenv import load_dotenv

from mongodb import get_users_collection
from auth_utils import create_access_token, get_current_user
from rate_limit import limiter

load_dotenv()
resend.api_key = os.getenv("RESEND_API_KEY")

router = APIRouter(prefix="/api/auth", tags=["authentication"])

OTP_EXPIRY_MINUTES = 10


# ============================================================================
# SCHEMAS
# ============================================================================

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user_id: str
    email: str
    name: str
    user_type: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class ResetPasswordRequest(BaseModel):
    email: EmailStr
    otp: str
    new_password: str


# ============================================================================
# HELPERS
# ============================================================================

def _verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def _hash_password(plain: str) -> str:
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def _send_otp_email(to_email: str, name: str, otp: str):
    resend.Emails.send({
        "from": "TeamSync <onboarding@resend.dev>",
        "to": [to_email],
        "subject": "Your TeamSync password reset code",
        "html": f"""
        <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
          <h2 style="color:#1a1a1a">Password Reset</h2>
          <p>Hi {name},</p>
          <p>Use the code below to reset your TeamSync password.
             It expires in <strong>{OTP_EXPIRY_MINUTES} minutes</strong>.</p>
          <div style="font-size:36px;font-weight:bold;letter-spacing:8px;
                      text-align:center;padding:24px;background:#f4f4f5;
                      border-radius:8px;margin:24px 0">{otp}</div>
          <p style="color:#666;font-size:13px">
            If you didn't request this, you can safely ignore this email.
          </p>
        </div>
        """
    })


# ============================================================================
# LOGIN
# ============================================================================

@router.post("/login", response_model=LoginResponse)
@limiter.limit("5/minute")
def login(request: Request, payload: LoginRequest):
    users_col = get_users_collection()
    user = users_col.find_one({"email": payload.email})

    if not user or not _verify_password(payload.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    token = create_access_token({
        "user_id": str(user["user_id"]),
        "email": user["email"],
        "name": user["name"],
        "user_type": user["user_type"],
    })

    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user_id=str(user["user_id"]),
        email=user["email"],
        name=user["name"],
        user_type=user["user_type"],
    )


# ============================================================================
# ME
# ============================================================================

@router.get("/me")
def me(user: dict = Depends(get_current_user)):
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "user_type": user["user_type"],
    }


# ============================================================================
# FORGOT PASSWORD — generate + email OTP
# ============================================================================

@router.post("/forgot-password", status_code=status.HTTP_200_OK)
@limiter.limit("3/minute")
def forgot_password(request: Request, payload: ForgotPasswordRequest):
    users_col = get_users_collection()
    user = users_col.find_one({"email": payload.email})

    # Always return the same message — don't reveal if email exists
    SAFE_RESPONSE = {"message": "If that email is registered, a reset code has been sent."}

    if not user:
        return SAFE_RESPONSE

    otp = f"{secrets.randbelow(1_000_000):06d}"   # zero-padded 6-digit code
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=OTP_EXPIRY_MINUTES)

    # Upsert: one active OTP per email at a time
    users_col.database["password_resets"].update_one(
        {"email": payload.email},
        {"$set": {"otp": otp, "expires_at": expires_at}},
        upsert=True,
    )

    try:
        _send_otp_email(payload.email, user.get("name", "User"), otp)
    except Exception as e:
        print(f"Email send failed for {payload.email}: {e}")
        # Don't expose email errors to the client

    return SAFE_RESPONSE


# ============================================================================
# RESET PASSWORD — verify OTP + update password
# ============================================================================

@router.post("/reset-password", status_code=status.HTTP_200_OK)
def reset_password(payload: ResetPasswordRequest):
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters.")

    users_col = get_users_collection()
    resets_col = users_col.database["password_resets"]

    record = resets_col.find_one({"email": payload.email})

    if not record:
        raise HTTPException(status_code=400, detail="No reset code found. Please request a new one.")

    # Check expiry
    expires_at = record["expires_at"]
    if expires_at.tzinfo is None:
        expires_at = expires_at.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires_at:
        resets_col.delete_one({"email": payload.email})
        raise HTTPException(status_code=400, detail="Reset code has expired. Please request a new one.")

    # Constant-time OTP comparison to prevent timing attacks
    if not secrets.compare_digest(record["otp"], payload.otp):
        raise HTTPException(status_code=400, detail="Invalid reset code.")

    # Update password
    new_hash = _hash_password(payload.new_password)
    users_col.update_one({"email": payload.email}, {"$set": {"password": new_hash}})

    # Delete used OTP
    resets_col.delete_one({"email": payload.email})

    return {"message": "Password updated successfully."}
