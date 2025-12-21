from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel, EmailStr
import bcrypt
from mongodb import get_users_collection

router = APIRouter(prefix="/api/auth", tags=["authentication"])


# Pydantic schemas
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    user_id: str
    email: str
    name: str
    user_type: str
    message: str


# Utility function
def verify_password(plain_password: str, hashed_password: str) -> bool:
    return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))


# Login endpoint - Now uses MongoDB
@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest):
    # Get MongoDB users collection
    users_col = get_users_collection()
    
    # Find user by email in MongoDB
    user = users_col.find_one({"email": payload.email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    # Verify password
    if not verify_password(payload.password, user["password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "user_type": user["user_type"],
        "message": "Login successful"
    }


# Get current user info (optional endpoint) - Uses MongoDB
@router.get("/me")
def get_current_user(email: str):
    users_col = get_users_collection()
    user = users_col.find_one({"email": email})
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return {
        "user_id": user["user_id"],
        "email": user["email"],
        "name": user["name"],
        "user_type": user["user_type"]
    }
