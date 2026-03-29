import json
import os

import psycopg2
import psycopg2.extras

SCHEMA = os.environ.get("MAIN_DB_SCHEMA", "t_p27869002_pet_finder_app")
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
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


def handle_favorites(method, path, body, user, cur, conn):
    parts = path.split("/")
    animal_id = int(parts[-1]) if parts[-1].isdigit() else None

    if method == "GET":
        cur.execute(
            """SELECT a.*, s.name as shelter_name
               FROM animals a
               JOIN favorites f ON f.animal_id = a.id
               LEFT JOIN shelters s ON s.id = a.shelter_id
               WHERE f.user_id = %s ORDER BY f.created_at DESC""",
            (user["id"],)
        )
        rows = cur.fetchall()
        return ok({"items": [dict(r) for r in rows]})

    if method == "POST" and animal_id:
        cur.execute(
            "INSERT INTO favorites (user_id, animal_id) VALUES (%s, %s) ON CONFLICT DO NOTHING",
            (user["id"], animal_id)
        )
        conn.commit()
        return ok({"ok": True, "animal_id": animal_id})

    if method == "DELETE" and animal_id:
        cur.execute("DELETE FROM favorites WHERE user_id = %s AND animal_id = %s", (user["id"], animal_id))
        conn.commit()
        return ok({"ok": True})

    return err("Not found", 404)


def handle_messages(method, path, body, user, cur, conn):
    uid = user["id"]
    parts = path.split("/")

    if "conversations" in parts and parts[-1].isdigit():
        conv_id = int(parts[-1])
        cur.execute(
            "SELECT 1 FROM conversations WHERE id = %s AND (sender_id = %s OR recipient_id = %s)",
            (conv_id, uid, uid)
        )
        if not cur.fetchone():
            return err("Диалог не найден", 404)
        cur.execute(
            "SELECT m.*, u.name as sender_name, u.avatar_url as sender_avatar "
            "FROM messages m JOIN users u ON u.id = m.sender_id "
            "WHERE m.conversation_id = %s ORDER BY m.created_at ASC",
            (conv_id,)
        )
        msgs = cur.fetchall()
        cur.execute("UPDATE messages SET is_read = true WHERE conversation_id = %s AND sender_id != %s", (conv_id, uid))
        cur.execute(
            "UPDATE conversations SET "
            "sender_unread = CASE WHEN sender_id = %s THEN 0 ELSE sender_unread END, "
            "recipient_unread = CASE WHEN recipient_id = %s THEN 0 ELSE recipient_unread END "
            "WHERE id = %s", (uid, uid, conv_id)
        )
        conn.commit()
        return ok({"messages": [dict(m) for m in msgs]})

    if path.endswith("/conversations") and method == "GET":
        cur.execute(
            """SELECT c.*,
               CASE WHEN c.sender_id = %s THEN u2.name ELSE u1.name END as other_name,
               CASE WHEN c.sender_id = %s THEN u2.avatar_url ELSE u1.avatar_url END as other_avatar,
               CASE WHEN c.sender_id = %s THEN c.sender_unread ELSE c.recipient_unread END as unread,
               a.name as animal_name
               FROM conversations c
               JOIN users u1 ON u1.id = c.sender_id
               JOIN users u2 ON u2.id = c.recipient_id
               LEFT JOIN animals a ON a.id = c.animal_id
               WHERE c.sender_id = %s OR c.recipient_id = %s
               ORDER BY c.last_message_at DESC NULLS LAST""",
            (uid, uid, uid, uid, uid)
        )
        return ok({"conversations": [dict(r) for r in cur.fetchall()]})

    if path.endswith("/send") and method == "POST":
        recipient_id = body.get("recipient_id")
        animal_id = body.get("animal_id")
        msg_body = (body.get("body") or "").strip()
        if not recipient_id or not msg_body:
            return err("recipient_id и body обязательны")
        if recipient_id == uid:
            return err("Нельзя писать самому себе")

        if animal_id:
            cur.execute(
                "SELECT id, sender_id, recipient_id FROM conversations "
                "WHERE animal_id = %s AND ((sender_id = %s AND recipient_id = %s) OR (sender_id = %s AND recipient_id = %s))",
                (animal_id, uid, recipient_id, recipient_id, uid)
            )
        else:
            cur.execute(
                "SELECT id, sender_id, recipient_id FROM conversations "
                "WHERE animal_id IS NULL AND ((sender_id = %s AND recipient_id = %s) OR (sender_id = %s AND recipient_id = %s))",
                (uid, recipient_id, recipient_id, uid)
            )
        conv = cur.fetchone()
        if not conv:
            cur.execute(
                "INSERT INTO conversations (animal_id, sender_id, recipient_id, last_message, last_message_at) "
                "VALUES (%s, %s, %s, %s, NOW()) RETURNING id, sender_id, recipient_id",
                (animal_id, uid, recipient_id, msg_body)
            )
            conv = cur.fetchone()
        else:
            cur.execute(
                "UPDATE conversations SET last_message = %s, last_message_at = NOW(), "
                "sender_unread = CASE WHEN sender_id = %s THEN sender_unread ELSE sender_unread + 1 END, "
                "recipient_unread = CASE WHEN recipient_id = %s THEN recipient_unread + 1 ELSE recipient_unread END "
                "WHERE id = %s",
                (msg_body, uid, recipient_id, conv["id"])
            )
        cur.execute(
            "INSERT INTO messages (conversation_id, sender_id, body) VALUES (%s, %s, %s) RETURNING *",
            (conv["id"], uid, msg_body)
        )
        msg = cur.fetchone()
        cur.execute(
            "INSERT INTO notifications (user_id, type, title, body, link) VALUES (%s, %s, %s, %s, %s)",
            (recipient_id, "new_message", f"Новое сообщение от {user['name']}", msg_body, f"/messages/{conv['id']}")
        )
        conn.commit()
        return ok({"message": dict(msg), "conversation_id": conv["id"]}, 201)

    return err("Not found", 404)


def handle_notifications(method, path, body, user, cur, conn):
    uid = user["id"]
    parts = path.split("/")

    if path.endswith("/unread-count") and method == "GET":
        cur.execute("SELECT COUNT(*) as cnt FROM notifications WHERE user_id = %s AND is_read = false", (uid,))
        return ok({"count": int(cur.fetchone()["cnt"])})

    if path.endswith("/read-all") and method == "POST":
        cur.execute("UPDATE notifications SET is_read = true WHERE user_id = %s", (uid,))
        conn.commit()
        return ok({"ok": True})

    if "read" in parts and parts[-1].isdigit() and method == "POST":
        cur.execute("UPDATE notifications SET is_read = true WHERE id = %s AND user_id = %s", (int(parts[-1]), uid))
        conn.commit()
        return ok({"ok": True})

    if method == "GET":
        cur.execute("SELECT * FROM notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT 50", (uid,))
        return ok({"notifications": [dict(r) for r in cur.fetchall()]})

    return err("Not found", 404)


def handler(event: dict, context) -> dict:
    """
    Социальные функции: избранное (/favorites/*), сообщения (/messages/*), уведомления (/notifications/*).
    """
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    method = event.get("httpMethod", "GET")
    path = (event.get("path") or "/").rstrip("/") or "/"
    params = event.get("queryStringParameters") or {}
    # Поддержка ?section= для роутинга
    section = params.get("section", "")
    if section:
        path = f"/{section}"
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
    user = get_user(cur, token)

    if not user:
        conn.close()
        return err("Требуется авторизация", 401)

    if "favorites" in path:
        result = handle_favorites(method, path, body, user, cur, conn)
    elif "messages" in path or "conversations" in path or "send" in path:
        result = handle_messages(method, path, body, user, cur, conn)
    elif "notifications" in path:
        result = handle_notifications(method, path, body, user, cur, conn)
    else:
        result = err("Not found", 404)

    conn.close()
    return result