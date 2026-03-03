
import asyncio
from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.attendance import Attendance
from app.models.enums import AttendanceStatus

async def inspect():
    async with AsyncSessionLocal() as session:
        # Get all users
        result = await session.execute(select(User))
        users = result.scalars().all()
        print("--- USERS ---")
        for u in users:
            print(f"ID: {u.id}, Name: {u.full_name}, Email: {u.email}, Role: {u.role}, ManagerType: {u.manager_type}, UserCode: {u.user_code}")

        # Get pending attendance for Super Admin (User Code 1001)
        # We manually query what the service would query: status=PENDING and approver_code='1001'
        print("\n--- PENDING ATTENDANCE FOR SUPER ADMIN (1001) ---")
        result = await session.execute(
            select(Attendance)
            .where(
                Attendance.status == AttendanceStatus.PENDING_APPROVAL,
                Attendance.approver_code == '1001'
            )
        )
        attendances = result.scalars().all()
        for a in attendances:
            print(f"ID: {a.id}, UserCode: {a.user_code}, Date: {a.date}, Status: {a.status}, Approver: {a.approver_code}")

if __name__ == "__main__":
    asyncio.run(inspect())
