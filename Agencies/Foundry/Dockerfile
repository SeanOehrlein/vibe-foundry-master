# CyCOS Foundry Builder Agency
FROM python:3.11-slim

# The Foundry needs git to initialize agency repos, and potentially docker cli to trigger builds
RUN apt-get update && apt-get install -y git docker.io --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Note: The Foundry runs as root here specifically because it requires
# write access to the host's ./Agencies/ directory and docker socket to forge new containers.
# It is an administrative container by design.

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["python", "main.py"]
