import os
import json
import redis
from dotenv import load_dotenv

load_dotenv()

_client = None


def _connect():
    global _client
    url = os.getenv("REDIS_URL", "").strip()
    if not url:
        return None
    # Upstash requires TLS; force rediss:// scheme regardless of what's in .env
    if url.startswith("redis://"):
        url = "rediss://" + url[len("redis://"):]
    try:
        client = redis.from_url(url, ssl_cert_reqs=None, decode_responses=True)
        client.ping()
        print("✓ Redis connected")
        return client
    except Exception as e:
        print(f"⚠  Redis unavailable ({e}) — caching disabled, falling back to DB")
        return None


def _get_client():
    global _client
    if _client is None:
        _client = _connect()
    return _client


# ── public helpers ────────────────────────────────────────────────────────────

def cache_get(key: str):
    r = _get_client()
    if r is None:
        return None
    try:
        raw = r.get(key)
        return json.loads(raw) if raw is not None else None
    except Exception:
        return None


def cache_set(key: str, value, ttl: int = 60):
    r = _get_client()
    if r is None:
        return
    try:
        r.setex(key, ttl, json.dumps(value, default=str))
    except Exception:
        pass


def cache_delete(*keys: str):
    r = _get_client()
    if r is None:
        return
    try:
        r.delete(*keys)
    except Exception:
        pass
