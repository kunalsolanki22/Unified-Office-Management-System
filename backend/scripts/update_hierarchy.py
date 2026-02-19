
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select, update
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.enums import UserRole

async def update_hierarchy():
    async with AsyncSessionLocal() as db:
        print("Updating user hierarchy...")
        
        # 1. Get Users
        # Admin
        result = await db.execute(select(User).where(User.email == "admin@company.com"))
        admin = result.scalar_one_or_none()
        
        # Attendance Manager
        result = await db.execute(select(User).where(User.email == "attendance.manager@company.com"))
        manager = result.scalar_one_or_none()
        
        # Team Lead
        result = await db.execute(select(User).where(User.email == "dev.teamlead@company.com"))
        team_lead = result.scalar_one_or_none()
        
        if not admin or not manager or not team_lead:
            print("Error: Could not find required users (Admin, Attendance Manager, or Team Lead).")
            return

        # 2. Link Manager to Admin
        # Manager reports to Admin
        # Note: The User model might use 'admin_code' or just rely on role-based logic if explicit 'admin_code' field doesn't exist.
        # Let's check the User model fields from previous context or just set 'manager_code' if that's how it's done.
        # In `attendance_service.py`, for MANAGER role, it finds an ADMIN. It doesn't strictly rely on `user.admin_code`.
        # BUT for TEAM_LEAD, it uses `user.manager_code`.
        # For EMPLOYEE, it uses `user.team_lead_code`.
        
        # So we surely need to set `manager_code` for Team Lead.
        print(f"Linking Team Lead ({team_lead.email}) to Manager ({manager.email})...")
        team_lead.manager_code = manager.user_code
        db.add(team_lead)
        
        # Link Sales Team Lead too
        result = await db.execute(select(User).where(User.email == "sales.teamlead@company.com"))
        sales_team_lead = result.scalar_one_or_none()
        if sales_team_lead:
             print(f"Linking Sales Team Lead ({sales_team_lead.email}) to Manager ({manager.email})...")
             sales_team_lead.manager_code = manager.user_code
             db.add(sales_team_lead)
        
        # Link Attendance Manager to Admin
        # Find Admin
        result = await db.execute(select(User).where(User.role == "admin").limit(1))
        admin = result.scalar_one_or_none()
        
        if admin and manager:
             print(f"Linking Attendance Manager ({manager.email}) to Admin ({admin.email})...")
             manager.manager_code = admin.user_code # For direct reporting
             # manager.admin_code = admin.user_code # Might additionally be needed depending on logic, but manager_code is primary
             db.add(manager)
             
        # Link Admin to Super Admin
        # Find Super Admin
        result = await db.execute(select(User).where(User.role == "super_admin").limit(1))
        super_admin = result.scalar_one_or_none()
        
        if admin and super_admin:
            print(f"Linking Admin ({admin.email}) to Super Admin ({super_admin.email})...")
            admin.manager_code = super_admin.user_code
            db.add(admin)
        
        # We also need to set `admin_code` for Manager?
        # Let's check `submit_for_approval` in `attendance_service.py` again.
        # For MANAGER: `result = await self.db.execute(select(User.user_code).where(User.role == UserRole.ADMIN...))`
        # It finds ANY Admin. It does NOT use `user.admin_code`.
        # So linking Manager -> Admin is implicit.
        
        # Linking Team Lead -> Manager is EXPLICIT.
        
        # Let's also link an Employee to Team Lead for completeness
        result = await db.execute(select(User).where(User.email == "employee1@company.com"))
        employee = result.scalar_one_or_none()
        if employee:
             print(f"Linking Employee ({employee.email}) to Team Lead ({team_lead.email})...")
             employee.team_lead_code = team_lead.user_code
             db.add(employee)
        
        await db.commit()
        print("Hierarchy updated successfully!")

if __name__ == "__main__":
    asyncio.run(update_hierarchy())
