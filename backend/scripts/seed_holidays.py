import asyncio
import os
import sys
from datetime import date

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.database import AsyncSessionLocal
from app.models.holiday import Holiday
import uuid

async def seed_holidays():
    print("Seeding Dummy Holidays for 2026...")
    async with AsyncSessionLocal() as db:
        holidays = [
            {
                "name": "New Year's Day",
                "date": date(2026, 1, 1),
                "description": "Celebrating the first day of the new year.",
                "holiday_type": "company",
                "is_optional": False
            },
            {
                "name": "Republic Day",
                "date": date(2026, 1, 26),
                "description": "National Holiday - Republic Day of India.",
                "holiday_type": "national",
                "is_optional": False
            },
            {
                "name": "Holi",
                "date": date(2026, 3, 4),
                "description": "Festival of Colors.",
                "holiday_type": "national",
                "is_optional": False
            },
            {
                "name": "Independence Day",
                "date": date(2026, 8, 15),
                "description": "National Holiday - Independence Day of India.",
                "holiday_type": "national",
                "is_optional": False
            },
            {
                "name": "Gandhi Jayanti",
                "date": date(2026, 10, 2),
                "description": "Birth anniversary of Mahatma Gandhi.",
                "holiday_type": "national",
                "is_optional": False
            },
            {
                "name": "Diwali",
                "date": date(2026, 11, 8),
                "description": "Festival of Lights.",
                "holiday_type": "national",
                "is_optional": False
            },
            {
                "name": "Christmas",
                "date": date(2026, 12, 25),
                "description": "Christmas celebrations.",
                "holiday_type": "company",
                "is_optional": False
            }
        ]
        
        from sqlalchemy import select
        for h_data in holidays:
            # Check if holiday already exists for that date
            result = await db.execute(select(Holiday).where(Holiday.date == h_data["date"]))
            existing = result.scalar_one_or_none()
            
            if not existing:
                h = Holiday(
                    id=uuid.uuid4(),
                    name=h_data["name"],
                    description=h_data["description"],
                    date=h_data["date"],
                    holiday_type=h_data["holiday_type"],
                    is_optional=h_data["is_optional"],
                    created_by_code="SA0001",
                    is_active=True
                )
                db.add(h)
                print(f"   Added: {h_data['name']} ({h_data['date']})")
            else:
                print(f"   Skipped: {h_data['name']} (already exists)")
        
        await db.commit()
        print("Holiday seeding completed.")

if __name__ == "__main__":
    asyncio.run(seed_holidays())