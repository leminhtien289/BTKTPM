"""
B08 — FastAPI: POST /predict → run B07 sentiment model → JSON + Swagger
Run: uvicorn main:app --reload --port 8000
Docs: http://localhost:8000/docs
"""

import re
import pickle
import os
from pathlib import Path
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Literal

# ── Load model ────────────────────────────────────────────────────────────────
MODEL_PATH = Path(__file__).parent.parent / "B07_Sentiment_Vietnamese" / "sentiment_pipeline.pkl"

if MODEL_PATH.exists():
    with open(MODEL_PATH, "rb") as f:
        pipeline = pickle.load(f)
    print(f"Model loaded from: {MODEL_PATH}")
else:
    # Fallback: train inline if model file not found
    print("Model file not found — training inline...")
    from sentiment_model import pipeline  # noqa: F401

# ── FastAPI app ───────────────────────────────────────────────────────────────
app = FastAPI(
    title="Vietnamese Sentiment Analysis API",
    description="Phân tích cảm xúc tiếng Việt (tích cực / tiêu cực) bằng TF-IDF + Logistic Regression",
    version="1.0.0",
)


# ── Schemas ───────────────────────────────────────────────────────────────────
class PredictRequest(BaseModel):
    text: str = Field(
        ...,
        min_length=1,
        max_length=1000,
        example="sản phẩm rất tốt, chất lượng tuyệt vời",
        description="Vietnamese review text to analyze",
    )

    class Config:
        json_schema_extra = {
            "example": {
                "text": "sản phẩm rất tốt, giao hàng nhanh, rất hài lòng"
            }
        }


class PredictResponse(BaseModel):
    text: str
    sentiment: Literal["positive", "negative"]
    confidence: float = Field(..., ge=0.0, le=1.0, description="Prediction confidence [0–1]")
    label: int = Field(..., description="0 = negative, 1 = positive")


class BatchRequest(BaseModel):
    texts: list[str] = Field(..., min_length=1, max_length=50)


class BatchResponse(BaseModel):
    results: list[PredictResponse]
    count: int


# ── Helpers ───────────────────────────────────────────────────────────────────
def preprocess(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def predict_single(text: str) -> PredictResponse:
    cleaned = preprocess(text)
    label = int(pipeline.predict([cleaned])[0])
    probs = pipeline.predict_proba([cleaned])[0]
    return PredictResponse(
        text=text,
        sentiment="positive" if label == 1 else "negative",
        confidence=round(float(probs[label]), 4),
        label=label,
    )


# ── Routes ────────────────────────────────────────────────────────────────────
@app.get("/health", tags=["System"])
def health():
    return {"status": "ok", "model": "tfidf-logistic-v1"}


@app.post(
    "/predict",
    response_model=PredictResponse,
    tags=["Sentiment"],
    summary="Predict sentiment of a single text",
)
def predict(request: PredictRequest):
    """
    Phân tích cảm xúc 1 đoạn văn bản tiếng Việt.

    - **text**: nội dung cần phân tích (review, bình luận, ...)
    - Returns: sentiment (positive/negative) + confidence score
    """
    return predict_single(request.text)


@app.post(
    "/predict/batch",
    response_model=BatchResponse,
    tags=["Sentiment"],
    summary="Predict sentiment for multiple texts",
)
def predict_batch(request: BatchRequest):
    """Phân tích cảm xúc nhiều văn bản cùng lúc (tối đa 50)."""
    results = [predict_single(t) for t in request.texts]
    return BatchResponse(results=results, count=len(results))


@app.get("/model/info", tags=["Model"])
def model_info():
    """Thông tin về model đang chạy."""
    tfidf = pipeline.named_steps["tfidf"]
    return {
        "algorithm": "TF-IDF + Logistic Regression",
        "vocabulary_size": len(tfidf.vocabulary_),
        "ngram_range": tfidf.ngram_range,
        "max_features": tfidf.max_features,
        "classes": ["negative (0)", "positive (1)"],
    }
