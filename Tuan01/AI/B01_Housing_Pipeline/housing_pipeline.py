"""
B01 — Housing Price Prediction: Full ML Pipeline
Load → Preprocess → Train → Evaluate → Pipeline Diagram
Dataset: sklearn.datasets.fetch_california_housing
"""

import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import fetch_california_housing
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.linear_model import LinearRegression
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.pipeline import Pipeline


# ── Step 1: Load data ─────────────────────────────────────────────────────────
print("=" * 50)
print("STEP 1: Load Data")
print("=" * 50)

housing = fetch_california_housing()
X, y = housing.data, housing.target
feature_names = housing.feature_names

print(f"Dataset shape: {X.shape}")
print(f"Features: {feature_names}")
print(f"Target range: ${y.min():.2f}k – ${y.max():.2f}k")
print(f"Sample:\n  X[0] = {X[0]}\n  y[0] = {y[0]:.2f}")


# ── Step 2: Preprocess ────────────────────────────────────────────────────────
print("\n" + "=" * 50)
print("STEP 2: Preprocess")
print("=" * 50)

# Check missing values
nan_count = np.isnan(X).sum()
print(f"Missing values: {nan_count}")

# Train/test split
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"Train size: {X_train.shape[0]}, Test size: {X_test.shape[0]}")

# Standardize features
scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)   # fit on train only
X_test_scaled  = scaler.transform(X_test)         # transform test with train stats

print(f"Feature mean (after scaling): {X_train_scaled.mean(axis=0).round(4)}")
print(f"Feature std  (after scaling): {X_train_scaled.std(axis=0).round(4)}")


# ── Step 3: Train ─────────────────────────────────────────────────────────────
print("\n" + "=" * 50)
print("STEP 3: Train Models")
print("=" * 50)

models = {
    "Linear Regression":  LinearRegression(),
    "Random Forest":      RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1),
}

results = {}
for name, model in models.items():
    model.fit(X_train_scaled, y_train)
    y_pred = model.predict(X_test_scaled)
    results[name] = {
        "RMSE": np.sqrt(mean_squared_error(y_test, y_pred)),
        "MAE":  mean_absolute_error(y_test, y_pred),
        "R2":   r2_score(y_test, y_pred),
        "y_pred": y_pred,
    }
    print(f"  {name}: trained")


# ── Step 4: Evaluate ──────────────────────────────────────────────────────────
print("\n" + "=" * 50)
print("STEP 4: Evaluate")
print("=" * 50)

print(f"\n{'Model':<22} {'RMSE':>8} {'MAE':>8} {'R²':>8}")
print("-" * 50)
for name, r in results.items():
    print(f"{name:<22} {r['RMSE']:>8.4f} {r['MAE']:>8.4f} {r['R2']:>8.4f}")


# ── Step 5: sklearn Pipeline (best practice) ──────────────────────────────────
print("\n" + "=" * 50)
print("STEP 5: sklearn Pipeline")
print("=" * 50)

pipeline = Pipeline([
    ("scaler",  StandardScaler()),
    ("model",   RandomForestRegressor(n_estimators=100, random_state=42)),
])
pipeline.fit(X_train, y_train)
y_pred_pipeline = pipeline.predict(X_test)
r2_pipeline = r2_score(y_test, y_pred_pipeline)
print(f"Pipeline R²: {r2_pipeline:.4f}")


# ── Step 6: Visualize ─────────────────────────────────────────────────────────
fig, axes = plt.subplots(1, 2, figsize=(14, 5))

for ax, (name, r) in zip(axes, results.items()):
    ax.scatter(y_test, r["y_pred"], alpha=0.3, s=10)
    ax.plot([y_test.min(), y_test.max()],
            [y_test.min(), y_test.max()], "r--", lw=2, label="Perfect prediction")
    ax.set_xlabel("Actual Price ($100k)")
    ax.set_ylabel("Predicted Price ($100k)")
    ax.set_title(f"{name}\nR²={r['R2']:.4f}, RMSE={r['RMSE']:.4f}")
    ax.legend()

plt.tight_layout()
plt.savefig("housing_results.png", dpi=100)
print("\nChart saved: housing_results.png")


# ── AI Pipeline Diagram (text) ────────────────────────────────────────────────
print("\n" + "=" * 50)
print("AI PIPELINE DIAGRAM")
print("=" * 50)
print("""
Raw Data (California Housing)
         │
         ▼
[Load & Inspect]
  - fetch_california_housing()
  - Check shape, types, missing values
         │
         ▼
[Preprocess]
  - train_test_split (80/20)
  - StandardScaler (fit on train, transform both)
         │
         ▼
[Train]
  - LinearRegression (baseline)
  - RandomForestRegressor (100 trees)
         │
         ▼
[Evaluate]
  - RMSE, MAE, R² on test set
  - Scatter plot: actual vs predicted
         │
         ▼
[Production Pipeline]
  - sklearn Pipeline(scaler + model)
  - Serialize: joblib.dump(pipeline, 'model.pkl')
  - Serve via FastAPI POST /predict
""")
