# Use a minimal Python image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy project files into the image
COPY . .

# Expose the port for Uvicorn
EXPOSE 8080

# Run both the bot and the API server
CMD ["bash", "-c", "uvicorn dashboard_api:app --host 0.0.0.0 --port $PORT & python reliabot.py"]



