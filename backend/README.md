# AgentOS backend

Fastify API backed by PostgreSQL and Drizzle ORM.

## Local development

From the repository root, install the frontend dependencies, then install the backend dependencies:

```sh
npm install
cd backend
npm install
```

Create the backend environment file from the checked-in development template:

```sh
cp .env.example .env
```

On Windows PowerShell, use `Copy-Item .env.example .env`.

The local database uses the same credentials as `docker-compose.yml`:

```text
user:     agentos
password: agentos_dev_password
database: agentos
host:     localhost
port:     5432
```

Start PostgreSQL from the repository root with `docker compose up -d`, then run the migration workflow from `backend/`:

```sh
npm run db:generate
npm run db:migrate
```

`db:generate` creates a migration from schema changes. Review the generated SQL before committing it. `db:migrate` applies pending migrations. Start the API with `npm run dev` from `backend/`, or start the API and frontend together using `npm run dev:all` from the repository root.

The API listens on `http://localhost:4000`. The frontend API client defaults to `http://localhost:4000/api/v1`; the root `.env.example` documents the optional `NEXT_PUBLIC_API_URL` override.

## Environment variables

`src/config.ts` validates backend environment variables at startup and reports invalid field names without printing credentials. Required variables are `DATABASE_URL`; `PORT` and `CORS_ORIGIN` have local-development defaults. Optional variables for future integrations are documented in `.env.example`.

Never put database credentials or server-side API keys in `NEXT_PUBLIC_*` variables.

## Authentication

The API supports email/password signup and login, logout, session inspection, and optional Google OAuth. Sessions are held in an HttpOnly cookie; configure `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` and `GOOGLE_REDIRECT_URI` together to enable Google sign-in. The callback URL must match the redirect URI registered with Google.

Agent API routes require a valid session cookie and are scoped to the caller's current workspace.

## Backend tests

Tests use a separate PostgreSQL database. Create it and apply migrations before running the integration suite:

```sh
createdb -h localhost -U agentos agentos_test
```

Set `NODE_ENV=test` and `TEST_DATABASE_URL` to that test database's connection string, run `npm run db:migrate` with `DATABASE_URL` pointing to the same test database, then run `npm test`. Tests delete only the uniquely named users they create.

## Migration workflow

Run these commands from `backend/` after changing `src/db/schema.ts`:

```sh
npm run db:generate
npm run db:migrate
```

## API routes

- `GET /api/v1/health` — confirms the API is running.
- `GET /api/v1/agents` — returns `{ "agents": [...] }` from PostgreSQL.
- `GET /api/v1/agents?status=active&role=support` — lists agents in the signed-in workspace with optional validated filters. Status is derived from pause state and activity in the last 24 hours.
- `GET /api/v1/agents/:id` — returns one agent from the signed-in workspace.
- `POST /api/v1/agents` — validates and creates an agent with provider, model, role, instructions, and optional monthly budget.
- `PATCH /api/v1/agents/:id` — validates and updates agent configuration.
- `POST /api/v1/agents/:id/pause` and `POST /api/v1/agents/:id/resume` — control the person-managed pause state.
- `DELETE /api/v1/agents/:id` — deletes an agent; owners and admins only.

Agent create, update, pause, resume, and delete actions are written to `audit_logs`. Agent execution telemetry updates `lastActiveAt`; an agent is active only when it is not paused and has activity within the last 24 hours.
