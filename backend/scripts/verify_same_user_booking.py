
import asyncio
import os
import sys
from datetime import date, time
from uuid import uuid4

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal
from app.services.desk_service import DeskService
from app.models.desk import Desk, DeskBooking
from app.schemas.desk import DeskBookingCreate
from app.models.enums import DeskStatus
from app.models.user import User

async def verify_same_user_booking():
    print("Verifying Same User Sequential Booking Logic...")
    async with AsyncSessionLocal() as db:
        service = DeskService(db)
        
        try:
            # 1. Setup: Get a test desk and user
            from sqlalchemy import select
            result = await db.execute(select(Desk).where(Desk.status == DeskStatus.AVAILABLE).limit(1))
            desk = result.scalar_one_or_none()
            
            if not desk:
                print("No available desk found for testing.")
                return

            result = await db.execute(select(User).limit(1))
            user = result.scalar_one_or_none()
            if not user:
                print("No user found for testing.")
                return

            print(f"Testing with Desk: {desk.desk_code} and User: {user.email}")
            
            test_date = date.today()
            
            # 2. User A books Desk 1: 09:00 - 11:00
            booking1_data = DeskBookingCreate(
                desk_id=desk.id,
                start_date=test_date,
                end_date=test_date,
                start_time=time(9, 0),
                end_time=time(11, 0),
                notes="User A Slot 1"
            )
            print("1. User A creates Booking (09:00 - 11:00)...")
            b1, error = await service.create_booking(booking1_data, user)
            if error:
                print(f"   Failed: {error}")
            else:
                print("   Success.")

            # 3. User A books Desk 1: 13:00 - 15:00 (SAME USER, SAME DESK, LATER TIME)
            booking2_data = DeskBookingCreate(
                desk_id=desk.id,
                start_date=test_date,
                end_date=test_date,
                start_time=time(13, 0),
                end_time=time(15, 0),
                notes="User A Slot 2"
            )
            print("2. User A creates Booking (13:00 - 15:00) [Expect Success]...")
            b2, error = await service.create_booking(booking2_data, user)
            if error:
                print(f"   Failed: {error}")
            else:
                print("   Success (Correct Behavior).")

            # 4. User A books Desk 1: 10:00 - 12:00 (Overlap)
            booking3_data = DeskBookingCreate(
                desk_id=desk.id,
                start_date=test_date,
                end_date=test_date,
                start_time=time(10, 0),
                end_time=time(12, 0),
                notes="User A Overlap"
            )
            print("3. User A creates Booking (10:00 - 12:00) [Expect Failure]...")
            b3, error = await service.create_booking(booking3_data, user)
            if error:
                print(f"   Failed as expected: {error}")
            else:
                print("   SUCCEEDED (UNEXPECTED!)")
                
        except Exception as e:
            print(f"Test Exception: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(verify_same_user_booking())
