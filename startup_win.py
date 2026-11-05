from __future__ import annotations

import logging
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from branding import APP_CODE_NAME, APP_DISPLAY_NAME
from paths import exe_path

log = logging.getLogger(f"{APP_CODE_NAME}.startup")

SHORTCUT_NAME = f"{APP_CODE_NAME}.lnk"


def startup_folder() -> Path:
    appdata = os.environ.get("APPDATA")
    if not appdata:
        raise RuntimeError("APPDATA introuvable")
    return Path(appdata) / r"Microsoft\Windows\Start Menu\Programs\Startup"


def shortcut_path() -> Path:
    return startup_folder() / SHORTCUT_NAME


def is_launch_at_startup() -> bool:
    return shortcut_path().exists()


def target_for_startup() -> Path:
    frozen = exe_path()
    if frozen is not None:
        return frozen
    return Path(sys.executable).resolve()


def startup_args() -> str:
    if exe_path() is not None:
        return ""
    desktop = Path(__file__).resolve().parent / "desktop.py"
    return f'"{desktop}"'


def _vbs_escape(value: str) -> str:
    return value.replace('"', '""')


def set_launch_at_startup(enabled: bool) -> bool:
    link = shortcut_path()
    if not enabled:
        if link.exists():
            link.unlink()
        return False

    target = target_for_startup()
    args = startup_args()
    workdir = str(target.parent if exe_path() is not None else Path(__file__).resolve().parent)
    link.parent.mkdir(parents=True, exist_ok=True)

    vbs = "\n".join([
        'Set ws = CreateObject("WScript.Shell")',
        f'Set sc = ws.CreateShortcut("{_vbs_escape(str(link))}")',
        f'sc.TargetPath = "{_vbs_escape(str(target))}"',
        f'sc.Arguments = "{_vbs_escape(args)}"',
        f'sc.WorkingDirectory = "{_vbs_escape(workdir)}"',
        "sc.WindowStyle = 7",
        f'sc.Description = "{_vbs_escape(APP_DISPLAY_NAME)}"',
        "sc.Save",
    ])

    tmp: Path | None = None
    try:
        with tempfile.NamedTemporaryFile("w", suffix=".vbs", delete=False, encoding="utf-8") as fh:
            fh.write(vbs)
            tmp = Path(fh.name)
        result = subprocess.run(
            ["wscript.exe", "//Nologo", str(tmp)],
            check=False,
            capture_output=True,
            text=True,
        )
        if result.returncode != 0:
            err = (result.stderr or result.stdout or "wscript echec").strip()
            log.error("Creation raccourci Startup echouee: %s", err)
            raise RuntimeError(f"Creation raccourci Startup echouee: {err}")
    finally:
        if tmp is not None:
            try:
                tmp.unlink(missing_ok=True)
            except OSError as exc:
                log.warning("Cleanup VBS temp: %s", exc)
    return True