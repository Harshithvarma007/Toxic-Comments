from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """All configuration comes from the environment (prefix TOXIC_), see .env.example."""

    model_config = SettingsConfigDict(env_prefix="TOXIC_", env_file=".env", extra="ignore")

    model_dir: Path = Path(__file__).resolve().parent.parent / "model"
    model_file: str = "onnx/model_quantized.onnx"
    max_len: int = 128
    max_batch: int = 64
    max_chars: int = 5000
    threads: int = 0  # 0 = let ONNX Runtime decide

    # Comma-separated. Empty = no auth (public demo). Sent as the X-API-Key header.
    api_keys: str = ""
    # Comma-separated origins, or "*". Extensions call from chrome-extension://<id>.
    cors_origins: str = "*"
    # Requests per minute per client IP (in-process token bucket; use the edge/WAF for global limits).
    rate_limit_per_minute: int = 120
    cache_size: int = 20_000

    @property
    def api_key_set(self) -> set[str]:
        return {k.strip() for k in self.api_keys.split(",") if k.strip()}

    @property
    def cors_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]


@lru_cache
def get_settings() -> Settings:
    return Settings()
