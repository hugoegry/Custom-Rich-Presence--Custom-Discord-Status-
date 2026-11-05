from __future__ import annotations

import logging
import os
import socket
import sys
import threading
import time
import webbrowser

from branding import APP_CODE_NAME, APP_DISPLAY_NAME
from instance_lock import existing_instance
from local_security import get_token
from paths import HOST, app_url

logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s: %(message)s")
log = logging.getLogger(f"{APP_CODE_NAME}.desktop")

# Fix PyInstaller + pythonnet (Loader.Initialize) : prefer CoreCLR
os.environ.setdefault("PYTHONNET_RUNTIME", "coreclr")


def wait_port(host: str, port: int, timeout: float = 20.0) -> bool:
    end = time.time() + timeout
    while time.time() < end:
        try:
            with socket.create_connection((host, port), timeout=0.5):
                return True
        except OSError:
            time.sleep(0.15)
    return False


def start_flask() -> None:
    from app import run_server

    run_server(open_browser=False, already_prepared=True)


def keep_alive() -> None:
    """Garde le process vivant (Flask daemon) si UI = navigateur."""
    try:
        threading.Event().wait()
    except KeyboardInterrupt:
        pass


def open_ui(window_url: str) -> None:
    try:
        import webview
    except ImportError:
        log.warning("pywebview manquant, fallback navigateur")
        webbrowser.open(window_url)
        keep_alive()
        return

    webview.create_window(title=APP_DISPLAY_NAME, url=window_url, width=1180, height=820, min_size=(900, 650), background_color="#0c0d10")
    try:
        webview.start(gui="edgechromium")
        return
    except Exception as exc:
        log.warning("Edge WebView2 echec (%s), fallback navigateur", exc)

    webbrowser.open(window_url)
    keep_alive()


def main() -> int:
    other = existing_instance()
    if other:
        other_port = int(other.get("port") or 0)
        log.error("Instance deja active (PID %s, port %s)", other.get("pid"), other_port)
        if other_port:
            webbrowser.open(app_url(other_port))
        return 1

    from app import ensure_user_files, prepare_runtime

    ensure_user_files()
    try:
        bound = prepare_runtime()
    except RuntimeError as exc:
        log.error("%s", exc)
        return 1

    server = threading.Thread(target=start_flask, daemon=True)
    server.start()

    if not wait_port(HOST, bound):
        log.error("Le serveur local n a pas demarre")
        return 1

    url = app_url(bound)
    token = get_token()
    window_url = f"{url}/?t={token}" if token else url

    open_ui(window_url)

    try:
        from app import rpc

        rpc.close()
    except Exception as exc:
        log.warning("Cleanup RPC desktop: %s", exc)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
