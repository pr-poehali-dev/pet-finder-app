import json
import os
from datetime import datetime

import psycopg2
import psycopg2.extras

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p27869002_pet_finder_app")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"], options=f"-c search_path={SCHEMA}")


def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}


def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


def get_admin(cur, token):
    if not token:
        return None
    cur.execute(
        "SELECT u.* FROM users u JOIN sessions s ON s.user_id = u.id "
        "WHERE s.token = %s AND s.expires_at > NOW() AND u.is_active = true AND u.role = 'admin'",
        (token,)
    )
    return cur.fetchone()


def handler(event: dict, context) -> dict:
    """
    Панель администратора: статистика, модерация объявлений, управление пользователями, верификация приютов.
    GET /stats, GET /animals?status=pending, PUT /animals/{id}/approve|reject,
    GET /users, PUT /users/{id}/role, PUT /shelters/{id}/verify
    """
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = (event.get("path") or "/").rstrip("/") or "/"
    params = event.get("queryStringParameters") or {}
    # Поддержка ?action= для роутинга
    action_param = params.get("action", "")
    if action_param:
        path = f"/{action_param}"
    token = (event.get("headers") or {}).get("x-auth-token") or \
            (event.get("headers") or {}).get("X-Auth-Token")

    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            return err("Invalid JSON body")

    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    admin = get_admin(cur, token)

    if not admin:
        conn.close()
        return err("Доступ запрещён", 403)

    # GET /stats
    if path.endswith("/stats") and method == "GET":
        cur.execute("SELECT COUNT(*) as total FROM users")
        users_total = cur.fetchone()["total"]
        cur.execute("SELECT role, COUNT(*) as cnt FROM users GROUP BY role")
        users_by_role = {r["role"]: r["cnt"] for r in cur.fetchall()}

        cur.execute("SELECT COUNT(*) as total FROM animals")
        animals_total = cur.fetchone()["total"]
        cur.execute("SELECT status, COUNT(*) as cnt FROM animals GROUP BY status")
        animals_by_status = {r["status"]: r["cnt"] for r in cur.fetchall()}

        cur.execute("SELECT COUNT(*) as total FROM shelters")
        shelters_total = cur.fetchone()["total"]
        cur.execute("SELECT COUNT(*) as total FROM messages")
        messages_total = cur.fetchone()["total"]

        conn.close()
        return ok({
            "users": {"total": int(users_total), "by_role": {k: int(v) for k, v in users_by_role.items()}},
            "animals": {"total": int(animals_total), "by_status": {k: int(v) for k, v in animals_by_status.items()}},
            "shelters": int(shelters_total),
            "messages": int(messages_total),
        })

    # GET /animals — объявления на модерации
    if path.endswith("/animals") and method == "GET":
        status_filter = params.get("status", "pending")
        limit = min(int(params.get("limit", 50)), 200)
        offset = int(params.get("offset", 0))
        cur.execute(
            """SELECT a.*, u.name as user_name, u.email as user_email
               FROM animals a JOIN users u ON u.id = a.user_id
               WHERE a.status = %s
               ORDER BY a.created_at ASC LIMIT %s OFFSET %s""",
            (status_filter, limit, offset)
        )
        rows = cur.fetchall()
        cur.execute("SELECT COUNT(*) as cnt FROM animals WHERE status = %s", (status_filter,))
        total = cur.fetchone()["cnt"]
        conn.close()
        return ok({"items": [dict(r) for r in rows], "total": int(total)})

    # PUT /animals/{id}/approve
    parts = path.split("/")
    if "animals" in parts and method == "PUT":
        idx = parts.index("animals")
        if idx + 1 < len(parts) and parts[idx + 1].isdigit():
            animal_id = int(parts[idx + 1])
            action = parts[-1] if parts[-1] in ("approve", "reject") else None
            if action == "approve":
                cur.execute("UPDATE animals SET status = 'active', updated_at = NOW() WHERE id = %s RETURNING user_id", (animal_id,))
                row = cur.fetchone()
                if row:
                    cur.execute(
                        "INSERT INTO notifications (user_id, type, title, body, link) VALUES (%s, %s, %s, %s, %s)",
                        (row["user_id"], "status_change", "Объявление опубликовано",
                         "Ваше объявление прошло проверку и опубликовано.", f"/animals/{animal_id}")
                    )
                conn.commit()
                conn.close()
                return ok({"ok": True, "status": "active"})
            elif action == "reject":
                reason = body.get("reason", "")
                cur.execute("UPDATE animals SET status = 'rejected', updated_at = NOW() WHERE id = %s RETURNING user_id", (animal_id,))
                row = cur.fetchone()
                if row:
                    cur.execute(
                        "INSERT INTO notifications (user_id, type, title, body, link) VALUES (%s, %s, %s, %s, %s)",
                        (row["user_id"], "status_change", "Объявление отклонено",
                         f"Причина: {reason}" if reason else "Объявление не прошло проверку.", f"/animals/{animal_id}")
                    )
                conn.commit()
                conn.close()
                return ok({"ok": True, "status": "rejected"})

    # GET /users
    if path.endswith("/users") and method == "GET":
        limit = min(int(params.get("limit", 50)), 200)
        offset = int(params.get("offset", 0))
        q = params.get("q", "")
        conditions = ["1=1"]
        vals = []
        if q:
            conditions.append("(u.name ILIKE %s OR u.email ILIKE %s)")
            vals += [f"%{q}%", f"%{q}%"]
        where = " AND ".join(conditions)
        cur.execute(
            f"SELECT id, email, name, phone, role, is_active, email_verified, created_at "
            f"FROM users u WHERE {where} ORDER BY created_at DESC LIMIT %s OFFSET %s",
            vals + [limit, offset]
        )
        rows = cur.fetchall()
        cur.execute(f"SELECT COUNT(*) as cnt FROM users u WHERE {where}", vals)
        total = cur.fetchone()["cnt"]
        conn.close()
        return ok({"items": [dict(r) for r in rows], "total": int(total)})

    # PUT /users/{id}/role
    if "users" in parts and method == "PUT" and parts[-1] == "role":
        idx = parts.index("users")
        user_id = int(parts[idx + 1]) if parts[idx + 1].isdigit() else None
        if user_id:
            new_role = body.get("role")
            if new_role not in ("user", "shelter", "admin"):
                conn.close()
                return err("Недопустимая роль")
            cur.execute("UPDATE users SET role = %s WHERE id = %s", (new_role, user_id))
            conn.commit()
            conn.close()
            return ok({"ok": True})

    # PUT /users/{id}/ban
    if "users" in parts and method == "PUT" and parts[-1] == "ban":
        idx = parts.index("users")
        user_id = int(parts[idx + 1]) if parts[idx + 1].isdigit() else None
        if user_id:
            cur.execute("UPDATE users SET is_active = NOT is_active WHERE id = %s RETURNING is_active", (user_id,))
            row = cur.fetchone()
            conn.commit()
            conn.close()
            return ok({"ok": True, "is_active": row["is_active"] if row else None})

    # PUT /shelters/{id}/verify
    if "shelters" in parts and method == "PUT" and parts[-1] == "verify":
        idx = parts.index("shelters")
        shelter_id = int(parts[idx + 1]) if parts[idx + 1].isdigit() else None
        if shelter_id:
            cur.execute("UPDATE shelters SET is_verified = true WHERE id = %s", (shelter_id,))
            conn.commit()
            conn.close()
            return ok({"ok": True})

    conn.close()
    return err("Not found", 404)