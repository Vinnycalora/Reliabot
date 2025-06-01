import psycopg2
import psycopg2.extras
import os
from datetime import datetime

DATABASE_URL = os.getenv("DATABASE_URL")  # Set this on Railway

def get_connection():
    return psycopg2.connect(DATABASE_URL, cursor_factory=psycopg2.extras.DictCursor)

# === Init / Migration ===
def init_db():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute('''
                CREATE TABLE IF NOT EXISTS users (
                    user_id TEXT PRIMARY KEY,
                    streak INTEGER DEFAULT 0,
                    last_check TEXT,
                    reminder_hour INTEGER,
                    last_dm TEXT
                )
            ''')
            cur.execute('''
                CREATE TABLE IF NOT EXISTS tasks (
                    id SERIAL PRIMARY KEY,
                    user_id TEXT,
                    task TEXT,
                    completed BOOLEAN DEFAULT FALSE,
                    created_at TEXT,
                    completed_at TEXT,
                    completed_date TEXT,
                    description TEXT DEFAULT '',
                    due_at TEXT,
                    FOREIGN KEY (user_id) REFERENCES users(user_id)
                )
            ''')
            conn.commit()

def get_user(user_id):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT * FROM users WHERE user_id = %s", (user_id,))
            return cur.fetchone()

def set_reminder(user_id, hour):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute('''
                INSERT INTO users (user_id, reminder_hour)
                VALUES (%s, %s)
                ON CONFLICT (user_id) DO UPDATE SET reminder_hour = EXCLUDED.reminder_hour
            ''', (user_id, hour))
            conn.commit()

def clear_reminder(user_id):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("UPDATE users SET reminder_hour = NULL WHERE user_id = %s", (user_id,))
            conn.commit()

def add_task(user_id, task, description='', due_at=None):
    created_at = datetime.now().isoformat()
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute('''
                INSERT INTO tasks (user_id, task, completed, created_at, description, due_at)
                VALUES (%s, %s, FALSE, %s, %s, %s)
                RETURNING id
            ''', (user_id, task, created_at, description, due_at))
            task_id = cur.fetchone()[0]
            conn.commit()
            return {
                "id": task_id,
                "user_id": user_id,
                "task": task,
                "description": description,
                "due_at": due_at,
                "completed": False,
                "created_at": created_at,
                "completed_at": None
            }

def get_tasks(user_id):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute('''
                SELECT id, user_id, task, description, due_at, completed, created_at, completed_at
                FROM tasks
                WHERE user_id = %s
                ORDER BY created_at DESC
            ''', (user_id,))
            rows = cur.fetchall()
            return [dict(row) for row in rows]

def complete_task(user_id, task):
    completed_date = datetime.now().date().isoformat()
    completed_at = datetime.now().isoformat()
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute('''
                UPDATE tasks
                SET completed = TRUE, completed_date = %s, completed_at = %s
                WHERE user_id = %s AND task = %s AND completed = FALSE
            ''', (completed_date, completed_at, user_id, task))
            conn.commit()
            return cur.rowcount > 0

def get_completed_tasks(user_id):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute('''
                SELECT task, completed_date, created_at, completed_at
                FROM tasks
                WHERE user_id = %s AND completed = TRUE
                ORDER BY completed_date DESC
            ''', (user_id,))
            return cur.fetchall()

def clear_completed_tasks(user_id):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM tasks WHERE user_id = %s AND completed = TRUE", (user_id,))
            conn.commit()

def update_streak(user_id):
    today = str(datetime.now().date())
    user = get_user(user_id)
    with get_connection() as conn:
        with conn.cursor() as cur:
            if not user:
                cur.execute("INSERT INTO users (user_id, streak, last_check) VALUES (%s, 1, %s)", (user_id, today))
                conn.commit()
                return 1
            else:
                last_check = user[2]
                streak = user[1] or 0
                if last_check != today:
                    if last_check:
                        last_date = datetime.strptime(last_check, "%Y-%m-%d").date()
                        if (datetime.now().date() - last_date).days == 1:
                            streak += 1
                        else:
                            streak = 1
                    else:
                        streak = 1
                    cur.execute("UPDATE users SET streak = %s, last_check = %s WHERE user_id = %s", (streak, today, user_id))
                    conn.commit()
                return streak

def get_streak(user_id):
    user = get_user(user_id)
    return user[1] if user else 0

def get_reminder_users():
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("SELECT user_id, reminder_hour, last_dm FROM users WHERE reminder_hour IS NOT NULL")
            return cur.fetchall()

def set_last_dm(user_id, date):
    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("UPDATE users SET last_dm = %s WHERE user_id = %s", (date, user_id))
            conn.commit()


def migrate_tasks_table():
    # Add any migration logic here if needed in the future
    pass
