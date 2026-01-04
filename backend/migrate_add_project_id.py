"""
Migration script to add project_id column to archive table
Run this once to update existing database schema
"""

from sqlalchemy import create_engine, text
from database import SQLALCHEMY_DATABASE_URL

def migrate():
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    with engine.connect() as connection:
        try:
            # Check if column already exists
            result = connection.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='archive' AND column_name='project_id'
            """))
            
            if result.fetchone():
                print("✓ project_id column already exists in archive table")
                return
            
            # Add project_id column
            connection.execute(text("""
                ALTER TABLE archive 
                ADD COLUMN project_id INTEGER REFERENCES project(project_id)
            """))
            
            connection.commit()
            print("✓ Successfully added project_id column to archive table")
            
        except Exception as e:
            print(f"✗ Migration failed: {e}")
            connection.rollback()
            raise

if __name__ == "__main__":
    migrate()
