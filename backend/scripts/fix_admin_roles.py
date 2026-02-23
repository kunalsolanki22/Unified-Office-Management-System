
import asyncio
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.enums import UserRole

async def fix_roles():
    async with AsyncSessionLocal() as db:
        print("Restoring correct roles for Super Admin and Admin...")
        
        # Define users to fix
        to_fix = [
            {"email": "super.admin@company.com", "role": UserRole.SUPER_ADMIN},
            {"email": "admin@company.com", "role": UserRole.ADMIN},
            {"email": "super.admin@cygnet.com", "role": UserRole.SUPER_ADMIN},
            {"email": "admin@cygnet.com", "role": UserRole.ADMIN},
        ]
        
        for item in to_fix:
            result = await db.execute(select(User).where(User.email == item["email"]))
            user = result.scalar_one_or_none()
            if user:
                print(f"  Fixing user: {user.email}")
                print(f"    Old Role: {user.role}, ManagerType: {user.manager_type}")
                user.role = item["role"]
                user.manager_type = None
                print(f"    New Role: {user.role}, ManagerType: {user.manager_type}")
                db.add(user)
            else:
                print(f"  User not found: {item['email']}")
        
        await db.commit()
        print("\nRoles restored successfully!")

if __name__ == "__main__":
    asyncio.run(fix_roles())
