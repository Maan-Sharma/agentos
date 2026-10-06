# AgentOS backend

This is a separate Fastify API service backed by PostgreSQL and Drizzle ORM.

## Run locally

1. Copy `.env.example` to `.env`.
2. Install dependencies with `npm install`.
3. Start the API with `npm run dev`.

The API listens on `http://localhost:4000` by default. Set `DATABASE_URL` in `.env`; the frontend API client reads `NEXT_PUBLIC_API_URL` from the project-root `.env.local`.

## API routes

- `GET /api/v1/health` — confirms the API is running.
- `GET /api/v1/agents` — returns `{ "agents": [...] }` from PostgreSQL.
- `POST /api/v1/agents` — validates and stores an agent, returning `{ "agent": ... }`.

Keep database credentials in the backend environment, never in `NEXT_PUBLIC_*` variables.
