# Migration script to add phase1_marks and phase2_marks columns to the project table
# Run this script to update your existing database schema

from sqlalchemy import create_engine, text, inspect
from database import SQLALCHEMY_DATABASE_URL

def migrate():
    """Add phase1_marks and phase2_marks columns to the project table"""
    
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={'check_same_thread': False})
    
    # Check existing columns
    inspector = inspect(engine)
    existing_columns = [col['name'] for col in inspector.get_columns('project')]
    
    with engine.connect() as connection:
        # Start a transaction
        trans = connection.begin()
        
        try:
            # Add phase1_marks column if it doesn't exist
            if 'phase1_marks' not in existing_columns:
                connection.execute(text(
                    "ALTER TABLE project ADD COLUMN phase1_marks INTEGER DEFAULT 0"
                ))
                print("✓ Added phase1_marks column")
            else:
                print("- phase1_marks column already exists")
            
            # Add phase2_marks column if it doesn't exist
            if 'phase2_marks' not in existing_columns:
                connection.execute(text(
                    "ALTER TABLE project ADD COLUMN phase2_marks INTEGER DEFAULT 0"
                ))
                print("✓ Added phase2_marks column")
            else:
                print("- phase2_marks column already exists")
            
            # Commit the transaction
            trans.commit()
            print("✓ Migration completed successfully!")
            
        except Exception as e:
            # Rollback on error
            trans.rollback()
            print(f"✗ Error during migration: {e}")
            raise

if __name__ == "__main__":
    print("Starting migration...")
    migrate()
    print("Migration complete!")
