import sqlite3
from datetime import datetime
import os

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(BASE_DIR, "reliabot.db")


# === Connect & Initialize ===
def init_db():
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()

    # Users table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS users (
            user_id TEXT PRIMARY KEY,
            streak INTEGER DEFAULT 0,
            last_check TEXT,
            reminder_hour INTEGER,
            last_dm TEXT
        )
    ''')

    # Tasks table
    cur.execute('''
        CREATE TABLE IF NOT EXISTS tasks (
            user_id TEXT,
            task TEXT,
            completed INTEGER DEFAULT 0,
            completed_date TEXT,
            FOREIGN KEY (user_id) REFERENCES users(user_id)
        )
    ''')

    conn.commit()
    conn.close()

# === User Functions ===
def get_user(user_id):
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("SELECT * FROM users WHERE user_id = ?", (user_id,))
    row = cur.fetchone()
    conn.close()
    return row

def set_reminder(user_id, hour):
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("INSERT INTO users (user_id, reminder_hour) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET reminder_hour = excluded.reminder_hour", (user_id, hour))
    conn.commit()
    conn.close()

def clear_reminder(user_id):
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("UPDATE users SET reminder_hour = NULL WHERE user_id = ?", (user_id,))
    conn.commit()
    conn.close()

# === Task Functions ===
def add_task(user_id, task):
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("INSERT INTO tasks (user_id, task) VALUES (?, ?)", (user_id, task))
    conn.commit()
    conn.close()

def get_tasks(user_id):
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("SELECT task FROM tasks WHERE user_id = ? AND completed = 0", (user_id,))
    tasks = [row[0] for row in cur.fetchall()]
    conn.close()
    return tasks

def complete_task(user_id, task):
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("UPDATE tasks SET completed = 1, completed_date = ? WHERE user_id = ? AND task = ? AND completed = 0", (datetime.now().date(), user_id, task))
    changes = cur.rowcount
    conn.commit()
    conn.close()
    return changes > 0

def get_completed_tasks(user_id):
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("SELECT task, completed_date FROM tasks WHERE user_id = ? AND completed = 1 ORDER BY completed_date DESC", (user_id,))
    rows = cur.fetchall()
    conn.close()
    return rows

def clear_completed_tasks(user_id):
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("DELETE FROM tasks WHERE user_id = ? AND completed = 1", (user_id,))
    conn.commit()
    conn.close()

# === Streak Tracking ===
def update_streak(user_id):
    today = str(datetime.now().date())
    user = get_user(user_id)
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    if not user:
        cur.execute("INSERT INTO users (user_id, streak, last_check) VALUES (?, 1, ?)", (user_id, today))
        conn.commit()
        conn.close()
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
            cur.execute("UPDATE users SET streak = ?, last_check = ? WHERE user_id = ?", (streak, today, user_id))
            conn.commit()
        conn.close()
        return streak

def get_streak(user_id):
    user = get_user(user_id)
    return user[1] if user else 0

def get_reminder_users():
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("SELECT user_id, reminder_hour, last_dm FROM users WHERE reminder_hour IS NOT NULL")
    users = cur.fetchall()
    conn.close()
    return users

def set_last_dm(user_id, date):
    conn = sqlite3.connect(DB_FILE)
    cur = conn.cursor()
    cur.execute("UPDATE users SET last_dm = ? WHERE user_id = ?", (date, user_id))
    conn.commit()
    conn.close()
