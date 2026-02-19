
import asyncio
import sys
import os

# Create backend module path
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.join(current_dir, '..', 'backend')
sys.path.append(backend_dir)

from app.core.database import AsyncSessionLocal
from app.models.desk import DeskBooking
from sqlalchemy import delete

async def clear_bookings():
    print("Clearing all desk bookings...")
    async with AsyncSessionLocal() as db:
        await db.execute(delete(DeskBooking))
        await db.commit()
    print("All desk bookings cleared.")

if __name__ == "__main__":
    asyncio.run(clear_bookings())
