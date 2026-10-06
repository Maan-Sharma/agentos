# AgentOS

AgentOS is organized as a Next.js frontend and a separate Fastify API service backed by PostgreSQL.

## Project layout

```text
app/                         Next.js routes and global styles
components/agentos/          App shell, shared UI, workflow canvas
features/agentos/            Screens and workspace data
lib/api/                     Frontend API client and endpoint functions
backend/                     Standalone Express API service
```

## Frontend

Run from the project root:

```sh
npm install
Copy-Item .env.example .env.local
npm run dev
```

The frontend runs on `http://localhost:3000`. API calls use `NEXT_PUBLIC_API_URL`, defaulting to `http://localhost:4000/api/v1`.

## Backend

Run from `backend/`:

```sh
npm install
Copy-Item .env.example .env
npm run dev
```

The API runs on `http://localhost:4000`. Configure `DATABASE_URL` in `backend/.env`, apply the Drizzle schema, and start the API. `GET /api/v1/agents` lists persisted agents and `POST /api/v1/agents` creates one. The home and agents screens use these API routes; set `NEXT_PUBLIC_API_URL` in the project-root `.env.local` if the backend uses a different URL.
