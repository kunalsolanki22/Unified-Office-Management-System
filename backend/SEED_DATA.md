# Seed Data Documentation

This document provides a comprehensive overview of all seed data used in the Unified Office Management System.

---

## 📋 Table of Contents

1. [Users & Hierarchy](#users--hierarchy)
2. [Desks](#desks)
3. [Conference Rooms](#conference-rooms)
4. [Parking Slots](#parking-slots)
5. [Cafeteria Tables](#cafeteria-tables)
6. [Food Items](#food-items)
7. [IT Assets](#it-assets)
8. [Leave Types](#leave-types)
9. [Running Seed Scripts](#running-seed-scripts)

---

## 👥 Users & Hierarchy

### Organization Hierarchy

```
┌─────────────────────────────────────────────────────────────────┐
│  SUPER_ADMIN                                                    │
│       │ creates                                                 │
│       ▼                                                         │
│    ADMIN                                                        │
│       │ creates                                                 │
│       ▼                                                         │
│  MANAGER (5 types):                                             │
│    - Parking Manager                                            │
│    - Attendance Manager → creates Team Leads                    │
│    - Desk & Conference Manager                                  │
│    - Cafeteria Manager                                          │
│    - IT Support Manager                                         │
│       │ creates                                                 │
│       ▼                                                         │
│  TEAM_LEAD (Dev, Sales, AI, HR)                                 │
│       │ manages                                                 │
│       ▼                                                         │
│  EMPLOYEE                                                       │
└─────────────────────────────────────────────────────────────────┘
```

### User Credentials (seed_data.py)

| Role | User Code | Email | Password | Department |
|------|-----------|-------|----------|------------|
| **Super Admin** | 1001 | super.admin@company.com | Admin@123 | Administration |
| **Admin** | 2001 | admin@company.com | Admin@123 | Administration |
| **Parking Manager** | 3001 | parking.manager@company.com | Manager@123 | Facilities |
| **Attendance Manager** | 3002 | attendance.manager@company.com | Manager@123 | HR |
| **Desk Manager** | 3003 | desk.manager@company.com | Manager@123 | Facilities |
| **Cafeteria Manager** | 3004 | cafeteria.manager@company.com | Manager@123 | Food Services |
| **IT Support Manager** | 3005 | it.manager@company.com | Manager@123 | IT |
| **Team Lead (Dev)** | 4001 | dev.teamlead@company.com | TeamLead@123 | Development |
| **Team Lead (Sales)** | 4002 | sales.teamlead@company.com | TeamLead@123 | Sales |
| **Employee 1** | 5001 | employee1@company.com | Employee@123 | Development |
| **Employee 2** | 5002 | employee2@company.com | Employee@123 | Development |
| **Employee 3** | 5003 | employee3@company.com | Employee@123 | Sales |
| **Employee 4** | 5004 | employee4@company.com | Employee@123 | HR |
| **Employee 5** | 5005 | employee5@company.com | Employee@123 | IT |

### User Credentials (seed_hierarchy.py)

| Role | User Code | Email | Password | Department |
|------|-----------|-------|----------|------------|
| **Super Admin** | SA0001 | super.admin@cygnet.com | Admin@123 | - |
| **Admin** | AD0001 | admin@cygnet.com | Admin@123 | - |
| **Parking Manager** | PM0001 | parking.manager@cygnet.com | Manager@123 | - |
| **Attendance Manager** | AM0001 | attendance.manager@cygnet.com | Manager@123 | - |
| **Desk Manager** | DM0001 | desk.manager@cygnet.com | Manager@123 | - |
| **Cafeteria Manager** | CM0001 | cafeteria.manager@cygnet.com | Manager@123 | - |
| **IT Support Manager** | IM0001 | it.manager@cygnet.com | Manager@123 | - |
| **Team Lead (Dev)** | TL0001 | development.lead@cygnet.com | TeamLead@123 | Development |
| **Team Lead (Sales)** | TL0002 | sales.lead@cygnet.com | TeamLead@123 | Sales |
| **Team Lead (AI)** | TL0003 | ai.lead@cygnet.com | TeamLead@123 | AI |
| **Team Lead (HR)** | TL0004 | hr.lead@cygnet.com | TeamLead@123 | HR |
| **Employee** | EM0001 | john.developer@cygnet.com | Employee@123 | Development |
| **Employee** | EM0002 | jane.coder@cygnet.com | Employee@123 | Development |
| **Employee** | EM0003 | bob.programmer@cygnet.com | Employee@123 | Development |
| **Employee** | EM0004 | alice.seller@cygnet.com | Employee@123 | Sales |
| **Employee** | EM0005 | charlie.deal@cygnet.com | Employee@123 | Sales |
| **Employee** | EM0006 | data.scientist@cygnet.com | Employee@123 | AI |
| **Employee** | EM0007 | ml.engineer@cygnet.com | Employee@123 | AI |
| **Employee** | EM0008 | human.resource@cygnet.com | Employee@123 | HR |

### Vehicle Information

All managers have car vehicle types with vehicle numbers following the pattern `GJ01XX####` where XX indicates role:
- SA = Super Admin
- AD = Admin
- PM = Parking Manager
- AM = Attendance Manager
- DM = Desk Manager
- CM = Cafeteria Manager
- IT = IT Manager
- TL = Team Lead
- EM = Employee

---

## 🖥️ Desks

**Total: 10 desks**

| Desk Label | Code Pattern | Features |
|------------|--------------|----------|
| Window Desk A1 | DSK-XXXX | Random monitor/docking station |
| Window Desk A2 | DSK-XXXX | Random monitor/docking station |
| Window Desk A3 | DSK-XXXX | Random monitor/docking station |
| Corner Desk B1 | DSK-XXXX | Random monitor/docking station |
| Corner Desk B2 | DSK-XXXX | Random monitor/docking station |
| Open Area C1 | DSK-XXXX | Random monitor/docking station |
| Open Area C2 | DSK-XXXX | Random monitor/docking station |
| Open Area C3 | DSK-XXXX | Random monitor/docking station |
| Quiet Zone D1 | DSK-XXXX | Random monitor/docking station |
| Quiet Zone D2 | DSK-XXXX | Random monitor/docking station |

> Note: Desk codes are auto-generated with format `DSK-XXXX` (random 4-digit number)

---

## 🏢 Conference Rooms

**Total: 5 rooms**

| Room Label | Code Pattern | Capacity | Projector | Whiteboard | Video Conf |
|------------|--------------|----------|-----------|------------|------------|
| Board Room | CNF-XXXX | 20 | ✅ | ✅ | ✅ |
| Meeting Room Alpha | CNF-XXXX | 8 | ✅ | ✅ | ✅ |
| Meeting Room Beta | CNF-XXXX | 6 | ❌ | ✅ | ❌ |
| Huddle Space 1 | CNF-XXXX | 4 | ❌ | ❌ | ❌ |
| Interview Room | CNF-XXXX | 3 | ❌ | ✅ | ✅ |

> Note: Room codes are auto-generated with format `CNF-XXXX` (random 4-digit number)

---

## 🚗 Parking Slots

**Total: 15 slots**

### Employee Slots (10)

| Slot Label | Code Pattern | Vehicle Type | Parking Type |
|------------|--------------|--------------|--------------|
| Employee A1 | PKG-XXXX | Car | Employee |
| Employee A2 | PKG-XXXX | Car | Employee |
| Employee A3 | PKG-XXXX | Car | Employee |
| Employee B1 | PKG-XXXX | Car | Employee |
| Employee B2 | PKG-XXXX | Car | Employee |
| Bike Bay 1 | PKG-XXXX | Bike | Employee |
| Bike Bay 2 | PKG-XXXX | Bike | Employee |
| Bike Bay 3 | PKG-XXXX | Bike | Employee |
| Bike Bay 4 | PKG-XXXX | Bike | Employee |
| Bike Bay 5 | PKG-XXXX | Bike | Employee |

### Visitor Slots (5)

| Slot Label | Code Pattern | Vehicle Type | Parking Type |
|------------|--------------|--------------|--------------|
| Visitor V1 | PKG-XXXX | Car | Visitor |
| Visitor V2 | PKG-XXXX | Car | Visitor |
| Visitor V3 | PKG-XXXX | Car | Visitor |
| Visitor Bike 1 | PKG-XXXX | Bike | Visitor |
| Visitor Bike 2 | PKG-XXXX | Bike | Visitor |

> Note: Slot codes are auto-generated with format `PKG-XXXX` (random 4-digit number)

---

## 🍽️ Cafeteria Tables

**Total: 8 tables**

| Table Label | Code Pattern | Capacity | Table Type |
|-------------|--------------|----------|------------|
| Window Table 1 | TBL-XXXX | 4 | Regular |
| Window Table 2 | TBL-XXXX | 4 | Regular |
| Center Table 1 | TBL-XXXX | 6 | Large |
| Center Table 2 | TBL-XXXX | 6 | Large |
| Round Table 1 | TBL-XXXX | 8 | Round |
| Round Table 2 | TBL-XXXX | 8 | Round |
| High Top 1 | TBL-XXXX | 2 | High |
| High Top 2 | TBL-XXXX | 2 | High |

> Note: Table codes are auto-generated with format `TBL-XXXX` (random 4-digit number)

---

## 🍕 Food Items

**Total: 10 items**

| Name | Price | Category | Tags | Calories |
|------|-------|----------|------|----------|
| Butter Chicken | ₹12.99 | Main Course | non-veg, spicy | 450 |
| Paneer Tikka | ₹9.99 | Starters | vegetarian, high-protein | 280 |
| Masala Dosa | ₹7.99 | South Indian | vegetarian, vegan | 320 |
| Chicken Biryani | ₹14.99 | Main Course | non-veg, spicy | 520 |
| Dal Makhani | ₹8.99 | Main Course | vegetarian | 350 |
| Mango Lassi | ₹3.99 | Beverages | vegetarian, sweet | 180 |
| Coffee | ₹2.49 | Beverages | vegetarian, vegan | 5 |
| Tea | ₹1.99 | Beverages | vegetarian, vegan | 25 |
| Veg Sandwich | ₹4.99 | Snacks | vegetarian, healthy | 250 |
| Samosa | ₹2.99 | Snacks | vegetarian, spicy | 150 |

### Food Item Descriptions

| Name | Description |
|------|-------------|
| Butter Chicken | Creamy tomato-based curry with tender chicken |
| Paneer Tikka | Grilled cottage cheese with spices |
| Masala Dosa | Crispy rice crepe with potato filling |
| Chicken Biryani | Aromatic basmati rice with spiced chicken |
| Dal Makhani | Creamy black lentils slow-cooked |
| Mango Lassi | Sweet mango yogurt drink |
| Coffee | Fresh brewed hot coffee |
| Tea | Hot brewed masala chai |
| Veg Sandwich | Fresh vegetable grilled sandwich |
| Samosa | Crispy fried pastry with potato filling |

---

## 💻 IT Assets

**Total: 10 assets**

| Asset Code | Name | Type | Serial Number | Model | Vendor |
|------------|------|------|---------------|-------|--------|
| IT-LAP-001 | Dell Latitude 5520 | Laptop | DELL-LAP-001 | Latitude 5520 | Dell |
| IT-LAP-002 | Dell Latitude 5520 | Laptop | DELL-LAP-002 | Latitude 5520 | Dell |
| IT-LAP-003 | MacBook Pro 14 | Laptop | APPLE-MAC-001 | MacBook Pro 14 | Apple |
| IT-MON-001 | HP Monitor 24 | Monitor | HP-MON-001 | HP E24 | HP |
| IT-MON-002 | HP Monitor 24 | Monitor | HP-MON-002 | HP E24 | HP |
| IT-MON-003 | Dell Monitor 27 | Monitor | DELL-MON-001 | Dell U2722D | Dell |
| IT-KB-001 | Logitech Keyboard | Keyboard | LOG-KB-001 | K120 | Logitech |
| IT-KB-002 | Logitech Keyboard | Keyboard | LOG-KB-002 | K120 | Logitech |
| IT-MS-001 | Logitech Mouse | Mouse | LOG-MS-001 | M100 | Logitech |
| IT-MS-002 | Logitech Mouse | Mouse | LOG-MS-002 | M100 | Logitech |

> All assets are seeded with `AVAILABLE` status

---

## 🏖️ Leave Types

**Total: 7 leave types**

| Leave Type | Code | Default Days | Paid | Requires Approval | Carry Forward | Max Carry Days |
|------------|------|--------------|------|-------------------|---------------|----------------|
| Sick Leave | SICK | 12 | ✅ | ✅ | ❌ | 0 |
| Casual Leave | CASUAL | 12 | ✅ | ✅ | ❌ | 0 |
| Annual Leave | ANNUAL | 15 | ✅ | ✅ | ✅ | 5 |
| Unpaid Leave | UNPAID | 0 | ❌ | ✅ | ❌ | 0 |
| Maternity Leave | MATERNITY | 180 | ✅ | ✅ | ❌ | 0 |
| Paternity Leave | PATERNITY | 15 | ✅ | ✅ | ❌ | 0 |
| Bereavement Leave | BEREAVEMENT | 5 | ✅ | ✅ | ❌ | 0 |

### Leave Type Descriptions

| Leave Type | Description |
|------------|-------------|
| Sick Leave | Leave for illness or medical appointments |
| Casual Leave | Personal leave for casual purposes |
| Annual Leave | Yearly vacation leave |
| Unpaid Leave | Leave without pay |
| Maternity Leave | Maternity leave for new mothers |
| Paternity Leave | Paternity leave for new fathers |
| Bereavement Leave | Leave for mourning the loss of a family member |

---

## 🚀 Running Seed Scripts

### Prerequisites

Make sure you have the database set up and migrations applied.

### Run Full Seed (seed_data.py)

```bash
cd backend
python -m scripts.seed_data
```

This will seed:
- 14 Users (1 Super Admin, 1 Admin, 5 Managers, 2 Team Leads, 5 Employees)
- 10 Desks
- 5 Conference Rooms
- 15 Parking Slots
- 8 Cafeteria Tables
- 10 Food Items
- 10 IT Assets
- 7 Leave Types

### Run Hierarchy Seed (seed_hierarchy.py)

```bash
cd backend
python -m scripts.seed_hierarchy
```

This will seed:
- 1 Super Admin
- 1 Admin
- 5 Managers
- 4 Team Leads
- 8 Employees

> Note: `seed_hierarchy.py` creates a cleaner hierarchical structure with proper relationships between users. Use this for testing role-based features.

---

## 📝 Notes

1. **Code Generation**: Desk, Conference Room, Parking, and Table codes are auto-generated with random 4-digit suffixes. Running the seed multiple times may create duplicates.

2. **Idempotency**: The seed scripts check for existing data before inserting. Running them multiple times will skip already-seeded items.

3. **Manager Types**: Each manager type controls specific features:
   - `PARKING` - Parking slot management
   - `ATTENDANCE` - Attendance tracking, Team Lead creation
   - `DESK_CONFERENCE` - Desk and conference room management
   - `CAFETERIA` - Cafeteria table and food management
   - `IT_SUPPORT` - IT asset and support ticket management

4. **Default Status**: All resources (desks, parking, tables, assets) are seeded as `AVAILABLE`.

5. **Vehicle Numbers**: Follow Gujarat registration format `GJ01XXNNNN`.
