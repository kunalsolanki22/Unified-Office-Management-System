"""
AI Employee Chatbot - Main Entry Point

This is a multi-agent chatbot system for employee services including:
- Attendance management
- Leave management  
- Desk & conference room bookings
- Cafeteria services
- IT support

Usage:
    python main.py          # Run CLI interface
    python main.py --cli    # Explicitly run CLI
    python main.py --api    # Run API server (future)
"""

import sys
import argparse
import logging

from config.settings import get_settings, setup_logging, validate_settings
from database.connection import init_database


def check_dependencies():
    """Check that all required dependencies are installed."""
    missing = []
    
    dependencies = [
        ("groq", "groq"),
        ("httpx", "httpx"),
        ("sqlalchemy", "sqlalchemy"),
        ("pydantic_settings", "pydantic-settings"),
        ("rich", "rich"),
    ]
    
    for module_name, package_name in dependencies:
        try:
            __import__(module_name)
        except ImportError:
            missing.append(package_name)
    
    if missing:
        print("Missing required dependencies:")
        for pkg in missing:
            print(f"  - {pkg}")
        print(f"\nInstall them with: pip install {' '.join(missing)}")
        print("Or run: pip install -r requirements.txt")
        sys.exit(1)


def run_cli():
    """Run the CLI interface."""
    from cli.main import run_cli as cli_run
    cli_run()


def run_api():
    """Run the API server (future implementation)."""
    print("API server not yet implemented.")
    print("Use --cli to run the command-line interface.")
    sys.exit(1)


def main():
    """Main entry point."""
    # Parse arguments
    parser = argparse.ArgumentParser(
        description="AI Employee Chatbot - Multi-agent system for employee services"
    )
    parser.add_argument(
        "--cli", 
        action="store_true", 
        help="Run the command-line interface (default)"
    )
    parser.add_argument(
        "--api",
        action="store_true",
        help="Run the API server"
    )
    parser.add_argument(
        "--init-db",
        action="store_true",
        help="Initialize database tables and exit"
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="Check configuration and dependencies"
    )
    
    args = parser.parse_args()
    
    # Check dependencies
    check_dependencies()
    
    # Setup logging
    settings = get_settings()
    logger = setup_logging(settings)
    
    # Handle --check flag
    if args.check:
        print("Checking configuration...")
        is_valid, errors = validate_settings()
        
        if is_valid:
            print("✅ Configuration is valid!")
            print(f"\nSettings:")
            print(f"  - Environment: {settings.environment}")
            print(f"  - LLM Provider: {settings.llm_provider}")
            print(f"  - Backend URL: {settings.backend_base_url}")
            print(f"  - Database: {settings.database_url}")
            print(f"  - Knowledge Base: {settings.knowledge_base_path}")
        else:
            print("❌ Configuration errors found:")
            for error in errors:
                print(f"  - {error}")
            sys.exit(1)
        return
    
    # Handle --init-db flag
    if args.init_db:
        print("Initializing database...")
        init_database()
        print("✅ Database initialized successfully!")
        return
    
    # Validate configuration
    is_valid, errors = validate_settings()
    if not is_valid:
        print("Configuration errors:")
        for error in errors:
            print(f"  - {error}")
        print("\nPlease fix these issues or run with --check for details.")
        sys.exit(1)
    
    # Initialize database
    init_database()
    
    # Run appropriate interface
    if args.api:
        run_api()
    else:
        # Default to CLI
        run_cli()


if __name__ == "__main__":
    main()
