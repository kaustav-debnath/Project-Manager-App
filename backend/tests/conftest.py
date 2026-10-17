"""Pytest configuration for backend tests.

Sets DB_PATH to a temporary file before any test imports db or main,
preventing state leakage between test modules.
"""

import os
import tempfile

# Set DB_PATH to a temp file before any test imports db or main
_fd, _tmp_path = tempfile.mkstemp(suffix=".db")
os.close(_fd)
os.environ["DB_PATH"] = _tmp_path