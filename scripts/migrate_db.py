#!/usr/bin/env python3
"""
Database migration script to update agent_execution_logs table schema.
Run this script to update the database schema.

WARNING: This will DROP and recreate the agent_execution_logs table!
"""

import sys
import os

# Add project root to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import text, inspect
from database.connection import db_manager
from database.models import AgentExecutionLog, Base
from config.settings import get_settings

def migrate():
    """Run database migration to update agent_execution_logs table."""
    settings = get_settings()
    engine = db_manager.engine
    
    print("=" * 60)
    print("Database Migration: agent_execution_logs")
    print("=" * 60)
    print(f"Database: {settings.database_url.split('@')[-1] if '@' in settings.database_url else settings.database_url}")
    print()
    
    try:
        with engine.connect() as conn:
            # Drop the table if it exists
            print("Dropping existing agent_execution_logs table...")
            conn.execute(text("DROP TABLE IF EXISTS agent_execution_logs CASCADE;"))
            conn.commit()
            print("- Dropped existing table")
            
            # Create the new table manually with all columns
            print("Creating new agent_execution_logs table...")
            create_table_sql = """
            CREATE TABLE agent_execution_logs (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                session_id UUID NOT NULL REFERENCES sessions(id),
                conversation_id UUID,
                agent_id agenttype NOT NULL,
                action_type VARCHAR(100) NOT NULL,
                user_input TEXT,
                prompt_sent TEXT,
                llm_response TEXT,
                parsed_response JSONB,
                api_endpoint VARCHAR(255),
                api_method VARCHAR(10),
                request_payload JSONB,
                response_data JSONB,
                success BOOLEAN,
                error_message TEXT,
                execution_time_ms INTEGER,
                llm_tokens_used INTEGER,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
            
            CREATE INDEX idx_execution_session ON agent_execution_logs(session_id);
            CREATE INDEX idx_execution_agent ON agent_execution_logs(agent_id);
            CREATE INDEX idx_execution_action ON agent_execution_logs(action_type);
            CREATE INDEX idx_execution_success ON agent_execution_logs(success);
            CREATE INDEX idx_execution_created ON agent_execution_logs(created_at);
            """
            conn.execute(text(create_table_sql))
            conn.commit()
            print("- Created new table with updated schema")
        
        print()
        print("SUCCESS! Table recreated with new columns:")
        print("  - user_input (TEXT)")
        print("  - prompt_sent (TEXT)")
        print("  - llm_response (TEXT)")
        print("  - parsed_response (JSONB)")
        print("  - api_endpoint (VARCHAR)")
        print("  - api_method (VARCHAR)")
        print("  - request_payload (JSONB)")
        print("  - response_data (JSONB)")
        
    except Exception as e:
        print(f"ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    print()
    print("=" * 60)
    print("Migration complete!")
    print("=" * 60)
    return True

if __name__ == "__main__":
    migrate()
