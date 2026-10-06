from typing import Literal

from pydantic import BaseModel, Field

Profile = Literal["balanced", "strict"]


class ClassifyRequest(BaseModel):
    texts: list[str] = Field(..., min_length=1, description="Comments to score (max batch set by TOXIC_MAX_BATCH).")
    profile: Profile = Field(
        "balanced",
        description="balanced = best F1 per label. strict = catches >= 90% of toxic comments on validation "
        "(more false positives; intended for child-safe filtering).",
    )

    model_config = {
        "json_schema_extra": {
            "examples": [{"texts": ["Great video, thanks!", "you are an idiot"], "profile": "balanced"}]
        }
    }


class Result(BaseModel):
    toxic: bool = Field(..., description="True if any label is above its threshold for the chosen profile.")
    score: float = Field(..., description="Max probability over all labels.")
    labels: list[str] = Field(..., description="Labels above threshold.")
    scores: dict[str, float]


class ClassifyResponse(BaseModel):
    model: str
    profile: Profile
    results: list[Result]


class ModelInfo(BaseModel):
    model: str
    labels: list[str]
    thresholds: dict[str, dict[str, float]]
    max_len: int
    max_batch: int
    metrics: dict
