import os
import cloudinary
import cloudinary.uploader
from fastapi import APIRouter, UploadFile, File, HTTPException, Depends
from dotenv import load_dotenv
from auth_utils import get_current_user

load_dotenv()

cloudinary.config(cloudinary_url=os.getenv("CLOUDINARY_URL"))

router = APIRouter(prefix="/api/upload", tags=["uploads"])

ALLOWED_TYPES = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "image/jpeg",
    "image/png",
}
MAX_SIZE_MB = 10


@router.post("/")
async def upload_file(
    file: UploadFile = File(...),
    _=Depends(get_current_user),
):
    if file.content_type not in ALLOWED_TYPES:
        raise HTTPException(
            status_code=400,
            detail=f"File type '{file.content_type}' not allowed. Upload PDF, DOCX, JPG, or PNG.",
        )

    contents = await file.read()
    if len(contents) > MAX_SIZE_MB * 1024 * 1024:
        raise HTTPException(status_code=400, detail=f"File exceeds {MAX_SIZE_MB} MB limit.")

    try:
        result = cloudinary.uploader.upload(
            contents,
            resource_type="auto",
            folder="teamsync",
            use_filename=True,
            unique_filename=True,
        )
        return {"url": result["secure_url"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")
