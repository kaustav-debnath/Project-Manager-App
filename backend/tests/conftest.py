"""Pytest configuration for backend tests.

Each test gets a fresh database file so state never leaks between tests.
"""

import os
import tempfile
import pytest
import sys

# Add parent directory to path so we can import db
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)) + "/..")

# Import the db module functions BEFORE they're used
# We need to ensure DB_PATH is set before init_db() is called
from db import init_db, get_db_connection, close_db_connection, _local


@pytest.fixture(autouse=True)
def fresh_db():
    """Point DB_PATH at a new empty database for each test."""
    # Close any existing connection from previous test
    close_db_connection()

    # Create a new temp database file path
    fd, path = tempfile.mkstemp(suffix=".db")
    os.close(fd)
    os.environ["DB_PATH"] = path

    # Clear the thread-local connection to force re-creation
    if hasattr(_local, "connection"):
        delattr(_local, "connection")

    # Initialize a fresh database
    init_db()

    yield

    # Cleanup
    close_db_connection()
    if hasattr(_local, "connection"):
        delattr(_local, "connection")
    os.unlink(path)