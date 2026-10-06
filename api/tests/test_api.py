"""Runs against the real exported model in api/model (run `make model` first)."""

import pytest
from fastapi.testclient import TestClient

from app.main import app
from app.ratelimit import RateLimiter
from app.settings import get_settings


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


def test_health(client):
    assert client.get("/healthz").json() == {"status": "ok"}
    assert client.get("/readyz").json()["status"] == "ready"


def test_model_info(client):
    info = client.get("/v1/model").json()
    assert info["labels"] == ["toxic", "severe_toxic", "obscene", "threat", "insult", "identity_hate"]
    assert set(info["thresholds"]) == {"balanced", "strict"}


def test_classify_separates_clean_and_toxic(client):
    r = client.post(
        "/v1/classify",
        json={"texts": ["Thanks for the tutorial, really clear explanation!", "you are a worthless idiot, shut up"]},
    )
    assert r.status_code == 200
    clean, toxic = r.json()["results"]
    assert not clean["toxic"] and clean["score"] < 0.2
    assert toxic["toxic"] and "insult" in toxic["labels"]


def test_strict_flags_at_least_as_much_as_balanced(client):
    texts = ["this is kind of dumb", "nice", "go to hell", "I disagree with you"]
    bal = client.post("/v1/classify", json={"texts": texts, "profile": "balanced"}).json()["results"]
    strict = client.post("/v1/classify", json={"texts": texts, "profile": "strict"}).json()["results"]
    assert sum(r["toxic"] for r in strict) >= sum(r["toxic"] for r in bal)


def test_validation(client):
    assert client.post("/v1/classify", json={"texts": []}).status_code == 422
    assert client.post("/v1/classify", json={"texts": ["x"], "profile": "nope"}).status_code == 422
    too_many = ["x"] * (get_settings().max_batch + 1)
    assert client.post("/v1/classify", json={"texts": too_many}).status_code == 413


def test_cache_is_consistent(client):
    a = client.post("/v1/classify", json={"texts": ["you   are an idiot"]}).json()["results"][0]
    b = client.post("/v1/classify", json={"texts": ["you are an idiot"]}).json()["results"][0]
    assert a["scores"] == b["scores"]


def test_metrics_endpoint(client):
    body = client.get("/metrics").text
    assert "toxic_comments_total" in body


def test_rate_limiter():
    rl = RateLimiter(per_minute=3)
    assert [rl.allow("a") for _ in range(4)] == [True, True, True, False]
    assert rl.allow("b")
