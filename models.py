"""
models.py
---------
All SQL query functions live here, keeping app.py clean.
Every function opens its own connection and closes it when done.
"""

import random
import string
from database import get_connection


# ──────────────────────────────────────────
# Short Code Generator
# ──────────────────────────────────────────

def generate_short_code(length: int = 6) -> str:
    """Return a random alphanumeric string of `length` characters."""
    chars = string.ascii_letters + string.digits  # a-z A-Z 0-9
    return "".join(random.choices(chars, k=length))


def create_unique_short_code() -> str:
    """
    Keep generating codes until we find one not already in the DB.
    Collision probability is extremely low (62^6 ≈ 56 billion combos),
    but this loop makes it bulletproof.
    """
    while True:
        code = generate_short_code()
        if not get_url_by_code(code):  # no collision → use it
            return code


# ──────────────────────────────────────────
# CRUD Operations
# ──────────────────────────────────────────

def create_short_url(original_url: str) -> dict:
    """
    Insert a new URL into the database.
    Returns the newly created row as a dict.
    """
    short_code = create_unique_short_code()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO urls (original_url, short_code) VALUES (?, ?)",
        (original_url, short_code),
    )
    conn.commit()
    new_id = cursor.lastrowid
    conn.close()

    # Fetch and return the full row
    return get_url_by_id(new_id)


def get_url_by_code(short_code: str) -> dict | None:
    """
    Look up a URL by its short code.
    Returns the row as a dict, or None if not found.
    """
    conn = get_connection()
    cursor = conn.cursor()
    row = cursor.execute(
        "SELECT * FROM urls WHERE short_code = ?", (short_code,)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def get_url_by_id(url_id: int) -> dict | None:
    """Look up a URL by its primary key ID."""
    conn = get_connection()
    cursor = conn.cursor()
    row = cursor.execute(
        "SELECT * FROM urls WHERE id = ?", (url_id,)
    ).fetchone()
    conn.close()
    return dict(row) if row else None


def increment_clicks(short_code: str) -> None:
    """Increment the click counter for a given short code."""
    conn = get_connection()
    conn.execute(
        "UPDATE urls SET clicks = clicks + 1 WHERE short_code = ?",
        (short_code,),
    )
    conn.commit()
    conn.close()


def get_all_urls() -> list[dict]:
    """
    Return all rows, newest first.
    Used to populate the dashboard.
    """
    conn = get_connection()
    rows = conn.execute(
        "SELECT * FROM urls ORDER BY created_at DESC"
    ).fetchall()
    conn.close()
    return [dict(row) for row in rows]


def delete_url(url_id: int) -> bool:
    """
    Delete a URL by ID.
    Returns True if a row was deleted, False if the ID didn't exist.
    """
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM urls WHERE id = ?", (url_id,))
    conn.commit()
    deleted = cursor.rowcount > 0  # rowcount = number of rows affected
    conn.close()
    return deleted
