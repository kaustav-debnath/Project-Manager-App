"""View routes for serving frontend or fallback HTML."""

from fastapi import APIRouter

router = APIRouter(tags=["views"])


HELLO_WORLD_HTML = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>OmniRoute — Hello World</title>
</head>
<body>
  <main>
    <h1>Hello World</h1>
    <p>OmniRoute backend is running.</p>
  </main>
</body>
</html>
"""

LOGIN_HTML = """<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>OmniRoute — Sign In</title>
  <style>
    body { font-family: system-ui, sans-serif; background: #032147; color: #fff; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
    .card { background: #131d31; padding: 2rem; border-radius: 12px; border: 1px solid #209dd7; width: 320px; }
    h1 { margin-top: 0; color: #ecad0a; }
    label { display: block; margin: 1rem 0 0.5rem; color: #888888; }
    input { width: 100%; padding: 0.75rem; border: 1px solid #209dd7; border-radius: 6px; background: #032147; color: #fff; }
    button { margin-top: 1.5rem; width: 100%; padding: 0.75rem; background: #753991; color: #fff; border: none; border-radius: 6px; cursor: pointer; font-weight: bold; }
    button:hover { background: #622e7a; }
    .error { color: #ff6b6b; margin-bottom: 1rem; font-size: 0.875rem; }
  </style>
</head>
<body>
  <div class="card">
    <h1>Sign In</h1>
    <div id="error" class="error" style="display:none">Invalid username or password</div>
    <form id="loginForm">
      <label>Username</label>
      <input type="text" name="username" placeholder="user" required autofocus />
      <label>Password</label>
      <input type="password" name="password" placeholder="password" required />
      <button type="submit">Sign In</button>
    </form>
  </div>
  <script>
    document.getElementById("loginForm").addEventListener("submit", async (e) => {
      e.preventDefault();
      const formData = new FormData(e.target);
      const username = formData.get("username");
      const password = formData.get("password");
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      if (res.ok) {
        window.location.href = "/";
      } else {
        document.getElementById("error").style.display = "block";
      }
    });
  </script>
</body>
</html>
"""
