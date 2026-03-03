import json
import os
import psycopg2

CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-User-Id, X-Auth-Token, X-Session-Id',
}

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    """Уведомления пользователя"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    conn = get_conn()
    cur = conn.cursor()

    try:
        if method == 'GET':
            user_id = params.get('user_id')
            if not user_id:
                return {'statusCode': 400, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'user_id required'})}
            cur.execute("SELECT id, message, is_read, created_at FROM notifications WHERE user_id = %s ORDER BY created_at DESC LIMIT 50", (user_id,))
            rows = cur.fetchall()
            result = [{'id': r[0], 'message': r[1], 'is_read': r[2], 'created_at': str(r[3])} for r in rows]
            return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(result, ensure_ascii=False)}

        if method == 'PUT':
            body = json.loads(event.get('body') or '{}')
            user_id = body.get('user_id')
            cur.execute("UPDATE notifications SET is_read = TRUE WHERE user_id = %s", (user_id,))
            conn.commit()
            return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'ok': True})}

        return {'statusCode': 404, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Not found'})}

    finally:
        cur.close()
        conn.close()
