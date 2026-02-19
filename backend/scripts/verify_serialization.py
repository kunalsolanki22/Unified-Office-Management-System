
import asyncio
import sys
import os
from datetime import date

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import select
from sqlalchemy.orm import selectinload
from app.core.database import AsyncSessionLocal
from app.models.attendance import Attendance, AttendanceStatus
from app.schemas.attendance import AttendanceDetailResponse
from app.models.user import User

async def verify_serialization():
    async with AsyncSessionLocal() as db:
        print("Fetching pending approval...")
        
        # 1. Fetch exactly as service does
        stmt = select(Attendance).where(
            Attendance.status == AttendanceStatus.PENDING_APPROVAL
        ).options(
            selectinload(Attendance.entries),
            selectinload(Attendance.user),
            selectinload(Attendance.approver)
        ).limit(1)
        
        result = await db.execute(stmt)
        attendance = result.scalar_one_or_none()
        
        if not attendance:
            print("No pending attendance found to test.")
            return

        print(f"Found attendance ID: {attendance.id}")
        if attendance.user:
             print(f"User loaded: {attendance.user.email}")
        else:
             print("User NOT loaded!")

        print("Attempting serialization...")
        try:
            pydantic_obj = AttendanceDetailResponse.model_validate(attendance)
            print("Serialization SUCCESS!")
            print(pydantic_obj.model_dump_json(indent=2))
        except Exception as e:
            print("Serialization FAILED!")
            print(e)

if __name__ == "__main__":
    asyncio.run(verify_serialization())
