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

## Migration workflow

Run these commands from `backend/` after changing `src/db/schema.ts`:

```sh
npm run db:generate
npm run db:migrate
```

## API routes

- `GET /api/v1/health` — confirms the API is running.
- `GET /api/v1/agents` — returns `{ "agents": [...] }` from PostgreSQL.
- `POST /api/v1/agents` — validates and stores an agent, returning `{ "agent": ... }`.
