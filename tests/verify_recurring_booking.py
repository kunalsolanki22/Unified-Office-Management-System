
print("Starting reproduction script...")
import asyncio
import sys
from datetime import date, time, timedelta

# Adjust path to include backend
sys.path.append('backend')

from app.core.database import AsyncSessionLocal
from app.services.desk_service import DeskService
from app.models.desk import DeskBooking, Desk
from app.models import user as user_model
from app.models.enums import UserRole, ManagerType, BookingStatus
from app.schemas.desk import DeskCreate, DeskBookingCreate
from sqlalchemy import delete, select

async def reproduce_issue():
    async with AsyncSessionLocal() as db:
        desk_service = DeskService(db)
        
        # 0. Cleanup
        print("Cleaning up DB...")
        await db.execute(delete(DeskBooking))
        await db.execute(delete(Desk).where(Desk.desk_code.like("TEST-%")))
        await db.commit()
        
        # 1. Create User & Desk
        user = user_model.User(user_code="TESTUSER", email="test@cygnet.com", role=UserRole.EMPLOYEE)
        
        # We need a real user in DB or mock? 
        # The service uses `user.user_code`. If FK constraint exists, we need a real user.
        # Let's check if we can mock or need to insert.
        # Ideally we use an existing user code if possible, or insert one.
        # For safety, let's try to fetch an existing user or insert a temp one.
        # Checking schema: DeskBooking.user_code -> users.user_code.
        
        # Let's insert a test user for safety
        # derived from outer import
        stmt = select(user_model.User).where(user_model.User.user_code == "TESTUSER")
        result = await db.execute(stmt)
        test_user = result.scalar_one_or_none()
        if not test_user:
            test_user = user_model.User(
                user_code="TESTUSER", 
                email="test@cygnet.com", 
                first_name="Test",
                last_name="User",
                role=UserRole.EMPLOYEE,
                is_active=True
            )
            # Depending on User model hash_password might be needed
            test_user.hashed_password = "hashed_password" 
            db.add(test_user)
            await db.commit()
            await db.refresh(test_user)
        
        desk_data = DeskCreate(desk_label="TEST-DESK-A2", has_monitor=True)
        desk, err = await desk_service.create_desk(desk_data, test_user) # Needs manager? Service checks role.
        # We can bypass service check by inserting directly if needed, or mock user role.
        test_user.role = UserRole.MANAGER
        test_user.manager_type = ManagerType.DESK_CONFERENCE
        
        if err and "Only DESK" in err:
             # Force role update just in case
             pass 
        
        if not desk:
            # Maybe created in previous run
             desk = await desk_service.get_desk_by_code("TEST-DESK-A2")
             if not desk:
                 # Create via logic if service fails
                 desk = Desk(desk_label="TEST-DESK-A2", created_by_code=test_user.user_code, is_active=True)
                 db.add(desk)
                 await db.commit()
        
        print(f"Desk Created: {desk.id}")

        # 2. Create Booking: 18/2 (Feb 18) to 20/2 (Feb 20). Time 9:15pm (21:15) to 10:00am.
        # Use relative dates to ensure it works whenever we run this
        today = date.today()
        d1 = today
        d2 = today + timedelta(days=2) # 3 days total: today, ymrw, day after
        
        start_t = time(21, 15)
        end_t = time(10, 0)
        
        print(f"Creating Booking: {d1} to {d2}, {start_t} to {end_t}")
        
        booking_data = DeskBookingCreate(
            desk_id=desk.id,
            start_date=d1,
            end_date=d2,
            start_time=start_t,
            end_time=end_t
        )
        
        booking, err = await desk_service.create_booking(booking_data, test_user)
        if err:
            print(f"FAILED to create booking: {err}")
            return
            
        print(f"Booking Created: {booking.id}")
        
        # 3. Verify Availability on Day 2 (Middle day) at Noon (12:00)
        # Should be AVAILABLE (Free) because booking is 21:15->10:00
        check_date = d1 + timedelta(days=1)
        check_time_start = time(12, 0)
        check_time_end = time(13, 0)
        
        print(f"Checking Conflict for: {check_date} {check_time_start}-{check_time_end}")
        
        is_conflict = await desk_service.check_booking_overlap(
            desk.id,
            check_date,
            check_date,
            check_time_start,
            check_time_end,
            exclude_booking_id=None
        )
        
        if is_conflict:
            print("[FAILURE] Conflict Detected! Desk is LOCKED at 12:00pm but should be FREE.")
        else:
            print("[SUCCESS] No Conflict! Desk is FREE at 12:00pm as expected.")

        # 4. Verify Availability on Day 2 at Night (22:00)
        # Should be LOCKED
        check_time_start_night = time(22, 0)
        check_time_end_night = time(23, 0)
        print(f"Checking Conflict for: {check_date} {check_time_start_night}-{check_time_end_night}")
        
        is_conflict_night = await desk_service.check_booking_overlap(
            desk.id,
            check_date,
            check_date,
            check_time_start_night,
            check_time_end_night
        )
        
        if is_conflict_night:
             print("[SUCCESS] Conflict Detected at Night! Desk is LOCKED as expected.")
        else:
             print("[FAILURE] No Conflict at Night! Desk should be LOCKED.")

if __name__ == "__main__":
    asyncio.run(reproduce_issue())
