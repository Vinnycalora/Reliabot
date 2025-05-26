import discord
from discord import app_commands
from discord.ext import commands, tasks
import openai
import os
import random
from dotenv import load_dotenv
from datetime import datetime
import asyncio
import db  # using the new db.py module

# === Load Environment Variables ===
load_dotenv()
openai.api_key = os.getenv("OPENAI_API_KEY")

# === Discord Bot Setup ===
intents = discord.Intents.default()
intents.message_content = True
intents.members = True
bot = commands.Bot(command_prefix="/", intents=intents)

# === Initialize Database ===
db.init_db()

# === On Ready Event ===
@bot.event
async def on_ready():
    print(f'🤖 {bot.user} is online!')
    try:
        synced = await bot.tree.sync()
        print(f"🔧 Synced {len(synced)} slash commands.")
    except Exception as e:
        print(f"Error syncing commands: {e}")
    schedule_daily_checkins.start()

# === Slash Commands ===
@bot.tree.command(name="motivate", description="Get a motivational boost from GPT-3.5")
@app_commands.describe(input="What are you struggling with?")
async def motivate(interaction: discord.Interaction, input: str = "I need motivation."):
    await interaction.response.defer()
    try:
        client = openai.OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": "You are a motivational coach who helps people refocus."},
                {"role": "user", "content": input}
            ],
            max_tokens=100,
            temperature=0.9
        )
        message = response.choices[0].message.content.strip()
        await interaction.followup.send(f"🌟 {message}")
    except Exception as e:
        await interaction.followup.send(f"⚠️ GPT error: {e}")

@bot.tree.command(name="addtask", description="Add a task to your to-do list")
@app_commands.describe(task="Describe your task")
async def addtask(interaction: discord.Interaction, task: str):
    db.add_task(str(interaction.user.id), task)
    await interaction.response.send_message(f"✅ Task added: {task}")

@bot.tree.command(name="progress", description="View your current tasks")
async def progress(interaction: discord.Interaction):
    tasks = db.get_tasks(str(interaction.user.id))
    if tasks:
        await interaction.response.send_message("📋 Your tasks:\n" + "\n".join(f"- {t}" for t in tasks))
    else:
        await interaction.response.send_message("You haven’t added any tasks yet. Use `/addtask` to start!")

@bot.tree.command(name="done", description="Mark a task as completed")
@app_commands.describe(task="The task to mark as done")
async def done(interaction: discord.Interaction, task: str):
    if db.complete_task(str(interaction.user.id), task):
        await interaction.response.send_message(f"🎉 Task marked as done: {task}")
    else:
        await interaction.response.send_message("⚠️ Couldn't find that task. Check `/progress` to see your list.")

@bot.tree.command(name="listdone", description="List your completed tasks")
async def listdone(interaction: discord.Interaction):
    completed = db.get_completed_tasks(str(interaction.user.id))
    if completed:
        formatted = "\n".join(f"- {task} ({date})" for task, date in completed)
        await interaction.response.send_message("✅ Completed tasks:\n" + formatted)
    else:
        await interaction.response.send_message("You haven’t completed any tasks yet.")

@bot.tree.command(name="clearcompleted", description="Clear all completed tasks")
async def clearcompleted(interaction: discord.Interaction):
    db.clear_completed_tasks(str(interaction.user.id))
    await interaction.response.send_message("🗑️ Your completed tasks list has been cleared.")

@bot.tree.command(name="summary", description="Weekly task and streak summary")
async def summary(interaction: discord.Interaction):
    completed = db.get_completed_tasks(str(interaction.user.id))
    this_week = [t for t in completed if (datetime.now().date() - datetime.strptime(t[1], "%Y-%m-%d").date()).days <= 7]
    streak = db.get_streak(str(interaction.user.id))
    await interaction.response.send_message(
        f"📈 This week you completed {len(this_week)} tasks.\n🔥 Your current streak is {streak} day(s). Great work!"
    )

@bot.tree.command(name="streak", description="Track your daily check-in streak")
async def streak(interaction: discord.Interaction):
    count = db.update_streak(str(interaction.user.id))
    await interaction.response.send_message(f"🔥 Your current streak is {count} day(s)!")

@bot.tree.command(name="setreminder", description="Set the hour (0–23) for your daily check-in reminder")
@app_commands.describe(hour="Hour of the day in 24h format (e.g. 9 for 9AM, 18 for 6PM)")
async def setreminder(interaction: discord.Interaction, hour: int):
    if not (0 <= hour <= 23):
        await interaction.response.send_message("⛔ Please enter a valid hour between 0 and 23.")
        return
    db.set_reminder(str(interaction.user.id), hour)
    await interaction.response.send_message(f"✅ Daily check-in reminder set to {hour:02d}:00.")

@bot.tree.command(name="stopreminder", description="Disable your daily check-in reminder")
async def stopreminder(interaction: discord.Interaction):
    db.clear_reminder(str(interaction.user.id))
    await interaction.response.send_message("🔕 Daily check-in reminder disabled.")

# === Daily Check-In Scheduler ===
@tasks.loop(minutes=1)
async def schedule_daily_checkins():
    now = datetime.now()
    for user_id, hour, last_dm in db.get_reminder_users():
        if hour is not None and now.hour == hour:
            if last_dm != str(now.date()):
                try:
                    user = await bot.fetch_user(int(user_id))
                    await user.send("👋 Daily check-in! How are you feeling today? What’s one thing you want to accomplish?")
                    db.set_last_dm(user_id, str(now.date()))
                except Exception as e:
                    print(f"Failed to DM {user_id}: {e}")

# === Run Bot ===
bot.run(os.getenv("DISCORD_TOKEN"))



