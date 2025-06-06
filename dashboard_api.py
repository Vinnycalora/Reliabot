from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse
from starlette.middleware.sessions import SessionMiddleware
from pydantic import BaseModel, constr
from typing import Optional
from collections import defaultdict
from datetime import datetime
import os
import time
import requests
from urllib.parse import urlencode
from dotenv import load_dotenv
import db
from db import get_connection, migrate_tasks_table
import traceback
from fastapi import Path

load_dotenv()

app = FastAPI()
START_TIME = time.time()

# CORS & Session
app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET", "supersecretkey123"),
    same_site="none",
    https_only=True,
    max_age=86400,
    session_cookie="session"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://reliabot.netlify.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# === Models ===
class TaskCreate(BaseModel):
    name: constr(max_length=255)
    due_at: Optional[str] = None
    description: Optional[constr(max_length=500)] = None
    recurrence: Optional[str] = None
    labels: Optional[str] = None
    priority: Optional[str] = None

class DoneTask(BaseModel):
    user_id: str
    task: str

# === Routes ===
@app.get("/tasks/{user_id}")
def get_tasks(user_id: str, request: Request):
    user = request.session.get("user")
    if not user or str(user.get("id")) != str(user_id):
        print(f"❌ Forbidden: session user {user.get('id') if user else 'None'} tried to access {user_id}")
        raise HTTPException(status_code=403, detail="Forbidden")
    return db.get_tasks(user_id)

@app.post("/task")
async def create_task(request: Request, task: TaskCreate):
    user = request.session.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    user_id = str(user["id"])
    created_at = datetime.utcnow()

    try:
        with get_connection() as conn:
            with conn.cursor() as cur:
                cur.execute(
                    """
                    INSERT INTO users (user_id, streak, last_check)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (user_id) DO NOTHING
                    """,
                    (user_id, 0, None)
                )

                cur.execute(
                    """
                    INSERT INTO tasks (user_id, task, created_at, due_at, description, recurrence, labels, priority)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
                    """,
                    (user_id, task.name, created_at, task.due_at, task.description, task.recurrence, task.labels, task.priority),
                )
            conn.commit()
    except Exception as e:
        print("🚨 ERROR in /task route:", e)
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

    return {"message": "Task added"}

@app.post("/done")
def mark_task_done(item: DoneTask, request: Request):
    user = request.session.get("user")
    if not user or str(user.get("id")) != str(item.user_id):
        raise HTTPException(status_code=403, detail="Forbidden")

    success = db.complete_task(item.user_id, item.task)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found.")

    db.update_streak(item.user_id)
    return {"message": "Task marked as done."}

@app.get("/streak/{user_id}")
def get_streak(user_id: str, request: Request):
    user = request.session.get("user")
    if not user or str(user.get("id")) != str(user_id):
        print(f"❌ Forbidden: session user {user.get('id') if user else 'None'} tried to access {user_id}")
        raise HTTPException(status_code=403, detail="Forbidden")
    return {"streak": db.get_streak(user_id)}

@app.get("/summary/{user_id}")
def get_summary(user_id: str, request: Request):
    user = request.session.get("user")
    if not user or str(user.get("id")) != str(user_id):
        print(f"❌ Forbidden: session user {user.get('id') if user else 'None'} tried to access {user_id}")
        raise HTTPException(status_code=403, detail="Forbidden")

    completed = db.get_completed_tasks(user_id)
    this_week = [t for t in completed if (datetime.now().date() - datetime.strptime(t[1], "%Y-%m-%d").date()).days <= 7]
    return {
        "completed_this_week": len(this_week),
        "total_completed": len(completed),
        "streak": db.get_streak(user_id)
    }

@app.get("/xp/{user_id}")
def get_user_xp(user_id: str, request: Request):
    """Return basic XP stats based on completed tasks."""
    user = request.session.get("user")
    if not user or str(user.get("id")) != str(user_id):
        raise HTTPException(status_code=403, detail="Forbidden")

    completed = db.get_completed_tasks(user_id)
    total_xp = len(completed)
    level = total_xp // 100
    progress = total_xp % 100

    return {
        "xp": total_xp,
        "level": level,
        "progress": progress,
    }

@app.get("/xp_heatmap/{user_id}")
def get_xp_heatmap(user_id: str, request: Request):
    user = request.session.get("user")
    if not user or str(user.get("id")) != str(user_id):
        raise HTTPException(status_code=403, detail="Forbidden")

    completed_tasks = db.get_completed_tasks(user_id)
    heatmap_data = defaultdict(int)

    for _, completed_date_str, _, _ in completed_tasks:
        try:
            day = datetime.strptime(completed_date_str, "%Y-%m-%d").strftime("%Y-%m-%d")
            heatmap_data[day] += 1
        except:
            continue

    return dict(heatmap_data)


@app.get("/analytics/{user_id}")
def get_analytics(user_id: str, request: Request):
    user = request.session.get("user")
    if not user or str(user.get("id")) != str(user_id):
        print(f"❌ Forbidden: session user {user.get('id') if user else 'None'} tried to access {user_id}")
        raise HTTPException(status_code=403, detail="Forbidden")

    completed_tasks = db.get_completed_tasks(user_id)
    daily_counts = defaultdict(int)
    completion_times_by_day = defaultdict(list)

    for task, completed_date_str, created_at_str, completed_at_str in completed_tasks:
        try:
            completed_date = datetime.strptime(completed_date_str, "%Y-%m-%d").date()
            if (datetime.now().date() - completed_date).days > 7:
                continue

            daily_counts[completed_date.strftime("%Y-%m-%d")] += 1

            created_at = datetime.fromisoformat(created_at_str)
            completed_at = datetime.fromisoformat(completed_at_str)
            completion_seconds = (completed_at - created_at).total_seconds()
            completion_times_by_day[completed_date.strftime("%Y-%m-%d")].append(completion_seconds)
        except Exception as e:
            print("Error processing task:", e)

    average_completion_time = {
        day: round(sum(times) / len(times) / 60, 2)
        for day, times in completion_times_by_day.items()
    }

    return {
        "daily_counts": dict(daily_counts),
        "completion_time_minutes": average_completion_time
    }

@app.post("/logout")
def logout(request: Request):
    request.session.clear()
    return {"message": "Logged out"}

@app.get("/status")
def get_status():
    return {
        "status": "Bot is online",
        "uptime": round(time.time() - START_TIME),
        "timestamp": datetime.now().isoformat()
    }

@app.get("/me")
def get_logged_in_user(request: Request):
    user = request.session.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="Not logged in")
    return user

@app.get("/oauth/discord")
async def discord_oauth(request: Request, code: str):
    data = {
        "client_id": os.environ["DISCORD_CLIENT_ID"],
        "client_secret": os.environ["DISCORD_CLIENT_SECRET"],
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": os.environ["DISCORD_REDIRECT_URI"],
        "scope": "identify",
    }

    headers = {"Content-Type": "application/x-www-form-urlencoded"}
    token_response = requests.post("https://discord.com/api/oauth2/token", data=urlencode(data), headers=headers)
    token_response.raise_for_status()
    access_token = token_response.json()["access_token"]

    user_response = requests.get("https://discord.com/api/users/@me", headers={"Authorization": f"Bearer {access_token}"})
    user_response.raise_for_status()
    user = user_response.json()

    request.session["user"] = {
        "id": user["id"],
        "username": f"{user['username']}#{user['discriminator']}"
    }

    return RedirectResponse(url="https://reliabot.netlify.app")

@app.delete("/task/{task_id}")
def delete_task(task_id: int, request: Request):
    user = request.session.get("user")
    if not user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    with get_connection() as conn:
        with conn.cursor() as cur:
            cur.execute("DELETE FROM tasks WHERE id = %s AND user_id = %s", (task_id, str(user["id"])))
            conn.commit()
    return {"message": "Task deleted"}

# === Startup ===
@app.on_event("startup")
def startup():
    db.init_db()

@app.on_event("startup")
def startup_migrate():
    migrate_tasks_table()
