import json
import os
import hashlib
import secrets
import re
from datetime import datetime, timedelta, timezone

import psycopg2
import psycopg2.extras

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p27869002_pet_finder_app")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id",
}
SESSION_DAYS = 30


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"], options=f"-c search_path={SCHEMA}")


def hash_password(pwd: str) -> str:
    return hashlib.sha256(pwd.encode()).hexdigest()


def make_token() -> str:
    return secrets.token_hex(32)


def user_to_dict(row) -> dict:
    return {
        "id": row["id"],
        "email": row["email"],
        "name": row["name"],
        "phone": row.get("phone"),
        "avatar_url": row.get("avatar_url"),
        "role": row["role"],
        "lang": row.get("lang", "ru"),
        "email_verified": row.get("email_verified", False),
        "created_at": str(row["created_at"]),
    }


def ok(data: dict, status: int = 200) -> dict:
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data)}


def err(msg: str, status: int = 400) -> dict:
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


def handler(event: dict, context) -> dict:
    """
    Аутентификация: регистрация, вход, выход, профиль, восстановление пароля.
    POST /register, POST /login, POST /logout, GET /me, POST /forgot-password, POST /reset-password
    """
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = event.get("path", "/")
    params = event.get("queryStringParameters") or {}
    # Поддержка роутинга через ?action= (для тестов и фронтенда)
    action = params.get("action", "")
    if action:
        path = f"/{action}"
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            return err("Invalid JSON body")

    token = (event.get("headers") or {}).get("x-auth-token") or \
            (event.get("headers") or {}).get("X-Auth-Token")

    # --- REGISTER ---
    if path.endswith("/register") and method == "POST":
        email = (body.get("email") or "").strip().lower()
        password = body.get("password", "")
        name = (body.get("name") or "").strip()
        role = body.get("role", "user")

        if not email or not re.match(r"[^@]+@[^@]+\.[^@]+", email):
            return err("Некорректный email")
        if len(password) < 6:
            return err("Пароль минимум 6 символов")
        if not name:
            return err("Укажите имя")
        if role not in ("user", "shelter"):
            role = "user"

        conn = get_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cur.fetchone():
            conn.close()
            return err("Email уже зарегистрирован", 409)

        pwd_hash = hash_password(password)
        cur.execute(
            "INSERT INTO users (email, password_hash, name, role) VALUES (%s, %s, %s, %s) RETURNING *",
            (email, pwd_hash, name, role)
        )
        user = cur.fetchone()

        session_token = make_token()
        expires = datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)
        cur.execute(
            "INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
            (user["id"], session_token, expires)
        )
        conn.commit()
        conn.close()
        return ok({"token": session_token, "user": user_to_dict(user)}, 201)

    # --- LOGIN ---
    if path.endswith("/login") and method == "POST":
        email = (body.get("email") or "").strip().lower()
        password = body.get("password", "")

        conn = get_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT * FROM users WHERE email = %s", (email,))
        user = cur.fetchone()

        if not user or not user.get("is_active"):
            conn.close()
            return err("Неверный email или пароль", 401)
        if user["password_hash"] != hash_password(password):
            conn.close()
            return err("Неверный email или пароль", 401)

        session_token = make_token()
        expires = datetime.now(timezone.utc) + timedelta(days=SESSION_DAYS)
        cur.execute(
            "INSERT INTO sessions (user_id, token, expires_at) VALUES (%s, %s, %s)",
            (user["id"], session_token, expires)
        )
        conn.commit()
        conn.close()
        return ok({"token": session_token, "user": user_to_dict(user)})

    # --- LOGOUT ---
    if path.endswith("/logout") and method == "POST":
        if token:
            conn = get_conn()
            cur = conn.cursor()
            cur.execute("UPDATE sessions SET expires_at = NOW() WHERE token = %s", (token,))
            conn.commit()
            conn.close()
        return ok({"ok": True})

    # --- ME ---
    if path.endswith("/me") and method == "GET":
        if not token:
            return err("Требуется авторизация", 401)
        conn = get_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT u.* FROM users u JOIN sessions s ON s.user_id = u.id "
            "WHERE s.token = %s AND s.expires_at > NOW() AND u.is_active = true",
            (token,)
        )
        user = cur.fetchone()
        conn.close()
        if not user:
            return err("Сессия истекла или недействительна", 401)
        return ok({"user": user_to_dict(user)})

    # --- UPDATE PROFILE ---
    if path.endswith("/me") and method == "PUT":
        if not token:
            return err("Требуется авторизация", 401)
        conn = get_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT u.* FROM users u JOIN sessions s ON s.user_id = u.id "
            "WHERE s.token = %s AND s.expires_at > NOW() AND u.is_active = true",
            (token,)
        )
        user = cur.fetchone()
        if not user:
            conn.close()
            return err("Требуется авторизация", 401)

        updates = {}
        for field in ("name", "phone", "avatar_url", "lang"):
            if field in body:
                updates[field] = body[field]
        if body.get("password"):
            if len(body["password"]) < 6:
                conn.close()
                return err("Пароль минимум 6 символов")
            updates["password_hash"] = hash_password(body["password"])

        if updates:
            sets = ", ".join(f"{k} = %s" for k in updates)
            vals = list(updates.values()) + [user["id"]]
            cur.execute(f"UPDATE users SET {sets}, updated_at = NOW() WHERE id = %s RETURNING *", vals)
            user = cur.fetchone()
            conn.commit()

        conn.close()
        return ok({"user": user_to_dict(user)})

    # --- FORGOT PASSWORD ---
    if path.endswith("/forgot-password") and method == "POST":
        email = (body.get("email") or "").strip().lower()
        conn = get_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute("SELECT id FROM users WHERE email = %s", (email,))
        user = cur.fetchone()
        if user:
            reset_token = make_token()
            expires = datetime.now(timezone.utc) + timedelta(hours=2)
            cur.execute(
                "UPDATE users SET reset_token = %s, reset_token_expires = %s WHERE id = %s",
                (reset_token, expires, user["id"])
            )
            conn.commit()
            conn.close()
            return ok({"ok": True, "reset_token": reset_token})
        conn.close()
        return ok({"ok": True})

    # --- RESET PASSWORD ---
    if path.endswith("/reset-password") and method == "POST":
        reset_token = body.get("token", "")
        new_password = body.get("password", "")
        if len(new_password) < 6:
            return err("Пароль минимум 6 символов")

        conn = get_conn()
        cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(
            "SELECT id FROM users WHERE reset_token = %s AND reset_token_expires > NOW()",
            (reset_token,)
        )
        user = cur.fetchone()
        if not user:
            conn.close()
            return err("Токен недействителен или истёк", 400)

        pwd_hash = hash_password(new_password)
        cur.execute(
            "UPDATE users SET password_hash = %s, reset_token = NULL, reset_token_expires = NULL WHERE id = %s",
            (pwd_hash, user["id"])
        )
        conn.commit()
        conn.close()
        return ok({"ok": True})

    return err("Not found", 404)