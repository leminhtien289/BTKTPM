# B09 — AI System Design
## Model Versioning, Data Drift, Retraining Pipeline

---

## 1. Tổng quan hệ thống AI Production

```
DATA SOURCES          TRAINING              SERVING
     │                    │                    │
┌────▼────┐         ┌─────▼──────┐      ┌────▼────────┐
│ Raw     │         │  Training  │      │  Model      │
│ Data    │──prep──▶│  Pipeline  │─────▶│  Registry   │───▶ API
│ (DB/S3) │         │ (MLflow)   │      │ (v1,v2,v3)  │     Serve
└─────────┘         └────────────┘      └─────────────┘
     │                                        │
     ▼                                        ▼
┌────────────┐                        ┌──────────────┐
│ Feature    │                        │  Monitoring  │
│ Store      │                        │  (Evidently) │
│ (Redis/    │                        │  Drift detect│
│  Feast)    │                        └──────┬───────┘
└────────────┘                               │ drift detected
                                             ▼
                                      ┌──────────────┐
                                      │ Retrain      │
                                      │ Trigger      │
                                      │ (Airflow/    │
                                      │  GitHub Act) │
                                      └──────────────┘
```

---

## 2. Model Versioning

### Chiến lược versioning với MLflow

```python
import mlflow

# Mỗi lần train → log vào MLflow experiment
with mlflow.start_run(run_name=f"sentiment_v{VERSION}"):
    # Log parameters
    mlflow.log_params({
        "ngram_range": "(1, 2)",
        "max_features": 5000,
        "C": 1.0,
        "dataset_version": "v3",
    })

    # Train model
    pipeline.fit(X_train, y_train)

    # Log metrics
    mlflow.log_metrics({
        "accuracy": accuracy_score(y_test, y_pred),
        "f1_macro": f1_score(y_test, y_pred, average="macro"),
        "roc_auc":  roc_auc_score(y_test, proba),
    })

    # Register model
    mlflow.sklearn.log_model(
        pipeline,
        artifact_path="model",
        registered_model_name="sentiment-vi",
    )
```

### Model stages (MLflow Model Registry)

```
Staging ──[pass threshold test]──▶ Production ──[new version]──▶ Archived
  │                                      │
  │                               Active serving
  │
  └── A/B test: route 10% traffic to Staging
      compare metrics for 24h
      → promote or rollback
```

### Version naming convention

| Version | Dataset | Algorithm | F1 | Notes |
|---|---|---|---|---|
| v1.0.0 | 1K samples | Logistic + TF-IDF | 0.82 | MVP |
| v1.1.0 | 5K samples | Logistic + TF-IDF | 0.87 | More data |
| v2.0.0 | 5K samples | BERT fine-tuned | 0.93 | New algorithm |
| v2.1.0 | 10K samples | BERT fine-tuned | 0.95 | More data + cleaning |

---

## 3. Data Drift Detection

### Loại drift cần monitor

| Drift Type | Mô tả | Ví dụ |
|---|---|---|
| **Feature drift** | Phân phối input thay đổi | Từ mới xuất hiện sau trend TikTok |
| **Label drift** | Phân phối nhãn thay đổi | Tỷ lệ negative tăng sau sự cố sản phẩm |
| **Concept drift** | Mối quan hệ input→output thay đổi | "Ok" trước có nghĩa tích cực, giờ mang nghĩa khác |
| **Prediction drift** | Model confidence thay đổi | Avg confidence giảm từ 0.9 → 0.7 |

### Implementation với Evidently

```python
from evidently.report import Report
from evidently.metric_preset import DataDriftPreset, TargetDriftPreset

def check_drift(reference_data, current_data):
    report = Report(metrics=[
        DataDriftPreset(),        # feature distribution drift
        TargetDriftPreset(),      # label distribution drift
    ])
    report.run(reference_data=reference_data,
               current_data=current_data)

    result = report.as_dict()
    drift_detected = result["metrics"][0]["result"]["dataset_drift"]
    n_drifted_features = result["metrics"][0]["result"]["number_of_drifted_columns"]

    return {
        "drift_detected": drift_detected,
        "drifted_features": n_drifted_features,
        "action": "retrain" if drift_detected else "no_action",
    }
```

### Drift monitoring schedule

```
Daily:   Check prediction confidence distribution
Weekly:  Full feature drift report (Evidently)
Monthly: Compare model accuracy on sample of labeled production data

Thresholds:
  - prediction confidence < 0.75 (avg) → WARNING
  - feature drift > 30% columns → RETRAIN triggered
  - accuracy drop > 3% from baseline → RETRAIN triggered
```

---

## 4. Retraining Pipeline

```
TRIGGER (one of):
  ├── Scheduled: cron every 2 weeks
  ├── Drift detected: Evidently report → webhook
  └── Manual: via API POST /retrain

        │
        ▼
STEP 1: Data Collection
  - Pull new labeled data from production (human-reviewed)
  - Augment with existing training data
  - Validate data quality (schema check, dedup)
        │
        ▼
STEP 2: Feature Engineering
  - Re-run preprocessing pipeline
  - Update TF-IDF vocabulary with new terms
  - Store features in Feature Store
        │
        ▼
STEP 3: Train
  - Train new model version
  - Log to MLflow (params, metrics, artifacts)
        │
        ▼
STEP 4: Evaluate
  - Compare with current Production model on test set
  - Champion/Challenger test:
    New model must be ≥ 1% better on F1 macro
        │
        ▼ (if pass)
STEP 5: Shadow Deployment
  - Deploy new model in shadow mode (not serving real users)
  - Compare predictions with production model for 24h
        │
        ▼ (if consistent)
STEP 6: Canary Rollout
  - Route 10% traffic to new model
  - Monitor error rate, latency, user feedback for 2h
        │
        ▼ (if stable)
STEP 7: Full Promotion
  - New model = Production
  - Old model = Archived (kept for rollback)

ROLLBACK: if p99 latency > 500ms or error rate > 1%
  → kubectl rollout undo / MLflow stage revert
```

---

## 5. AI System Architecture Diagram

```
                    ┌─────────────────────────┐
                    │     DATA LAYER           │
                    │  Raw DB │ S3 Data Lake   │
                    └──────────────────────────┘
                               │
                    ┌─────────▼──────────────┐
                    │  FEATURE PIPELINE       │
                    │  (Airflow DAG, daily)   │
                    │  preprocess → Feature   │
                    │  Store (Redis/Feast)    │
                    └─────────────────────────┘
                               │
            ┌──────────────────┼────────────────────┐
            ▼                  ▼                    ▼
   ┌────────────────┐  ┌────────────────┐  ┌──────────────┐
   │ Training Job   │  │ Model Registry │  │  Serving     │
   │ (Docker/K8s)   │─▶│  (MLflow)      │─▶│  API         │
   │ mlflow tracking│  │ v1, v2, v3...  │  │  FastAPI     │
   └────────────────┘  └────────────────┘  └──────┬───────┘
                                                   │
                                         ┌─────────▼───────┐
                                         │  MONITORING      │
                                         │  Prometheus +    │
                                         │  Grafana +       │
                                         │  Evidently       │
                                         │  (drift report)  │
                                         └─────────────────┘
```
