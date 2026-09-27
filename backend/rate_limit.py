import os
from dotenv import load_dotenv
from slowapi import Limiter
from slowapi.util import get_remote_address

load_dotenv()


def _storage_uri() -> str:
    url = os.getenv("REDIS_URL", "").strip()
    if not url:
        return "memory://"
    # Upstash requires TLS — force rediss:// scheme
    if url.startswith("redis://"):
        url = "rediss://" + url[len("redis://"):]
    return url


limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["100/minute"],
    storage_uri=_storage_uri(),
)
