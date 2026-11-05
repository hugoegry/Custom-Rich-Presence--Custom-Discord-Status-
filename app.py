from __future__ import annotations

import atexit
import json
import logging
import threading
from typing import Any

from flask import Flask, Response, jsonify, request, send_from_directory

from branding import APP_CODE_NAME, APP_DISPLAY_NAME
from instance_lock import acquire_lock, existing_instance, release_lock
from local_security import api_authorized, clear_runtime_file, get_bound_port, get_token, init_runtime, inject_token_into_html
from paths import CONFIG_PATH, DIST_DIR, HOST, PORT, PRESETS_PATH, app_url, legacy_data_dirs, pick_free_port
from rpc_client import ACTIVITY_MAP, RpcClient
from startup_win import is_launch_at_startup, set_launch_at_startup

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger(f"{APP_CODE_NAME}.app")

rpc = RpcClient()
app = Flask(__name__, static_folder=str(DIST_DIR), static_url_path="")

# Rempli au demarrage serveur
_bound_port = PORT


def load_json(path, default):
    if not path.exists():
        return default
    try:
        with path.open("r", encoding="utf-8") as f:
            return json.load(f)
    except (OSError, json.JSONDecodeError) as exc:
        log.warning("Lecture JSON echouee (%s): %s", path, exc)
        return default


def save_json(path, data) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def _legacy_file_useful(name: str, path) -> bool:
    data = load_json(path, None)
    if data is None:
        return False
    if name == "presets.json":
        return isinstance(data, list) and len(data) > 0
    if name == "config.json":
        if not isinstance(data, dict):
            return False
        return bool(data.get("client_id") or data.get("last_presence") or data.get("launch_at_startup") or data.get("auto_apply_on_launch"))
    return False


def migrate_legacy_user_files() -> None:
    for name, dest in (("presets.json", PRESETS_PATH), ("config.json", CONFIG_PATH)):
        if dest.exists():
            continue
        for folder in legacy_data_dirs():
            src = folder / name
            try:
                if src.resolve() == dest.resolve():
                    continue
            except OSError as exc:
                log.warning("Resolve legacy path echoue (%s): %s", src, exc)
                continue
            if not _legacy_file_useful(name, src):
                continue
            try:
                save_json(dest, load_json(src, {} if name == "config.json" else []))
                log.info("Migration legacy %s -> %s", src, dest)
                break
            except OSError as exc:
                log.warning("Migration legacy echouee (%s): %s", src, exc)
                continue


def ensure_user_files() -> None:
    migrate_legacy_user_files()
    if not PRESETS_PATH.exists():
        save_json(PRESETS_PATH, [])
    if not CONFIG_PATH.exists():
        save_config({
            "client_id": "",
            "launch_at_startup": False,
            "auto_apply_on_launch": False,
            "last_presence": None,
        })


def get_config() -> dict[str, Any]:
    cfg = load_json(CONFIG_PATH, {})
    if not isinstance(cfg, dict):
        cfg = {}
    cfg.setdefault("client_id", "")
    cfg.setdefault("launch_at_startup", False)
    cfg.setdefault("auto_apply_on_launch", False)
    cfg.setdefault("last_presence", None)
    return cfg


def save_config(cfg: dict[str, Any]) -> None:
    save_json(CONFIG_PATH, cfg)


def _json_error(message: str, status: int):
    return jsonify({"ok": False, "error": message}), status


@app.before_request
def _guard_api():
    if not request.path.startswith("/api/"):
        return None
    port = get_bound_port() or _bound_port
    if not api_authorized(request, port):
        log.warning("API refusee (%s %s)", request.method, request.path)
        return _json_error("Non autorise", 401)
    return None


def _serve_index():
    index_path = DIST_DIR / "index.html"
    if not index_path.exists():
        return ("Build manquant. Lance: cd frontend && npm run build", 503)
    html = index_path.read_text(encoding="utf-8")
    return Response(inject_token_into_html(html), mimetype="text/html")


@app.get("/")
def index():
    return _serve_index()


@app.get("/api/bootstrap")
def bootstrap():
    config = get_config()
    presets = load_json(PRESETS_PATH, [])
    startup_on = is_launch_at_startup()
    if bool(config.get("launch_at_startup")) != startup_on:
        config["launch_at_startup"] = startup_on
        save_config(config)
    return jsonify({
        "ok": True,
        "client_id": config.get("client_id", ""),
        "presets": presets,
        "activity_types": list(ACTIVITY_MAP.keys()),
        "connected": rpc.connected,
        "launch_at_startup": startup_on,
        "auto_apply_on_launch": bool(config.get("auto_apply_on_launch")),
    })


@app.post("/api/update")
def update():
    data = request.get_json(silent=True) or {}
    client_id = str(data.get("client_id") or "").strip()
    try:
        if not rpc.connected:
            if not client_id:
                return _json_error("Client ID manquant", 400)
            rpc.connect(client_id)
        cfg = get_config()
        if client_id:
            cfg["client_id"] = client_id
        presence = dict(data)
        presence.pop("client_id", None)
        cfg["last_presence"] = presence
        save_config(cfg)
        rpc.update(data)
        return jsonify({"ok": True, "connected": True})
    except Exception as exc:
        log.exception("Update presence echoue")
        return _json_error(str(exc), 500)


@app.post("/api/disconnect")
def disconnect():
    try:
        rpc.close()
        return jsonify({"ok": True, "connected": False})
    except Exception as exc:
        log.exception("Disconnect echoue")
        return _json_error(str(exc), 500)


@app.post("/api/presets")
def save_preset():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name") or "").strip()
    if not name:
        return _json_error("Nom de preset manquant", 400)
    presets = load_json(PRESETS_PATH, [])
    old_name = str(data.get("old_name") or "").strip()
    if old_name and old_name != name:
        presets = [p for p in presets if p.get("name") != old_name]
    presets = [p for p in presets if p.get("name") != name]
    payload = dict(data)
    payload.pop("old_name", None)
    payload["name"] = name
    presets.append(payload)
    save_json(PRESETS_PATH, presets)
    return jsonify({"ok": True, "presets": presets})


@app.delete("/api/presets")
def delete_preset():
    data = request.get_json(silent=True) or {}
    name = str(data.get("name") or "").strip()
    if not name:
        return _json_error("Nom de preset manquant", 400)
    presets = load_json(PRESETS_PATH, [])
    next_presets = [p for p in presets if p.get("name") != name]
    if len(next_presets) == len(presets):
        return _json_error("Preset introuvable", 404)
    save_json(PRESETS_PATH, next_presets)
    return jsonify({"ok": True, "presets": next_presets})


@app.post("/api/settings")
def post_settings():
    data = request.get_json(silent=True) or {}
    cfg = get_config()
    try:
        if "client_id" in data:
            cfg["client_id"] = str(data.get("client_id") or "").strip()
        if "launch_at_startup" in data:
            enabled = bool(data.get("launch_at_startup"))
            set_launch_at_startup(enabled)
            cfg["launch_at_startup"] = enabled
        if "auto_apply_on_launch" in data:
            cfg["auto_apply_on_launch"] = bool(data.get("auto_apply_on_launch"))
        save_config(cfg)
        return jsonify({
            "ok": True,
            "client_id": cfg.get("client_id", ""),
            "launch_at_startup": is_launch_at_startup(),
            "auto_apply_on_launch": bool(cfg.get("auto_apply_on_launch")),
        })
    except Exception as exc:
        log.exception("Settings echoue")
        return _json_error(str(exc), 500)


@app.get("/<path:path>")
def spa_assets(path: str):
    if path == "index.html":
        return _serve_index()
    target = DIST_DIR / path
    if target.exists() and target.is_file():
        return send_from_directory(DIST_DIR, path)
    index_path = DIST_DIR / "index.html"
    if index_path.exists():
        return _serve_index()
    return ("Build manquant. Lance: cd frontend && npm run build", 503)


@atexit.register
def _cleanup():
    try:
        rpc.close()
    except Exception as exc:
        log.warning("Cleanup RPC: %s", exc)
    release_lock()
    clear_runtime_file()


def apply_last_presence_if_needed() -> None:
    cfg = get_config()
    if not cfg.get("auto_apply_on_launch"):
        return
    client_id = str(cfg.get("client_id") or "").strip()
    last = cfg.get("last_presence")
    if not client_id or not isinstance(last, dict):
        return
    try:
        rpc.connect(client_id)
        rpc.update(last)
        log.info("Presence auto appliquee au demarrage")
    except Exception as exc:
        log.warning("Auto apply echoue: %s", exc)


def prepare_runtime(port: int | None = None) -> int:
    """Choisit le port, lock, token session. Raise si une autre instance tourne."""
    global _bound_port
    other = existing_instance()
    if other:
        other_port = int(other.get("port") or 0)
        raise RuntimeError(f"{APP_DISPLAY_NAME} deja lance (PID {other.get('pid')}, port {other_port})")
    bound = port if port is not None else pick_free_port()
    init_runtime(bound)
    acquire_lock(bound)
    _bound_port = bound
    import paths as paths_mod

    paths_mod.PORT = bound
    paths_mod.APP_URL = app_url(bound)
    return bound


def run_server(open_browser: bool = False, port: int | None = None, already_prepared: bool = False) -> None:
    if not already_prepared:
        ensure_user_files()
        bound = prepare_runtime(port)
    else:
        bound = get_bound_port() or port or PORT
        if not get_token():
            raise RuntimeError("Runtime non prepare (token manquant)")
    apply_last_presence_if_needed()
    url = app_url(bound)
    if open_browser:
        import webbrowser

        token = get_token()
        open_url = f"{url}/?t={token}" if token else url
        threading.Timer(0.8, lambda: webbrowser.open(open_url)).start()
    log.info("%s UI -> %s", APP_DISPLAY_NAME, url)
    app.run(host=HOST, port=bound, debug=False, use_reloader=False, threaded=True)

if __name__ == "__main__":
    run_server(open_browser=True)