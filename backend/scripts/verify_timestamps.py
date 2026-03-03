
import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.attendance import Attendance
from app.models.enums import AttendanceStatus

async def verify_timestamps():
    async with AsyncSessionLocal() as session:
        # Get pending attendance
        result = await session.execute(
            select(Attendance)
            .where(Attendance.status == AttendanceStatus.PENDING_APPROVAL)
            .order_by(Attendance.created_at.desc())
            .limit(5)
        )
        attendances = result.scalars().all()
        print("\n--- RECENT PENDING ATTENDANCE ---")
        for a in attendances:
            print(f"ID: {a.id}")
            print(f"UserCode: {a.user_code}")
            print(f"Date: {a.date} (Type: {type(a.date)})")
            print(f"Submitted At: {a.submitted_at} (Type: {type(a.submitted_at)})")
            print(f"First Check-in: {a.first_check_in} (Type: {type(a.first_check_in)})")
            print(f"Last Check-out: {a.last_check_out} (Type: {type(a.last_check_out)})")
            print("-" * 30)

if __name__ == "__main__":
    asyncio.run(verify_timestamps())
