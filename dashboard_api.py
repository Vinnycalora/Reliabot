from fastapi import FastAPI, HTTPException, Request
from pydantic import BaseModel
import db
import time
from datetime import datetime, date
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, JSONResponse
from starlette.middleware.sessions import SessionMiddleware
import os
from dotenv import load_dotenv
import requests
from urllib.parse import urlencode
from collections import defaultdict

load_dotenv()

START_TIME = time.time()
app = FastAPI()

app.add_middleware(
    SessionMiddleware,
    secret_key=os.getenv("SESSION_SECRET", "supersecretkey123"),
    same_site="none",
    https_only=True,
    max_age=86400,  # optional: session cookie lasts 1 day
    session_cookie="session"  # explicitly name the cookie
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://reliabot.netlify.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class Task(BaseModel):
    task: str

class DoneTask(BaseModel):
    user_id: str
    task: str

@app.get("/tasks/{user_id}")
def get_tasks(user_id: str):
    return db.get_tasks(user_id)

@app.post("/task")
async def add_task(request: Request):
    user = request.session.get("user")
    if not user:
        return JSONResponse(status_code=401, content={"detail": "Unauthorized"})

    body = await request.json()
    task_name = body.get("task")
    if not task_name:
        return JSONResponse(status_code=400, content={"detail": "Missing 'task'"})

    return db.add_task(user["id"], task_name)

@app.post("/done")
def mark_task_done(item: DoneTask):
    if db.complete_task(item.user_id, item.task):
        return {"message": "Task marked as done."}
    raise HTTPException(status_code=404, detail="Task not found.")

@app.get("/streak/{user_id}")
def get_streak(user_id: str):
    return {"streak": db.get_streak(user_id)}

@app.get("/summary/{user_id}")
def get_summary(user_id: str):
    completed = db.get_completed_tasks(user_id)
    this_week = [t for t in completed if (datetime.now().date() - datetime.strptime(t[1], "%Y-%m-%d").date()).days <= 7]
    return {
        "completed_this_week": len(this_week),
        "total_completed": len(completed),
        "streak": db.get_streak(user_id)
    }

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

@app.get("/analytics/{user_id}")
def get_analytics(user_id: str):
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
        day: round(sum(times) / len(times) / 60, 2)  # minutes
        for day, times in completion_times_by_day.items()
    }

    return {
        "daily_counts": dict(daily_counts),
        "completion_time_minutes": average_completion_time
    }

@app.on_event("startup")
def startup():
    db.init_db()
