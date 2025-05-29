from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import db
import time
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware
import httpx
from fastapi.responses import RedirectResponse
from fastapi import Request
from starlette.middleware.sessions import SessionMiddleware
import os
from dotenv import load_dotenv
import requests
from urllib.parse import urlencode

load_dotenv()



START_TIME = time.time()
app = FastAPI()
app.add_middleware(SessionMiddleware, secret_key=os.environ["SESSION_SECRET"])

origins = [
    "http://localhost:5173",                  # local dev
    "https://reliabot.netlify.app",           # production
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)




# === Pydantic Models ===
class Task(BaseModel):
    user_id: str
    task: str

class DoneTask(BaseModel):
    user_id: str
    task: str

# === API Routes ===
@app.get("/tasks/{user_id}")
def get_tasks(user_id: str):
    tasks = db.get_tasks(user_id)
    return tasks

@app.post("/task")
def add_task(item: Task):
    task_data = db.add_task(item.user_id, item.task)
    return task_data

@app.post("/done")
def mark_task_done(item: DoneTask):
    success = db.complete_task(item.user_id, item.task)
    if not success:
        raise HTTPException(status_code=404, detail="Task not found.")
    return {"message": "Task marked as done."}

@app.get("/streak/{user_id}")
def get_streak(user_id: str):
    count = db.get_streak(user_id)
    return {"streak": count}

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
    if "user" not in request.session:
        raise HTTPException(status_code=401, detail="Not logged in")
    return request.session["user"]

@app.get("/whoami")
def whoami(request: Request):
    return request.session.get("user", "Not logged in")


# === Init DB on API startup ===
@app.on_event("startup")
def startup():
    try:
        db.init_db()
    except Exception as e:
        print("❌ DB init failed:", e)

@app.get("/oauth/discord")
async def discord_oauth(request: Request, code: str):
    token_url = "https://discord.com/api/oauth2/token"
    user_url = "https://discord.com/api/users/@me"

    data = {
        "client_id": os.environ["DISCORD_CLIENT_ID"],
        "client_secret": os.environ["DISCORD_CLIENT_SECRET"],
        "grant_type": "authorization_code",
        "code": code,
        "redirect_uri": os.environ["DISCORD_REDIRECT_URI"],
        "scope": "identify",
    }

    headers = {
        "Content-Type": "application/x-www-form-urlencoded"
    }

    print("DATA SENT TO DISCORD TOKEN ENDPOINT:")
    print(data)


    token_response = requests.post(
    "https://discord.com/api/oauth2/token",
    data=urlencode(data),
    headers=headers
    )
    token_response.raise_for_status()

    access_token = token_response.json()["access_token"]

    user_headers = {
        "Authorization": f"Bearer {access_token}"
    }

    user_response = requests.get(user_url, headers=user_headers)
    user_response.raise_for_status()

    user = user_response.json()
    user_id = user["id"]
    username = f"{user['username']}#{user['discriminator']}"

    # Store in session
    request.session["user"] = {
        "id": user_id,
        "username": username
    }

    # Redirect back to frontend
    return RedirectResponse(url="https://reliabot.netlify.app")
