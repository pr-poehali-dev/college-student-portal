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
    """Пропуски: получить, добавить, обновить причину"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': CORS, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    conn = get_conn()
    cur = conn.cursor()

    try:
        if method == 'GET':
            student_id = params.get('student_id')
            if student_id:
                cur.execute("""
                    SELECT a.id, a.student_id, u.display_name, a.schedule_id, s.subject, s.day_of_week, s.lesson_number, s.time_start,
                           a.date, a.reason, a.is_valid, a.created_at
                    FROM absences a
                    JOIN users u ON u.id = a.student_id
                    JOIN schedule s ON s.id = a.schedule_id
                    WHERE a.student_id = %s
                    ORDER BY a.date DESC, s.lesson_number
                """, (student_id,))
            else:
                cur.execute("""
                    SELECT a.id, a.student_id, u.display_name, a.schedule_id, s.subject, s.day_of_week, s.lesson_number, s.time_start,
                           a.date, a.reason, a.is_valid, a.created_at
                    FROM absences a
                    JOIN users u ON u.id = a.student_id
                    JOIN schedule s ON s.id = a.schedule_id
                    ORDER BY a.date DESC, s.lesson_number
                """)
            rows = cur.fetchall()
            result = [{
                'id': r[0], 'student_id': r[1], 'student_name': r[2],
                'schedule_id': r[3], 'subject': r[4], 'day_of_week': r[5],
                'lesson_number': r[6], 'time_start': r[7],
                'date': str(r[8]), 'reason': r[9], 'is_valid': r[10],
                'created_at': str(r[11])
            } for r in rows]
            return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps(result, ensure_ascii=False)}

        if method == 'POST':
            body = json.loads(event.get('body') or '{}')
            student_id = body.get('student_id')
            schedule_id = body.get('schedule_id')
            date = body.get('date')
            reason = body.get('reason')
            is_valid = body.get('is_valid', False)
            created_by = body.get('created_by')

            cur.execute(
                "INSERT INTO absences (student_id, schedule_id, date, reason, is_valid, created_by) VALUES (%s,%s,%s,%s,%s,%s) RETURNING id",
                (student_id, schedule_id, date, reason, is_valid, created_by)
            )
            new_id = cur.fetchone()[0]

            # Уведомление студенту
            cur.execute("SELECT subject FROM schedule WHERE id = %s", (schedule_id,))
            subj_row = cur.fetchone()
            subject = subj_row[0] if subj_row else 'паре'
            cur.execute(
                "INSERT INTO notifications (user_id, message) VALUES (%s, %s)",
                (student_id, f'Зафиксирован пропуск {date} на паре: {subject}')
            )
            conn.commit()
            return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'id': new_id})}

        if method == 'PUT':
            body = json.loads(event.get('body') or '{}')
            absence_id = body.get('id')
            reason = body.get('reason')
            is_valid = body.get('is_valid', False)
            cur.execute("UPDATE absences SET reason=%s, is_valid=%s WHERE id=%s", (reason, is_valid, absence_id))
            conn.commit()
            return {'statusCode': 200, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'ok': True})}

        return {'statusCode': 404, 'headers': {**CORS, 'Content-Type': 'application/json'}, 'body': json.dumps({'error': 'Not found'})}

    finally:
        cur.close()
        conn.close()
