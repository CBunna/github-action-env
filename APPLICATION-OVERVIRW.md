# Application Overview

A small full-stack Node.js app: an Express REST API backed by MongoDB, serving a static HTML/CSS/JS frontend from the same process (no frontend build step — no React/Vite/webpack, just plain files). Single deployable unit, single Docker image, single port (3000).

## Tech Stack

- **Runtime:** Node 18 (Dockerfile pins `node:18-alpine`)
- **Backend:** Express 4, MongoDB driver 6.x, dotenv
- **Frontend:** vanilla HTML/CSS/JS, no bundler — served via `express.static`
- **Tests:** Vitest + Supertest (integration tests that hit a real MongoDB, not mocked)
- **Lint:** ESLint 9 flat config (backend only — see gaps below)
- **DB:** MongoDB (local container for dev, Atlas via split creds for "prod"-style testing)

## Repo Layout

\```
backend/    server.js, db.js, package.json, tests, node_modules, .env (local only)
frontend/   index.html, app.js, style.css — static, no build
Dockerfile  single image, copies backend/ and frontend/ as siblings
docker-compose.yaml   app + mongo, for local dev only
.github/workflows/    deployment.yml, matrix.yaml (existing, partial CI)
\```

## Build

- **Install:** `npm ci` inside `backend/` (package-lock.json present, so `ci` not `install`)
- No frontend build step — `frontend/` is copied into the image as-is
- **Docker:** `docker build .` from repo root — produces one image containing both

## Test

- `npm test` (vitest) in `backend/` — needs a reachable MongoDB, either via `MONGODB_URI` or split `MONGODB_USERNAME`/`MONGODB_PASSWORD`/`MONGODB_CLUSTER_ADDRESS`
- `npm run lint` in `backend/`
- Smoke check pattern already used: start server, sleep, `curl --fail /health`

## Config / Secrets a Pipeline Needs to Inject

| Var | Purpose |
|---|---|
| `MONGODB_URI` or `MONGODB_USERNAME`+`MONGODB_PASSWORD`+`MONGODB_CLUSTER_ADDRESS` | DB connection |
| `MONGODB_DB_NAME` | defaults to `practice-db` |
| `PORT` | defaults to `3000` |
| `NODE_ENV` | set to `test` to disable autostart during test runs |

None of these are baked into the image — all expected at runtime via environment.

## Runtime Contract

- Listens on `PORT` (default `3000`)
- `GET /health` → `{status, database}`, `500` if DB unreachable — usable as a container/LB health check
- Stateless process; all persistence is in MongoDB, not the container
\```