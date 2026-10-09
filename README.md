# AgentOS

> **The operating system for your company's AI workforce.**

AgentOS is a B2B SaaS platform for creating, connecting, managing and monitoring AI agents from a single workspace.

Instead of AI agents scattered across scripts, APIs, servers and platforms, AgentOS gives teams one control center for their entire AI workforce.

![Status](https://img.shields.io/badge/status-in%20development-orange)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Vision

Companies are starting to deploy dozens or hundreds of AI agents across sales, support, engineering, operations, research and internal workflows.

The problem is simple: **where do you manage all of them?**

AgentOS aims to be that control plane.

```text
             +----------------------+
             |       AgentOS        |
             |   AI Workforce OS    |
             +----------+-----------+
                        |
   +--------------------+--------------------+
   |                    |                    |
Agents              Workflows           Insights
   |                    |                    |
   +--------------------+--------------------+
                        |
                 Agent Runtime
                        |
       +----------------+----------------+
       |                |                |
    AI Models         Tools          Customer APIs
```

## Core concepts

| Concept | What it is |
| --- | --- |
| **Agents** | Individual AI agents you create, configure and manage |
| **Workflows** | Connected, coordinated processes built from agents (visual graph editor) |
| **Insights** | Monitoring and analytics for your AI workforce |
| **Agent Runtime** | The layer that runs agents and talks to models, tools and customer APIs |

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 18, TypeScript |
| Styling | Tailwind CSS 4 |
| Workflow graphs | React Flow (`@xyflow/react`) |
| Charts | Recharts |
| Icons | Lucide React |
| Database | PostgreSQL 17 (via Docker Compose) |
| Backend | Fastify 5, Drizzle ORM, Zod |
| Tooling | ESLint, TypeScript, Docker Compose |

## Project structure

```text
agentos/
|-- app/                  # Next.js app router pages
|-- backend/              # Fastify API service
|-- components/agentos/   # Reusable UI components
|-- features/agentos/     # Feature modules
|-- lib/api/              # API client helpers
|-- .env.example          # Frontend environment template
|-- docker-compose.yml    # PostgreSQL 17 for local development
`-- package.json
```

## Getting started

### Prerequisites

- Node.js 20 or newer
- npm
- Docker (for the local PostgreSQL database)

### 1. Clone the repository

```bash
git clone https://github.com/Maan-Sharma/agentos.git
cd agentos
```

### 2. Install dependencies

Install the frontend and backend packages:

```bash
npm install
cd backend
npm install
```

### 3. Set up environment variables

From `backend/`, create the backend environment file:

```powershell
Copy-Item .env.example .env
```

On macOS/Linux, use `cp .env.example .env`.

The backend template uses the same development PostgreSQL credentials configured in `docker-compose.yml`:

| Variable | Local development value |
| --- | --- |
| `DATABASE_URL` | `postgresql://agentos:agentos_dev_password@localhost:5432/agentos` |
| `PORT` | `4000` |
| `CORS_ORIGIN` | `http://localhost:3000` |

The root `.env.example` documents the optional frontend `NEXT_PUBLIC_API_URL` override. Copy it to `.env.local` only if you need to change the default API URL.

Never commit real secrets or use the development database credentials in production.

### 4. Start the database and apply migrations

From the repository root:

```bash
docker compose up -d
cd backend
npm run db:migrate
cd ..
```

After changing `backend/src/db/schema.ts`, create a migration with `npm run db:generate`, review the generated SQL, then apply it with `npm run db:migrate`.

### 5. Run the applications

From the repository root:

```bash
npm run dev:all
```

This starts Docker Compose, the backend API and the frontend. Open [http://localhost:3000](http://localhost:3000); the API health endpoint is [http://localhost:4000/api/v1/health](http://localhost:4000/api/v1/health).

To run only the frontend, use `npm run dev` at the repository root. To run only the backend, use `npm run dev` from `backend/` after starting PostgreSQL.

## Available scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the frontend development server |
| `npm run dev:all` | Start Docker Compose, the backend and the frontend |
| `npm run build` | Create a production frontend build |
| `npm run start` | Run the production frontend build |
| `npm run lint` | Lint the frontend code with ESLint |
| `npm run typecheck` | Type-check the frontend with TypeScript |

Backend commands are run from `backend/`: `npm run dev`, `npm run typecheck`, `npm run db:generate` and `npm run db:migrate`.

## Roadmap

- [x] Project scaffold (Next.js, Tailwind, Docker Compose)
- [ ] Login and sign-up with email and Google (see the open issue)
- [ ] Agent creation and management
- [ ] Visual workflow builder
- [ ] Insights dashboard (usage, cost, run history)
- [ ] Support for open-weight models (for example, running agents on a local model through Ollama)
- [ ] Team workspaces and roles

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) first. In short: **fork the repo, create your own branch, and open a pull request** linked to an issue.

## AI tools used

This project was built with help from AI tools:

- **Claude (Anthropic)**: documentation and project planning help (README, CONTRIBUTING, issue drafting)
- _Add any other AI coding assistants or models you used here._

## License

Released under the [MIT License](LICENSE).

## Author

**Maan Sharma** · [@Maan-Sharma](https://github.com/Maan-Sharma)
