
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, text
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.attendance import Attendance

async def inspect_data():
    async with AsyncSessionLocal() as db:
        print("\n--- Inspecting Users ---")
        # Check Team Lead
        result = await db.execute(select(User).where(User.email == "sales.teamlead@company.com"))
        team_lead = result.scalar_one_or_none()
        if team_lead:
            print(f"Sales Team Lead: {team_lead.email} (Code: {team_lead.user_code})")
            print(f"  Manager Code: {team_lead.manager_code}")
        else:
            print("Sales Team Lead not found.")

        # Check Attendance Manager
        result = await db.execute(select(User).where(User.email == "attendance.manager@company.com"))
        manager = result.scalar_one_or_none()
        if manager:
            print(f"Attendance Manager: {manager.email} (Code: {manager.user_code})")
            print(f"  Manager Code (Should be Admin): {manager.manager_code}")
        else:
            print("Attendance Manager not found.")

        # Check if an Admin exists to link to
        result = await db.execute(select(User).where(User.role == "admin").limit(1))
        admin = result.scalar_one_or_none()
        
        if admin:
            print(f"Found Admin: {admin.email} (Code: {admin.user_code})")
            print(f"  Manager Code (Should be Super Admin): {admin.manager_code}")
            
            # Check for Super Admin
            result = await db.execute(select(User).where(User.role == "super_admin").limit(1))
            super_admin = result.scalar_one_or_none()
            if super_admin:
                print(f"Found Super Admin: {super_admin.email} (Code: {super_admin.user_code})")
            else:
                print("No Super Admin found!")
        else:
            print("No Admin found!")

        print("\n--- Inspecting Enrollments/Attendances ---")
        if team_lead:
            # Check latest attendance for Team Lead
            result = await db.execute(
                select(Attendance)
                .where(Attendance.user_code == team_lead.user_code)
                .order_by(Attendance.date.desc()) # Assuming date field
            )
            attendances = result.scalars().all()
            if attendances:
                for att in attendances[:3]: # Show last 3
                    print(f"Date: {att.date}, Status: {att.status}")
                    print(f"  Approver Code: {att.approver_code}")
                    print(f"  Submitted At: {att.submitted_at}")
            else:
                print("No attendance records for Team Lead.")

if __name__ == "__main__":
    asyncio.run(inspect_data())
