from pymongo import MongoClient
from pymongo.errors import ConnectionFailure
import os
from dotenv import load_dotenv
from urllib.parse import quote_plus

# Load environment variables from .env file
load_dotenv()

# MongoDB connection settings
# MongoDB Atlas connection string from environment variable
MONGODB_URL = os.getenv("MONGODB_URL")
DATABASE_NAME = "teamsync_auth"

if not MONGODB_URL:
    raise ValueError("MONGODB_URL environment variable is not set. Please check your .env file.")

# If the URL contains unencoded credentials, parse and encode them
if "mongodb+srv://" in MONGODB_URL:
    try:
        # Extract the part after mongodb+srv://
        after_protocol = MONGODB_URL.split("mongodb+srv://")[1]
        
        # Find the last @ which separates credentials from host
        # Count @ symbols - if more than 1, there's an @ in the password
        at_count = after_protocol.count("@")
        
        if at_count >= 2:
            # Multiple @ means password contains @
            # Split only on the LAST @ to get host
            parts = after_protocol.rsplit("@", 1)
            creds_part = parts[0]
            host_part = parts[1]
            
            if ":" in creds_part:
                username, password = creds_part.split(":", 1)
                # Encode the credentials
                encoded_username = quote_plus(username)
                encoded_password = quote_plus(password)
                # Reconstruct the URL
                MONGODB_URL = f"mongodb+srv://{encoded_username}:{encoded_password}@{host_part}"
    except Exception as e:
        print(f"Warning: Could not parse MongoDB URL: {e}")
        pass  # If parsing fails, use the URL as-is

# Initialize MongoDB client
try:
    client = MongoClient(MONGODB_URL)
    # Test the connection
    client.admin.command('ping')
    print(f"✓ Successfully connected to MongoDB at {MONGODB_URL}")
except ConnectionFailure as e:
    print(f"✗ Failed to connect to MongoDB: {e}")
    client = None

# Get database
db = client[DATABASE_NAME] if client is not None else None

# Collections
users_collection = db["users"] if db is not None else None
resumes_collection = db["resumes"] if db is not None else None
notifications_collection = db["notifications"] if db is not None else None

# Note: Create indexes manually in MongoDB Atlas UI if needed
# Users collection: Create unique index on "email" field
# Users collection: Create index on "user_id" field  
# Resumes collection: Create unique index on "student_id" field
# Notifications collection: Create index on "target_type" field

def get_users_collection():
    """Get users collection"""
    if users_collection is None:
        raise Exception("MongoDB users collection is not available")
    return users_collection

def get_resumes_collection():
    """Get resumes collection"""
    if resumes_collection is None:
        raise Exception("MongoDB resumes collection is not available")
    return resumes_collection

def get_notifications_collection():
    """Get notifications collection"""
    if notifications_collection is None:
        raise Exception("MongoDB notifications collection is not available")
    return notifications_collection
