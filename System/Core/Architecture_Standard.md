# CyCOS Docker Containment System: Architecture Standard

This document officially outlines the **CyCOS Containerized Micro-Agent Protocol**, marking the transition from a monolithic OS architecture to a highly scalable, isolated, and resilient micro-agent environment.

## The Core Philosophy

The primary objective of this architecture is **Containment and Specialization**. Different CyCOS personas (Agencies) have radically different requirements. By isolating them into dedicated Docker containers, we guarantee:

1. **Security & Blast Radius Limitation:** A fatal error, memory leak, or compromised process within one agency (e.g., untrusted code executed by the `Technical` agency) cannot crash or corrupt the other agencies.
2. **Environment Tailoring:** The `Strategic` agency is deployed in a hyper-optimized `Alpine` environment (< 50MB footprint), while the `Technical` agency runs in a heavy Debian environment with necessary toolchains and potential local AI weights.
3. **Zero-Trust LLM Gateway:** API keys are never given directly to the operating agencies. Instead, a central Gateway proxy acts as a secure vault and rate-limiter, protecting billing limits against rogue code or accidental infinite loops.
4. **Future-Proof Compute Offloading:** The architecture natively supports treating local AI infrastructure (like the NVIDIA DGX Spark cluster) as a massive external API endpoint. The core CyCOS OS remains lightweight on the local machine while delegating high-inference tasks to the Spark.

---

### The Two Tiers of CyCOS Entities

The CyCOS ecosystem consists of two distinct types of agents:

#### 1. Core Agencies (Persistent)

The foundational, "always-on" personas that make up the CyCOS Operating System.

* **Examples:** `Strategic`, `Operations`, `Technical`, `Research`, `Security`
* **Lifespan:** Hardcoded into the root `docker-compose.yml` and boot with the system.
* **Access:** Long-term, permanent access to the `cycos-memory` vault and broad system privileges.

#### 2. Subagencies / Ad Hoc Agencies (Transient)

Narrowly-scoped, highly specialized agents spun up dynamically to execute a specific mission or sandbox a risk.

* **Examples:** A dedicated "Repo Scout" analyzing a specific codebase, or a "Disposable QA Bot".
* **Creation:** Forged dynamically by the **Foundry Agency** using the Universal Template (`/app/System/Templates/Universal_Agency`).
* **Isolation:** Each Subagency gets its own strictly isolated **Docker Container** on the `cycos-net` network and its own independent **Git repository**, ensuring issues or malicious code cannot affect the parent agency that requested it.
* **Lifespan:** Ephemeral. They are destroyed when their job is complete, though their findings are persisted back to long-term memory.

---

## Architecture Topology

The CyCOS system is orchestrated by a single `docker-compose.yml` file, which manages the lifecycle of the entire cluster.

```mermaid
graph TD;
    subgraph Host OS (Your Machine)
        Compose[Docker Compose Orchestrator] --> CyNet((cycos-net))
        Compose --> CyMem[(cycos-memory/)]
        
        subgraph Safety & Routing
            CyNet --- GW[LLM Gateway / Vault]
            Keys[Real API Keys] -.-> GW
        end

        subgraph CyCOS Container Cluster
            CyNet --- S[Strategic Agency Container]
            CyNet --- O[Operations Agency Container]
            CyNet --- R[Research Agency Container]
            CyNet --- Sec[Security Agency Container]
            
            S -.-> CyMem
            O -.-> CyMem
            R -.-> CyMem
            Sec -.-> CyMem
            
            S -- Fake Local Key --> GW
            R -- Fake Local Key --> GW
        end
        
        subgraph External/Heavy Compute
            CyNet --- T[Technical Agency Container / Dispatcher]
            T -.-> CyMem
            T -- Fake Local Key --> GW
            T == Network Request ==> Spark[[NVIDIA DGX Spark Cluster]]
        end
    end
```

### 1. The Inter-Process Communication (IPC) Network (`cycos-net`)

Containers cannot simply call each other's Python functions. All inter-agency communication happens over the internal `cycos-net` Docker Bridge network. Continers can resolve each other by name (e.g., `http://research:8080`). This network does **not** expose ports to the outside internet by default, ensuring absolute security.

### 3. The LLM Gateway (The Vault)

Instead of injecting `OPENAI_API_KEY` directly into every agency container (where untrusted code like Open CLAW might read it), only the **Gateway** container maps the real `.env.gateway` file.
The internal agencies are given `.env.agencies`, which simply points them to `http://llm-gateway:4000` using placeholder keys. The Gateway validates the request, applies rate limits/budgets, and forwards it to the real provider.

### 4. The Unified Memory Bank (`cycos-memory`)

To ensure all isolated agencies share the exact same contextual awareness, a single physical Docker Volume (`cycos-memory`) is mounted to `/app/Memory` inside **every** container.

* *Note:* Because SQLite cannot handle high-concurrency writes, the memory bank must be managed carefully, eventually transitioning to a proper database container (like Postgres or Redis) within the cluster.

---

## Anatomy of an Agency

When adding a new Agency to CyCOS, follow this standard deployment package format:

**1. The Implementation (`main.py`)**  
A highly focused Python application that only contains the logic for that specific persona.

**2. The Dependencies (`requirements.txt`)**  
Only the packages explicitly needed by that agency. Do not install massive ML libraries on the `Strategic` agency if it only needs `requests` and `openai`.

**3. The Container Definition (`Dockerfile`)**  
A standard, minimal image definition. Example:

```dockerfile
# /Agencies/Strategic/Dockerfile
FROM python:3.11-alpine

WORKDIR /app

# Copy minimum dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Mount point for unified memory
VOLUME ["/app/Memory"]

# Copy Agency Logic
COPY . .

# Run the agency
CMD ["python", "main.py"]
```

## How to Start the System

The entire OS is managed from the root `c:\Docker Containment System\CyCOS` directory via Docker Compose.

```bash
# Build all agencies simultaneously
docker compose build

# Start the entire operating system in the background
docker compose up -d

# Check the logs of a specific agency
docker compose logs -f strategic

# Gracefully shut down the entire system
docker compose down
```
