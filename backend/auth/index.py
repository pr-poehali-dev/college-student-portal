import json
import os
import hashlib
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
}

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    """Авторизация: login (?action=login), register-admin (?action=register-admin), status (?action=status)"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    action = params.get('action', '')

    conn = get_conn()
    cur = conn.cursor()

    try:
        if method == 'GET' and action == 'status':
            cur.execute("SELECT value FROM app_settings WHERE key = 'initialized'")
            row = cur.fetchone()
            initialized = row[0] == 'true' if row else False
            return {
                'statusCode': 200,
                'headers': {**CORS, 'Content-Type': 'application/json'},
                'body': json.dumps({'initialized': initialized})
            }

        body = json.loads(event.get('body') or '{}')

        if method == 'POST' and action == 'register-admin':
            cur.execute("SELECT value FROM app_settings WHERE key = 'initialized'")
            row = cur.fetchone()
            if row and row[0] == 'true':
                return {'statusCode': 403, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Уже инициализировано'})}

            username = body.get('username', '').strip()
            password = body.get('password', '').strip()
            display_name = body.get('display_name', username).strip()

            if not username or not password:
                return {'statusCode': 400, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Введите логин и пароль'})}

            ph = hash_password(password)
            cur.execute("INSERT INTO users (username, password_hash, role, display_name) VALUES (%s, %s, 'admin', %s) RETURNING id", (username, ph, display_name))
            user_id = cur.fetchone()[0]
            cur.execute("UPDATE app_settings SET value = 'true' WHERE key = 'initialized'")
            conn.commit()
            return {
                'statusCode': 200,
                'headers': {**CORS, 'Content-Type': 'application/json'},
                'body': json.dumps({'id': user_id, 'username': username, 'role': 'admin', 'display_name': display_name, 'avatar_url': None})
            }

        if method == 'POST':
            username = body.get('username', '').strip()
            password = body.get('password', '').strip()
            role = body.get('role', '')

            if not username or not password:
                return {'statusCode': 400, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Введите логин и пароль'})}

            ph = hash_password(password)
            cur.execute("SELECT id, username, role, display_name, avatar_url FROM users WHERE username = %s AND password_hash = %s", (username, ph))
            user = cur.fetchone()

            if not user:
                return {'statusCode': 401, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Неверный логин или пароль'})}

            if role and user[2] != role:
                return {'statusCode': 403, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': f'Этот аккаунт не является {role}'})}

            return {
                'statusCode': 200,
                'headers': {**CORS, 'Content-Type': 'application/json'},
                'body': json.dumps({'id': user[0], 'username': user[1], 'role': user[2], 'display_name': user[3], 'avatar_url': user[4]})
            }

        return {'statusCode': 404, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Not found'})}

    finally:
        cur.close()
        conn.close()