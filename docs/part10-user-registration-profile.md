# Part 10: User Registration and Profile

## Goal

Let people create their own account, sign in with email and password, and manage their profile from an avatar menu at the top right. The user database is created automatically if it does not exist, and existing databases (including the one on Render) upgrade on startup.

## Context

- Login is a hardcoded check in `backend/main.py:73-96` (`user` / `password`). It never reads the database.
- The `users` table (`backend/db.py:47-53`) has `username` and a plaintext `password_hash`. It has no name and no email.
- Sessions live in memory (`backend/main.py:37, 50-59`) and store only the username.
- Headers currently show a standalone Log Out button and the mode switcher in four places (`BoardHeader.tsx`, `ProjectList.tsx`, `ProjectDetail.tsx`).

## Decisions

Confirmed with you:
- The avatar is a dropdown with Profile and Log Out, placed after the mode switcher so it is the rightmost control. The standalone Log Out button is removed.
- Sign-in is by email and password. Registration collects name, email and password.
- A new user gets a sample project, board and cards.

Chosen by me (tell me if you disagree):
- Passwords are hashed with the standard library (`hashlib.scrypt`, random salt, `hmac.compare_digest`). No new dependency. Plaintext passwords are upgraded to hashes by the migration.
- The `username` column stays (NOT NULL UNIQUE). New users get `username = email`. The demo user keeps `user` and gets email `user@example.com`, so its login becomes `user@example.com` / `password`.
- Emails are stored lowercase and are unique.
- Passwords need at least 8 characters. Email gets a simple format check. Name is required, at most 100 characters.
- Registration signs the user in and redirects to `/projects`.
- Sessions store `user_id`, so profile edits do not break sessions. Changing a password signs out that user's other sessions.

## Database (`backend/db.py`)

- Add `name` and `email` to the `users` table definition for new databases.
- Add `_migrate_users_profile(cursor)`, following the `_migrate_projects_slug` pattern (`db.py:203-216`). It checks `PRAGMA table_info(users)`, adds missing columns, and is safe to run twice.
- The migration backfills the demo user (`name = 'Demo User'`, `email = 'user@example.com'`), hashes any password not already in hash form, and creates `CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email)`. SQLite cannot add a UNIQUE column with `ALTER`, so the index does that job.
- Call the migration from `init_db()` next to the existing migrations.
- New helpers: `hash_password`, `verify_password`, `create_user`, `get_user_by_email`, `get_user_by_id`, `update_user_profile`, `update_user_password`.
- Move the demo sample data (project, board, 5 columns, 9 cards, from `db.py:110-179`) into `seed_sample_project(cursor, user_id)`. `init_db()` and registration both call it.

## API

- `POST /api/login` takes `{email, password}`. It returns 401 for an unknown email or a wrong password.
- `POST /api/register` takes `{name, email, password}`. It returns 400 for invalid input and 409 for a duplicate email. On success it creates the user, seeds the sample project, starts a session, and sets the cookie. It lives in `main.py` next to login.
- `GET /api/auth/status` returns `{authenticated, user: {id, name, email}}`.
- `GET /api/profile` returns the current user. `PATCH /api/profile` takes `{name?, email?}` and returns 409 for a duplicate email.
- `POST /api/profile/password` takes `{currentPassword, newPassword}`. It returns 401 for a wrong current password and 400 for a short new one.
- `get_authenticated_user_id` (`backend/routes/api.py:16-27`) reads `user_id` from the session instead of looking up the username.
- Static serving: `catch_all` lets `register` through without the auth gate, the same way `_next/` is handled. `_resolve_static` maps `register` and `profile` to their HTML files, as it does for `login`.
- The inline `LOGIN_HTML` in `backend/routes/views.py` switches to email and links to Register.

## Frontend

- `context/AuthContext.tsx`: `User` becomes `{id, name, email}`. `login` takes email. Add `register` and `refreshUser`.
- New `app/register/page.tsx` with a `RegisterForm`. New `app/profile/page.tsx` with a `ProfilePage` that has a name and email form and a change-password form. The profile page redirects to `/login` when signed out.
- New `components/UserMenu.tsx`: an avatar with initials and a dropdown with Profile and Log Out. It closes on outside click and Escape, and it works with the keyboard. It replaces `LogoutButton` in the headers, after `ThemeToggle`. `LogoutButton.tsx` is removed.
- The Profile link is a plain anchor, so the navigation is a full page load, the same as logout today.
- `LoginForm.tsx` gets an email field, a "Create an account" link, and a demo hint of `user@example.com / password`.
- Netlify should serve `/register` and `/profile` through its clean URLs without a `netlify.toml` change. Confirm after deploy.
- Layouts are responsive from the start, matching the Part 9 header work.

## Files

- Backend: `backend/db.py`, `backend/main.py`, `backend/routes/api.py`, `backend/routes/views.py`. New `backend/tests/test_users.py`. Update login calls in `conftest.py`, `test_auth.py`, `test_projects.py`, `test_boards.py`, `test_kanban.py`, `test_db.py`.
- Frontend: `context/AuthContext.tsx`, `components/LoginForm.tsx`, `BoardHeader.tsx`, `ProjectList.tsx`, `ProjectDetail.tsx`, new `UserMenu.tsx`, `RegisterForm.tsx`, `ProfilePage.tsx`, new `app/register/page.tsx`, `app/profile/page.tsx`. Remove `LogoutButton.tsx`. Update `BoardHeader.test.tsx` and `e2e/kanban.spec.ts`.

## Verification

- Backend (`pytest`): hashing round trip; migration on an old-schema database, run twice; register (success, duplicate email, bad input); email login; profile get, update and password change; session behavior; per-user data isolation; a new user gets the sample project.
- Frontend: `npx tsc --noEmit`, `npx vitest run`, `npm run build`. Unit tests for `UserMenu`, `RegisterForm` and `ProfilePage` validation.
- End to end on port 8000: register, see the sample project, open Profile from the avatar, change the name, change the password, log out, log in with the new password, and check that a duplicate email shows an error. The existing e2e tests are updated for email login.
- Screenshots at 390px and 768px for register, profile and the avatar menu.
- Deploy: confirm that the Render migration keeps `user@example.com` / `password` working, then redeploy Netlify and test register and profile on the live URL.

## Risks and out of scope

- The production migration runs on Render's disk. It is idempotent and tested on an old-schema database. The demo login changes, so tell users before deploying.
- Sessions stay in memory, so a restart signs everyone out. This is unchanged from today.
- Not included: password reset, email verification, login rate limiting, and `secure=True` on the session cookie over HTTPS. These are recommended before real users arrive.
