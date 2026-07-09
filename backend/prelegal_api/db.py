from __future__ import annotations

import hashlib
import json
import os
import sqlite3
from pathlib import Path


SCHEMA = """
CREATE TABLE users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL DEFAULT '',
  password_salt TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  title TEXT NOT NULL,
  document_type TEXT NOT NULL,
  content TEXT NOT NULL,
  values_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);
"""


def initialize_database(database_path: Path) -> None:
    database_path.parent.mkdir(parents=True, exist_ok=True)

    if database_path.exists():
        database_path.unlink()

    with sqlite3.connect(database_path) as connection:
        connection.executescript(SCHEMA)


def hash_password(password: str, salt: str | None = None) -> tuple[str, str]:
    password_salt = salt or os.urandom(16).hex()
    password_hash = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        bytes.fromhex(password_salt),
        100_000,
    ).hex()
    return password_hash, password_salt


def row_to_user(row: sqlite3.Row) -> dict[str, str | int]:
    return {
        "id": row["id"],
        "email": row["email"],
        "displayName": row["display_name"],
    }


def create_user(
    database_path: Path,
    *,
    email: str,
    display_name: str,
    password: str,
) -> dict[str, str | int]:
    password_hash, password_salt = hash_password(password)

    with sqlite3.connect(database_path) as connection:
        connection.row_factory = sqlite3.Row
        connection.execute(
            """
            INSERT INTO users (email, display_name, password_hash, password_salt)
            VALUES (?, ?, ?, ?)
            """,
            (email.lower(), display_name, password_hash, password_salt),
        )
        row = connection.execute(
            "SELECT id, email, display_name FROM users WHERE email = ?",
            (email.lower(),),
        ).fetchone()

    return row_to_user(row)


def authenticate_user(
    database_path: Path,
    *,
    email: str,
    password: str,
) -> dict[str, str | int] | None:
    with sqlite3.connect(database_path) as connection:
        connection.row_factory = sqlite3.Row
        row = connection.execute(
            "SELECT id, email, display_name, password_hash, password_salt FROM users WHERE email = ?",
            (email.lower(),),
        ).fetchone()

    if row is None:
        return None

    password_hash, _ = hash_password(password, row["password_salt"])
    if password_hash != row["password_hash"]:
        return None

    return row_to_user(row)


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
            INSERT INTO users (email, display_name, password_hash, password_salt)
            VALUES (?, ?, '', '')
            ON CONFLICT(email) DO UPDATE SET display_name = excluded.display_name
            """,
            (email.lower(), display_name),
        )
        row = connection.execute(
            "SELECT id, email, display_name FROM users WHERE email = ?",
            (email.lower(),),
        ).fetchone()

    return row_to_user(row)


def create_document(
    database_path: Path,
    *,
    user_id: int,
    title: str,
    document_type: str,
    content: str,
    values: dict[str, str],
) -> dict[str, str | int | dict[str, str]]:
    with sqlite3.connect(database_path) as connection:
        connection.row_factory = sqlite3.Row
        cursor = connection.execute(
            """
            INSERT INTO documents (user_id, title, document_type, content, values_json)
            VALUES (?, ?, ?, ?, ?)
            """,
            (user_id, title, document_type, content, json.dumps(values)),
        )
        row = connection.execute(
            """
            SELECT id, user_id, title, document_type, content, values_json, created_at
            FROM documents
            WHERE id = ?
            """,
            (cursor.lastrowid,),
        ).fetchone()

    return row_to_document(row)


def list_user_documents(database_path: Path, *, user_id: int) -> list[dict[str, str | int]]:
    with sqlite3.connect(database_path) as connection:
        connection.row_factory = sqlite3.Row
        rows = connection.execute(
            """
            SELECT id, title, document_type, created_at
            FROM documents
            WHERE user_id = ?
            ORDER BY id DESC
            """,
            (user_id,),
        ).fetchall()

    return [
        {
            "id": row["id"],
            "title": row["title"],
            "documentType": row["document_type"],
            "createdAt": row["created_at"],
        }
        for row in rows
    ]


def get_user_document(
    database_path: Path,
    *,
    user_id: int,
    document_id: int,
) -> dict[str, str | int | dict[str, str]] | None:
    with sqlite3.connect(database_path) as connection:
        connection.row_factory = sqlite3.Row
        row = connection.execute(
            """
            SELECT id, user_id, title, document_type, content, values_json, created_at
            FROM documents
            WHERE user_id = ? AND id = ?
            """,
            (user_id, document_id),
        ).fetchone()

    return row_to_document(row) if row else None


def row_to_document(row: sqlite3.Row) -> dict[str, str | int | dict[str, str]]:
    return {
        "id": row["id"],
        "userId": row["user_id"],
        "title": row["title"],
        "documentType": row["document_type"],
        "content": row["content"],
        "values": json.loads(row["values_json"]),
        "createdAt": row["created_at"],
    }


def database_is_ready(database_path: Path) -> bool:
    if not database_path.exists():
        return False

    with sqlite3.connect(database_path) as connection:
        row = connection.execute(
            "SELECT name FROM sqlite_master WHERE type = 'table' AND name = 'documents'",
        ).fetchone()

    return row is not None
