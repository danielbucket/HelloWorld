# HelloWorld
Systems hardware status interface.

## Services

- `metrics-api` (Python): reads host hardware metrics from mounted `/proc` and `/sys` and exposes:
  - `GET /health`
  - `GET /metrics`
- `express-server` (Node/Express): proxies metrics to:
  - `GET /health`
  - `GET /api/hardware-status`

## Run with Docker

```bash
docker compose up --build
```

Then open:

- `http://localhost:3000/health`
- `http://localhost:3000/api/hardware-status`

## Secure host metric access

- The Python container mounts host paths read-only:
  - `/proc:/host/proc:ro`
  - `/sys:/host/sys:ro`
- Both containers are hardened with:
  - non-root users
  - `read_only: true`
  - `cap_drop: [ALL]`
  - `no-new-privileges:true`
  - `pids_limit`
