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


def get_user(cur, token):
    if not token:
        return None
    cur.execute(
        "SELECT u.* FROM users u JOIN sessions s ON s.user_id = u.id "
        "WHERE s.token = %s AND s.expires_at > NOW() AND u.is_active = true",
        (token,)
    )
    return cur.fetchone()


def handler(event: dict, context) -> dict:
    """
    Управление приютами: список, детали, создание/редактирование профиля приюта, модерация (admin).
    GET /, GET /{id}, POST /, PUT /{id}
    """
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = (event.get("path") or "/").rstrip("/") or "/"
    params = event.get("queryStringParameters") or {}
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
    current_user = get_user(cur, token)

    parts = path.split("/")
    shelter_id = int(parts[-1]) if parts[-1].isdigit() else None

    # GET /{id}/animals — животные приюта
    if shelter_id and "animals" in parts and method == "GET":
        cur.execute(
            "SELECT * FROM animals WHERE shelter_id = %s AND status = 'active' ORDER BY created_at DESC",
            (shelter_id,)
        )
        rows = cur.fetchall()
        conn.close()
        return ok({"items": [dict(r) for r in rows]})

    # GET /{id}
    if shelter_id and method == "GET":
        cur.execute(
            "SELECT s.*, u.name as owner_name, u.email as owner_email, "
            "(SELECT COUNT(*) FROM animals a WHERE a.shelter_id = s.id AND a.status = 'active') as active_count "
            "FROM shelters s JOIN users u ON u.id = s.user_id WHERE s.id = %s",
            (shelter_id,)
        )
        row = cur.fetchone()
        conn.close()
        if not row:
            return err("Приют не найден", 404)
        return ok(dict(row))

    # PUT /{id} — обновление
    if shelter_id and method == "PUT":
        if not current_user:
            conn.close()
            return err("Требуется авторизация", 401)
        cur.execute("SELECT user_id FROM shelters WHERE id = %s", (shelter_id,))
        sh = cur.fetchone()
        if not sh:
            conn.close()
            return err("Не найдено", 404)
        if sh["user_id"] != current_user["id"] and current_user["role"] != "admin":
            conn.close()
            return err("Нет прав", 403)

        allowed = ["name", "description", "address", "city", "lat", "lng", "phone", "email", "website", "logo_url"]
        if current_user["role"] == "admin":
            allowed.append("is_verified")

        updates = {k: v for k, v in body.items() if k in allowed}
        if updates:
            sets = ", ".join(f"{k} = %s" for k in updates)
            vals = list(updates.values()) + [shelter_id]
            cur.execute(f"UPDATE shelters SET {sets}, updated_at = NOW() WHERE id = %s RETURNING *", vals)
            conn.commit()
            row = cur.fetchone()
            conn.close()
            return ok(dict(row))
        conn.close()
        return err("Нет данных")

    # POST / — создание профиля приюта
    if method == "POST":
        if not current_user:
            conn.close()
            return err("Требуется авторизация", 401)
        if current_user["role"] not in ("shelter", "admin"):
            conn.close()
            return err("Только для пользователей с ролью 'приют'", 403)

        cur.execute("SELECT id FROM shelters WHERE user_id = %s", (current_user["id"],))
        if cur.fetchone():
            conn.close()
            return err("Профиль приюта уже существует", 409)

        name = body.get("name", "").strip()
        if not name:
            conn.close()
            return err("Название обязательно")

        cur.execute(
            """INSERT INTO shelters (user_id, name, description, address, city, lat, lng, phone, email, website, logo_url)
               VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) RETURNING *""",
            (
                current_user["id"], name,
                body.get("description"), body.get("address"),
                body.get("city"), body.get("lat"), body.get("lng"),
                body.get("phone"), body.get("email"),
                body.get("website"), body.get("logo_url"),
            )
        )
        shelter = cur.fetchone()
        conn.commit()
        conn.close()
        return ok(dict(shelter), 201)

    # GET / — список приютов
    if method == "GET":
        city = params.get("city")
        conditions = ["1=1"]
        vals = []
        if city:
            conditions.append("s.city ILIKE %s")
            vals.append(f"%{city}%")

        where = " AND ".join(conditions)
        cur.execute(
            f"""SELECT s.*,
                (SELECT COUNT(*) FROM animals a WHERE a.shelter_id = s.id AND a.status = 'active') as active_count
                FROM shelters s WHERE {where} ORDER BY s.is_verified DESC, s.name ASC""",
            vals
        )
        rows = cur.fetchall()
        conn.close()
        return ok({"items": [dict(r) for r in rows]})

    conn.close()
    return err("Not found", 404)
