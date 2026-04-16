# HelloWorld

Hardware metrics API for Raspberry Pi.

## Service

- `metrics-api` (Node.js 20): reads host hardware metrics from mounted `/proc` and `/sys` and exposes:
  - `GET /health` → `{"status": "ok"}`
  - `GET /metrics` → JSON metrics object

## Run with Docker

```bash
docker compose up --build
```

Then test endpoints:

```bash
curl http://localhost:8000/health
curl http://localhost:8000/metrics
```

## Run Locally

```bash
npm install
npm start
```

## Tests

```bash
npm test
```

## Security

- Container runs as non-root user (`appuser`)
- `read_only: true` filesystem
- All capabilities dropped (`cap_drop: [ALL]`)
- Host `/proc` and `/sys` mounted read-only
- Environment variables for path configuration:
  - `PROC_ROOT` (default: `/proc`)
  - `SYS_ROOT` (default: `/sys`)
  - `API_HOST` (default: `0.0.0.0`)
  - `API_PORT` (default: `8000`)
