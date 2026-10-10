# AgentOS

> **The operating system for your company's AI workforce.**

AgentOS is a B2B SaaS platform for creating, connecting, managing, and monitoring AI agents from a single workspace.

Instead of AI agents scattered across scripts, APIs, servers, and platforms, AgentOS gives teams one control center for their entire AI workforce.

![Status](https://img.shields.io/badge/status-in%20development-orange)
![Next.js](https://img.shields.io/badge/Next.js-16-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## Vision

Companies are starting to deploy dozens or hundreds of AI agents across sales, support, engineering, operations, research, and internal workflows.

The problem is simple: **where do you manage all of them?**

AgentOS aims to be that control plane.

```text
             ┌──────────────────────┐
             │       AgentOS        │
             │   AI Workforce OS    │
             └──────────┬───────────┘
                        │
   ┌────────────────────┼────────────────────┐
   │                    │                    │
 Agents              Workflows            Insights
   │                    │                    │
   └────────────────────┼────────────────────┘
                        │
                 Agent Runtime
                        │
       ┌────────────────┼────────────────┐
       │                │                │
   AI Models          Tools         Customer APIs
```

## Core concepts

| Concept | What it is |
| --- | --- |
| **Agents** | Individual AI agents you create, configure, and manage |
| **Workflows** | Connected processes built from agents using a visual graph editor |
| **Insights** | Monitoring and analytics for your AI workforce |
| **Agent Runtime** | The layer that runs agents and communicates with models, tools, and customer APIs |

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | Next.js 16, React 18, TypeScript |
| Styling | Tailwind CSS 4 |
| Workflow graphs | React Flow (`@xyflow/react`) |
| Charts | Recharts |
| Icons | Lucide React |
| Authentication | Firebase Authentication and Firebase Admin SDK |
| Database | PostgreSQL 17 (via Docker Compose) |
| Backend | `backend/` service, intended to run at `http://localhost:4000/api/v1` |
| Tooling | ESLint, TypeScript, Docker Compose |

## Project structure

```text
agentos/
├── app/                  # Next.js App Router pages and API routes
├── backend/              # Backend API service
├── components/agentos/   # Reusable application UI components
├── components/auth/      # Authentication UI components
├── lib/api/              # API client helpers
├── lib/auth/             # Authentication context and server utilities
├── lib/firebase/         # Firebase client and Admin SDK setup
├── .env.example          # Example environment variables
├── docker-compose.yml    # Local database configuration
└── package.json
```

## Getting started

### Prerequisites

- Node.js 20 or newer
- npm
- A Firebase project for Google sign-in
- Docker, if you need the local PostgreSQL database

### 1. Clone the repository

```bash
git clone https://github.com/Maan-Sharma/agentos.git
cd agentos
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Copy the example environment file:

**Windows PowerShell**

```powershell
Copy-Item .env.example .env.local
```

**macOS / Linux**

```bash
cp .env.example .env.local
```

Configure the following values in `.env.local`:

| Variable | Description | Example |
| --- | --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL used by the frontend API client | `http://localhost:4000/api/v1` |
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase web API key | `your-firebase-api-key` |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase authentication domain | `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase project ID | `your-firebase-project-id` |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase web app ID | `your-firebase-app-id` |
| `FIREBASE_CLIENT_EMAIL` | Firebase Admin service-account email | `your-service-account-email` |
| `FIREBASE_PRIVATE_KEY` | Firebase Admin service-account private key | Keep this value secret |

#### Firebase setup

1. Create or open a project in the [Firebase Console](https://console.firebase.google.com/).
2. Add a web app and copy its Firebase configuration values into the `NEXT_PUBLIC_FIREBASE_*` variables.
3. In **Authentication → Sign-in method**, enable Google as a sign-in provider.
4. For server-side authentication, configure Firebase Admin SDK credentials using a service account. Set `FIREBASE_CLIENT_EMAIL` and `FIREBASE_PRIVATE_KEY` in `.env.local`.
5. Add your local development domain (`localhost`) to Firebase Authentication's authorized domains if it is not already listed.

Keep service-account credentials private. **Never commit `.env.local`, service-account JSON files, or real private keys to Git.** The Firebase Admin private key should be provided with escaped `\n` characters if required by the environment configuration.

The database configuration may also require `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB`, depending on your Docker Compose setup.

### 4. Start the database

```bash
docker compose up -d
```

This starts the PostgreSQL service configured in `docker-compose.yml`.

### 5. Start the backend

The backend service lives in the `backend/` folder. Follow its setup instructions and ensure it is available at the URL configured in `NEXT_PUBLIC_API_URL`.

### 6. Run the frontend

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Available scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the frontend development server |
| `npm run build` | Create a production build |
| `npm run start` | Run the production build |
| `npm run lint` | Lint the code with ESLint |
| `npm run typecheck` | Type-check the code with TypeScript |

If the `dev:all` script is available in your local branch, `npm run dev:all` starts both the frontend and backend development processes.

## Roadmap

- [x] Project scaffold (Next.js, Tailwind, Docker Compose)
- [x] Login and sign-up UI with email and Google authentication
- [ ] Agent creation and management
- [ ] Visual workflow builder
- [ ] Insights dashboard (usage, cost, run history)
- [ ] Support for open-weight models, including local models through Ollama
- [ ] Team workspaces and roles

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) first. In short: fork the repository, create a feature branch, and open a pull request linked to an issue.

## AI tools used

This project was built with help from AI tools.

- **Claude (Anthropic):** Documentation and project planning assistance.

Add any other AI coding assistants or models used for your contribution.

## License

Released under the [MIT License](LICENSE).

## Author

**Maan Sharma** · [@Maan-Sharma](https://github.com/Maan-Sharma)
