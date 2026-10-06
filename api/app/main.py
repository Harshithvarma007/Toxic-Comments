"""Toxicity detection API.

POST /v1/classify   score a batch of comments
GET  /v1/model      model name, labels, thresholds, held-out metrics
GET  /healthz       liveness
GET  /readyz        readiness (model loaded)
GET  /metrics       Prometheus
"""

from __future__ import annotations

import logging
import time
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, Response
from prometheus_client import CONTENT_TYPE_LATEST, Counter, Histogram, generate_latest
from starlette.concurrency import run_in_threadpool

from .model import ToxicityModel
from .ratelimit import RateLimiter
from .schemas import ClassifyRequest, ClassifyResponse, ModelInfo, Result
from .settings import get_settings

log = logging.getLogger("toxic-api")
logging.basicConfig(level=logging.INFO, format='{"t":"%(asctime)s","level":"%(levelname)s","msg":%(message)r}')

REQUESTS = Counter("toxic_requests_total", "Requests", ["endpoint", "status"])
COMMENTS = Counter("toxic_comments_total", "Comments scored", ["profile", "toxic"])
CACHE_HITS = Counter("toxic_cache_hits_total", "Comments served from cache")
LATENCY = Histogram(
    "toxic_inference_seconds", "Model latency per request", buckets=(0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5)
)

state: dict = {}


@asynccontextmanager
async def lifespan(app: FastAPI):
    s = get_settings()
    t0 = time.time()
    state["model"] = ToxicityModel(s.model_dir, s.model_file, s.max_len, s.threads, s.cache_size)
    state["model"].predict(["warm up"])
    state["limiter"] = RateLimiter(s.rate_limit_per_minute)
    log.info(f"model {state['model'].name} loaded in {time.time() - t0:.2f}s")
    yield
    state.clear()


app = FastAPI(
    title="Toxic Comment Detection API",
    version="2.0.0",
    description="Multi-label toxicity scoring (toxic, severe_toxic, obscene, threat, insult, identity_hate).",
    lifespan=lifespan,
)
_settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=_settings.cors_list,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-API-Key"],
)


def client_ip(request: Request) -> str:
    fwd = request.headers.get("x-forwarded-for")
    return fwd.split(",")[0].strip() if fwd else (request.client.host if request.client else "unknown")


def guard(request: Request) -> None:
    s = get_settings()
    if s.api_key_set and request.headers.get("x-api-key") not in s.api_key_set:
        REQUESTS.labels("classify", "401").inc()
        raise HTTPException(401, "missing or invalid X-API-Key")
    limiter: RateLimiter = state["limiter"]
    if not limiter.allow(client_ip(request)):
        REQUESTS.labels("classify", "429").inc()
        raise HTTPException(429, "rate limit exceeded", headers={"Retry-After": "10"})


@app.post("/v1/classify", response_model=ClassifyResponse, dependencies=[Depends(guard)])
async def classify(body: ClassifyRequest) -> ClassifyResponse:
    s = get_settings()
    if len(body.texts) > s.max_batch:
        raise HTTPException(413, f"at most {s.max_batch} texts per request")
    texts = [t[: s.max_chars] for t in body.texts]
    model: ToxicityModel = state["model"]

    t0 = time.perf_counter()
    probs, hits = await run_in_threadpool(model.predict, texts)
    LATENCY.observe(time.perf_counter() - t0)
    CACHE_HITS.inc(hits)

    thresholds = model.thresholds[body.profile]
    results = []
    for row in probs:
        scores = {label: round(float(p), 4) for label, p in zip(model.labels, row, strict=True)}
        flagged = [label for label in model.labels if scores[label] >= thresholds[label]]
        results.append(Result(toxic=bool(flagged), score=max(scores.values()), labels=flagged, scores=scores))
        COMMENTS.labels(body.profile, str(bool(flagged)).lower()).inc()
    REQUESTS.labels("classify", "200").inc()
    return ClassifyResponse(model=model.name, profile=body.profile, results=results)


@app.get("/v1/model", response_model=ModelInfo)
async def model_info() -> ModelInfo:
    s, m = get_settings(), state["model"]
    metrics = {k: m.metrics[k] for k in ("test", "youtube", "size_mb", "test_ms_per_comment") if k in m.metrics}
    return ModelInfo(
        model=m.name,
        labels=m.labels,
        thresholds=m.thresholds,
        max_len=s.max_len,
        max_batch=s.max_batch,
        metrics=metrics,
    )


@app.get("/healthz")
async def healthz():
    return {"status": "ok"}


@app.get("/readyz")
async def readyz():
    if "model" not in state:
        return JSONResponse({"status": "loading"}, status_code=503)
    return {"status": "ready", "model": state["model"].name}


@app.get("/metrics")
async def metrics():
    return Response(generate_latest(), media_type=CONTENT_TYPE_LATEST)


@app.get("/")
async def root():
    return {"name": "toxic-comment-detection", "docs": "/docs", "classify": "POST /v1/classify"}
