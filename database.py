"""
database.py
-----------
Handles SQLite connection and first-time table creation.
Call `init_db()` once at application startup.
"""

import sqlite3
import os

# Path to the SQLite database file (sits next to app.py)
DB_PATH = os.path.join(os.path.dirname(__file__), "shortener.db")


def get_connection():
    """
    Open and return a new SQLite connection.
    Row factory is set so rows behave like dictionaries:
        row["original_url"]  instead of  row[0]
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """
    Create the `urls` table if it doesn't already exist.
    Safe to call multiple times — uses IF NOT EXISTS.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS urls (
            id           INTEGER PRIMARY KEY AUTOINCREMENT,
            original_url TEXT    NOT NULL,
            short_code   TEXT    NOT NULL UNIQUE,
            clicks       INTEGER NOT NULL DEFAULT 0,
            created_at   TEXT    NOT NULL DEFAULT (datetime('now', 'localtime'))
        )
    """)
    # Index on short_code for fast redirect lookups
    cursor.execute("""
        CREATE UNIQUE INDEX IF NOT EXISTS idx_short_code
        ON urls (short_code)
    """)
    conn.commit()
    conn.close()
