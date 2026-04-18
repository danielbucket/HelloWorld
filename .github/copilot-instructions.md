# Copilot Instructions for HelloWorld

## Architecture Overview

**HelloWorld** is a secured hardware metrics API built with Express.js on Node.js 20:

- **Express.js application** (`src/app/`) with modular architecture
- Reads host `/proc` and `/sys` filesystems mounted read-only
- **Two main endpoints:**
  - `GET /metrics/health` → `{"status": "ok"}`
  - `GET /metrics` → JSON with `{timestamp_epoch, memory, load_average, uptime_seconds, cpu_temperature_celsius}`
- **Security layers:**
  - JWT token authentication (`authMiddleware.verifyToken`)
  - Token issuance with origin validation (`authMiddleware.issueToken`)
  - Rate limiting (100 requests per 15 minutes)
- Runs in hardened Docker container as non-root user with all capabilities dropped
- CommonJS and ES modules mixed (see patterns below)

## Directory Structure

```
src/app/
  ├── app.js                 # Express app setup, middleware, routing
  ├── router.js              # Metrics routes (health, system_metrics)
  ├── controllers/
  │   ├── index.js           # Exports all controllers
  │   └── GET/system_metrics.js  # GET /metrics handler
  ├── middleware/
  │   └── authMiddleware.js  # JWT verification and token issuance
  └── optimization/
      └── rateLimiter.js     # Express rate limiter configuration
server.js                    # Entry point, handles startup logic
```

## Development Workflow

**Run locally:**
```bash
npm install
npm start
```
Listens on `http://localhost:8000`

**Run in development with auto-reload:**
```bash
npm run dev
```
Uses nodemon to watch for changes.

**Run in Docker:**
```bash
docker compose up --build
```

**Test:**
```bash
npm test
```
Uses Node.js built-in test runner. Tests import Express app and make HTTP requests.

## Code Patterns & Conventions

### Entry Point (server.js)
- Imports Express app from `src/app/app.js`
- Handles environment configuration: `API_PORT`, `API_HOST`, `PROC_ROOT`, `SYS_ROOT`
- Uses `import.meta.url` check to prevent auto-startup when imported as module
- Graceful shutdown: listens for `SIGTERM` signal and closes server cleanly

### Express Application (src/app/app.js)
- **Order matters:** Rate limiter → JSON middleware → routes → catch-all 404
- Rate limiting applied globally before routes
- Authentication middleware applied per-route (only on `/metrics` endpoints)
- Catch-all handler at end: `app.all('*', ...)` for undefined routes

### Middleware (src/app/middleware/authMiddleware.js)
- **Token verification:**
  - Checks for `Authorization: Bearer <token>` header
  - Validates JWT signature using `jwtSecret` from config
  - Checks token expiration (`decoded.exp * 1000 < Date.now()`)
  - Validates `read:metrics` permission in token
- **Token issuance:**
  - Validates request `origin` header matches `originURL` config
  - Requires `permissions` in request body
  - Issues 30-day JWT tokens
- Error responses: `401 {error: 'missing_token'|'invalid_token'|'token_expired'}`, `403 {error: 'insufficient_permissions'|'invalid_origin'}`

### Rate Limiting (src/app/optimization/rateLimiter.js)
- 15-minute window, 100 requests per IP
- Returns `429` Too Many Requests if limit exceeded
- Sends standard `RateLimit-*` headers (not legacy `x-RateLimit-*`)

### Controllers (src/app/controllers/)
- Folder structure: `GET/`, `POST/` (etc.) containing handlers
- Each handler receives `(req, res)` and handles its own responses
- Exported from `index.js` for clean imports: `const { GET } = require('./controllers')`

### Routing (src/app/router.js)
- Uses Express Router for `/metrics` namespace
- `/metrics/health` → Health check (no auth required)
- `/metrics` → System metrics (auth required)
- Auth middleware applied at app level for `/metrics` routes

## Key Integration Points

- **Authentication:** All `/metrics` requests require valid JWT with `read:metrics` permission
- **Token workflow:**
  1. Client calls `POST /auth` with `origin` header and `{permissions}` body
  2. Server validates origin, issues JWT
  3. Client includes `Authorization: Bearer <token>` on subsequent requests
  4. Server validates token before returning metrics
- **Rate limiting:** Applied before authentication; limits by IP address
- **Error propagation:** Controllers should catch metric collection errors and respond with `500 {error: 'error_code', details: '...'}`

## When Making Changes

- **Adding metrics:** Update `/metrics` handler in `controllers/GET/system_metrics.js`; add test case
- **Adding routes:** Add to `router.js`, create controller in appropriate `controllers/` folder, apply auth middleware if needed
- **Changing authentication:** Update `middleware/authMiddleware.js`, ensure token structure matches (must include `permissions` array)
- **Security updates:** Keep JWT secret in config, never commit to git; update Node/Express base images in Dockerfile
- **Module imports:** Be consistent with CommonJS (`require`/`module.exports`) vs ES modules (`import`/`export`) within files
