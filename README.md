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

```
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
| Backend | `backend/` service, served at `http://localhost:4000/api/v1` |
| Tooling | ESLint, TypeScript, Docker Compose |

## Project structure

```
agentos/
├── app/                  # Next.js app router pages
├── backend/              # Backend API service
├── components/agentos/   # Reusable UI components
├── features/agentos/     # Feature modules
├── lib/api/              # API client helpers
├── .env.example          # Example environment variables
├── docker-compose.yml    # PostgreSQL 17 for local development
└── package.json
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

```bash
npm install
```

### 3. Set up environment variables

Copy the example file and fill in your own values:

```bash
# macOS / Linux
cp .env.example .env.local

# Windows (PowerShell)
Copy-Item .env.example .env.local
```

| Variable | Description | Example |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL the frontend uses to reach the backend | `http://localhost:4000/api/v1` |

The database container also reads `POSTGRES_USER`, `POSTGRES_PASSWORD` and `POSTGRES_DB`. Set these in your environment or a `.env` file before starting Docker. Never commit real secrets.

### 4. Start the database

```bash
docker compose up -d
```

This starts PostgreSQL 17 on port `5432`.

### 5. Start the backend

The backend service lives in the `backend/` folder and should run on port `4000`. See that folder for its own setup steps.

### 6. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint the code with ESLint |
| `npm run typecheck` | Type-check with TypeScript |

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
