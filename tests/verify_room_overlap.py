import asyncio
import httpx
from uuid import UUID

BASE_URL = "http://127.0.0.1:8000/api/v1"

async def get_token(email, password):
    async with httpx.AsyncClient() as client:
        response = await client.post(f"{BASE_URL}/auth/login", json={"email": email, "password": password})
        if response.status_code != 200:
            print(f"Login failed for {email}: {response.status_code} - {response.text}")
            return None
        return response.json()["data"]["access_token"]

async def verify_constraints():
    # Login as a regular employee
    token = await get_token("employee1@company.com", "Employee@123")
    if not token:
        token = await get_token("employee1@cygnet.com", "Employee@123")
    
    if not token:
        print("Could not login with either domain. Exiting.")
        return
    
    headers = {"Authorization": f"Bearer {token}"}
    
    async with httpx.AsyncClient() as client:
        # 1. Get a room ID
        rooms_res = await client.get(f"{BASE_URL}/desks/rooms", headers=headers)
        room_id = rooms_res.json()["data"][0]["id"]
        print(f"Testing with Room: {room_id}")

        # 2. Create a first booking
        booking_data = {
            "room_id": room_id,
            "booking_date": "2026-03-01",
            "start_time": "14:00:00",
            "end_time": "15:00:00",
            "title": "First Request",
            "attendees_count": 5
        }
        res1 = await client.post(f"{BASE_URL}/desks/rooms/bookings", headers=headers, json=booking_data)
        print(f"First booking status: {res1.status_code}")
        print(res1.json().get("message", res1.json().get("detail")))

        # 3. Try to book the same slot again
        res2 = await client.post(f"{BASE_URL}/desks/rooms/bookings", headers=headers, json=booking_data)
        print(f"Second booking (same slot) status: {res2.status_code}")
        print(res2.json().get("message", res2.json().get("detail", "No error message")))

        # 4. Try to book a different slot on same day (should succeed)
        booking_data_diff = booking_data.copy()
        booking_data_diff["start_time"] = "15:00:00"
        booking_data_diff["end_time"] = "16:00:00"
        booking_data_diff["title"] = "Different Slot"
        res3 = await client.post(f"{BASE_URL}/desks/rooms/bookings", headers=headers, json=booking_data_diff)
        print(f"Different slot booking status: {res3.status_code}")
        print(res3.json().get("message", res3.json().get("detail")))

if __name__ == "__main__":
    asyncio.run(verify_constraints())
