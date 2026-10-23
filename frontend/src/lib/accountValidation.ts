// Mirrors backend/accounts.py so the forms can explain problems before the request is sent.

export const MAX_NAME_LENGTH = 100;
export const MIN_PASSWORD_LENGTH = 8;

const EMAIL_PATTERN = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

export function validateName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Name is required";
  if (trimmed.length > MAX_NAME_LENGTH) return `Name must be ${MAX_NAME_LENGTH} characters or fewer`;
  return null;
}

export function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (trimmed.length > 254 || !EMAIL_PATTERN.test(trimmed)) return "Enter a valid email address";
  return null;
}

export function validatePassword(password: string): string | null {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters`;
  }
  return null;
}

export function validateRegistration(values: {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  const name = validateName(values.name);
  const email = validateEmail(values.email);
  const password = validatePassword(values.password);
  if (name) errors.name = name;
  if (email) errors.email = email;
  if (password) errors.password = password;
  if (!errors.password && values.password !== values.confirmPassword) {
    errors.confirmPassword = "Passwords do not match";
  }
  return errors;
}
