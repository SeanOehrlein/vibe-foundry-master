# CyCOS Orchestrator Execution Module (Python)
FROM python:3.11-slim

# Prevent Python from writing .pyc files & buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Create a non-root user (cycos_user) to run the application
RUN groupadd -r cycos_group && useradd -r -g cycos_group cycos_user

WORKDIR /app

# Ensure cycos_user has ownership of the working directory
RUN chown -R cycos_user:cycos_group /app

# Install OS dependencies 
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     && rm -rf /var/lib/apt/lists/*

# Install python dependencies first
COPY requirements.txt .
# If requirements.txt doesn't exist yet, we can create a dummy one or comment this out
# RUN pip install --no-cache-dir -r requirements.txt

# Mount point for unified memory (Controlled via docker-compose)
VOLUME ["/app/Memory"]

# Copy Logic
COPY . .

# Switch to the non-root user before running the application
USER cycos_user

# Run the execution engine
CMD ["python", "main.py"]
