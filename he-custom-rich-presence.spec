# -*- mode: python ; coding: utf-8 -*-
from pathlib import Path

root = Path(SPECPATH)
dist_ui = root / "frontend" / "dist"

a = Analysis(
    ["desktop.py"],
    pathex=[str(root)],
    binaries=[],
    datas=[
        (str(dist_ui), "frontend/dist"),
        (str(root / "assets" / "app.ico"), "assets"),
    ],
    hiddenimports=[
        "webview",
        "webview.platforms.edgechromium",
        "clr_loader",
        "pythonnet",
        "flask",
        "pypresence",
    ],
    hookspath=[],
    hooksconfig={},
    runtime_hooks=[],
    excludes=[],
    noarchive=False,
)

pyz = PYZ(a.pure)
exe = EXE(pyz, a.scripts, [], exclude_binaries=True, name="he-custom-rich-presence", debug=False, bootloader_ignore_signals=False, strip=False, upx=False, console=False, disable_windowed_traceback=False, argv_emulation=False, target_arch=None, codesign_identity=None, entitlements_file=None, icon=str(root / "assets" / "app.ico"))
coll = COLLECT(exe, a.binaries, a.datas, strip=False, upx=False, upx_exclude=[], name="he-custom-rich-presence")
