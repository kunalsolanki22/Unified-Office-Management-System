"""
CLI Interface - Command-line chat interface for testing.
"""

import sys
import signal
import atexit
import getpass
from typing import Optional

from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown
from rich.prompt import Prompt
from rich.text import Text
from rich import print as rprint

from core.orchestrator import Orchestrator, get_orchestrator
from database.connection import init_database
from config.settings import get_settings, setup_logging, validate_settings


console = Console()

# Global orchestrator reference for cleanup
_orchestrator: Optional[Orchestrator] = None


def cleanup_on_exit():
    """Cleanup function called when terminal is closed."""
    global _orchestrator
    if _orchestrator is not None:
        try:
            _orchestrator.logout()
        except Exception:
            pass


def signal_handler(signum, frame):
    """Handle termination signals."""
    cleanup_on_exit()
    sys.exit(0)


def print_header():
    """Print application header."""
    header = """
╔═══════════════════════════════════════════════════════════╗
║           🤖 AI Employee Services Chatbot                  ║
║                                                            ║
║  Your assistant for attendance, leave, bookings & more    ║
╚═══════════════════════════════════════════════════════════╝
"""
    console.print(header, style="bold cyan")


def print_help():
    """Print help message."""
    help_text = """
**Available Commands:**

| Command | Description |
|---------|-------------|
| `/help` | Show this help message |
| `/login` | Login with credentials |
| `/logout` | Logout and end session |
| `/clear` | Clear conversation history |
| `/quit` or `/exit` | Exit the chatbot |

**What I can help with:**
- 📋 Attendance (check-in, check-out, history)
- 🏖️ Leave (apply, balance, history)
- 🪑 Desk & Conference room bookings
- 🍽️ Cafeteria (menu, orders, table booking)
- 💻 IT Support (raise tickets, check status)

Just type your request naturally!
"""
    console.print(Markdown(help_text))


def login_flow(orchestrator: Orchestrator) -> bool:
    """Handle login flow."""
    console.print("\n[bold]Please login to continue[/bold]\n")
    
    email = Prompt.ask("[cyan]Email[/cyan]")
    password = Prompt.ask("[cyan]Password[/cyan]", password=True)
    
    console.print("\n[dim]Logging in...[/dim]")
    
    success, message = orchestrator.login(email, password)
    
    if success:
        console.print(Panel(message, title="✅ Login Successful", border_style="green"))
        return True
    else:
        console.print(Panel(message, title="❌ Login Failed", border_style="red"))
        return False


def format_response(response) -> Panel:
    """Format orchestrator response as a panel."""
    # Determine style based on success
    if response.success:
        border_style = "green" if response.action_type == "api_call" else "blue"
    else:
        border_style = "red"
    
    # Build title
    title_parts = ["🤖 Assistant"]
    if response.agent_used and response.agent_used != "routing":
        title_parts.append(f"({response.agent_used})")
    title = " ".join(title_parts)
    
    # Format message
    try:
        content = Markdown(response.message)
    except Exception:
        content = response.message
    
    return Panel(content, title=title, border_style=border_style)


def run_cli():
    """Run the CLI chatbot interface."""
    global _orchestrator
    
    # Setup
    settings = get_settings()
    logger = setup_logging(settings)
    
    # Register signal handlers for cleanup on terminal close
    signal.signal(signal.SIGTERM, signal_handler)
    signal.signal(signal.SIGINT, signal_handler)
    atexit.register(cleanup_on_exit)
    
    # Validate settings
    is_valid, errors = validate_settings()
    if not is_valid:
        console.print("[bold red]Configuration errors:[/bold red]")
        for error in errors:
            console.print(f"  • {error}", style="red")
        console.print("\nPlease fix these issues and try again.")
        sys.exit(1)
    
    # Initialize database
    console.print("[dim]Initializing database...[/dim]")
    init_database()
    
    # Print header
    print_header()
    
    # Get orchestrator and store globally for cleanup
    orchestrator = get_orchestrator()
    _orchestrator = orchestrator
    
    # Initial login
    console.print("\n[yellow]You need to login to use the chatbot.[/yellow]")
    if not login_flow(orchestrator):
        retry = Prompt.ask("Would you like to try again?", choices=["y", "n"], default="y")
        if retry == "n":
            console.print("Goodbye!")
            sys.exit(0)
        else:
            if not login_flow(orchestrator):
                console.print("[red]Login failed. Exiting.[/red]")
                sys.exit(1)
    
    # Main chat loop
    console.print("\n[dim]Type '/help' for available commands, '/quit' to exit[/dim]\n")
    
    while True:
        try:
            # Get user input
            user_input = Prompt.ask("\n[bold cyan]You[/bold cyan]")
            
            if not user_input.strip():
                continue
            
            # Handle commands
            command = user_input.strip().lower()
            
            if command in ["/quit", "/exit", "/q"]:
                message = orchestrator.logout()
                console.print(f"\n{message}")
                break
            
            elif command == "/help":
                print_help()
                continue
            
            elif command == "/login":
                if orchestrator.api_client.is_authenticated:
                    console.print("[yellow]You are already logged in. Use /logout first.[/yellow]")
                else:
                    login_flow(orchestrator)
                continue
            
            elif command == "/logout":
                message = orchestrator.logout()
                console.print(f"\n{message}")
                console.print("[yellow]You need to login to continue using the chatbot.[/yellow]")
                login_flow(orchestrator)
                continue
            
            elif command == "/clear":
                orchestrator.state.conversation_history.clear()
                orchestrator.state.pending_action = None
                console.print("[green]Conversation history cleared.[/green]")
                continue
            
            # Process regular message
            console.print("[dim]Thinking...[/dim]")
            response = orchestrator.process_message(user_input)
            
            # Display response
            panel = format_response(response)
            console.print(panel)
            
            # Show follow-up indicator
            if response.needs_followup:
                console.print("[dim italic]I need more information to complete this request.[/dim italic]")
            
        except KeyboardInterrupt:
            console.print("\n\n[yellow]Interrupted. Use /quit to exit properly.[/yellow]")
            continue
        
        except EOFError:
            message = orchestrator.logout()
            console.print(f"\n{message}")
            break
        
        except Exception as e:
            logger.error(f"CLI error: {e}", exc_info=True)
            console.print(f"[red]Error: {e}[/red]")


def main():
    """Main entry point for CLI."""
    run_cli()


if __name__ == "__main__":
    main()
