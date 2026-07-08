from __future__ import annotations

import sqlite3
from pathlib import Path


SCHEMA = """
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
"""


def initialize_database(database_path: Path) -> None:
    database_path.parent.mkdir(parents=True, exist_ok=True)

    if database_path.exists():
        database_path.unlink()

    with sqlite3.connect(database_path) as connection:
        connection.executescript(SCHEMA)


def create_or_replace_fake_user(
    database_path: Path,
    *,
    email: str,
    display_name: str,
) -> dict[str, str | int]:
    with sqlite3.connect(database_path) as connection:
        connection.row_factory = sqlite3.Row
        connection.execute(
            """
            INSERT INTO users (email, display_name)
            VALUES (?, ?)
            ON CONFLICT(email) DO UPDATE SET display_name = excluded.display_name
            """,
            (email, display_name),
        )
        row = connection.execute(
            "SELECT id, email, display_name FROM users WHERE email = ?",
            (email,),
        ).fetchone()

    return {
        "id": row["id"],
        "email": row["email"],
        "displayName": row["display_name"],
    }


def database_is_ready(database_path: Path) -> bool:
    if not database_path.exists():
        return False

    with sqlite3.connect(database_path) as connection:
        row = connection.execute(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'users'",
        ).fetchone()

    return row is not None
