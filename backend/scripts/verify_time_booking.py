
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

async def verify_time_based_booking():
    print("Verifying Time-Based Booking Logic...")
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
            
            # 3. Create Booking 1: 09:00 - 11:00
            test_date = date.today()
            booking1_data = DeskBookingCreate(
                desk_id=desk.id,
                start_date=test_date,
                end_date=test_date,
                start_time=time(9, 0),
                end_time=time(11, 0),
                notes="Booking 1"
            )
            print("Creating Booking 1 (09:00 - 11:00)...")
            b1, error = await service.create_booking(booking1_data, user)
            if error:
                print(f"Booking 1 Failed: {error}")
            else:
                print("Booking 1 Created Successfully.")

            # 4. Create Booking 2: 10:00 - 12:00 (Should Fail - Overlap)
            booking2_data = DeskBookingCreate(
                desk_id=desk.id,
                start_date=test_date,
                end_date=test_date,
                start_time=time(10, 0),
                end_time=time(12, 0),
                notes="Booking 2"
            )
            print("Creating Booking 2 (10:00 - 12:00) [Expect Failure]...")
            b2, error = await service.create_booking(booking2_data, user)
            if error:
                print(f"Booking 2 Failed as expected: {error}")
            else:
                print("Booking 2 SUCCEEDED (UNEXPECTED!)")
                if b2: # Cleanup if unexpectedly created
                    await service.delete_booking(b2.id, user) 

            # 5. Create Booking 3: 11:00 - 13:00 (Should Succeed - Adjacent)
            booking3_data = DeskBookingCreate(
                desk_id=desk.id,
                start_date=test_date,
                end_date=test_date,
                start_time=time(11, 0),
                end_time=time(13, 0),
                notes="Booking 3"
            )
            print("Creating Booking 3 (11:00 - 13:00) [Expect Success]...")
            b3, error = await service.create_booking(booking3_data, user)
            if error:
                print(f"Booking 3 Failed: {error}")
            else:
                print("Booking 3 Created Successfully.")
                
        except Exception as e:
            print(f"Test Exception: {e}")
            import traceback
            traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(verify_time_based_booking())
