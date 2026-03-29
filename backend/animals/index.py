import json
import os
import math
from datetime import datetime

import psycopg2
import psycopg2.extras

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p27869002_pet_finder_app")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-User-Id, X-Auth-Token, X-Session-Id",
}


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"], options=f"-c search_path={SCHEMA}")


def ok(data, status=200):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, default=str)}


def err(msg, status=400):
    return {"statusCode": status, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps({"error": msg})}


def get_user_from_token(cur, token):
    if not token:
        return None
    cur.execute(
        "SELECT u.* FROM users u JOIN sessions s ON s.user_id = u.id "
        "WHERE s.token = %s AND s.expires_at > NOW() AND u.is_active = true",
        (token,)
    )
    return cur.fetchone()


def animal_to_dict(row):
    d = dict(row)
    for k, v in d.items():
        if isinstance(v, datetime):
            d[k] = v.isoformat()
    return d


def haversine(lat1, lng1, lat2, lng2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    return R * 2 * math.asin(math.sqrt(a))


def handler(event: dict, context) -> dict:
    """
    CRUD объявлений о животных: листинг с фильтрами, детали, создание, обновление.
    GET /, GET /{id}, POST /, PUT /{id}, GET /my
    """
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = (event.get("path") or "/").rstrip("/") or "/"
    params = event.get("queryStringParameters") or {}
    # Поддержка ?action=get&id=N
    action_param = params.get("action", "")
    if action_param == "get" and params.get("id"):
        path = f"/{params['id']}"
    elif action_param == "my":
        path = "/my"
    body = {}
    if event.get("body"):
        try:
            body = json.loads(event["body"])
        except Exception:
            return err("Invalid JSON body")

    token = (event.get("headers") or {}).get("x-auth-token") or \
            (event.get("headers") or {}).get("X-Auth-Token")

    conn = get_conn()
    cur = conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
    current_user = get_user_from_token(cur, token)

    # GET /my — мои объявления
    if path.endswith("/my") and method == "GET":
        if not current_user:
            conn.close()
            return err("Требуется авторизация", 401)
        cur.execute(
            "SELECT a.*, s.name as shelter_name FROM animals a "
            "LEFT JOIN shelters s ON s.id = a.shelter_id "
            "WHERE a.user_id = %s ORDER BY a.created_at DESC",
            (current_user["id"],)
        )
        rows = cur.fetchall()
        conn.close()
        return ok({"items": [animal_to_dict(r) for r in rows]})

    # GET /{id} — детальная карточка
    parts = path.split("/")
    if len(parts) >= 2 and parts[-1].isdigit() and method == "GET":
        animal_id = int(parts[-1])
        cur.execute(
            "SELECT a.*, s.name as shelter_name, s.logo_url as shelter_logo, "
            "u.name as owner_name, u.phone as owner_phone "
            "FROM animals a "
            "LEFT JOIN shelters s ON s.id = a.shelter_id "
            "LEFT JOIN users u ON u.id = a.user_id "
            "WHERE a.id = %s",
            (animal_id,)
        )
        row = cur.fetchone()
        if not row:
            conn.close()
            return err("Не найдено", 404)
        cur.execute("UPDATE animals SET view_count = view_count + 1 WHERE id = %s", (animal_id,))
        conn.commit()

        is_fav = False
        if current_user:
            cur.execute("SELECT 1 FROM favorites WHERE user_id = %s AND animal_id = %s",
                        (current_user["id"], animal_id))
            is_fav = bool(cur.fetchone())

        conn.close()
        result = animal_to_dict(row)
        result["is_favorite"] = is_fav
        return ok(result)

    # DELETE /{id}
    if len(parts) >= 2 and parts[-1].isdigit() and method == "DELETE":
        if not current_user:
            conn.close()
            return err("Требуется авторизация", 401)
        animal_id = int(parts[-1])
        cur.execute("SELECT user_id FROM animals WHERE id = %s", (animal_id,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return err("Не найдено", 404)
        if row["user_id"] != current_user["id"] and current_user["role"] != "admin":
            conn.close()
            return err("Нет прав", 403)
        cur.execute("UPDATE animals SET status = 'closed' WHERE id = %s", (animal_id,))
        conn.commit()
        conn.close()
        return ok({"ok": True})

    # PUT /{id} — обновление
    if len(parts) >= 2 and parts[-1].isdigit() and method == "PUT":
        if not current_user:
            conn.close()
            return err("Требуется авторизация", 401)
        animal_id = int(parts[-1])
        cur.execute("SELECT user_id FROM animals WHERE id = %s", (animal_id,))
        row = cur.fetchone()
        if not row:
            conn.close()
            return err("Не найдено", 404)
        if row["user_id"] != current_user["id"] and current_user["role"] != "admin":
            conn.close()
            return err("Нет прав", 403)

        allowed = ["name", "breed", "age_months", "sex", "size", "color", "description",
                   "city", "address", "lat", "lng", "contact_name", "contact_phone",
                   "contact_email", "is_vaccinated", "is_sterilized", "is_chipped",
                   "has_passport", "photos", "status", "post_type", "animal_type"]
        if current_user["role"] == "admin":
            allowed.append("status")

        updates = {k: v for k, v in body.items() if k in allowed}
        if updates:
            sets = ", ".join(f"{k} = %s" for k in updates)
            vals = list(updates.values()) + [animal_id]
            cur.execute(f"UPDATE animals SET {sets}, updated_at = NOW() WHERE id = %s RETURNING *", vals)
            conn.commit()
            updated = cur.fetchone()
            conn.close()
            return ok(animal_to_dict(updated))
        conn.close()
        return err("Нет данных для обновления")

    # POST / — создание
    if method == "POST" and (path == "/" or path.endswith("/animals")):
        if not current_user:
            conn.close()
            return err("Требуется авторизация", 401)

        required = ["animal_type", "post_type"]
        for f in required:
            if not body.get(f):
                conn.close()
                return err(f"Поле {f} обязательно")

        status = "active" if current_user["role"] in ("shelter", "admin") else "pending"

        shelter_id = None
        if current_user["role"] == "shelter":
            cur.execute("SELECT id FROM shelters WHERE user_id = %s", (current_user["id"],))
            sh = cur.fetchone()
            if sh:
                shelter_id = sh["id"]

        cur.execute(
            """INSERT INTO animals
            (user_id, shelter_id, post_type, status, name, animal_type, breed, age_months, sex, size,
             color, description, city, address, lat, lng, contact_name, contact_phone, contact_email,
             is_vaccinated, is_sterilized, is_chipped, has_passport, photos, lang)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            RETURNING *""",
            (
                current_user["id"], shelter_id,
                body.get("post_type", "adopt"), status,
                body.get("name"), body.get("animal_type", "dog"),
                body.get("breed"), body.get("age_months"),
                body.get("sex", "unknown"), body.get("size"),
                body.get("color"), body.get("description"),
                body.get("city"), body.get("address"),
                body.get("lat"), body.get("lng"),
                body.get("contact_name"), body.get("contact_phone"),
                body.get("contact_email"),
                body.get("is_vaccinated"), body.get("is_sterilized"),
                body.get("is_chipped"), body.get("has_passport"),
                json.dumps(body.get("photos", [])),
                body.get("lang", "ru"),
            )
        )
        animal = cur.fetchone()
        conn.commit()
        conn.close()
        return ok(animal_to_dict(animal), 201)

    # GET / — листинг с фильтрами
    if method == "GET":
        conditions = ["1=1"]
        vals = []

        post_type = params.get("post_type")
        if post_type:
            conditions.append("a.post_type = %s")
            vals.append(post_type)

        animal_type = params.get("animal_type")
        if animal_type:
            conditions.append("a.animal_type = %s")
            vals.append(animal_type)

        breed = params.get("breed")
        if breed:
            conditions.append("a.breed ILIKE %s")
            vals.append(f"%{breed}%")

        sex = params.get("sex")
        if sex:
            conditions.append("a.sex = %s")
            vals.append(sex)

        size = params.get("size")
        if size:
            conditions.append("a.size = %s")
            vals.append(size)

        city = params.get("city")
        if city:
            conditions.append("a.city ILIKE %s")
            vals.append(f"%{city}%")

        status = params.get("status", "active")
        if status:
            conditions.append("a.status = %s")
            vals.append(status)

        age_min = params.get("age_min")
        age_max = params.get("age_max")
        if age_min:
            conditions.append("a.age_months >= %s")
            vals.append(int(age_min))
        if age_max:
            conditions.append("a.age_months <= %s")
            vals.append(int(age_max))

        vaccinated = params.get("vaccinated")
        if vaccinated == "true":
            conditions.append("a.is_vaccinated = true")

        sterilized = params.get("sterilized")
        if sterilized == "true":
            conditions.append("a.is_sterilized = true")

        q = params.get("q")
        if q:
            conditions.append("(a.name ILIKE %s OR a.breed ILIKE %s OR a.description ILIKE %s)")
            vals += [f"%{q}%", f"%{q}%", f"%{q}%"]

        lang = params.get("lang")
        if lang:
            conditions.append("a.lang = %s")
            vals.append(lang)

        where = " AND ".join(conditions)

        sort = params.get("sort", "date_desc")
        order = "a.created_at DESC"
        if sort == "date_asc":
            order = "a.created_at ASC"

        limit = min(int(params.get("limit", 20)), 100)
        offset = int(params.get("offset", 0))

        cur.execute(
            f"""SELECT a.*, s.name as shelter_name, s.is_verified as shelter_verified
                FROM animals a
                LEFT JOIN shelters s ON s.id = a.shelter_id
                WHERE {where}
                ORDER BY {order}
                LIMIT %s OFFSET %s""",
            vals + [limit, offset]
        )
        rows = cur.fetchall()

        cur.execute(f"SELECT COUNT(*) as cnt FROM animals a WHERE {where}", vals)
        total = cur.fetchone()["cnt"]

        items = [animal_to_dict(r) for r in rows]

        # Гео-фильтрация: если переданы lat/lng/radius — фильтруем и сортируем
        lat = params.get("lat")
        lng = params.get("lng")
        radius = params.get("radius")
        if lat and lng:
            lat_f, lng_f = float(lat), float(lng)
            for item in items:
                if item.get("lat") and item.get("lng"):
                    item["distance_km"] = round(haversine(lat_f, lng_f, float(item["lat"]), float(item["lng"])), 1)
                else:
                    item["distance_km"] = None
            if radius:
                r_km = float(radius)
                items = [i for i in items if i.get("distance_km") is not None and i["distance_km"] <= r_km]
            if sort == "distance":
                items.sort(key=lambda i: i.get("distance_km") or 99999)

        conn.close()
        return ok({"items": items, "total": int(total), "limit": limit, "offset": offset})

    conn.close()
    return err("Not found", 404)