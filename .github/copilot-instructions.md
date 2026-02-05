# Struxt Copilot Instructions

## Project Overview

Struxt is a full-stack web application with a **React 19/Vite** frontend and **Node.js/Express** backend. Ideally run in a **Docker** environment with **MongoDB**, **Dragonfly** (Redis compatible), and **VictoriaMetrics**.

## Architecture & Tech Stack

### Frontend (`client/`)

- **Framework**: React 19, Vite, TypeScript.
- **UI Library**: Bootstrap 5 (customized in `client/src/bootstrap`), Sass.
- **Key Libraries**: `@monaco-editor/react` (Code Editor), `@grapesjs/studio-sdk` (Visual Builder).
- **PWA**: Configured via `vite-plugin-pwa`.
- **Pages**: Multi-page builds configured in `vite.config.ts` (`home`, `dashboard`, `editor`).

### Backend (`server/`)

- **Runtime**: Node.js, Express.
- **Database**: MongoDB (with `connect-mongodb-session`).
- **Queues**: BullMQ for background jobs (`server/routines/queue`).
- **Data**: VictoriaMetrics (time-series), Dragonfly (Process caching/Redis).
- **AI/LLM**: LangChain (`@langchain/*`), Google GenAI integration.
- **Auth**: Keycloak (`server/auth/setupKeycloak.ts`).
- **Entry**: `server/apiEntry.ts`.

### Shared (`common/`)

- Contains shared types, API definitions (`api.ts`), and utility logic.
- **Interfaces**: `Api` interface defines contract for endpoints.

## Developer Workflows

### Starting the Project

1. **Infrastructure & Backend**: Run `npm run docker` (uses `./docker.sh`).
   - This starts DBs, queues, and the backend server.
   - Wraps `docker compose` handling `docker-compose.dev.yml` vs `prod`.
2. **Frontend**: Run `npm run dev` (starts Vite dev server).
   - Proxies `/api`, `/auth`, `/assets`, `/screenshots` to the backend server (running in Docker, exposed on port 3000).

### Database & Migrations

- **Migrations**: Run `npm run migrate` (executes inside docker container).
- **Access**: MongoDB (27017), Dragonfly (6379), VictoriaMetrics (8428) exposed on localhost for manual inspection via tools like Compass/Redis GUI.

### Docker Optimization

- `copyDockerPackageJson.js`: Optimizes build by creating a stripped-down `package.json` for Docker layers (e.g., separating Puppeteer dependencies).

## Conventions & Patterns

### 1. Imports & Path Aliases

- Use path aliases: `common/*`, `server/*`, `client/*`.
- **Do not** import generic paths (e.g., `../../../common`).
- defined in `tsconfig.json` (server) and `vite.config.ts` (client).

### 2. API & Communication

- **REST**: Defined in `server/api/`. Endpoints protected via `protectEndpoint`.
- **WebSockets**: Socket.IO setup in `server/ws/setupWs.ts`.
- **Types**: Use `common/api/api.ts` `Api` interface to enforce contracts.

### 3. Error Handling

- Use `StructuredError` from `common/custom-error` for consistent error application responses.

### 4. Background Workers

- Place worker logic in `server/**/worker.ts` files.
- Imported in `server/apiEntry.ts` to ensure registration at startup.

### 5. Database Access

- **MongoDB**: Use helpers in `server/database/mongodb.ts`.
  - `getCollection<T>(name)`: Type-safe collection access using `CollectionNames`.
  - `getDb()`: Access the DB instance.
- **Dragonfly/Redis**: Use `server/database/dragonFly.ts`.
  - `getClient()`: Shared client instance.

## Testing

- **Runner**: Vitest.
- Run `npm test`.

## Detailed Coding Standards

For specific coding style, strict import rules, and component usage, refer to [`.github/instructions/project.instructions.md`](instructions/project.instructions.md).
