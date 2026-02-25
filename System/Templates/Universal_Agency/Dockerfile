# CyCOS Docker Containment Standard: Universal Agency Template
FROM python:3.11-slim

# Prevent Python from writing .pyc files & buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Create a non-root user (cycos_user) to run the application
RUN groupadd -r cycos_group && useradd -r -g cycos_group cycos_user

WORKDIR /app

# Ensure cycos_user has ownership of the working directory
RUN chown -R cycos_user:cycos_group /app

# Install OS dependencies (if needed later)
# RUN apt-get update && apt-get install -y --no-install-recommends \
#     && rm -rf /var/lib/apt/lists/*

# Install python dependencies first (caches this layer unless reqs change)
COPY requirements.txt .
# Avoid failing if requirements.txt is empty
RUN if [ -s requirements.txt ]; then pip install --no-cache-dir -r requirements.txt; fi

# Copy Agency Logic
COPY . .

# Switch to the non-root user before running the application
USER cycos_user

# Run the agency
CMD ["python", "main.py"]
