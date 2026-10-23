"""Validation rules for user accounts (registration and profile)."""

import re

MAX_NAME_LENGTH = 100
MIN_PASSWORD_LENGTH = 8
_EMAIL_PATTERN = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


def name_error(name: str) -> str | None:
    """Return an error message for an invalid name, or None if it is valid."""
    if not name:
        return "Name is required"
    if len(name) > MAX_NAME_LENGTH:
        return f"Name must be {MAX_NAME_LENGTH} characters or fewer"
    return None


def email_error(email: str) -> str | None:
    """Return an error message for an invalid email, or None if it is valid."""
    if len(email) > 254 or not _EMAIL_PATTERN.match(email):
        return "Enter a valid email address"
    return None


def password_error(password: str) -> str | None:
    """Return an error message for a weak password, or None if it is valid."""
    if len(password) < MIN_PASSWORD_LENGTH:
        return f"Password must be at least {MIN_PASSWORD_LENGTH} characters"
    return None
