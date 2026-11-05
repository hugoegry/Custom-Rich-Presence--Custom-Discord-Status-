from __future__ import annotations

import logging
import time
from typing import Any
from urllib.parse import parse_qs, unquote, urlparse

from pypresence import Presence
from pypresence.types import ActivityType

from branding import APP_CODE_NAME

log = logging.getLogger(f"{APP_CODE_NAME}.rpc")


def normalize_image_ref(value: str) -> str:
    raw = (value or "").strip()
    if not raw:
        return ""
    if "google." in raw and "imgurl=" in raw:
        try:
            query = parse_qs(urlparse(raw).query)
            imgurl = (query.get("imgurl") or [""])[0]
            if imgurl:
                return unquote(imgurl).strip()
        except (ValueError, TypeError) as exc:
            log.warning("Parse imgurl Google echoue: %s", exc)
    return raw


ACTIVITY_MAP = {
    "PLAYING": ActivityType.PLAYING,
    "LISTENING": ActivityType.LISTENING,
    "WATCHING": ActivityType.WATCHING,
    "COMPETING": ActivityType.COMPETING,
}


class RpcClient:
    def __init__(self) -> None:
        self._rpc: Presence | None = None
        self._client_id: str = ""
        self._connected: bool = False
        self._start_ts: int | None = None

    @property
    def connected(self) -> bool:
        return self._connected

    def connect(self, client_id: str) -> None:
        """Connecte au client Discord via IPC local."""
        client_id = (client_id or "").strip()
        if not client_id:
            raise ValueError("Client ID manquant")

        if self._connected and self._client_id == client_id:
            return

        self.close()
        self._client_id = client_id
        self._rpc = Presence(client_id)
        self._rpc.connect()
        self._connected = True

    def update(self, payload: dict[str, Any]) -> None:
        """Envoie le status Rich Presence vers Discord."""
        if not self._connected or self._rpc is None:
            raise RuntimeError("Pas connecte a Discord")

        activity_key = str(payload.get("activity_type") or "PLAYING").upper()
        activity_type = ACTIVITY_MAP.get(activity_key, ActivityType.PLAYING)

        use_timer = bool(payload.get("timer"))
        if use_timer:
            if self._start_ts is None:
                self._start_ts = int(time.time())
        else:
            self._start_ts = None

        kwargs: dict[str, Any] = {
            "activity_type": activity_type,
        }

        name = (payload.get("name") or "").strip()
        if name:
            kwargs["name"] = name[:128]

        details = (payload.get("details") or "").strip()
        state = (payload.get("state") or "").strip()
        if details:
            kwargs["details"] = details[:128]
        if state:
            kwargs["state"] = state[:128]

        large_image = normalize_image_ref(str(payload.get("large_image") or ""))
        large_text = (payload.get("large_text") or "").strip()
        small_image = normalize_image_ref(str(payload.get("small_image") or ""))
        small_text = (payload.get("small_text") or "").strip()

        if large_image:
            if len(large_image) > 300:
                raise ValueError("Large image URL trop longue (max 300 car). Colle une URL directe .jpg/.png, pas une page Google.")
            kwargs["large_image"] = large_image
        if large_text:
            kwargs["large_text"] = large_text[:128]
        if small_image:
            if len(small_image) > 300:
                raise ValueError("Small image URL trop longue (max 300 car). Colle une URL directe .jpg/.png.")
            kwargs["small_image"] = small_image
        if small_text:
            kwargs["small_text"] = small_text[:128]

        if self._start_ts is not None:
            kwargs["start"] = self._start_ts

        buttons = self._build_buttons(payload)
        if buttons:
            kwargs["buttons"] = buttons

        try:
            self._rpc.update(**kwargs)
        except Exception as exc:
            msg = str(exc).strip() or "Erreur Discord"
            if msg.lower() == "unknown error":
                raise ValueError("Discord refuse l image. Utilise une URL directe (finissant en .jpg/.png)") from exc
            raise

    def clear(self) -> None:
        if not self._connected or self._rpc is None:
            return
        self._rpc.clear()
        self._start_ts = None

    def close(self) -> None:
        if self._rpc is not None:
            try:
                self._rpc.clear()
            except Exception as exc:
                log.warning("Clear RPC: %s", exc)
            try:
                self._rpc.close()
            except Exception as exc:
                log.warning("Close RPC: %s", exc)
        self._rpc = None
        self._connected = False
        self._start_ts = None

    @staticmethod
    def _build_buttons(payload: dict[str, Any]) -> list[dict[str, str]]:
        buttons: list[dict[str, str]] = []
        for i in (1, 2):
            label = (payload.get(f"button{i}_label") or "").strip()
            url = (payload.get(f"button{i}_url") or "").strip()
            if label and url and url.startswith(("http://", "https://")):
                buttons.append({"label": label[:32], "url": url})
        return buttons