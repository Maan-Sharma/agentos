# AgentOS

> **The operating system for your company's AI workforce.**

AgentOS is a B2B SaaS platform for creating, connecting, managing, and monitoring AI agents from a single workspace.

Instead of having AI agents scattered across different scripts, APIs, servers, and platforms, AgentOS provides one control center for managing the entire AI workforce.

---

## 🚀 Vision

Companies are starting to deploy dozens or hundreds of AI agents across sales, support, engineering, operations, research, and internal workflows.

The problem is simple:

**Where do you manage all of them?**

AgentOS aims to become that control plane.

```text
                    ┌──────────────────────┐
                    │       AgentOS        │
                    │   AI Workforce OS    │
                    └──────────┬───────────┘
                               │
          ┌────────────────────┼────────────────────┐
          │                    │                    │
       Agents              Workflows           Insights
          │                    │                    │
          └────────────────────┼────────────────────┘
                               │
                        Agent Runtime
                               │
              ┌────────────────┼────────────────┐
              │                │                │
           AI Models         Tools          Customer APIs
```

## Local development

Requirements: Node.js, npm, and Docker Compose.

Install the root frontend and backend dependencies:

```sh
npm install
cd backend
npm install
Copy-Item .env.example .env
cd ..
```

On macOS/Linux, replace `Copy-Item .env.example .env` with `cp .env.example .env`.

Start PostgreSQL, apply the database migrations, and run both applications:

```sh
docker compose up -d
cd backend
npm run db:migrate
cd ..
npm run dev:all
```

The dashboard is at `http://localhost:3000`; the API health endpoint is `http://localhost:4000/api/v1/health`. The development database credentials in `backend/.env.example` match the PostgreSQL service in `docker-compose.yml`. Do not use these development credentials in production.
