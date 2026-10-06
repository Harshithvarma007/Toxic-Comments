import threading
import time


class RateLimiter:
    """Per-key token bucket. Per process only — put a WAF / edge rate limit in front for global limits."""

    def __init__(self, per_minute: int, max_keys: int = 50_000):
        self.rate = per_minute / 60.0
        self.capacity = float(per_minute)
        self.buckets: dict[str, tuple[float, float]] = {}
        self.max_keys = max_keys
        self.lock = threading.Lock()

    def allow(self, key: str) -> bool:
        if self.capacity <= 0:
            return True
        now = time.monotonic()
        with self.lock:
            tokens, last = self.buckets.get(key, (self.capacity, now))
            tokens = min(self.capacity, tokens + (now - last) * self.rate)
            allowed = tokens >= 1
            self.buckets[key] = (tokens - 1 if allowed else tokens, now)
            if len(self.buckets) > self.max_keys:
                self.buckets.clear()
            return allowed
