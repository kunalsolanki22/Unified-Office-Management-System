"""Seed holidays into the database for testing."""
import asyncio
from datetime import date
from sqlalchemy import text
from app.core.database import engine as async_engine

HOLIDAYS = [
    {"name": "Republic Day", "date": "2026-01-26", "holiday_type": "national", "description": "National holiday celebrating the constitution"},
    {"name": "Maha Shivratri", "date": "2026-02-26", "holiday_type": "religious", "description": "Hindu festival dedicated to Lord Shiva"},
    {"name": "Holi", "date": "2026-03-14", "holiday_type": "festival", "description": "Festival of colours"},
    {"name": "Ram Navami", "date": "2026-03-29", "holiday_type": "religious", "description": "Birthday of Lord Rama"},
    {"name": "Good Friday", "date": "2026-04-10", "holiday_type": "religious", "description": "Christian observance"},
    {"name": "Independence Day", "date": "2026-08-15", "holiday_type": "national", "description": "National holiday celebrating independence"},
    {"name": "Gandhi Jayanti", "date": "2026-10-02", "holiday_type": "national", "description": "Birthday of Mahatma Gandhi"},
    {"name": "Diwali", "date": "2026-11-08", "holiday_type": "festival", "description": "Festival of lights"},
    {"name": "Christmas", "date": "2026-12-25", "holiday_type": "festival", "description": "Christmas Day"},
]

async def seed_holidays():
    async with async_engine.begin() as conn:
        # Get any user_code to use as created_by
        result = await conn.execute(text("SELECT user_code FROM users LIMIT 1"))
        admin = result.fetchone()
        
        if not admin:
            print("No users found in database! Please seed users first.")
            return
        
        admin_code = admin[0]
        print(f"Using admin code: {admin_code}")
        
        inserted = 0
        for h in HOLIDAYS:
            holiday_date = date.fromisoformat(h["date"])
            # Check if already exists
            exists = await conn.execute(
                text("SELECT id FROM holidays WHERE date = :d"),
                {"d": holiday_date}
            )
            if exists.fetchone():
                print(f"  Skipping {h['name']} ({h['date']}) - already exists")
                continue
            
            await conn.execute(
                text("""
                    INSERT INTO holidays (id, name, description, date, holiday_type, is_optional, is_active, created_by_code) 
                    VALUES (gen_random_uuid(), :name, :desc, :date, :type, false, true, :code)
                """),
                {
                    "name": h["name"],
                    "desc": h["description"],
                    "date": holiday_date,
                    "type": h["holiday_type"],
                    "code": admin_code,
                }
            )
            inserted += 1
            print(f"  Inserted {h['name']} ({h['date']})")
        
        print(f"\nDone! Inserted {inserted} holidays.")

if __name__ == "__main__":
    asyncio.run(seed_holidays())
