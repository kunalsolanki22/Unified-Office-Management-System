import asyncio
import random
import sys
import os

# Add the backend directory to the Python path so 'app' can be resolved
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from sqlalchemy.future import select
from app.db.session import async_session
from app.models.user import User

async def populate_phones():
    async with async_session() as session:
        # Get all users with empty or null phone numbers
        result = await session.execute(
            select(User).where((User.phone == None) | (User.phone == ""))
        )
        users = result.scalars().all()
        
        if not users:
            print("No users found with an empty phone number.")
            return

        count = 0
        for user in users:
            # Generate a 10 digit number starting with 9
            # The remaining 9 digits can be anything from 000000000 to 999999999
            random_digits = ''.join([str(random.randint(0, 9)) for _ in range(9)])
            phone_number = f"9{random_digits}"
            user.phone = phone_number
            count += 1
            
        await session.commit()
        print(f"Successfully populated {count} users with random 10-digit phone numbers starting with '9'.")

if __name__ == "__main__":
    asyncio.run(populate_phones())
