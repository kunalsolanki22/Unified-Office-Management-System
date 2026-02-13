"""Seed cafeteria tables and food items into the database for testing."""
import asyncio
from datetime import date
from decimal import Decimal
from sqlalchemy import text
from app.core.database import engine as async_engine

TABLES = [
    {"label": "A1", "capacity": 4, "table_type": "regular"},
    {"label": "A2", "capacity": 4, "table_type": "regular"},
    {"label": "A3", "capacity": 6, "table_type": "regular"},
    {"label": "A4", "capacity": 4, "table_type": "booth"},
    {"label": "A5", "capacity": 2, "table_type": "high_top"},
    {"label": "A6", "capacity": 4, "table_type": "regular"},
    {"label": "A7", "capacity": 6, "table_type": "regular"},
    {"label": "A8", "capacity": 4, "table_type": "booth"},
    {"label": "B1", "capacity": 4, "table_type": "regular"},
    {"label": "B2", "capacity": 2, "table_type": "high_top"},
    {"label": "B3", "capacity": 6, "table_type": "regular"},
    {"label": "B4", "capacity": 4, "table_type": "regular"},
]

FOOD_ITEMS = [
    {"name": "Grilled Chicken Sandwich", "description": "Tender grilled chicken with fresh lettuce and mayo", "price": 8.50, "category_name": "lunch", "tags": ["non-veg", "high-protein"], "calories": 450, "prep_time": 15},
    {"name": "Gourmet Veggie Platter", "description": "Assorted fresh vegetables with hummus dip", "price": 12.50, "category_name": "lunch", "tags": ["vegan", "healthy"], "calories": 320, "prep_time": 10},
    {"name": "Detox Grain Bowl", "description": "Quinoa, avocado, and mixed greens with lemon dressing", "price": 10.00, "category_name": "lunch", "tags": ["vegan", "gluten-free"], "calories": 380, "prep_time": 12},
    {"name": "Margherita Pizza", "description": "Classic pizza with fresh mozzarella and basil", "price": 11.00, "category_name": "lunch", "tags": ["vegetarian"], "calories": 520, "prep_time": 20},
    {"name": "Caesar Salad", "description": "Crispy romaine lettuce with parmesan and croutons", "price": 7.50, "category_name": "lunch", "tags": ["vegetarian", "healthy"], "calories": 280, "prep_time": 8},
    {"name": "Cappuccino", "description": "Rich espresso with steamed milk foam", "price": 4.50, "category_name": "beverages", "tags": ["hot", "caffeine"], "calories": 120, "prep_time": 5},
    {"name": "Fresh Orange Juice", "description": "Freshly squeezed orange juice", "price": 3.50, "category_name": "beverages", "tags": ["fresh", "vitamin-c"], "calories": 110, "prep_time": 3},
    {"name": "Green Smoothie", "description": "Spinach, banana, and almond milk blend", "price": 5.00, "category_name": "beverages", "tags": ["vegan", "healthy"], "calories": 180, "prep_time": 5},
    {"name": "Chocolate Brownie", "description": "Rich dark chocolate brownie with walnuts", "price": 4.00, "category_name": "snacks", "tags": ["vegetarian", "sweet"], "calories": 350, "prep_time": 2},
    {"name": "Trail Mix Cup", "description": "Mixed nuts, dried fruits, and seeds", "price": 3.00, "category_name": "snacks", "tags": ["vegan", "high-protein"], "calories": 250, "prep_time": 1},
]

async def seed_cafeteria():
    async with async_engine.begin() as conn:
        # Get any user_code to use as created_by
        result = await conn.execute(text("SELECT user_code FROM users LIMIT 1"))
        admin = result.fetchone()
        if not admin:
            print("No users found in database!")
            return
        admin_code = admin[0]
        print(f"Using admin code: {admin_code}")

        # Seed tables
        print("\n--- Seeding Cafeteria Tables ---")
        table_count = 0
        for t in TABLES:
            exists = await conn.execute(
                text("SELECT id FROM cafeteria_tables WHERE table_label = :label"),
                {"label": t["label"]}
            )
            if exists.fetchone():
                print(f"  Skipping table {t['label']} - already exists")
                continue
            
            # Generate table code
            import random, string
            code = f"TBL-{''.join(random.choices(string.digits, k=4))}"
            
            await conn.execute(
                text("""
                    INSERT INTO cafeteria_tables (id, table_code, table_label, capacity, table_type, is_active, created_by_code)
                    VALUES (gen_random_uuid(), :code, :label, :capacity, :type, true, :admin)
                """),
                {"code": code, "label": t["label"], "capacity": t["capacity"], "type": t["table_type"], "admin": admin_code}
            )
            table_count += 1
            print(f"  Inserted table {t['label']} ({code}, capacity: {t['capacity']})")
        
        print(f"  Total tables inserted: {table_count}")

        # Seed food items
        print("\n--- Seeding Food Items ---")
        item_count = 0
        for f in FOOD_ITEMS:
            exists = await conn.execute(
                text("SELECT id FROM food_items WHERE name = :name"),
                {"name": f["name"]}
            )
            if exists.fetchone():
                print(f"  Skipping food item '{f['name']}' - already exists")
                continue
            
            await conn.execute(
                text("""
                    INSERT INTO food_items (id, name, description, price, category_name, tags, calories, 
                                           preparation_time_minutes, is_available, is_active, created_by_code)
                    VALUES (gen_random_uuid(), :name, :desc, :price, :cat, :tags, :cal, :prep, true, true, :admin)
                """),
                {
                    "name": f["name"],
                    "desc": f["description"],
                    "price": f["price"],
                    "cat": f["category_name"],
                    "tags": f.get("tags", []),
                    "cal": f["calories"],
                    "prep": f["prep_time"],
                    "admin": admin_code,
                }
            )
            item_count += 1
            print(f"  Inserted food item '{f['name']}' (${f['price']}, {f['category_name']})")
        
        print(f"  Total food items inserted: {item_count}")
        print("\nDone!")

if __name__ == "__main__":
    asyncio.run(seed_cafeteria())
