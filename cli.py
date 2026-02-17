#!/usr/bin/env python3
"""
AI Chatbot CLI - Simple command line interface
"""
import asyncio
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from rich.console import Console
from rich.markdown import Markdown
from rich.prompt import Prompt
from rich.table import Table
from prompt_toolkit import PromptSession
from prompt_toolkit.history import FileHistory
from prompt_toolkit.auto_suggest import AutoSuggestFromHistory

from chatbot import orchestrator, api_client, knowledge_base

console = Console()


class ChatbotCLI:
    """Command Line Interface for the AI Chatbot"""
    
    def __init__(self):
        self.running = True
        self.history_file = os.path.join(os.path.dirname(__file__), ".chat_history")
        self.session = PromptSession(
            history=FileHistory(self.history_file),
            auto_suggest=AutoSuggestFromHistory()
        )
        
        self.commands = {
            "/help": self.cmd_help,
            "/login": self.cmd_login,
            "/logout": self.cmd_logout,
            "/status": self.cmd_status,
            "/clear": self.cmd_clear,
            "/apis": self.cmd_list_apis,
            "/exit": self.cmd_exit,
            "/quit": self.cmd_exit,
        }
    
    def print_banner(self):
        """Print welcome banner"""
        banner = """
╔═══════════════════════════════════════════════════════════════════╗
║           🤖 Office Management AI Chatbot                         ║
║                                                                    ║
║   Your intelligent assistant for:                                  ║
║   • Attendance (check-in/out)                                     ║
║   • Leave requests                                                 ║
║   • Desk & conference room booking                                 ║
║   • Food ordering                                                  ║
║   • IT support requests                                            ║
║                                                                    ║
║   Type /help for commands                                          ║
║   Type /login to authenticate                                      ║
╚═══════════════════════════════════════════════════════════════════╝
        """
        console.print(banner, style="cyan")
    
    async def cmd_help(self, args=None):
        """Show help"""
        table = Table(title="Commands", show_header=True)
        table.add_column("Command", style="cyan")
        table.add_column("Description")
        
        table.add_row("/login", "Login to the system")
        table.add_row("/logout", "Logout")
        table.add_row("/status", "Show login status")
        table.add_row("/clear", "Clear screen")
        table.add_row("/apis", "List API categories")
        table.add_row("/exit", "Exit chatbot")
        table.add_row("[text]", "Send natural language request")
        
        console.print(table)
        console.print("\n[bold]Examples:[/bold]")
        console.print("  [dim]• I want to check in[/dim]")
        console.print("  [dim]• Book a desk for tomorrow[/dim]")
        console.print("  [dim]• Show my attendance[/dim]")
    
    async def cmd_login(self, args=None):
        """Login command"""
        email = Prompt.ask("Email")
        password = Prompt.ask("Password", password=True)
        
        with console.status("[cyan]Logging in...", spinner="dots"):
            success, message = await orchestrator.login(email, password)
        
        if success:
            console.print(f"[green]✓ {message}[/green]")
        else:
            console.print(f"[red]✗ {message}[/red]")
    
    async def cmd_logout(self, args=None):
        """Logout"""
        orchestrator.logout()
        console.print("[yellow]Logged out.[/yellow]")
    
    async def cmd_status(self, args=None):
        """Show status"""
        if orchestrator.is_authenticated():
            user = api_client.user_info
            console.print(f"[green]✓ Logged in[/green]")
            console.print(f"  User: {user.get('first_name', '')} {user.get('last_name', '')}")
            console.print(f"  Email: {user.get('email', '')}")
            console.print(f"  Role: {user.get('role', '')}")
        else:
            console.print("[yellow]Not logged in. Use /login[/yellow]")
    
    async def cmd_clear(self, args=None):
        """Clear screen"""
        console.clear()
        self.print_banner()
    
    async def cmd_list_apis(self, args=None):
        """List API categories"""
        knowledge_base.load()
        
        table = Table(title="API Categories", show_header=True)
        table.add_column("Category", style="cyan")
        table.add_column("APIs", style="dim")
        
        from collections import defaultdict
        apis_by_cat = defaultdict(list)
        for api_id, api_info in knowledge_base.apis.items():
            cat = api_info.get("category", "other")
            apis_by_cat[cat].append(api_id)
        
        for cat, cat_info in knowledge_base.categories.items():
            apis = apis_by_cat.get(cat, [])
            table.add_row(cat_info.get("name", cat), str(len(apis)))
        
        console.print(table)
    
    async def cmd_exit(self, args=None):
        """Exit"""
        console.print("[yellow]Goodbye! 👋[/yellow]")
        self.running = False
    
    async def process_command(self, user_input: str) -> bool:
        """Process command or message"""
        user_input = user_input.strip()
        if not user_input:
            return True
        
        # Check for commands
        if user_input.startswith("/"):
            parts = user_input.split(maxsplit=1)
            cmd = parts[0].lower()
            args = parts[1:] if len(parts) > 1 else []
            
            if cmd in self.commands:
                await self.commands[cmd](args)
                return True
            else:
                console.print(f"[red]Unknown command: {cmd}[/red]. Type /help")
                return True
        
        # Send to orchestrator
        console.print()
        with console.status("[cyan]Processing...", spinner="dots"):
            response = await orchestrator.process_input(user_input)
        
        console.print()
        try:
            console.print(Markdown(response))
        except Exception:
            console.print(response)
        console.print()
        return True
    
    async def run(self):
        """Main loop"""
        self.print_banner()
        
        while self.running:
            try:
                if orchestrator.is_authenticated():
                    prompt_text = f"[{orchestrator.user_email}] > "
                else:
                    prompt_text = "[not logged in] > "
                
                try:
                    user_input = await asyncio.get_event_loop().run_in_executor(
                        None, lambda: self.session.prompt(prompt_text)
                    )
                except EOFError:
                    break
                except KeyboardInterrupt:
                    console.print("\n[dim]Use /exit to quit[/dim]")
                    continue
                
                await self.process_command(user_input)
                
            except KeyboardInterrupt:
                console.print("\n[dim]Use /exit to quit[/dim]")
            except Exception as e:
                console.print(f"[red]Error: {e}[/red]")


async def main():
    cli = ChatbotCLI()
    await cli.run()


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\nGoodbye!")
