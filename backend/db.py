"""Database initialization and connection helpers for OmniRoute backend."""

import sqlite3
import os
from pathlib import Path
from typing import Optional, Generator
import threading


def get_db_path() -> str:
    """Get the database file path from environment or default."""
    return os.getenv("DB_PATH", "backend/data/omniroute.db")


# Thread-local storage for database connections
_local = threading.local()


def get_db_connection() -> sqlite3.Connection:
    """Get a thread-local SQLite database connection."""
    if not hasattr(_local, "connection") or _local.connection is None:
        # Ensure the data directory exists
        db_path = Path(get_db_path())
        db_path.parent.mkdir(parents=True, exist_ok=True)

        # Create connection
        _local.connection = sqlite3.connect(
            str(db_path),
            detect_types=sqlite3.PARSE_DECLTYPES | sqlite3.PARSE_COLNAMES
        )
        _local.connection.row_factory = sqlite3.Row

        # Enable foreign key constraints
        _local.connection.execute("PRAGMA foreign_keys = ON")

    return _local.connection


def init_db() -> None:
    """Initialize the database with tables and default data."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Create tables
    cursor.executescript("""
        -- Users table
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Boards table
        CREATE TABLE IF NOT EXISTS boards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL DEFAULT 'Project Alpha Roadmap',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Columns table
        CREATE TABLE IF NOT EXISTS columns (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            board_id INTEGER NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            position INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Cards table
        CREATE TABLE IF NOT EXISTS cards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            column_id INTEGER NOT NULL REFERENCES columns(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            details TEXT NOT NULL DEFAULT '',
            position INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Indexes for performance
        CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);
        CREATE INDEX IF NOT EXISTS idx_columns_board_id ON columns(board_id);
        CREATE INDEX IF NOT EXISTS idx_cards_column_id ON cards(column_id);
    """)

    # Check if we need to seed default data
    cursor.execute("SELECT COUNT(*) FROM users")
    user_count = cursor.fetchone()[0]

    if user_count == 0:
        # Seed default user and board data for MVP
        cursor.execute("""
            INSERT INTO users (username, password_hash)
            VALUES (?, ?)
        """, ("user", "password"))  # In real app, this would be hashed

        user_id = cursor.lastrowid

        cursor.execute("""
            INSERT INTO boards (user_id, title)
            VALUES (?, ?)
        """, (user_id, "Project Alpha Roadmap"))

        board_id = cursor.lastrowid

        # Seed columns
        columns_data = [
            ("Backlog", 0),
            ("To Do", 1),
            ("In Progress", 2),
            ("In Review", 3),
            ("Done", 4)
        ]

        for title, position in columns_data:
            cursor.execute("""
                INSERT INTO columns (board_id, title, position)
                VALUES (?, ?, ?)
            """, (board_id, title, position))

        # Get column IDs for card seeding
        cursor.execute("SELECT id, title FROM columns WHERE board_id = ? ORDER BY position", (board_id,))
        column_map = {row[1]: row[0] for row in cursor.fetchall()}

        # Seed default cards (matching frontend dummy data)
        cards_data = [
            # Backlog
            ("Define system metrics", "Establish key performance indicators and alerting thresholds for core microservices.", column_map["Backlog"]),
            ("User persona research", "Synthesize user interview recordings and update target segment profiles.", column_map["Backlog"]),
            # To Do
            ("Design authentication flow", "Map out login, password reset, and session management wireframes.", column_map["To Do"]),
            ("Configure database migrations", "Set up Alembic migration scripts and verify rollback procedures.", column_map["To Do"]),
            # In Progress
            ("Develop Kanban UI", "Build responsive column layouts, card modals, and drag-and-drop interactions.", column_map["In Progress"]),
            ("API schema definition", "Draft OpenAPI specification endpoints for board management and card updates.", column_map["In Progress"]),
            # In Review
            ("Security compliance check", "Audit dependency vulnerabilities and ensure adherence to security standards.", column_map["In Review"]),
            # Done
            ("Project kickoff meeting", "Aligned scope, timeline, and deliverables with executive stakeholders.", column_map["Done"]),
            ("Setup repository structure", "Initialize Next.js frontend and establish testing conventions.", column_map["Done"])
        ]

        for title, details, column_id in cards_data:
            cursor.execute("""
                INSERT INTO cards (column_id, title, details)
                VALUES (?, ?, ?)
            """, (column_id, title, details))

    conn.commit()


def get_user_id(username: str) -> int:
    """Look up user ID by username."""
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM users WHERE username = ?", (username,))
    result = cursor.fetchone()
    if result:
        return result[0]
    raise ValueError(f"User '{username}' not found")


def get_board_for_user(user_id: int) -> dict:
    """Get the board for a user with all columns and cards."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get the user's board (MVP: 1 board per user)
    cursor.execute("""
        SELECT id, title FROM boards WHERE user_id = ? LIMIT 1
    """, (user_id,))
    board = cursor.fetchone()

    if not board:
        raise ValueError(f"No board found for user_id {user_id}")

    board_id = board["id"]
    board_title = board["title"]

    # Get columns for this board
    cursor.execute("""
        SELECT id, title, position FROM columns
        WHERE board_id = ? ORDER BY position
    """, (board_id,))
    columns = cursor.fetchall()

    # Build the board structure with cards for each column
    columns_data = []
    for col in columns:
        col_id = col["id"]
        cursor.execute("""
            SELECT id, title, details, position FROM cards
            WHERE column_id = ? ORDER BY position
        """, (col_id,))
        cards = cursor.fetchall()

        cards_data = [
            {
                "id": str(card["id"]),
                "title": card["title"],
                "details": card["details"],
            }
            for card in cards
        ]

        columns_data.append({
            "id": str(col_id),
            "title": col["title"],
            "position": col["position"],
            "cards": cards_data
        })

    return {
        "id": str(board_id),
        "title": board_title,
        "columns": columns_data
    }


def create_card(column_id: int, title: str, details: str) -> int:
    """Insert a new card, return the new card ID."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get the next position for this column
    cursor.execute("""
        SELECT COALESCE(MAX(position), -1) + 1 FROM cards WHERE column_id = ?
    """, (column_id,))
    position = cursor.fetchone()[0]

    cursor.execute("""
        INSERT INTO cards (column_id, title, details, position)
        VALUES (?, ?, ?, ?)
    """, (column_id, title, details, position))

    card_id = cursor.lastrowid
    conn.commit()
    return card_id


def update_card(card_id: int, title: str, details: str) -> None:
    """Update a card's title and details."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE cards SET title = ?, details = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (title, details, card_id))

    conn.commit()


def delete_card(card_id: int) -> None:
    """Delete a card."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM cards WHERE id = ?", (card_id,))
    conn.commit()


def update_column_title(column_id: int, title: str) -> None:
    """Rename a column."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE columns SET title = ? WHERE id = ?
    """, (title, column_id))

    conn.commit()


def move_card(card_id: int, new_column_id: int, new_position: int) -> None:
    """Move a card to a new column and position."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get the card's current column
    cursor.execute("SELECT column_id, position FROM cards WHERE id = ?", (card_id,))
    card = cursor.fetchone()
    if not card:
        raise ValueError(f"Card {card_id} not found")

    old_column_id = card["column_id"]
    old_position = card["position"]

    # If moving within the same column
    if old_column_id == new_column_id:
        # Shift other cards in the same column
        if old_position < new_position:
            # Moving down: shift cards up
            cursor.execute("""
                UPDATE cards SET position = position - 1
                WHERE column_id = ? AND position > ? AND position <= ?
            """, (new_column_id, old_position, new_position))
        elif old_position > new_position:
            # Moving up: shift cards down
            cursor.execute("""
                UPDATE cards SET position = position + 1
                WHERE column_id = ? AND position >= ? AND position < ?
            """, (new_column_id, new_position, old_position))
    else:
        # Moving to a different column: shift cards in old column up
        cursor.execute("""
            UPDATE cards SET position = position - 1
            WHERE column_id = ? AND position > ?
        """, (old_column_id, old_position))

        # Shift cards in new column down to make room
        cursor.execute("""
            UPDATE cards SET position = position + 1
            WHERE column_id = ? AND position >= ?
        """, (new_column_id, new_position))

    # Move the card
    cursor.execute("""
        UPDATE cards SET column_id = ?, position = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
    """, (new_column_id, new_position, card_id))

    conn.commit()


def get_default_user_id() -> int:
    """Get the ID of the default MVP user ('user')."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM users WHERE username = ?", ("user",))
    result = cursor.fetchone()

    if result:
        return result[0]
    else:
        # Should not happen if init_db was called
        raise RuntimeError("Default user 'user' not found in database")


def close_db_connection() -> None:
    """Close the thread-local database connection."""
    if hasattr(_local, "connection") and _local.connection is not None:
        _local.connection.close()
        _local.connection = None