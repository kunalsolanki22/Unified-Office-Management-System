import asyncio
import os
import sys
from datetime import date, time, datetime, timedelta

# Add backend directory to sys.path
# Script is in backend/scripts, we need to add backend/
current_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(current_dir)
if backend_dir not in sys.path:
    sys.path.append(backend_dir)

from app.core.database import AsyncSessionLocal
from app.core.database import AsyncSessionLocal
from app.models.food import FoodOrder, FoodOrderItem, FoodItem
from app.models.cafeteria import CafeteriaTableBooking, CafeteriaTable
from app.models.user import User
from app.models.enums import OrderStatus, BookingStatus
from sqlalchemy import select
from uuid import uuid4

async def seed_activity():
    async with AsyncSessionLocal() as db:
        print("Seeding activity...")

        # Get a user (User 2 - Employee)
        result = await db.execute(select(User).where(User.email == "employee.one@company.com"))
        user = result.scalar_one_or_none()
        if not user:
            print("User not found, using first available")
            result = await db.execute(select(User))
            user = result.scalars().first()
        
        # Get a food item
        item_result = await db.execute(select(FoodItem))
        food_item = item_result.scalars().first()
        if not food_item:
            print("No food items found, cannot create order item properly.")
            return

        # 1. Create a Food Order
        order_id = uuid4()
        new_order = FoodOrder(
            id=order_id,
            user_code=user.user_code,
            subtotal=25.0,
            total_amount=25.0,
            status=OrderStatus.PENDING,
            created_at=datetime.now()
        )
        db.add(new_order)
        
        # Add item
        order_item = FoodOrderItem(
            id=uuid4(),
            order_id=order_id,
            food_item_id=food_item.id,
            item_name="Verification Burger",
            quantity=1,
            unit_price=25.0,
            total_price=25.0
        )
        db.add(order_item)
        print(f"Created Order: {order_id}")

        # 2. Create a Table Booking
        # Get a table
        table_result = await db.execute(select(CafeteriaTable))
        table = table_result.scalars().first()
        
        if table:
            booking = CafeteriaTableBooking(
                id=uuid4(),
                table_id=table.id,
                user_code=user.user_code,
                booking_date=date.today(),
                start_time=time(12, 0),
                end_time=time(13, 0),
                status=BookingStatus.CONFIRMED,
                guest_count=2,
                created_at=datetime.now()
            )
            db.add(booking)
            print(f"Created Booking for Table: {table.table_code}")
        
        await db.commit()
        print("Seeding complete.")

if __name__ == "__main__":
    if sys.platform == "win32":
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    asyncio.run(seed_activity())
