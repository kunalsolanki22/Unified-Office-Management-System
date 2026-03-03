
import asyncio
import os
import sys

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import engine
from sqlalchemy import text

async def migrate_desk_times():
    """Add start_time and end_time columns to desk_bookings table."""
    print("Starting migration: Adding time columns to desk_bookings...")
    
    async with engine.begin() as conn:
        # Check if columns exist (simple check by trying to select them, or just use identifying method)
        # PostgreSQL: ALTER TABLE ... ADD COLUMN IF NOT EXISTS ...
        
        try:
            await conn.execute(text("ALTER TABLE desk_bookings ADD COLUMN IF NOT EXISTS start_time TIME NULL;"))
            await conn.execute(text("ALTER TABLE desk_bookings ADD COLUMN IF NOT EXISTS end_time TIME NULL;"))
            print("Migration successful: Columns added.")
        except Exception as e:
            print(f"Migration failed: {e}")

if __name__ == "__main__":
    asyncio.run(migrate_desk_times())
