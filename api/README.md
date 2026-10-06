# Toxicity API (FastAPI + ONNX Runtime)

```bash
../scripts/fetch_model.sh                 # model -> api/model
pip install -r requirements-dev.txt
uvicorn app.main:app --reload --port 8000 # http://localhost:8000/docs
pytest -q
docker build -t toxic-api . && docker run -p 8000:8000 toxic-api
```

| Endpoint | |
|---|---|
| `POST /v1/classify` | `{"texts": [...≤64], "profile": "balanced" \| "strict"}` → per-text `toxic`, `score`, `labels`, `scores` |
| `GET /v1/model` | model name, labels, both threshold profiles, held-out metrics |
| `GET /healthz` · `/readyz` | liveness · readiness (model loaded and warmed) |
| `GET /metrics` | Prometheus |

Configuration is environment variables with the `TOXIC_` prefix (see `.env.example` and `app/settings.py`): API keys, CORS origins, rate limit, batch limits and cache size.

Design notes:
- **No torch at serving time.** onnxruntime + tokenizers only, so the image is ~460 MB (most of it numpy + onnxruntime) and startup is ~1 s.
- **Same preprocessing as training.** Whitespace normalisation only (`normalise` in `app/model.py` mirrors `ml/toxicity/data.py`).
- **Length-sorted micro-batches of 32** to minimise padding. An LRU cache keyed on normalised text helps, because popular comments repeat across page loads.
- **Rate limiting is per process.** Put a WAF or edge limit in front for global limits.
