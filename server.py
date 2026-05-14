from __future__ import annotations

import json
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse

from backend.aiml.weather_engine import WeatherEnsemble


ROOT = Path(__file__).resolve().parent
FRONTEND_DIR = ROOT / "frontend"
ENGINE = WeatherEnsemble()
APP_VERSION = os.environ.get("APP_VERSION", "1.0.0")


class WeatherRequestHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(FRONTEND_DIR), **kwargs)

    def do_GET(self):  # noqa: N802 - stdlib handler API
        parsed = urlparse(self.path)
        if parsed.path == "/api/health":
            self._send_json(
                {
                    "ok": True,
                    "service": "WeatherML",
                    "version": APP_VERSION,
                    "frontend": FRONTEND_DIR.name,
                    "engine": "WeatherEnsemble-v2",
                },
            )
            return

        if parsed.path == "/api/predict":
            params = parse_qs(parsed.query)
            city = params.get("city", ["Hyderabad"])[0]
            try:
                self._send_json(ENGINE.predict(city))
            except ValueError as exc:
                self._send_json({"error": True, "message": str(exc)}, status=404)
            except Exception as exc:  # Keep the API stable for the browser app.
                self._send_json({"error": True, "message": f"Prediction service error: {exc}"}, status=502)
            return

        if parsed.path == "/api/search":
            params = parse_qs(parsed.query)
            query = params.get("q", [""])[0]
            try:
                self._send_json({"results": ENGINE.search_locations(query)})
            except Exception as exc:
                self._send_json({"results": [], "error": True, "message": str(exc)}, status=502)
            return

        if parsed.path == "/api/model-registry":
            registry = ENGINE.model_registry()
            if registry:
                self._send_json(registry)
            else:
                self._send_json(
                    {
                        "available": False,
                        "message": "Run python3 backend/aiml/training_pipeline.py to generate historical model metrics.",
                    },
                    status=404,
                )
            return

        if parsed.path == "/":
            self.path = "/index.html"

        super().do_GET()

    def end_headers(self):
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "strict-origin-when-cross-origin")
        self.send_header("Permissions-Policy", "geolocation=(), microphone=(), camera=()")
        super().end_headers()

    def guess_type(self, path):
        if path.endswith(".webmanifest"):
            return "application/manifest+json"
        return super().guess_type(path)

    def _send_json(self, payload: dict, status: int = 200):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def run(host: str = "127.0.0.1", port: int = 4173):
    server = ThreadingHTTPServer((host, port), WeatherRequestHandler)
    print(f"WeatherML running at http://{host}:{port}")
    print("AIML API endpoint: /api/predict?city=Hyderabad")
    server.serve_forever()


if __name__ == "__main__":
    run(
        host=os.environ.get("HOST", "127.0.0.1"),
        port=int(os.environ.get("PORT", "4173")),
    )
