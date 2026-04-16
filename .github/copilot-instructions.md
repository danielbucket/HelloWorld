# Copilot Instructions for HelloWorld

## Architecture Overview

**HelloWorld** is a lightweight hardware metrics API built in Node.js 20:

- Reads host `/proc` and `/sys` filesystems mounted read-only
- Exposes two endpoints:
  - `GET /health` → `{"status": "ok"}`
  - `GET /metrics` → JSON with `{timestamp_epoch, memory, load_average, uptime_seconds, cpu_temperature_celsius}`
- Runs in hardened Docker container as non-root user with all capabilities dropped
- ES modules (import/export syntax)
- No external dependencies; uses Node.js built-in `http`, `fs`, `path` modules

## Development Workflow

**Run locally:**
```bash
npm install
npm start
```
Listens on `http://localhost:8000`

**Run in Docker:**
```bash
docker compose up --build
```

**Test:**
```bash
npm test
```
Uses Node.js built-in test runner; tests import `requestHandler` function and mock HTTP requests.

## Code Patterns & Conventions

**app.js structure:**
- `readText(filePath)`: Reads file with UTF-8 encoding, throws `MetricsError` on failure
- Helper functions for each metric: `memoryInfo()`, `loadAverage()`, `uptimeSeconds()`, `cpuTemperatureCelsius()`
- `getMetrics()`: Aggregates all helpers into single object; called by request handler
- `requestHandler(req, res)`: Core HTTP handler, checks method, routes by URL, catches errors
- `respondJson(res, status, payload)`: Sends JSON with proper headers and Content-Length
- `start()`: Creates and starts HTTP server; logs startup message
- `import.meta.url` check enables module to be imported without side effects

### Metrics Parsing Details

- **`memoryInfo()`**: Reads `/proc/meminfo`, parses key-value pairs (colon-separated), extracts `MemTotal` and `MemAvailable` integers, calculates `used_kib = max(total - available, 0)`. Returns object with `total_kib`, `available_kib`, `used_kib`.
- **`loadAverage()`**: Reads `/proc/loadavg`, splits on whitespace, extracts first 3 as floats for 1m/5m/15m. Returns object with keys `'1m'`, `'5m'`, `'15m'`.
- **`uptimeSeconds()`**: Reads `/proc/uptime`, splits on whitespace, returns first value as float.
- **`cpuTemperatureCelsius()`**: Reads `/sys/class/thermal/thermal_zone0/temp`. Returns `null` if file doesn't exist (not all boards have thermal sensors). Otherwise parses as integer (millidegrees), divides by 1000, rounds to 2 decimals.

### HTTP Handler (`requestHandler`)
- `GET /health` → `200 {"status": "ok"}`
- `GET /metrics` → `200 {timestamp_epoch, memory, load_average, uptime_seconds, cpu_temperature_celsius}` or `500` on metrics error
- `GET /*` → `404 {"error": "not_found"}`
- Non-GET methods → `405 {"error": "method_not_allowed"}`
- All responses: `Content-Type: application/json` and correct `Content-Length`
- Metrics errors caught and returned with error details

**Environment Configuration:**
- `PROC_ROOT` (default `/proc`): Path to /proc filesystem (useful for testing)
- `SYS_ROOT` (default `/sys`): Path to /sys filesystem
- `API_HOST` (default `0.0.0.0`): Server bind address
- `API_PORT` (default `8000`): Server port
- Passed to container via Dockerfile or docker-compose

**docker-compose.yml:**
- Single service; read-only filesystem, dropped capabilities, pids limit
- Mounts: `/proc:/host/proc:ro`, `/sys:/host/sys:ro`
- Port 8000 exposed

## When Making Changes

- **Adding metrics**: Create new helper function parsing `/proc` or `/sys`, add to `getMetrics()` object, add test
- **Adding routes**: Add new URL check in `requestHandler`, use `respondJson()` for responses
- **Changing error responses**: Update relevant error objects; maintain `{error: 'error_code', details?: string}` shape
- **Testing**: Export functions needed for tests; tests import `requestHandler` and mock HTTP with dynamic ports
