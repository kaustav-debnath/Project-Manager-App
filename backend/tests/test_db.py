import pytest
import os

@pytest.fixture
def db_conn():
    """Get a database connection with test isolation."""
    from db import init_db, get_db_connection, close_db_connection
    init_db()
    conn = get_db_connection()
    yield conn
    close_db_connection()

def test_tables_exist(db_conn):
    """Verify all required tables are created."""
    tables = db_conn.execute("""
        SELECT name FROM sqlite_master
        WHERE type='table'
        AND name IN ('users', 'boards', 'columns', 'cards')
        ORDER BY name
    """).fetchall()
    table_names = [t[0] for t in tables]
    assert "users" in table_names
    assert "boards" in table_names
    assert "columns" in table_names
    assert "cards" in table_names


def test_default_user_exists(db_conn):
    """Verify default 'user' is created on init."""
    user = db_conn.execute(
        "SELECT * FROM users WHERE username = ?", ("user",)
    ).fetchone()
    assert user is not None


def test_default_board_exists(db_conn):
    """Verify default board is created for default user."""
    board = db_conn.execute(
        "SELECT * FROM boards WHERE title = ?", ("Project Alpha Roadmap",)
    ).fetchone()
    assert board is not None


def test_default_columns_exist(db_conn):
    """Verify 5 default columns are created."""
    count = db_conn.execute("SELECT COUNT(*) FROM columns").fetchone()[0]
    assert count == 5


def test_default_cards_exist(db_conn):
    """Verify default cards are seeded."""
    count = db_conn.execute("SELECT COUNT(*) FROM cards").fetchone()[0]
    assert count == 9
