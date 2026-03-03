# 🤖 AI Agent API Reference Guide

> **Purpose**: This document provides a comprehensive API reference for an AI agent to process natural language requests from employees and execute appropriate API calls.

**Base URL**: `http://127.0.0.1:8000/api/v1`

**Authentication**: All endpoints (except `/auth/login`) require JWT Bearer token in the `Authorization` header:
```
Authorization: Bearer <access_token>
```

---

## 📋 Table of Contents

1. [Authentication](#1-authentication)
2. [Attendance Management](#2-attendance-management)
3. [Leave Management](#3-leave-management)
4. [Parking Management](#4-parking-management)
5. [Desk Booking](#5-desk-booking)
6. [Conference Room Booking](#6-conference-room-booking)
7. [Food Orders](#7-food-orders)
8. [IT Requests](#8-it-requests)
9. [Holidays](#9-holidays)
10. [User Profile](#10-user-profile)
11. [Request Body Schemas Reference](#11-request-body-schemas-reference)
12. [Natural Language Intent Mapping](#12-natural-language-intent-mapping)

---

## 🔑 Default Credentials

After running `python -m scripts.seed_data`:

| Role | Email | Password | User Code |
|------|-------|----------|-----------|
| Super Admin | `super.admin@company.com` | `Admin@123` | `1001` |
| Admin | `admin@company.com` | `Admin@123` | `2001` |
| Parking Manager | `parking.manager@company.com` | `Manager@123` | `3001` |
| Attendance Manager | `attendance.manager@company.com` | `Manager@123` | `3002` |
| Desk Manager | `desk.manager@company.com` | `Manager@123` | `3003` |
| Cafeteria Manager | `cafeteria.manager@company.com` | `Manager@123` | `3004` |
| IT Manager | `it.manager@company.com` | `Manager@123` | `3005` |
| Dev Team Lead | `dev.teamlead@company.com` | `TeamLead@123` | `4001` |
| Sales Team Lead | `sales.teamlead@company.com` | `TeamLead@123` | `4002` |
| Employees | `employee1@company.com` - `employee5@company.com` | `Employee@123` | `5001` - `5005` |

---

## 1. Authentication

### Login
**Intent Examples**: "login", "sign in", "authenticate"

```http
POST /auth/login
Content-Type: application/json
```

**Request Body Schema**:
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `email` | string | ✅ | Valid email format | User's email address |
| `password` | string | ✅ | Min 8 characters | User's password |

**Example Request**:
```json
{
    "email": "employee1@company.com",
    "password": "Employee@123"
}
```

**Response**:
```json
{
    "success": true,
    "data": {
        "access_token": "eyJhbGciOiJIUzI1NiIs...",
        "refresh_token": "eyJhbGciOiJIUzI1NiIs...",
        "token_type": "bearer",
        "expires_in": 86400,
        "user_id": "uuid",
        "role": "employee",
        "manager_type": null
    }
}
```

---

### Refresh Token
**Intent Examples**: "refresh token", "renew session"

```http
POST /auth/refresh
Content-Type: application/json
```

**Request Body Schema**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `refresh_token` | string | ✅ | Valid refresh token from login |

**Example Request**:
```json
{
    "refresh_token": "eyJhbGciOiJIUzI1NiIs..."
}
```

---

### Get Current User Profile
**Intent Examples**: "who am I", "my profile", "my details"

```http
GET /auth/me
Authorization: Bearer <token>
```
> No request body needed.

---

### Change Password
**Intent Examples**: "change my password", "update password"

```http
POST /auth/change-password
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body Schema**:
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `current_password` | string | ✅ | Min 8 characters | Current password |
| `new_password` | string | ✅ | See password requirements below | New password |
| `confirm_password` | string | ✅ | Must match new_password | Confirm new password |

**Password Requirements**:
- At least 8 characters long
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character (`!@#$%^&*()_+-=[]{}|;:',.<>?/~`)
- New password must be different from current password

**Example Request**:
```json
{
    "current_password": "Employee@123",
    "new_password": "NewPassword@456",
    "confirm_password": "NewPassword@456"
}
```

---

## 2. Attendance Management

### Check In
**Intent Examples**: "check in", "mark attendance", "punch in", "start work", "I'm here", "arrived at office"

```http
POST /attendance/check-in
Authorization: Bearer <token>
```
> **No request body needed** - automatically records current time.

**Response**:
```json
{
    "success": true,
    "message": "Check-in recorded successfully",
    "data": {
        "id": "uuid",
        "user_code": "5001",
        "date": "2026-02-17",
        "status": "draft",
        "first_check_in": "09:00:00",
        "total_hours": null,
        "entries": [
            {
                "id": "uuid",
                "check_in": "2026-02-17T09:00:00Z",
                "check_out": null,
                "entry_type": "regular",
                "duration_hours": null
            }
        ]
    }
}
```

---

### Check Out
**Intent Examples**: "check out", "punch out", "leaving", "going home", "end work", "signing off"

```http
POST /attendance/check-out
Authorization: Bearer <token>
```
> **No request body needed** - automatically records current time and finds open check-in.

---

### Get My Attendance Status Today
**Intent Examples**: "my attendance status", "am I checked in", "attendance today", "work hours today"

```http
GET /attendance/my-status
Authorization: Bearer <token>
```
> No request body needed.

**Response**:
```json
{
    "success": true,
    "data": {
        "has_attendance": true,
        "is_checked_in": true,
        "can_submit": false,
        "status": "draft",
        "total_hours": 4.5,
        "first_check_in": "2026-02-17T09:00:00Z",
        "last_check_out": null,
        "entries": [...]
    }
}
```

---

### Submit Attendance for Approval
**Intent Examples**: "submit my attendance", "send attendance for approval", "submit today's work"

```http
POST /attendance/submit
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body Schema** (optional):
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `notes` | string | ❌ | Max 500 chars | Optional submission notes |

**Example Request**:
```json
{
    "notes": "Worked from home in the morning"
}
```

> All check-ins must have check-outs before submission.

---

### Submit Specific Attendance for Approval
**Intent Examples**: "submit yesterday's attendance"

```http
POST /attendance/{attendance_id}/submit
Authorization: Bearer <token>
```
> No request body needed.

---

### Approve/Reject Attendance
**Intent Examples**: "approve attendance", "reject attendance"

**Access**: Team Lead, Manager, Admin, Super Admin

```http
POST /attendance/{attendance_id}/approve
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body Schema**:
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `action` | string | ✅ | `"approve"` or `"reject"` | Approval action |
| `notes` | string | ❌ | - | Optional approval notes |
| `rejection_reason` | string | ⚠️ | Required if action is "reject" | Reason for rejection |

**Example Request (Approve)**:
```json
{
    "action": "approve",
    "notes": "Verified - all good"
}
```

**Example Request (Reject)**:
```json
{
    "action": "reject",
    "rejection_reason": "Missing check-out for afternoon session"
}
```

---

### Get My Attendance History
**Intent Examples**: "my attendance history", "past attendance", "attendance records"

```http
GET /attendance/my?page=1&page_size=20&start_date=2026-02-01&end_date=2026-02-17
Authorization: Bearer <token>
```

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | int | 1 | Page number |
| `page_size` | int | 20 | Items per page (max: 100) |
| `start_date` | date | - | Filter from date (YYYY-MM-DD) |
| `end_date` | date | - | Filter to date (YYYY-MM-DD) |

---

### Get Pending Approvals
**Intent Examples**: "pending attendance approvals", "who needs approval"

**Access**: Team Lead, Manager, Admin

```http
GET /attendance/pending-approvals?page=1&page_size=20
Authorization: Bearer <token>
```

---

## 3. Leave Management

### Apply for Leave
**Intent Examples**: "apply for leave", "take sick leave", "request vacation", "need day off", "apply casual leave from X to Y"

```http
POST /leave/requests
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body Schema**:
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `leave_type` | string | ✅ | See Leave Types below | Type of leave |
| `start_date` | date | ✅ | YYYY-MM-DD format | Leave start date |
| `end_date` | date | ✅ | Must be ≥ start_date | Leave end date |
| `reason` | string | ❌ | - | Reason for leave |
| `is_half_day` | boolean | ❌ | Default: false | Is this a half-day leave? |
| `half_day_type` | string | ⚠️ | Required if is_half_day=true | `"first_half"` or `"second_half"` |
| `emergency_contact` | string | ❌ | - | Emergency contact name |
| `emergency_phone` | string | ❌ | - | Emergency contact phone |

**Leave Types** (`leave_type` values):
| Value | Description |
|-------|-------------|
| `casual` | Casual leave |
| `sick` | Sick leave |
| `privilege` | Privilege/Earned leave |
| `unpaid` | Unpaid leave |

**Example Request (Full Day)**:
```json
{
    "leave_type": "casual",
    "start_date": "2026-02-20",
    "end_date": "2026-02-21",
    "reason": "Family function",
    "is_half_day": false,
    "emergency_contact": "John Doe",
    "emergency_phone": "+919876543210"
}
```

**Example Request (Half Day)**:
```json
{
    "leave_type": "sick",
    "start_date": "2026-02-18",
    "end_date": "2026-02-18",
    "reason": "Doctor appointment",
    "is_half_day": true,
    "half_day_type": "first_half"
}
```

**Approval Hierarchy**:
| Requester | Approved By |
|-----------|-------------|
| Employee | Team Lead |
| Team Lead | Manager |
| Manager | Admin |
| Admin | Super Admin |
| Super Admin | Auto-approved |

---

### Get My Leave Balance
**Intent Examples**: "my leave balance", "how many leaves left", "available leaves", "check leave balance"

```http
GET /leave/balance?year=2026
Authorization: Bearer <token>
```

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `year` | int | Current year | Year to check balance for |

---

### Get My Leave Requests
**Intent Examples**: "my leave requests", "leave history", "pending leave requests", "check leave status"

```http
GET /leave/requests?page=1&page_size=20&status=pending
Authorization: Bearer <token>
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | int | Page number |
| `page_size` | int | Items per page |
| `status` | string | `pending`, `approved`, `rejected`, `cancelled` |
| `leave_type` | string | Filter by leave type |

---

### Approve/Reject Leave Request
**Intent Examples**: "approve leave", "reject leave request"

**Access**: Based on hierarchy (TL approves Employee, etc.)

```http
POST /leave/requests/{request_id}/approve
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body Schema**:
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `action` | string | ✅ | `"approve"` or `"reject"` | Approval action |
| `notes` | string | ❌ | - | Optional approval notes |
| `rejection_reason` | string | ⚠️ | Required if action is "reject" | Reason for rejection |

**Example Request**:
```json
{
    "action": "approve",
    "notes": "Coverage confirmed with team"
}
```

---

### Cancel Leave Request
**Intent Examples**: "cancel my leave", "withdraw leave request", "cancel leave application"

```http
POST /leave/requests/{request_id}/cancel
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body Schema** (optional):
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `reason` | string | ❌ | Cancellation reason |

**Example Request**:
```json
{
    "reason": "Plans changed, no longer need the day off"
}
```

---

## 4. Parking Management

### Allocate Parking (Get a Slot)
**Intent Examples**: "book parking", "need parking", "allocate parking slot", "park my car", "get parking spot"

```http
POST /parking/allocate
Authorization: Bearer <token>
```
> **No request body needed** - automatically assigns first available slot using user's vehicle info from profile.

**Response**:
```json
{
    "success": true,
    "message": "Parking allocated successfully",
    "data": {
        "message": "Parking allocated successfully",
        "slot_code": "PKG-1234",
        "vehicle_number": "GJ01EM5001",
        "vehicle_type": "car",
        "entry_time": "2026-02-17T09:30:00Z"
    }
}
```

> **Note**: User must have `vehicle_number` in their profile.

---

### Release Parking
**Intent Examples**: "release parking", "leaving parking", "exit parking", "free up parking slot"

```http
POST /parking/release
Authorization: Bearer <token>
```
> **No request body needed** - automatically finds and releases user's active parking slot.

**Response**:
```json
{
    "success": true,
    "data": {
        "message": "Parking released successfully",
        "slot_code": "PKG-1234",
        "vehicle_number": "GJ01EM5001",
        "entry_time": "2026-02-17T09:00:00Z",
        "exit_time": "2026-02-17T18:00:00Z",
        "duration_mins": 540
    }
}
```

---

### Check My Parking Status
**Intent Examples**: "my parking status", "where did I park", "do I have parking", "check my parking"

```http
GET /parking/my-slot
Authorization: Bearer <token>
```
> No request body needed.

---

### Get Parking Slots Summary (Admin)
**Access**: Parking Manager, Admin, Super Admin

```http
GET /parking/slots/summary
Authorization: Bearer <token>
```

---

### List Parking Slots (Admin)
**Access**: Parking Manager, Admin, Super Admin

```http
GET /parking/slots/list?skip=0&limit=100&status=AVAILABLE
Authorization: Bearer <token>
```

---

### Create Parking Slot (Admin)
**Access**: Parking Manager, Admin, Super Admin

```http
POST /parking/slots/create?slot_code=PKG-NEW1
Authorization: Bearer <token>
```

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `slot_code` | string | ✅ | Unique slot code |

---

### Assign Visitor Parking (Admin)
**Access**: Parking Manager, Admin, Super Admin

```http
POST /parking/slots/assign-visitor?visitor_name=John%20Smith&vehicle_number=GJ01VS1234&slot_code=PKG-1001&vehicle_type=CAR
Authorization: Bearer <token>
```

**Query Parameters**:
| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `visitor_name` | string | ✅ | - | Visitor's name |
| `vehicle_number` | string | ✅ | - | Vehicle number |
| `slot_code` | string | ✅ | - | Slot to assign |
| `vehicle_type` | string | ❌ | CAR | `CAR` or `BIKE` |

---

## 5. Desk Booking

### List Available Desks
**Intent Examples**: "show available desks", "which desks are free", "list desks"

```http
GET /desks?status=available&is_active=true&page=1&page_size=20
Authorization: Bearer <token>
```

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `status` | string | - | `available`, `booked`, `maintenance` |
| `is_active` | bool | true | Show only active desks |
| `page` | int | 1 | Page number |
| `page_size` | int | 20 | Items per page |

---

### Book a Desk
**Intent Examples**: "book a desk", "reserve desk", "I need a desk", "book desk for tomorrow"

```http
POST /desks/bookings
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body Schema**:
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `desk_id` | UUID | ✅ | Valid desk UUID | ID of the desk to book |
| `start_date` | date | ✅ | Cannot be past date | Booking start date |
| `end_date` | date | ✅ | Must be ≥ start_date | Booking end date |
| `notes` | string | ❌ | Max 500 chars | Optional booking notes |

**Example Request**:
```json
{
    "desk_id": "550e8400-e29b-41d4-a716-446655440000",
    "start_date": "2026-02-18",
    "end_date": "2026-02-20",
    "notes": "Need near window for video calls"
}
```

---

### Get My Desk Bookings
**Intent Examples**: "my desk bookings", "show my booked desks", "desk reservations"

```http
GET /desks/bookings/my
Authorization: Bearer <token>
```

---

### Cancel Desk Booking
**Intent Examples**: "cancel desk booking", "cancel my desk reservation"

```http
POST /desks/bookings/{booking_id}/cancel
Authorization: Bearer <token>
```
> No request body needed.

---

### Create Desk (Admin)
**Access**: Desk & Conference Manager, Admin, Super Admin

```http
POST /desks
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body Schema**:
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `desk_label` | string | ✅ | 1-50 chars | Display name for desk |
| `has_monitor` | bool | ❌ | Default: true | Has external monitor? |
| `has_docking_station` | bool | ❌ | Default: false | Has docking station? |
| `notes` | string | ❌ | Max 500 chars | Additional notes |

**Example Request**:
```json
{
    "desk_label": "Window Desk A5",
    "has_monitor": true,
    "has_docking_station": true,
    "notes": "Corner desk with good lighting"
}
```

---

## 6. Conference Room Booking

### List Conference Rooms
**Intent Examples**: "show conference rooms", "available meeting rooms", "list meeting rooms"

```http
GET /desks/rooms?is_active=true&page=1&page_size=20
Authorization: Bearer <token>
```

**Response**:
```json
{
    "success": true,
    "data": {
        "rooms": [
            {
                "id": "uuid",
                "room_code": "CNF-1234",
                "room_label": "Board Room",
                "capacity": 20,
                "has_projector": true,
                "has_video_conferencing": true,
                "has_whiteboard": true,
                "is_active": true
            }
        ],
        "total": 5
    }
}
```

---

### Book Conference Room
**Intent Examples**: "book meeting room", "reserve conference room", "need a meeting room for 10 people"

```http
POST /desks/rooms/bookings
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body Schema**:
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `room_id` | UUID | ✅ | Valid room UUID | ID of the conference room |
| `booking_date` | date | ✅ | Cannot be past date | Date of booking |
| `start_time` | time | ✅ | HH:MM format | Meeting start time |
| `end_time` | time | ✅ | Must be > start_time | Meeting end time |
| `title` | string | ✅ | 1-200 chars | Meeting title |
| `description` | string | ❌ | Max 1000 chars | Meeting description |
| `attendees_count` | int | ✅ | ≥ 1 | Number of attendees |
| `notes` | string | ❌ | Max 500 chars | Additional notes |

**Example Request**:
```json
{
    "room_id": "550e8400-e29b-41d4-a716-446655440000",
    "booking_date": "2026-02-18",
    "start_time": "14:00",
    "end_time": "15:30",
    "title": "Sprint Planning",
    "description": "Weekly sprint planning for Q1 deliverables",
    "attendees_count": 8,
    "notes": "Need video conferencing for remote team members"
}
```

---

### Get My Conference Room Bookings
**Intent Examples**: "my meeting room bookings", "show my room reservations"

```http
GET /desks/rooms/bookings/my
Authorization: Bearer <token>
```

---

### Cancel Conference Room Booking
**Intent Examples**: "cancel meeting room", "cancel room booking"

```http
POST /desks/rooms/bookings/{booking_id}/cancel
Authorization: Bearer <token>
```
> No request body needed.

---

### Create Conference Room (Admin)
**Access**: Desk & Conference Manager, Admin, Super Admin

```http
POST /desks/rooms
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body Schema**:
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `room_label` | string | ✅ | 1-100 chars | Room display name |
| `capacity` | int | ✅ | 1-100 | Maximum capacity |
| `has_projector` | bool | ❌ | Default: false | Has projector? |
| `has_whiteboard` | bool | ❌ | Default: true | Has whiteboard? |
| `has_video_conferencing` | bool | ❌ | Default: false | Has video conferencing? |
| `notes` | string | ❌ | Max 500 chars | Additional notes |

**Example Request**:
```json
{
    "room_label": "Innovation Hub",
    "capacity": 15,
    "has_projector": true,
    "has_whiteboard": true,
    "has_video_conferencing": true,
    "notes": "Creative space with flexible seating"
}
```

---

## 7. Food Orders

### Browse Menu / List Food Items
**Intent Examples**: "show menu", "what food is available", "list food items", "show lunch options"

```http
GET /food-orders/items?is_available=true&page=1&page_size=20
Authorization: Bearer <token>
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `category_id` | UUID | Filter by category |
| `is_available` | bool | Show only available items |
| `page` | int | Page number |
| `page_size` | int | Items per page |

---

### Place Food Order
**Intent Examples**: "order food", "I want to order lunch", "place food order", "order paneer butter masala"

```http
POST /food-orders/orders
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body Schema**:
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `items` | array | ✅ | 1-20 items | List of order items |
| `items[].food_item_id` | UUID | ✅ | Valid item UUID | Food item to order |
| `items[].quantity` | int | ❌ | 1-10 (default: 1) | Quantity |
| `items[].special_instructions` | string | ❌ | Max 500 chars | Special requests |
| `is_scheduled` | bool | ❌ | Default: false | Is this a scheduled order? |
| `scheduled_date` | date | ⚠️ | Required if is_scheduled | Future date |
| `scheduled_time` | time | ⚠️ | Required if is_scheduled | Delivery time |
| `notes` | string | ❌ | Max 500 chars | Order notes |

**Example Request (Immediate)**:
```json
{
    "items": [
        {
            "food_item_id": "550e8400-e29b-41d4-a716-446655440001",
            "quantity": 2,
            "special_instructions": "Less spicy please"
        },
        {
            "food_item_id": "550e8400-e29b-41d4-a716-446655440002",
            "quantity": 1
        }
    ],
    "notes": "Deliver to Desk A12, 3rd floor"
}
```

**Example Request (Scheduled)**:
```json
{
    "items": [
        {
            "food_item_id": "550e8400-e29b-41d4-a716-446655440001",
            "quantity": 1
        }
    ],
    "is_scheduled": true,
    "scheduled_date": "2026-02-18",
    "scheduled_time": "13:00",
    "notes": "Lunch for meeting"
}
```

---

### Get My Orders
**Intent Examples**: "my food orders", "order history", "check my order status"

```http
GET /food-orders/my-orders?page=1&page_size=20&status=pending
Authorization: Bearer <token>
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | `pending`, `preparing`, `ready`, `delivered`, `cancelled` |
| `page` | int | Page number |
| `page_size` | int | Items per page |

---

### Cancel Food Order
**Intent Examples**: "cancel my food order", "cancel lunch order"

```http
POST /food-orders/orders/{order_id}/cancel
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body Schema**:
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `cancellation_reason` | string | ✅ | 1-500 chars | Reason for cancellation |

**Example Request**:
```json
{
    "cancellation_reason": "Meeting got cancelled, no longer need the food"
}
```

---

### Create Food Item (Admin)
**Access**: Cafeteria Manager only

```http
POST /food-orders/items
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body Schema**:
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `name` | string | ✅ | 1-200 chars | Item name |
| `description` | string | ❌ | Max 1000 chars | Item description |
| `price` | decimal | ✅ | > 0 | Price in INR |
| `category_id` | UUID | ❌ | Valid category UUID | Category ID |
| `category_name` | string | ❌ | - | Category name for display |
| `ingredients` | array | ❌ | List of strings | Ingredients list |
| `tags` | array | ❌ | List of strings | Tags (e.g., "spicy", "vegan") |
| `calories` | int | ❌ | ≥ 0 | Calorie count |
| `preparation_time_minutes` | int | ❌ | 1-180 (default: 15) | Prep time |
| `image_url` | string | ❌ | Valid URL | Image URL |

**Example Request**:
```json
{
    "name": "Paneer Butter Masala",
    "description": "Creamy tomato-based curry with cottage cheese cubes",
    "price": 180.00,
    "category_name": "Main Course",
    "ingredients": ["paneer", "tomatoes", "cream", "butter", "spices"],
    "tags": ["vegetarian", "popular", "creamy"],
    "calories": 350,
    "preparation_time_minutes": 20,
    "image_url": "https://example.com/paneer.jpg"
}
```

---

## 8. IT Requests

### Create IT Request
**Intent Examples**: "raise IT ticket", "IT support request", "my laptop is broken", "need software installed", "request new laptop"

```http
POST /it-requests
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body Schema**:
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `request_type` | string | ✅ | See Request Types below | Type of IT request |
| `title` | string | ✅ | 1-300 chars | Brief title |
| `description` | string | ✅ | 10-5000 chars | Detailed description |
| `priority` | string | ❌ | Default: "medium" | Priority level |
| `related_asset_code` | string | ❌ | Existing asset code | Related asset (e.g., LAP-0042) |

**Request Types** (`request_type` values):
| Value | Use Case |
|-------|----------|
| `new` | General new request |
| `new_asset` | Request a new laptop/equipment |
| `repair` | Something is broken/not working |
| `replacement` | Replace old/damaged equipment |
| `software_install` | Install new software |
| `access_request` | Request access to systems/tools |
| `network_issue` | WiFi, VPN, network problems |
| `other` | Anything else |

**Priority Levels** (`priority` values):
| Value | Description |
|-------|-------------|
| `low` | Can wait, minor issue |
| `medium` | Standard request (default) |
| `high` | Important, needs attention soon |
| `critical` | Urgent, blocking work |

**Example Request**:
```json
{
    "request_type": "repair",
    "title": "Laptop screen flickering",
    "description": "My laptop screen has been flickering intermittently for the past 2 days. It happens especially when running multiple applications. The laptop model is Dell XPS 15.",
    "priority": "high",
    "related_asset_code": "LAP-0042"
}
```

**Example Request (Software Install)**:
```json
{
    "request_type": "software_install",
    "title": "Install VS Code and Docker",
    "description": "Need Visual Studio Code and Docker Desktop installed for development work on the new project.",
    "priority": "medium"
}
```

**Example Request (New Asset)**:
```json
{
    "request_type": "new_asset",
    "title": "Request for external monitor",
    "description": "Need a 27-inch external monitor for better productivity. Currently working with laptop screen only which is causing eye strain.",
    "priority": "low"
}
```

---

### Get My IT Requests
**Intent Examples**: "my IT tickets", "IT request status", "check IT support requests"

```http
GET /it-requests?page=1&page_size=20&status=pending
Authorization: Bearer <token>
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | `pending`, `approved`, `in_progress`, `completed`, `rejected`, `cancelled` |
| `request_type` | string | Filter by request type |
| `priority` | string | Filter by priority |

---

### Approve/Reject IT Request (Admin)
**Access**: IT Manager only

```http
POST /it-requests/{request_id}/approve
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body Schema**:
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `action` | string | ✅ | `"approve"` or `"reject"` | Approval action |
| `notes` | string | ❌ | Max 1000 chars | Approval notes |
| `rejection_reason` | string | ⚠️ | Max 500 chars, required if reject | Rejection reason |
| `assigned_to_code` | string | ❌ | Valid IT staff user code | Assign to IT staff |

**Example Request (Approve)**:
```json
{
    "action": "approve",
    "notes": "Approved. Assigning to IT support team.",
    "assigned_to_code": "3005"
}
```

**Example Request (Reject)**:
```json
{
    "action": "reject",
    "rejection_reason": "This software requires special licensing. Please submit a license request first."
}
```

---

## 9. Holidays

### List Holidays
**Intent Examples**: "show holidays", "upcoming holidays", "holiday list", "when is the next holiday"

```http
GET /holidays/list?upcoming_only=true&year=2026&page=1&page_size=50
Authorization: Bearer <token>
```

**Query Parameters**:
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `upcoming_only` | bool | true | Show only future holidays |
| `year` | int | Current year | Filter by year |
| `page` | int | 1 | Page number |
| `page_size` | int | 50 | Items per page |

**Response**:
```json
{
    "success": true,
    "data": {
        "holidays": [
            {
                "id": "uuid",
                "name": "Republic Day",
                "description": "National holiday",
                "date": "2026-01-26",
                "holiday_type": "national",
                "is_optional": false,
                "is_active": true
            },
            {
                "id": "uuid",
                "name": "Holi",
                "description": "Festival of colors",
                "date": "2026-03-10",
                "holiday_type": "festival",
                "is_optional": false,
                "is_active": true
            }
        ],
        "total": 15
    }
}
```

---

### Create Holiday (Admin)
**Access**: Super Admin only

```http
POST /holidays
Authorization: Bearer <token>
Content-Type: application/json
```

**Request Body Schema**:
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `name` | string | ✅ | 1-200 chars | Holiday name |
| `description` | string | ❌ | Max 1000 chars | Holiday description |
| `date` | date | ✅ | YYYY-MM-DD format | Holiday date |
| `holiday_type` | string | ❌ | Max 50 chars (default: "company") | Type of holiday |
| `is_optional` | bool | ❌ | Default: false | Is optional holiday? |

**Example Request**:
```json
{
    "name": "Company Foundation Day",
    "description": "Celebrating 10 years of our company",
    "date": "2026-03-15",
    "holiday_type": "company",
    "is_optional": false
}
```

---

## 10. User Profile

### Get My Profile
**Intent Examples**: "my profile", "show my details", "my information"

```http
GET /users/me
Authorization: Bearer <token>
```

**Response**:
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "user_code": "5001",
        "email": "employee1@company.com",
        "first_name": "Alice",
        "last_name": "Johnson",
        "phone": "+919876543210",
        "role": "employee",
        "department": "Development",
        "vehicle_number": "GJ-01-EM-5001",
        "vehicle_type": "car",
        "is_active": true
    }
}
```

---

### User Directory
**Intent Examples**: "find colleague", "search employees", "company directory"

```http
GET /users/directory?page=1&page_size=50&search=alice
Authorization: Bearer <token>
```

**Query Parameters**:
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | int | Page number |
| `page_size` | int | Items per page (max: 100) |
| `search` | string | Search by name, email, phone, or user code |

---

### Create User (Admin Only)
**Intent Examples**: "create new user", "add employee", "register new staff"

```http
POST /users
Authorization: Bearer <token>
Content-Type: application/json
```

> **Permission**: Only SUPER_ADMIN and ADMIN can create users.

**Request Body Schema**:
| Field | Type | Required | Constraints | Description |
|-------|------|----------|-------------|-------------|
| `first_name` | string | ✅ | 1-100 chars | User's first name |
| `last_name` | string | ✅ | 1-100 chars | User's last name |
| `password` | string | ✅ | See password requirements | User's password |
| `role` | string | ✅ | Enum | `admin`, `manager`, `team_lead`, or `employee` |
| `vehicle_number` | string | ✅ | Format: XX-00-XX-0000 | Vehicle number (e.g., GJ-33-DD-3333) |
| `vehicle_type` | string | ✅ | Enum | `car`, `motorcycle`, `bicycle`, or `none` |
| `email` | string | ❌ | Valid email | Auto-generated if not provided |
| `phone` | string | ❌ | Exactly 10 digits | Phone number (e.g., 9876543210) |
| `manager_type` | string | ⚠️ | Enum | Required when role is `manager` |
| `department` | string | ⚠️ | - | Required when role is `team_lead` |
| `team_lead_code` | string | ❌ | - | Team lead's user code (for employees) |
| `manager_code` | string | ❌ | - | Manager's user code |
| `admin_code` | string | ❌ | - | Admin's user code |

**Password Requirements**:
- At least 8 characters long
- At least one uppercase letter
- At least one lowercase letter
- At least one digit
- At least one special character (`!@#$%^&*()_+-=[]{}|;:',.<>?/~`)

**Vehicle Number Format**:
- Format: `XX-00-XX-0000` (e.g., `GJ-33-DD-3333`)
- State code (2 letters) - District code (2 digits) - Series (1-2 letters) - Number (1-4 digits)
- Also accepts without hyphens: `GJ33DD3333`

**Phone Number Format**:
- Exactly 10 digits (e.g., `9876543210`)
- Country code (+91) is automatically stripped if provided

**Example Request**:
```json
{
    "first_name": "John",
    "last_name": "Doe",
    "password": "SecurePass@123",
    "role": "employee",
    "vehicle_number": "GJ-33-DD-3333",
    "vehicle_type": "car",
    "phone": "9876543210",
    "team_lead_code": "4001"
}
```

**Response**:
```json
{
    "success": true,
    "data": {
        "id": "uuid",
        "user_code": "5006",
        "email": "john.doe@company.com",
        "first_name": "John",
        "last_name": "Doe",
        "role": "employee",
        "vehicle_number": "GJ-33-DD-3333",
        "vehicle_type": "car",
        "is_active": true
    },
    "message": "User created successfully"
}
```

---

## 11. Request Body Schemas Reference

### Quick Reference Table

| Endpoint | Method | Body Required | Schema Summary |
|----------|--------|---------------|----------------|
| `/auth/login` | POST | ✅ | `{email, password}` |
| `/auth/refresh` | POST | ✅ | `{refresh_token}` |
| `/auth/change-password` | POST | ✅ | `{current_password, new_password, confirm_password}` |
| `/users` | POST | ✅ | `{first_name, last_name, password, role, vehicle_number, vehicle_type, ...}` |
| `/attendance/check-in` | POST | ❌ | None |
| `/attendance/check-out` | POST | ❌ | None |
| `/attendance/submit` | POST | ❌ | Optional: `{notes}` |
| `/attendance/{id}/approve` | POST | ✅ | `{action, notes?, rejection_reason?}` |
| `/leave/requests` | POST | ✅ | `{leave_type, start_date, end_date, reason?, ...}` |
| `/leave/requests/{id}/approve` | POST | ✅ | `{action, notes?, rejection_reason?}` |
| `/leave/requests/{id}/cancel` | POST | ❌ | Optional: `{reason}` |
| `/parking/allocate` | POST | ❌ | None |
| `/parking/release` | POST | ❌ | None |
| `/desks/bookings` | POST | ✅ | `{desk_id, start_date, end_date, notes?}` |
| `/desks/rooms/bookings` | POST | ✅ | `{room_id, booking_date, start_time, end_time, title, attendees_count, ...}` |
| `/food-orders/orders` | POST | ✅ | `{items: [{food_item_id, quantity?, special_instructions?}], ...}` |
| `/food-orders/orders/{id}/cancel` | POST | ✅ | `{cancellation_reason}` |
| `/it-requests` | POST | ✅ | `{request_type, title, description, priority?, related_asset_code?}` |
| `/it-requests/{id}/approve` | POST | ✅ | `{action, notes?, rejection_reason?, assigned_to_code?}` |
| `/holidays` | POST | ✅ | `{name, date, description?, holiday_type?, is_optional?}` |

---

## 12. Natural Language Intent Mapping

Use this mapping to identify user intent and corresponding API calls:

### Attendance Intents
| User Says | API Call | Body |
|-----------|----------|------|
| "check in", "I'm at office", "punch in" | `POST /attendance/check-in` | None |
| "check out", "leaving office", "punch out" | `POST /attendance/check-out` | None |
| "attendance status", "am I checked in" | `GET /attendance/my-status` | None |
| "submit attendance", "send for approval" | `POST /attendance/submit` | `{notes?}` |
| "attendance history" | `GET /attendance/my` | None |

### Leave Intents
| User Says | API Call | Body |
|-----------|----------|------|
| "apply leave", "take leave", "need time off" | `POST /leave/requests` | Full schema |
| "sick leave for tomorrow" | `POST /leave/requests` | `{leave_type: "sick", ...}` |
| "half day today" | `POST /leave/requests` | `{is_half_day: true, half_day_type: "..."}` |
| "leave balance", "how many leaves left" | `GET /leave/balance` | None |
| "my leave requests" | `GET /leave/requests` | None |
| "cancel leave" | `POST /leave/requests/{id}/cancel` | `{reason?}` |

### Parking Intents
| User Says | API Call | Body |
|-----------|----------|------|
| "book parking", "need parking", "park my car" | `POST /parking/allocate` | None |
| "release parking", "exit parking" | `POST /parking/release` | None |
| "where is my car", "my parking slot" | `GET /parking/my-slot` | None |

### Desk/Room Intents
| User Says | API Call | Body |
|-----------|----------|------|
| "book desk", "reserve desk" | `POST /desks/bookings` | `{desk_id, start_date, end_date}` |
| "available desks", "show free desks" | `GET /desks?status=available` | None |
| "book meeting room", "conference room" | `POST /desks/rooms/bookings` | Full schema |
| "available meeting rooms" | `GET /desks/rooms` | None |
| "my desk bookings" | `GET /desks/bookings/my` | None |

### Food Intents
| User Says | API Call | Body |
|-----------|----------|------|
| "show menu", "what's for lunch" | `GET /food-orders/items` | None |
| "order food", "I want to eat" | `POST /food-orders/orders` | `{items: [...]}` |
| "my orders", "order status" | `GET /food-orders/my-orders` | None |
| "cancel food order" | `POST /food-orders/orders/{id}/cancel` | `{cancellation_reason}` |

### IT Support Intents
| User Says | API Call | Body |
|-----------|----------|------|
| "raise IT ticket", "IT help", "laptop broken" | `POST /it-requests` | `{request_type: "repair", ...}` |
| "install software" | `POST /it-requests` | `{request_type: "software_install", ...}` |
| "network not working", "WiFi issue" | `POST /it-requests` | `{request_type: "network_issue", ...}` |
| "need new laptop" | `POST /it-requests` | `{request_type: "new_asset", ...}` |
| "my IT tickets" | `GET /it-requests` | None |

### General Intents
| User Says | API Call | Body |
|-----------|----------|------|
| "holiday list", "upcoming holidays" | `GET /holidays/list` | None |
| "my profile", "my details" | `GET /users/me` | None |
| "change password" | `POST /auth/change-password` | `{current_password, new_password, confirm_password}` |

---

## 📝 Common Response Format

All API responses follow this structure:

**Success Response**:
```json
{
    "success": true,
    "message": "Operation completed successfully",
    "data": { ... },
    "timestamp": "2026-02-17T10:30:00Z"
}
```

**Paginated Response**:
```json
{
    "success": true,
    "message": "Records retrieved successfully",
    "data": [ ... ],
    "total": 100,
    "page": 1,
    "page_size": 20,
    "timestamp": "2026-02-17T10:30:00Z"
}
```

**Error Response**:
```json
{
    "success": false,
    "message": "Error message",
    "detail": "Detailed error description",
    "timestamp": "2026-02-17T10:30:00Z"
}
```

---

## ⚠️ Error Handling

| HTTP Code | Meaning | Agent Action |
|-----------|---------|--------------|
| 400 | Bad Request | Check request body, inform user of validation error |
| 401 | Unauthorized | Token expired, need to re-login |
| 403 | Forbidden | User doesn't have permission for this action |
| 404 | Not Found | Resource doesn't exist, inform user |
| 422 | Validation Error | Invalid input format, check field constraints |
| 500 | Server Error | Retry once, then inform user of technical issue |

---

## 🔑 Agent Workflow Example

**User**: "I want to apply for sick leave tomorrow"

**Agent Steps**:
1. Extract intent: `apply_leave`
2. Extract entities: `leave_type=sick`, `date=tomorrow`
3. Calculate dates: `start_date=2026-02-18`, `end_date=2026-02-18`
4. Call API:
```http
POST /leave/requests
Authorization: Bearer <token>
Content-Type: application/json

{
    "leave_type": "sick",
    "start_date": "2026-02-18",
    "end_date": "2026-02-18",
    "reason": "Not feeling well",
    "is_half_day": false
}
```
5. Return response to user: "Your sick leave for February 18, 2026 has been applied and is pending approval from your Team Lead."

---

## 📝 Enum Values Reference

### ITRequestType
```
new, new_asset, repair, replacement, software_install, access_request, network_issue, other
```

### ITRequestPriority
```
low, medium, high, critical
```

### ITRequestStatus
```
pending, approved, in_progress, completed, rejected, cancelled
```

### LeaveType
```
casual, sick, privilege, unpaid
```

### LeaveStatus
```
pending, approved, rejected, cancelled
```

### AttendanceStatus
```
draft, pending_approval, approved, rejected
```

### OrderStatus
```
pending, preparing, ready, delivered, cancelled
```

### BookingStatus
```
pending, confirmed, cancelled
```

### DeskStatus
```
available, booked, maintenance
```

---

*Last Updated: February 17, 2026*
