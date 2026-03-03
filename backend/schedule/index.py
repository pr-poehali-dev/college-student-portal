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
    """Расписание: получить, добавить/обновить предмет"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    conn = get_conn()
    cur = conn.cursor()

    try:
        if method == 'GET':
            cur.execute("SELECT id, day_of_week, lesson_number, subject, teacher, room, time_start, time_end FROM schedule ORDER BY day_of_week, lesson_number")
            rows = cur.fetchall()
            result = [{'id': r[0], 'day_of_week': r[1], 'lesson_number': r[2], 'subject': r[3], 'teacher': r[4], 'room': r[5], 'time_start': r[6], 'time_end': r[7]} for r in rows]
            return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(result, ensure_ascii=False)}

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            day = body.get('day_of_week')
            lesson = body.get('lesson_number')
            subject = body.get('subject', '').strip()
            teacher = body.get('teacher', '').strip()
            room = body.get('room', '').strip()
            time_start = body.get('time_start', '').strip()
            time_end = body.get('time_end', '').strip()

            cur.execute(
                "INSERT INTO schedule (day_of_week, lesson_number, subject, teacher, room, time_start, time_end) VALUES (%s,%s,%s,%s,%s,%s,%s) RETURNING id",
                (day, lesson, subject, teacher, room, time_start, time_end)
            )
            new_id = cur.fetchone()[0]
            conn.commit()
            return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'id': new_id})}

        if method == 'PUT':
            body = json.loads(event.get('body') or '{}')
            sid = body.get('id')
            subject = body.get('subject', '').strip()
            teacher = body.get('teacher', '').strip()
            room = body.get('room', '').strip()
            time_start = body.get('time_start', '').strip()
            time_end = body.get('time_end', '').strip()
            cur.execute("UPDATE schedule SET subject=%s, teacher=%s, room=%s, time_start=%s, time_end=%s WHERE id=%s", (subject, teacher, room, time_start, time_end, sid))
            conn.commit()
            return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'ok': True})}

        return {'statusCode': 404, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Not found'})}

    finally:
        cur.close()
        conn.close()
