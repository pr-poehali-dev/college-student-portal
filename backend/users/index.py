import json
import os
import hashlib
import base64
import psycopg2
import boto3

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
    """Управление пользователями: список, создание, обновление профиля, загрузка аватара"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    path = event.get('path', '/')
    conn = get_conn()
    cur = conn.cursor()

    try:
        if method == 'POST' and path.endswith('/upload-avatar'):
            body = json.loads(event.get('body') or '{}')
            user_id = body.get('user_id')
            file_data = body.get('file_data')
            content_type = body.get('content_type', 'image/jpeg')

            image_bytes = base64.b64decode(file_data)
            key = f'avatars/user_{user_id}.jpg'

            s3 = boto3.client(
                's3',
                endpoint_url='https://bucket.poehali.dev',
                aws_access_key_id=os.environ['AWS_ACCESS_KEY_ID'],
                aws_secret_access_key=os.environ['AWS_SECRET_ACCESS_KEY']
            )
            s3.put_object(Bucket='files', Key=key, Body=image_bytes, ContentType=content_type)
            cdn_url = f"https://cdn.poehali.dev/projects/{os.environ['AWS_ACCESS_KEY_ID']}/bucket/{key}"

            cur.execute("UPDATE users SET avatar_url=%s WHERE id=%s", (cdn_url, user_id))
            conn.commit()
            return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'url': cdn_url})}

        if method == 'GET':
            role = params.get('role')
            if role:
                cur.execute("SELECT id, username, role, display_name, avatar_url, created_at FROM users WHERE role = %s ORDER BY display_name", (role,))
            else:
                cur.execute("SELECT id, username, role, display_name, avatar_url, created_at FROM users ORDER BY role, display_name")
            rows = cur.fetchall()
            result = [{'id': r[0], 'username': r[1], 'role': r[2], 'display_name': r[3], 'avatar_url': r[4], 'created_at': str(r[5])} for r in rows]
            return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(result, ensure_ascii=False)}

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            username = body.get('username', '').strip()
            password = body.get('password', '').strip()
            role = body.get('role', 'student')
            display_name = body.get('display_name', username).strip()

            if not username or not password:
                return {'statusCode': 400, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Логин и пароль обязательны'})}

            ph = hash_password(password)
            cur.execute("SELECT id FROM users WHERE username = %s", (username,))
            if cur.fetchone():
                return {'statusCode': 409, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Логин уже занят'})}

            cur.execute("INSERT INTO users (username, password_hash, role, display_name) VALUES (%s,%s,%s,%s) RETURNING id", (username, ph, role, display_name))
            new_id = cur.fetchone()[0]
            conn.commit()
            return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'id': new_id, 'username': username, 'role': role, 'display_name': display_name})}

        if method == 'PUT':
            body = json.loads(event.get('body') or '{}')
            user_id = body.get('id')
            display_name = body.get('display_name')
            avatar_url = body.get('avatar_url')
            password = body.get('password')

            if password:
                ph = hash_password(password)
                cur.execute("UPDATE users SET password_hash=%s WHERE id=%s", (ph, user_id))

            if display_name is not None:
                cur.execute("UPDATE users SET display_name=%s WHERE id=%s", (display_name, user_id))

            if avatar_url is not None:
                cur.execute("UPDATE users SET avatar_url=%s WHERE id=%s", (avatar_url, user_id))

            conn.commit()

            cur.execute("SELECT id, username, role, display_name, avatar_url FROM users WHERE id=%s", (user_id,))
            u = cur.fetchone()
            return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'id': u[0], 'username': u[1], 'role': u[2], 'display_name': u[3], 'avatar_url': u[4]})}

        return {'statusCode': 404, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Not found'})}

    finally:
        cur.close()
        conn.close()
