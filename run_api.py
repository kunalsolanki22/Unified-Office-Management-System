#!/usr/bin/env python3
"""
Run the AI Employee Chatbot API server.
"""

import argparse
import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))


def main():
    parser = argparse.ArgumentParser(description="AI Employee Chatbot API Server")
    parser.add_argument("--host", default="0.0.0.0", help="Host to bind to (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8080, help="Port to bind to (default: 8080)")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload for development")
    
    args = parser.parse_args()
    
    print(f"""
╔═══════════════════════════════════════════════════════════╗
║           🤖 AI Employee Chatbot API                       ║
║                                                            ║
║  Starting server on http://{args.host}:{args.port}              ║
║  API Docs: http://{args.host}:{args.port}/docs                  ║
╚═══════════════════════════════════════════════════════════╝
    """)
    
    from api.app import run_server
    run_server(host=args.host, port=args.port, reload=args.reload)


if __name__ == "__main__":
    main()
