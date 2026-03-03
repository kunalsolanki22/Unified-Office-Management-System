
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, update
from app.core.database import AsyncSessionLocal
from app.models.attendance import Attendance, AttendanceStatus

async def fix_attendance():
    async with AsyncSessionLocal() as db:
        print("Fixing attendance records...")
        
        # Find pending attendances with no approver
        result = await db.execute(
            select(Attendance).where(
                Attendance.status == AttendanceStatus.PENDING_APPROVAL,
                Attendance.approver_code == None
            )
        )
        attendances = result.scalars().all()
        
        count = 0
        for att in attendances:
            if not att.approver_code:
                # If user is Attendance Manager (3002), approver should be Admin (2001)
                if att.user_code == "3002":
                    print(f"Fixing attendance for Attendance Manager {att.user_code} -> Admin (2001)...")
                    att.approver_code = "2001"
                    db.add(att)
                    count += 1
                elif att.user_code == "2001":
                    # Admin (2001) needs approval from Super Admin (1001)
                    print(f"Fixing attendance for Admin {att.user_code} -> Super Admin (1001)...")
                    att.approver_code = "1001"
                    db.add(att)
                    count += 1
                else:
                    # Default fallback: assigning to Attendance Manager (3002) for others
                    print(f"Fixing attendance for user {att.user_code} -> Manager (3002)...")
                    att.approver_code = "3002"
                    db.add(att)
                    count += 1
        
        if count > 0:
            await db.commit()
            print(f"Fixed {count} attendance records.")
        else:
            print("No broken attendance records found.")

if __name__ == "__main__":
    asyncio.run(fix_attendance())
