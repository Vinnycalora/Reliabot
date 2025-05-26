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
from openai import OpenAI  

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
        client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

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

@bot.tree.command(name="affirmation", description="Send a gentle positive affirmation")
async def affirmation(interaction: discord.Interaction):
    affirmations = [
        "You are enough, exactly as you are. 💛",
        "Progress over perfection. 🌱",
        "You can begin again, any moment. 🌀",
        "Your effort matters more than the result. 🎯",
        "You’re not behind. You’re on your own path. 🌄"
    ]
    await interaction.response.send_message(random.choice(affirmations))

@bot.tree.command(name="panic", description="Send a calming message if you're overwhelmed")
async def panic(interaction: discord.Interaction):
    messages = [
        "Pause. Inhale for 4… hold… exhale for 4. You’re okay. One step at a time. 🧘‍♂️",
        "Overwhelm means your brain needs a moment. Let’s take that moment now. ✋",
        "You are safe. You don’t have to solve everything right now. One task, one breath."
    ]
    await interaction.response.send_message(random.choice(messages))

@bot.tree.command(name="refocus", description="Refocus your mind when you're distracted")
async def refocus(interaction: discord.Interaction):
    prompts = [
        "Let’s pause the scroll. What’s one small thing you can do next? 🎯",
        "You can’t do everything, but you *can* do something. Let’s start. 💪",
        "Set a 5-minute timer. Try one task. Then reassess. That’s enough. ⏳"
    ]
    await interaction.response.send_message(random.choice(prompts))

@bot.tree.command(name="review", description="Reflect on your week with journaling prompts")
async def review(interaction: discord.Interaction):
    prompt = (
        "📝 Weekly Review Prompt:\n"
        "- What did I follow through on?\n"
        "- What got in the way?\n"
        "- What’s one thing I’m proud of?\n"
        "- What do I want to try next week?"
    )
    await interaction.response.send_message(prompt)

@bot.tree.command(name="buddy", description="Daily encouragement from your friendly bot buddy")
async def buddy(interaction: discord.Interaction):
    await interaction.response.send_message("👋 Hey buddy! Just checking in. How are you feeling today? What's one thing you're working on?")

@bot.tree.command(name="quote", description="Send a motivational quote")
async def quote(interaction: discord.Interaction):
    quotes = [
        "“Action is the foundational key to all success.” – Pablo Picasso",
        "“Done is better than perfect.” – Sheryl Sandberg",
        "“You don’t have to be great to start, but you have to start to be great.” – Zig Ziglar",
        "“Success is the sum of small efforts repeated day in and day out.” – R. Collier",
        "“Start where you are. Use what you have. Do what you can.” – Arthur Ashe"
    ]
    await interaction.response.send_message(random.choice(quotes))

@bot.tree.command(name="guide", description="Show all Reliabot commands and what they do")
async def guide_command(interaction: discord.Interaction):
    help_text = (
        "**🧠 Motivation & Mental Focus**\n"
        "/motivate — GPT-3.5-powered motivational support\n"
        "/affirmation — Positive self-affirmation\n"
        "/panic — Calming messages for overwhelm\n"
        "/refocus — Get back on track\n"
        "/quote — Famous motivational quote\n\n"
        "**✅ Task & Goal Tracking**\n"
        "/addtask — Add a task\n"
        "/progress — View tasks\n"
        "/done — Mark task as done\n"
        "/listdone — View completed tasks\n"
        "/clearcompleted — Clear completed tasks\n"
        "/summary — Weekly summary of accomplishments\n"
        "/streak — Daily check-in streak\n"
        "/review — Weekly review prompt\n\n"
        "**🤝 Accountability**\n"
        "/buddy — Daily encouragement\n"
        "/setreminder — Set daily reminder time\n"
        "/stopreminder — Disable daily reminder\n"
        "(Daily DM Check-In runs automatically)")
    await interaction.response.send_message(help_text)

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




