
import asyncio
import pytest
from datetime import date, time, timedelta, datetime
from uuid import uuid4
from sqlalchemy import select, delete
from sqlalchemy.orm import selectinload

from app.core.database import AsyncSessionLocal
from app.models.desk import Desk, DeskBooking
from app.models.user import User
from app.models.enums import DeskStatus, BookingStatus, UserRole
from app.services.desk_service import DeskService
from app.schemas.desk import DeskBookingCreate

async def verify_cancellation():
    async with AsyncSessionLocal() as db:
        service = DeskService(db)
        
        # 1. Setup Data
        # Get/Create User
        result = await db.execute(select(User).limit(1))
        user = result.scalar_one_or_none()
        if not user:
            print("No user found, creating temporary user")
            user = User(
                user_code="TEST_CANCEL",
                email="test_cancel@cygnet.com",
                hashed_password="hash",
                first_name="Test",
                last_name="Cancel",
                role=UserRole.EMPLOYEE,
                is_active=True
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)

        # Create Desk
        desk = Desk(
            desk_code=f"D-TEST-{uuid4().hex[:4]}",
            desk_label="Cancellation Test Desk",
            status=DeskStatus.AVAILABLE,
            is_active=True,
            created_by_code=user.user_code
        )
        db.add(desk)
        await db.commit()
        await db.refresh(desk)
        print(f"Created Desk: {desk.desk_code} ({desk.id})")

        try:
            # 2. Book Desk
            today = date.today()
            now = datetime.now()
            start_t = (now + timedelta(minutes=5)).time()
            end_t = (now + timedelta(minutes=60)).time()
            
            booking_data = DeskBookingCreate(
                desk_id=desk.id,
                start_date=today,
                end_date=today,
                start_time=start_t,
                end_time=end_t,
                notes="Test Cancellation"
            )
            
            booking, error = await service.create_booking(booking_data, user)
            if error:
                print(f"Booking failed: {error}")
                return
            print(f"Booking Created: {booking.id}")
            
            # 3. Verify Locked
            desks, _ = await service.list_desks(
                booking_date=today,
                start_time=start_t,
                end_time=end_t
            )
            target_desk = next((d for d in desks if d.id == desk.id), None)
            print(f"Status BEFORE Cancel: {target_desk.status} (Expected: BOOKED)")
            assert target_desk.status == DeskStatus.BOOKED, "Desk should be BOOKED"
            
            # 4. Cancel Booking
            success, error = await service.cancel_booking(booking.id, user, "Testing release")
            print(f"Cancellation Result: {success} ({error})")
            assert success, "Cancellation failed"
            
            # 5. Verify Unlocked
            desks_after, _ = await service.list_desks(
                booking_date=today,
                start_time=start_t,
                end_time=end_t
            )
            target_desk_after = next((d for d in desks_after if d.id == desk.id), None)
            print(f"Status AFTER Cancel: {target_desk_after.status} (Expected: AVAILABLE)")
            assert target_desk_after.status == DeskStatus.AVAILABLE, "Desk should be AVAILABLE after cancel"
            
            print("SUCCESS: Cancellation correctly releases desk lock.")
            
        finally:
            # Cleanup
            print("Cleaning up...")
            await db.execute(delete(DeskBooking).where(DeskBooking.desk_id == desk.id))
            await db.execute(delete(Desk).where(Desk.id == desk.id))
            if user.user_code == "TEST_CANCEL":
                await db.execute(delete(User).where(User.id == user.id))
            await db.commit()

if __name__ == "__main__":
    asyncio.run(verify_cancellation())
