# 🤖 AI Chatbot for Office Management System

An intelligent CLI chatbot that allows employees to perform self-service operations using natural language. The chatbot uses **Groq's meta-llama/llama-4-scout-17b-16e-instruct** model via **LangChain** to understand user requests and execute appropriate API calls.

## ✨ Features

- **Natural Language Processing**: Understands natural language requests like "I want to apply for leave tomorrow"
- **Smart API Selection**: Automatically determines which APIs to call based on user intent
- **Automatic Payload Generation**: Creates API payloads with intelligent defaults
- **Multi-API Orchestration**: Handles complex requests requiring multiple API calls
- **Follow-up Questions**: Asks for clarification only when essential information is missing
- **Conversation History**: Maintains context for better understanding
- **Comprehensive Logging**: Logs all LLM calls and API executions to database
- **CLI Interface**: Beautiful command-line interface with rich formatting

## 🚫 Excluded Operations

By design, the following are **NOT** available through this chatbot:
- **Parking Services**: All parking operations
- **Admin Operations**: User management, role changes, system configuration
- **Manager/Team Lead Approvals**: Approval workflows (leave approval, attendance approval, etc.)

## 📋 Available Operations

| Category | Operations |
|----------|------------|
| **Authentication** | Login, view profile, change password |
| **Attendance** | Check-in, check-out, view history, submit for approval |
| **Leave Management** | Apply for leave, view balance, cancel requests, view history |
| **Desk Booking** | View desks, book desk, view/cancel bookings |
| **Conference Rooms** | View rooms, book rooms |
| **Food Ordering** | View menu, place orders, view/cancel orders |
| **Cafeteria Tables** | View tables, book tables |
| **IT Assets** | View assigned equipment |
| **IT Requests** | Submit IT requests, view/cancel requests |
| **Holidays** | View company holidays |
| **User Directory** | Search employee directory |
| **Semantic Search** | Smart search for food items and IT assets |

## 🛠️ Installation

### Prerequisites

- Python 3.10+
- Groq API Key (get from https://console.groq.com)
- Backend API running (default: http://localhost:8000)

### Setup

```bash
# Navigate to the chatbot directory
cd ai-chatbot

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
# OR
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Copy environment file and configure
cp .env.example .env

# Edit .env and add your GROQ_API_KEY
nano .env  # or vim, code, etc.
```

### Environment Configuration

Edit `.env` file:

```env
# Required: Get from https://console.groq.com
GROQ_API_KEY=your_groq_api_key_here

# Backend API (adjust if needed)
BACKEND_BASE_URL=http://localhost:8000
API_V1_PREFIX=/api/v1

# LLM Settings (optional)
LLM_MODEL=meta-llama/llama-4-scout-17b-16e-instruct
LLM_TEMPERATURE=0.1
LLM_MAX_TOKENS=4096

# Database (SQLite by default)
DATABASE_URL=sqlite+aiosqlite:///./chatbot.db

# Logging
LOG_LEVEL=INFO
```

## 🚀 Running the Chatbot

### Start the CLI

```bash
# Make sure backend is running first!
cd ai-chatbot
python cli.py
```

### CLI Commands

| Command | Description |
|---------|-------------|
| `/login <email> <password>` | Login to the system |
| `/logout` | Logout from the system |
| `/status` | Show current login status |
| `/clear` | Clear the screen |
| `/history` | Show recent conversation history |
| `/apis` | List available API categories |
| `/help` | Show help information |
| `/exit` or `/quit` | Exit the chatbot |

### Example Session

```
╔═══════════════════════════════════════════════════════════════════╗
║           🤖 Office Management AI Chatbot                         ║
╚═══════════════════════════════════════════════════════════════════╝

[not logged in] > /login john.doe@company.com SecurePass@123
✓ Welcome John Doe! You are logged in as employee.

[john.doe@company.com] > I want to check in
✓ Check-in recorded successfully!
- Time: 09:15:00
- Date: 2026-02-13
- Status: draft

[john.doe@company.com] > Show my leave balance
Your leave balance:
- Casual Leave: 8.0 days
- Sick Leave: 10.0 days  
- Privilege Leave: 15.0 days
- Total Available: 33.0 days

[john.doe@company.com] > Apply for 2 days casual leave starting from next Monday
✓ Leave request created successfully!
- Request ID: abc123
- Leave Type: Casual
- Start Date: 2026-02-17
- End Date: 2026-02-18
- Total Days: 2.0
- Status: pending

[john.doe@company.com] > Order 2 chicken biryanis for lunch
✓ Food order placed successfully!
- Order Number: ORD-20260213-001
- Items: 2x Chicken Biryani
- Total Amount: ₹240.00
- Status: pending

[john.doe@company.com] > /exit
Goodbye! 👋
```

## 🏗️ Architecture

### System Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                         User Input                               │
│          "I want to apply for 2 days casual leave"              │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LLM Call 1                                  │
│              (API Selection)                                     │
│  - Analyzes user intent                                         │
│  - Selects: LEAVE_CREATE                                        │
│  - May also select: LEAVE_BALANCE (to check balance first)      │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                 Knowledge Base Lookup                            │
│  - Fetch API details for selected APIs                          │
│  - Get required fields, enum values, validation rules           │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LLM Call 2                                  │
│              (Payload Generation)                                │
│  - Generate JSON payloads                                       │
│  - Auto-fill description/title fields                           │
│  - Ask follow-up only for essential missing info                │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                    API Execution                                 │
│  - Execute APIs in order                                        │
│  - Handle dependencies between APIs                             │
│  - Collect responses                                            │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────┐
│                Response Generation                               │
│  - Generate user-friendly response                              │
│  - Display results in chat format                               │
└─────────────────────────────────────────────────────────────────┘
```

### Project Structure

```
ai-chatbot/
├── cli.py                      # CLI entry point
├── requirements.txt            # Python dependencies
├── .env.example               # Example environment config
├── .gitignore                 # Git ignore file
├── README.md                  # This file
│
├── config/
│   ├── __init__.py
│   └── settings.py            # Configuration settings
│
├── data/
│   └── api_knowledge_base.json  # API definitions
│
├── database/
│   ├── __init__.py
│   ├── connection.py          # Database connection
│   └── models.py              # SQLAlchemy models for logging
│
├── services/
│   ├── __init__.py
│   ├── api_client.py          # HTTP client for backend API
│   ├── knowledge_base.py      # Knowledge base service
│   ├── llm_service.py         # LLM interaction service
│   └── orchestrator.py        # Main orchestration logic
│
├── utils/
│   ├── __init__.py
│   └── logger.py              # Logging configuration
│
└── logs/                      # Log files (auto-created)
    └── chatbot.log
```

## 📊 Database Logging

All LLM calls are logged to SQLite database for debugging and analysis:

### LLM Call 1 Logs (`llm_call_1_logs`)
- Session ID
- User input
- Prompt sent to LLM
- Raw response
- Selected APIs
- Reasoning
- Success/error status
- Latency

### LLM Call 2 Logs (`llm_call_2_logs`)
- Session ID
- User input
- API context
- Generated payloads
- Follow-up questions (if any)
- API execution results
- Final response to user
- Success/error status
- Latency

### Viewing Logs

```bash
# Using SQLite CLI
sqlite3 chatbot.db

# View LLM Call 1 logs
SELECT id, user_input, selected_apis, success, created_at 
FROM llm_call_1_logs 
ORDER BY created_at DESC 
LIMIT 10;

# View LLM Call 2 logs
SELECT id, user_input, generated_payloads, api_responses, success 
FROM llm_call_2_logs 
ORDER BY created_at DESC 
LIMIT 10;

# View errors
SELECT * FROM llm_call_1_logs WHERE success = 0;
SELECT * FROM llm_call_2_logs WHERE success = 0;
```

## 🔧 Configuration

### Adding New APIs

1. Edit `data/api_knowledge_base.json`
2. Add new API entry under `apis` key:

```json
{
  "NEW_API_ID": {
    "api_id": "NEW_API_ID",
    "name": "Human Readable Name",
    "description": "Detailed description for LLM",
    "short_description": "Short desc for API list",
    "endpoint": "/endpoint/path",
    "method": "POST",
    "auth_required": true,
    "user_accessible": true,
    "category": "category_name",
    "request_body": {
      "field_name": {
        "type": "string",
        "required": true,
        "description": "Field description",
        "auto_fill": false
      }
    },
    "usage_example": "Example user request"
  }
}
```

### Auto-fill Fields

Fields marked with `"auto_fill": true` will be automatically generated by the LLM:
- `description` - Generated based on user request
- `title` - Generated based on context
- `reason` - Generated based on leave type, etc.
- `notes` - Generated or left empty
- `purpose` - Generated based on booking context
- `is_half_day` - Always defaults to `false`

### Required Fields

For required fields without `auto_fill`:
- The LLM will ask follow-up questions to get this information
- Examples: dates, quantities, specific IDs

## 🐛 Troubleshooting

### Common Issues

**1. "GROQ_API_KEY not set"**
```bash
# Make sure .env file exists and has the key
cat .env | grep GROQ_API_KEY
```

**2. "Could not connect to backend API"**
```bash
# Ensure backend is running
curl http://localhost:8000/api/v1/auth/me

# Check BACKEND_BASE_URL in .env
```

**3. "Login failed"**
- Verify credentials are correct
- Ensure user is active in the system

**4. "422 Unprocessable Entity"**
- Missing required fields in payload
- Check logs for exact error
- Review `logs/chatbot.log`

### Debug Mode

```bash
# Set LOG_LEVEL to DEBUG in .env
LOG_LEVEL=DEBUG

# View detailed logs
tail -f logs/chatbot.log
```

## 📝 API Knowledge Base

The knowledge base (`data/api_knowledge_base.json`) contains:
- 25+ user-accessible API definitions
- Field specifications with types and validation
- Enum values for dropdowns
- Dependencies between APIs
- Auto-fill field markers

### Categories

1. **Authentication** - Login, profile, password
2. **Attendance** - Check-in/out, history, submit
3. **Leave** - Apply, balance, cancel, history
4. **Desk Booking** - List, book, cancel
5. **Conference Rooms** - List, book
6. **Food Ordering** - Menu, order, history
7. **Cafeteria** - Table booking
8. **IT Assets** - View assigned
9. **IT Requests** - Submit, view, cancel
10. **Holidays** - View calendar
11. **Users** - Directory search
12. **Search** - Semantic search

## 🔒 Security Notes

- JWT tokens are stored in memory only
- Passwords are never logged
- Sensitive data excluded from logs
- Session-based authentication
- Role-based access control (via backend)

## 📄 License

MIT License - See main project LICENSE file.

## 🙏 Credits

- **LLM**: Groq with meta-llama/llama-4-scout-17b-16e-instruct
- **Framework**: LangChain for LLM orchestration
- **CLI**: Rich library for beautiful terminal output
- **Backend**: FastAPI-based Office Management System
