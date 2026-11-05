"""Chemins app : dev vs exe PyInstaller."""

from __future__ import annotations

import logging
import os
import socket
import sys
from pathlib import Path

from branding import APP_CODE_NAME

log = logging.getLogger(f"{APP_CODE_NAME}.paths")

HOST = "127.0.0.1"
PORT_DEFAULT = 8765
PORT_SPAN = 20


def resource_dir() -> Path:
    """Fichiers embarques (UI build, etc)."""
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        return Path(sys._MEIPASS)
    return Path(__file__).resolve().parent


def app_dir() -> Path:
    if getattr(sys, "frozen", False):
        base = Path(os.environ.get("LOCALAPPDATA") or (Path.home() / "AppData" / "Local"))
        path = base / APP_CODE_NAME
        path.mkdir(parents=True, exist_ok=True)
        return path
    return Path(__file__).resolve().parent


def legacy_data_dirs() -> list[Path]:
    dirs: list[Path] = []
    if getattr(sys, "frozen", False):
        exe_dir = Path(sys.executable).resolve().parent
        dirs.append(exe_dir)
        maybe_root = exe_dir.parent.parent
        if maybe_root != exe_dir:
            dirs.append(maybe_root)
        local = Path(os.environ.get("LOCALAPPDATA") or (Path.home() / "AppData" / "Local"))
        dirs.append(local / "DiscordStatus")
        dirs.append(local / "he-custom-riche-presence")
    else:
        dirs.append(Path(__file__).resolve().parent)
    return dirs


def exe_path() -> Path | None:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve()
    return None


def port_is_free(host: str, port: int) -> bool:
    sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    try:
        sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
        sock.bind((host, port))
        return True
    except OSError:
        return False
    finally:
        sock.close()


def pick_free_port(host: str = HOST, start: int = PORT_DEFAULT, span: int = PORT_SPAN) -> int:
    for port in range(start, start + span):
        if port_is_free(host, port):
            return port
    raise RuntimeError(f"Aucun port libre entre {start} et {start + span - 1}")


def app_url(port: int) -> str:
    return f"http://{HOST}:{port}"


DIST_DIR = resource_dir() / "frontend" / "dist"
CONFIG_PATH = app_dir() / "config.json"
PRESETS_PATH = app_dir() / "presets.json"
RUNTIME_PATH = app_dir() / ".local_session"
LOCK_PATH = app_dir() / "instance.lock"

PORT = PORT_DEFAULT
APP_URL = app_url(PORT_DEFAULT)