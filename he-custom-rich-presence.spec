# -*- mode: python ; coding: utf-8 -*-
from pathlib import Path

from PyInstaller.utils.hooks import collect_all

root = Path(SPECPATH)
dist_ui = root / "frontend" / "dist"

datas = [
    (str(dist_ui), "frontend/dist"),
    (str(root / "assets" / "app.ico"), "assets"),
]
binaries = []
hiddenimports = [
    "webview",
    "webview.platforms.edgechromium",
    "flask",
    "pypresence",
    "clr",
    "clr_loader",
    "pythonnet",
]

for pkg in ("pythonnet", "clr_loader", "webview"):
    pkg_datas, pkg_binaries, pkg_hidden = collect_all(pkg)
    datas += pkg_datas
    binaries += pkg_binaries
    hiddenimports += pkg_hidden

a = Analysis(
    ["desktop.py"],
    pathex=[str(root)],
    binaries=binaries,
    datas=datas,
    hiddenimports=hiddenimports,
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=["webview.platforms.mshtml"],
    noarchive=False,
)

pyz = PYZ(a.pure)
exe = EXE(pyz, a.scripts, [], exclude_binaries=True, name="he-custom-rich-presence", debug=False, bootloader_ignore_signals=False, strip=False, upx=False, console=False, disable_windowed_traceback=False, argv_emulation=False, target_arch=None, codesign_identity=None, entitlements_file=None, icon=str(root / "assets" / "app.ico"))
coll = COLLECT(exe, a.binaries, a.datas, strip=False, upx=False, upx_exclude=[], name="he-custom-rich-presence")
