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
        _local.connection.execute("PRAGMA busy_timeout = 5000")

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

        -- Projects table
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            title TEXT NOT NULL,
            slug TEXT,
            description TEXT NOT NULL DEFAULT '',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );

        -- Boards table
        CREATE TABLE IF NOT EXISTS boards (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
            project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
            title TEXT NOT NULL DEFAULT 'Project Alpha Roadmap',
            position INTEGER NOT NULL DEFAULT 0,
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
    """)

    # Migrate legacy boards schema (user_id only) to the projects model
    _migrate_boards_to_projects(cursor)

    # Indexes for performance
    cursor.executescript("""
        CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
        CREATE INDEX IF NOT EXISTS idx_boards_user_id ON boards(user_id);
        CREATE INDEX IF NOT EXISTS idx_boards_project_id ON boards(project_id);
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

        # Create default project for the user
        cursor.execute("""
            INSERT INTO projects (user_id, title, description)
            VALUES (?, ?, ?)
        """, (user_id, "My Projects", "Default project created during migration"))

        project_id = cursor.lastrowid

        cursor.execute("""
            INSERT INTO boards (user_id, project_id, title, position)
            VALUES (?, ?, ?, ?)
        """, (user_id, project_id, "Project Alpha Roadmap", 0))

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

    # Slugs backfill after seeding so the seeded project gets one too.
    _migrate_projects_slug(cursor)

    conn.commit()


def _slugify_title(title: str) -> str:
    """Turn a project title into a URL slug: "My Projects" -> "MyProjects"."""
    slug = "".join(ch for ch in title if ch.isalnum())
    return slug or "Project"


def _unique_slug(cursor: sqlite3.Cursor, base: str) -> str:
    """Return a slug that is not already used by another project."""
    slug = base
    suffix = 2
    while cursor.execute("SELECT 1 FROM projects WHERE slug = ?", (slug,)).fetchone():
        slug = f"{base}{suffix}"
        suffix += 1
    return slug


def _migrate_projects_slug(cursor: sqlite3.Cursor) -> None:
    """Add the projects.slug column and backfill it from the project title."""
    cursor.execute("PRAGMA table_info(projects)")
    columns = [row[1] for row in cursor.fetchall()]

    if "slug" not in columns:
        cursor.execute("ALTER TABLE projects ADD COLUMN slug TEXT")

    cursor.execute("SELECT id, title, slug FROM projects")
    for project in cursor.fetchall():
        if project["slug"]:
            continue
        slug = _unique_slug(cursor, _slugify_title(project["title"]))
        cursor.execute("UPDATE projects SET slug = ? WHERE id = ?", (slug, project["id"]))


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
    """Get the first board for a user, traversing projects (backward compat)."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Find this user's first board (MVP: 1 board per user)
    cursor.execute("""
        SELECT id, title FROM boards
        WHERE user_id = ? AND project_id IS NOT NULL
        LIMIT 1
    """, (user_id,))
    board = cursor.fetchone()

    if not board:
        # Fallback: user_id-only board (old schema)
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


# --- Project Helper Functions ---

def create_project(user_id: int, title: str, description: str = "") -> int:
    """Create a new project for a user, return the new project ID."""
    conn = get_db_connection()
    cursor = conn.cursor()

    slug = _unique_slug(cursor, _slugify_title(title))
    cursor.execute("""
        INSERT INTO projects (user_id, title, slug, description)
        VALUES (?, ?, ?, ?)
    """, (user_id, title, slug, description))

    project_id = cursor.lastrowid
    conn.commit()
    return project_id


def get_projects_for_user(user_id: int) -> list[dict]:
    """Get all projects for a user."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, user_id, title, slug, description, created_at, updated_at
        FROM projects WHERE user_id = ? ORDER BY created_at DESC
    """, (user_id,))

    return [
        {
            "id": str(row["id"]),
            "user_id": str(row["user_id"]),
            "title": row["title"],
            "slug": row["slug"],
            "description": row["description"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }
        for row in cursor.fetchall()
    ]


def get_project(project_id: int, user_id: int) -> dict | None:
    """Get a specific project by ID, verifying ownership."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, user_id, title, slug, description, created_at, updated_at
        FROM projects WHERE id = ? AND user_id = ?
    """, (project_id, user_id))

    row = cursor.fetchone()
    if not row:
        return None

    return {
        "id": str(row["id"]),
        "user_id": str(row["user_id"]),
        "title": row["title"],
        "slug": row["slug"],
        "description": row["description"],
        "created_at": row["created_at"],
        "updated_at": row["updated_at"],
    }


def update_project(project_id: int, user_id: int, title: str, description: str = "") -> None:
    """Update a project's title and description, verifying ownership."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        UPDATE projects
        SET title = ?, description = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND user_id = ?
    """, (title, description, project_id, user_id))

    if cursor.rowcount == 0:
        raise ValueError(f"Project {project_id} not found or access denied")

    conn.commit()


def delete_project(project_id: int, user_id: int) -> None:
    """Delete a project and all its boards (cascades), verifying ownership."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        DELETE FROM projects WHERE id = ? AND user_id = ?
    """, (project_id, user_id))

    if cursor.rowcount == 0:
        raise ValueError(f"Project {project_id} not found or access denied")

    conn.commit()


# --- Board Helper Functions ---

def get_boards_for_project(project_id: int) -> list[dict]:
    """Get all boards for a project."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, project_id, title, position, created_at, updated_at
        FROM boards WHERE project_id = ? ORDER BY position
    """, (project_id,))

    return [
        {
            "id": str(row["id"]),
            "project_id": str(row["project_id"]),
            "title": row["title"],
            "position": row["position"],
            "created_at": row["created_at"],
            "updated_at": row["updated_at"],
        }
        for row in cursor.fetchall()
    ]


def create_board(project_id: int, user_id: int, title: str) -> int:
    """Create a new board in a project, return the new board ID."""
    conn = get_db_connection()
    cursor = conn.cursor()

    # Get the next position
    cursor.execute("""
        SELECT COALESCE(MAX(position), -1) + 1 FROM boards WHERE project_id = ?
    """, (project_id,))
    position = cursor.fetchone()[0]

    cursor.execute("""
        INSERT INTO boards (project_id, user_id, title, position)
        VALUES (?, ?, ?, ?)
    """, (project_id, user_id, title, position))

    board_id = cursor.lastrowid
    conn.commit()

    # Create default columns for the new board
    _create_default_columns(board_id)

    return board_id


def _create_default_columns(board_id: int) -> None:
    """Create the default 5 columns for a new board."""
    conn = get_db_connection()
    cursor = conn.cursor()

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

    conn.commit()


def get_board(board_id: int) -> dict:
    """Get a board with all columns and cards."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, project_id, title, position FROM boards WHERE id = ?
    """, (board_id,))
    board = cursor.fetchone()

    if not board:
        raise ValueError(f"Board {board_id} not found")

    board_id_val = board["id"]
    board_title = board["title"]

    cursor.execute("""
        SELECT id, title, position FROM columns
        WHERE board_id = ? ORDER BY position
    """, (board_id_val,))
    columns = cursor.fetchall()

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
        "id": str(board_id_val),
        "title": board_title,
        "columns": columns_data
    }


def update_board(board_id: int, title: str, position: int | None = None) -> None:
    """Update a board's title and/or position."""
    conn = get_db_connection()
    cursor = conn.cursor()

    if position is not None:
        cursor.execute("""
            UPDATE boards SET title = ?, position = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (title, position, board_id))
    else:
        cursor.execute("""
            UPDATE boards SET title = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
        """, (title, board_id))

    conn.commit()


def delete_board(board_id: int) -> None:
    """Delete a board (cascades to columns and cards)."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("DELETE FROM boards WHERE id = ?", (board_id,))

    if cursor.rowcount == 0:
        raise ValueError(f"Board {board_id} not found")

    conn.commit()


def get_board_for_project(board_id: int, project_id: int) -> dict | None:
    """Get a board by ID, verifying it belongs to the given project."""
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id FROM boards WHERE id = ? AND project_id = ?
    """, (board_id, project_id))

    if not cursor.fetchone():
        return None

    return get_board(board_id)


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


def _migrate_boards_to_projects(cursor: sqlite3.Cursor) -> None:
    """Migrate legacy boards from user_id to project_id if needed."""
    # Check if boards table has user_id but no project_id
    cursor.execute("PRAGMA table_info(boards)")
    columns = [row[1] for row in cursor.fetchall()]

    if "user_id" in columns and "project_id" not in columns:
        # This shouldn't happen since we created the new schema above,
        # but handle the case where an old DB exists with only user_id
        cursor.execute("ALTER TABLE boards ADD COLUMN project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE")
        cursor.execute("ALTER TABLE boards ADD COLUMN position INTEGER NOT NULL DEFAULT 0")

    # Check for boards that have user_id but no project_id (legacy data)
    cursor.execute("SELECT id, user_id FROM boards WHERE project_id IS NULL AND user_id IS NOT NULL")
    legacy_boards = cursor.fetchall()

    for board in legacy_boards:
        board_id = board["id"]
        user_id = board["user_id"]

        # Create a default project for this user if one doesn't exist
        cursor.execute("""
            SELECT id FROM projects WHERE user_id = ? LIMIT 1
        """, (user_id,))
        project = cursor.fetchone()

        if not project:
            cursor.execute("""
                INSERT INTO projects (user_id, title, description)
                VALUES (?, ?, ?)
            """, (user_id, "My Projects", "Default project created during migration"))
            project_id = cursor.lastrowid
        else:
            project_id = project["id"]

        # Update the board with project_id
        cursor.execute("""
            UPDATE boards SET project_id = ? WHERE id = ?
        """, (project_id, board_id))

    conn = cursor.connection
    if conn:
        conn.commit()


def close_db_connection() -> None:
    """Close the thread-local database connection."""
    if hasattr(_local, "connection") and _local.connection is not None:
        _local.connection.close()
        _local.connection = None