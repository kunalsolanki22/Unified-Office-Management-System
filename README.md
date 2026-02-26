# AI Employee Services Chatbot

A multi-agent conversational AI system for managing employee services including attendance, leave, bookings, cafeteria services, and IT support.

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              USER INPUT                                  │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           ROUTING AGENT                                  │
│                                                                          │
│  • Analyzes user intent using LLM                                       │
│  • Classifies request to appropriate domain                             │
│  • Handles greetings, farewells, and unclear requests                   │
│  • Routes with confidence scoring                                        │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
          ┌───────────────────────┼───────────────────────┐
          │                       │                       │
          ▼                       ▼                       ▼
┌─────────────────┐   ┌─────────────────┐   ┌─────────────────┐
│   ATTENDANCE    │   │      LEAVE      │   │ DESK/CONFERENCE │
│     AGENT       │   │     AGENT       │   │     AGENT       │
│                 │   │                 │   │                 │
│ • Check-in/out  │   │ • Apply leave   │   │ • Book desk     │
│ • History       │   │ • Balance       │   │ • Book room     │
│ • Holidays      │   │ • Cancel        │   │ • Availability  │
└────────┬────────┘   └────────┬────────┘   └────────┬────────┘
         │                     │                     │
         └──────────────┬──────┴──────┬──────────────┘
                        │             │
          ┌─────────────┴─────────────┴─────────────┐
          ▼                                         ▼
┌─────────────────┐                     ┌─────────────────┐
│   CAFETERIA     │                     │ IT MANAGEMENT   │
│     AGENT       │                     │     AGENT       │
│                 │                     │                 │
│ • View menu     │                     │ • Raise ticket  │
│ • Order food    │                     │ • Check status  │
│ • Book table    │                     │ • View history  │
└────────┬────────┘                     └────────┬────────┘
         │                                       │
         └───────────────────┬───────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              TOOLS                                       │
│                         (API Client)                                     │
│                                                                          │
│  • HTTP client for backend API calls                                    │
│  • Authentication handling (JWT)                                         │
│  • Request/Response formatting                                           │
│  • Error handling                                                        │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     CONVERSATION/RESPONSE GENERATOR                      │
│                          (Orchestrator)                                  │
│                                                                          │
│  • Manages conversation state and history                               │
│  • Handles multi-turn interactions                                       │
│  • Generates natural language responses                                  │
│  • Supports follow-up questions                                          │
└─────────────────────────────────┬───────────────────────────────────────┘
                                  │
                                  ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                           USER RESPONSE                                  │
└─────────────────────────────────────────────────────────────────────────┘
```

## 📁 Project Structure

```
ai-chatbot/
├── main.py                    # Main entry point
├── requirements.txt           # Python dependencies
├── .env.example              # Environment variables template
├── agents/                   # Agent implementations
│   ├── base_agent.py         # Abstract base agent class
│   ├── routing_agent.py      # Intent classification & routing
│   ├── attendance_agent.py   # Attendance management
│   ├── leave_agent.py        # Leave management
│   ├── desk_conference_agent.py  # Desk & room bookings
│   ├── cafeteria_agent.py    # Cafeteria services
│   └── it_agent.py           # IT support
├── cli/                      # Command-line interface
│   └── main.py               # CLI implementation
├── config/                   # Configuration
│   └── settings.py           # App settings & env vars
├── core/                     # Core components
│   └── orchestrator.py       # Main conversation controller
├── database/                 # Database layer
│   ├── models.py             # SQLAlchemy models
│   ├── connection.py         # DB connection management
│   └── repository.py         # Repository pattern
├── knowledge/                # Knowledge base
│   └── user_services_kb.json # API definitions & intents
├── services/                 # Business services
│   ├── llm_service.py        # LLM integration (Groq/OpenAI)
│   └── kb_loader.py          # Knowledge base loader
├── tools/                    # Agent tools
│   └── api_client.py         # HTTP client for backend
└── logs/                     # Application logs
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
# Copy example env file
cp .env.example .env

# Edit .env and add your Groq API key
GROQ_API_KEY=your-groq-api-key-here
```

### 3. Initialize Database

```bash
python main.py --init-db
```

### 4. Run the Chatbot

```bash
python main.py
```

## 🔧 Configuration

Key environment variables in `.env`:

| Variable | Description | Default |
|----------|-------------|---------|
| `GROQ_API_KEY` | Groq API key (required) | - |
| `LLM_PROVIDER` | LLM provider (groq/openai) | groq |
| `BACKEND_BASE_URL` | Backend API URL | http://127.0.0.1:8000/api/v1 |
| `DATABASE_URL` | Database connection | sqlite:///./chatbot.db |
| `LOG_LEVEL` | Logging level | INFO |

## 🤖 Agents

### Routing Agent
- Analyzes user input using LLM
- Classifies intent and routes to appropriate domain agent
- Handles greetings, farewells, and ambiguous requests
- Provides confidence scores for routing decisions

### Domain Agents
Each domain agent specializes in a specific area:

| Agent | Domains | Capabilities |
|-------|---------|--------------|
| Attendance | attendance, holidays | Check-in/out, history, holiday list |
| Leave | leave | Apply, balance, history, cancel |
| Desk/Conference | desk_booking, conference_room | Book, availability, cancel |
| Cafeteria | food_orders, cafeteria_tables | Menu, order, table booking |
| IT Management | it_requests | Raise tickets, check status |

## 📊 Database Schema

```
┌─────────────┐     ┌─────────────┐     ┌─────────────────┐
│    User     │     │   Session   │     │  Conversation   │
├─────────────┤     ├─────────────┤     ├─────────────────┤
│ id          │◄────│ user_id     │◄────│ session_id      │
│ user_code   │     │ status      │     │ current_agent   │
│ email       │     │ access_token│     │ pending_action  │
│ first_name  │     │ started_at  │     │ is_active       │
│ last_name   │     │ ended_at    │     │ created_at      │
│ role        │     └─────────────┘     └────────┬────────┘
└─────────────┘                                   │
                                                  │
                    ┌─────────────────────────────┴─────┐
                    │                                   │
                    ▼                                   ▼
          ┌─────────────────┐               ┌─────────────────────┐
          │     Message     │               │  AgentRoutingLog    │
          ├─────────────────┤               ├─────────────────────┤
          │ conversation_id │               │ session_id          │
          │ role            │               │ user_input          │
          │ content         │               │ selected_agent      │
          │ agent_id        │               │ confidence_score    │
          │ tokens_used     │               │ routing_reason      │
          └─────────────────┘               └─────────────────────┘
```

## 🔄 Conversation Flow

1. **User Input** → User types a message
2. **Routing** → Routing Agent classifies intent
3. **Agent Selection** → Appropriate domain agent is activated
4. **Processing** → Agent uses LLM to understand request and extract parameters
5. **API Call** → If needed, agent calls backend API via Tools
6. **Response Generation** → Natural language response is generated
7. **Follow-up** → If more info needed, agent asks clarifying questions

## 🛠️ CLI Commands

| Command | Description |
|---------|-------------|
| `/help` | Show available commands |
| `/login` | Login with credentials |
| `/logout` | Logout and end session |
| `/clear` | Clear conversation history |
| `/quit` | Exit the chatbot |

## 📝 Example Conversations

**Attendance:**
```
You: I want to check in
Assistant: ✅ You've been checked in successfully! Time: 9:00 AM
```

**Leave:**
```
You: I want to apply for leave
Assistant: Sure! I can help you apply for leave. Could you please tell me:
1. What type of leave? (casual, sick, earned)
2. From which date?
3. To which date?
```

**Desk Booking:**
```
You: Book a desk for tomorrow
Assistant: I found 5 available desks for tomorrow. Which one would you prefer?
- Desk A1 (Window seat)
- Desk B3 (Near cafeteria)
...
```

## 📄 License

MIT License

## 👥 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
