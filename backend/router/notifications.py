# router/notifications.py
from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from mongodb import get_notifications_collection
from bson import ObjectId

router = APIRouter(
    prefix="/notifications",
    tags=["notifications"]
)

# Pydantic models for request/response
class NotificationCreate(BaseModel):
    message: str
    target_type: str  # "student" or "faculty"
    created_by: str  # admin user ID

class NotificationResponse(BaseModel):
    id: str
    message: str
    target_type: str
    created_by: str
    created_at: str

    class Config:
        from_attributes = True


@router.post("/", status_code=status.HTTP_201_CREATED)
async def create_notification(notification: NotificationCreate):
    """
    Create a new notification for students or faculty.
    Only admin should be able to call this endpoint.
    """
    try:
        # Validate target_type
        if notification.target_type not in ["student", "faculty"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="target_type must be either 'student' or 'faculty'"
            )
        
        # Get notifications collection
        notifications_coll = get_notifications_collection()
        
        # Create notification document
        notification_doc = {
            "message": notification.message,
            "target_type": notification.target_type,
            "created_by": notification.created_by,
            "created_at": datetime.utcnow().isoformat()
        }
        
        # Insert into MongoDB
        result = notifications_coll.insert_one(notification_doc)
        
        # Return the created notification
        notification_doc["id"] = str(result.inserted_id)
        notification_doc.pop("_id", None)
        
        return {
            "message": "Notification created successfully",
            "notification": notification_doc
        }
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creating notification: {str(e)}"
        )


@router.get("/{target_type}", response_model=List[NotificationResponse])
async def get_notifications(target_type: str):
    """
    Get all notifications for a specific user type (student or faculty).
    Returns notifications in reverse chronological order (newest first).
    """
    try:
        # Validate target_type
        if target_type not in ["student", "faculty"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="target_type must be either 'student' or 'faculty'"
            )
        
        # Get notifications collection
        notifications_coll = get_notifications_collection()
        
        # Query notifications for the target type
        notifications = list(
            notifications_coll.find({"target_type": target_type})
            .sort("created_at", -1)  # Sort by newest first
        )
        
        # Convert ObjectId to string and format response
        result = []
        for notif in notifications:
            result.append({
                "id": str(notif["_id"]),
                "message": notif["message"],
                "target_type": notif["target_type"],
                "created_by": notif["created_by"],
                "created_at": notif["created_at"]
            })
        
        return result
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching notifications: {str(e)}"
        )


@router.delete("/{notification_id}")
async def delete_notification(notification_id: str):
    """
    Delete a notification by ID.
    Only admin should be able to call this endpoint.
    """
    try:
        # Get notifications collection
        notifications_coll = get_notifications_collection()
        
        # Delete the notification
        result = notifications_coll.delete_one({"_id": ObjectId(notification_id)})
        
        if result.deleted_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notification not found"
            )
        
        return {"message": "Notification deleted successfully"}
    
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error deleting notification: {str(e)}"
        )
