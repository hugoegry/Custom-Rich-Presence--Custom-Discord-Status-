"""Auth locale pour l API Flask (token + host check)."""

from __future__ import annotations

import json
import logging
import secrets
from typing import Any

from flask import Request

from branding import APP_CODE_NAME
from paths import RUNTIME_PATH

log = logging.getLogger(f"{APP_CODE_NAME}.security")

_TOKEN = ""
_PORT = 0


def get_token() -> str:
    return _TOKEN


def get_bound_port() -> int:
    return _PORT


def init_runtime(port: int) -> str:
    """Genere le token session et ecrit .local_session (dev Vite + lock info)."""
    global _TOKEN, _PORT
    _TOKEN = secrets.token_urlsafe(32)
    _PORT = port
    payload = {"token": _TOKEN, "port": port}
    try:
        RUNTIME_PATH.parent.mkdir(parents=True, exist_ok=True)
        RUNTIME_PATH.write_text(json.dumps(payload), encoding="utf-8")
    except OSError as exc:
        log.warning("Impossible d ecrire le runtime session: %s", exc)
    return _TOKEN


def clear_runtime_file() -> None:
    try:
        if RUNTIME_PATH.exists():
            RUNTIME_PATH.unlink()
    except OSError as exc:
        log.warning("Impossible de supprimer le runtime session: %s", exc)


def read_runtime_file() -> dict[str, Any] | None:
    if not RUNTIME_PATH.exists():
        return None
    try:
        data = json.loads(RUNTIME_PATH.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else None
    except (OSError, json.JSONDecodeError) as exc:
        log.warning("Runtime session illisible: %s", exc)
        return None


def request_token(req: Request) -> str:
    header = (req.headers.get("X-App-Token") or "").strip()
    if header:
        return header
    return (req.args.get("t") or "").strip()


def host_allowed(req: Request, port: int) -> bool:
    host = (req.host or "").split("%")[0].strip().lower()
    allowed = {f"127.0.0.1:{port}", f"localhost:{port}", "127.0.0.1", "localhost"}
    return host in allowed


def api_authorized(req: Request, port: int) -> bool:
    if not _TOKEN:
        return False
    if not host_allowed(req, port):
        return False
    return secrets.compare_digest(request_token(req), _TOKEN)


def inject_token_into_html(html: str) -> str:
    snippet = f"<script>window.__APP_TOKEN__={json.dumps(_TOKEN)};</script>"
    if "</head>" in html:
        return html.replace("</head>", f"{snippet}</head>", 1)
    return snippet + html