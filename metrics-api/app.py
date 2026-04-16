import json
import os
import time
from http.server import BaseHTTPRequestHandler, HTTPServer


PROC_ROOT = os.getenv("PROC_ROOT", "/proc")
SYS_ROOT = os.getenv("SYS_ROOT", "/sys")
API_HOST = os.getenv("API_HOST", "0.0.0.0")
API_PORT = int(os.getenv("API_PORT", "8000"))


class MetricsError(Exception):
    pass


def _read_text(path: str) -> str:
    with open(path, "r", encoding="utf-8") as file:
        return file.read().strip()


def _memory_info() -> dict:
    meminfo = _read_text(os.path.join(PROC_ROOT, "meminfo"))
    values = {}
    for line in meminfo.splitlines():
        key, rest = line.split(":", 1)
        values[key] = int(rest.strip().split()[0])

    total_kib = values.get("MemTotal")
    available_kib = values.get("MemAvailable")
    if total_kib is None or available_kib is None:
        raise MetricsError("MemTotal or MemAvailable missing from meminfo")

    used_kib = max(total_kib - available_kib, 0)
    return {
        "total_kib": total_kib,
        "available_kib": available_kib,
        "used_kib": used_kib,
    }


def _load_average() -> dict:
    loadavg = _read_text(os.path.join(PROC_ROOT, "loadavg")).split()
    if len(loadavg) < 3:
        raise MetricsError("Unexpected loadavg format")

    return {
        "1m": float(loadavg[0]),
        "5m": float(loadavg[1]),
        "15m": float(loadavg[2]),
    }


def _uptime_seconds() -> float:
    uptime = _read_text(os.path.join(PROC_ROOT, "uptime")).split()
    if not uptime:
        raise MetricsError("Unexpected uptime format")
    return float(uptime[0])


def _cpu_temperature_celsius() -> float | None:
    thermal_path = os.path.join(SYS_ROOT, "class", "thermal", "thermal_zone0", "temp")
    if not os.path.exists(thermal_path):
        return None

    raw = _read_text(thermal_path)
    return round(int(raw) / 1000.0, 2)


def get_metrics() -> dict:
    return {
        "timestamp_epoch": int(time.time()),
        "memory": _memory_info(),
        "load_average": _load_average(),
        "uptime_seconds": _uptime_seconds(),
        "cpu_temperature_celsius": _cpu_temperature_celsius(),
    }


class MetricsHandler(BaseHTTPRequestHandler):
    def _respond_json(self, status: int, payload: dict):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/health":
            self._respond_json(200, {"status": "ok"})
            return

        if self.path == "/metrics":
            try:
                self._respond_json(200, get_metrics())
            except Exception as exc:  # pragma: no cover
                self._respond_json(500, {"error": "failed_to_collect_metrics", "details": str(exc)})
            return

        self._respond_json(404, {"error": "not_found"})

    def log_message(self, fmt: str, *args):
        """Silence default BaseHTTPRequestHandler request logging."""
        return


def run() -> None:
    server = HTTPServer((API_HOST, API_PORT), MetricsHandler)
    print(f"metrics api listening on {API_HOST}:{API_PORT}")
    server.serve_forever()


if __name__ == "__main__":
    run()
