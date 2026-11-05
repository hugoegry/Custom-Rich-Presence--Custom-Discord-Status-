"""Lock mono-instance"""

from __future__ import annotations

import json
import logging
import os
from typing import Any

from branding import APP_CODE_NAME
from paths import LOCK_PATH

log = logging.getLogger(f"{APP_CODE_NAME}.lock")


def _pid_alive(pid: int) -> bool:
    if pid <= 0:
        return False
    if os.name == "nt":
        import ctypes

        kernel32 = ctypes.windll.kernel32
        process_query_limited = 0x1000
        handle = kernel32.OpenProcess(process_query_limited, False, pid)
        if not handle:
            return False
        kernel32.CloseHandle(handle)
        return True
    try:
        os.kill(pid, 0)
        return True
    except OSError:
        return False


def read_lock() -> dict[str, Any] | None:
    if not LOCK_PATH.exists():
        return None
    try:
        data = json.loads(LOCK_PATH.read_text(encoding="utf-8"))
        return data if isinstance(data, dict) else None
    except (OSError, json.JSONDecodeError) as exc:
        log.warning("Lock illisible, on ignore: %s", exc)
        return None


def existing_instance() -> dict[str, Any] | None:
    data = read_lock()
    if not data:
        return None
    pid = int(data.get("pid") or 0)
    if not _pid_alive(pid):
        try:
            LOCK_PATH.unlink(missing_ok=True)
        except OSError as exc:
            log.warning("Echec cleanup lock stale: %s", exc)
        return None
    return data


def acquire_lock(port: int) -> None:
    payload = {"pid": os.getpid(), "port": port}
    try:
        LOCK_PATH.parent.mkdir(parents=True, exist_ok=True)
        LOCK_PATH.write_text(json.dumps(payload), encoding="utf-8")
    except OSError as exc:
        log.warning("Impossible d ecrire le lock: %s", exc)


def release_lock() -> None:
    data = read_lock()
    if data and int(data.get("pid") or 0) != os.getpid():
        return
    try:
        LOCK_PATH.unlink(missing_ok=True)
    except OSError as exc:
        log.warning("Impossible de liberer le lock: %s", exc)