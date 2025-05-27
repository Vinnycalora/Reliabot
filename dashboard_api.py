from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List
import db
import time
from datetime import datetime
from fastapi.middleware.cors import CORSMiddleware


START_TIME = time.time()
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # or ["*"] during dev
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
@app.get("/tasks/{user_id}", response_model=List[str])
def get_tasks(user_id: str):
    tasks = db.get_tasks(user_id)
    return tasks

@app.post("/task")
def add_task(item: Task):
    db.add_task(item.user_id, item.task)
    return {"message": "Task added successfully."}

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


# === Init DB on API startup ===
@app.on_event("startup")
def startup():
    db.init_db()
