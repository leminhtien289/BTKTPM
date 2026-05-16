"""
B04 — Feature Selection + GridSearch + Cross-Validation
Compare: Logistic Regression vs SVM vs Random Forest
"""

import numpy as np
import pandas as pd
from sklearn.datasets import load_breast_cancer
from sklearn.model_selection import train_test_split, GridSearchCV, cross_val_score, StratifiedKFold
from sklearn.preprocessing import StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.feature_selection import SelectKBest, f_classif, RFE
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score, f1_score, roc_auc_score, classification_report
import time


# ── Dataset ───────────────────────────────────────────────────────────────────
data = load_breast_cancer()
X, y = data.data, data.target
feature_names = data.feature_names
print(f"Dataset: Breast Cancer | Shape: {X.shape} | Classes: {data.target_names}")

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)
cv = StratifiedKFold(n_splits=5, shuffle=True, random_state=42)


# ── Feature Selection ─────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("FEATURE SELECTION")
print("=" * 60)

scaler = StandardScaler()
X_train_s = scaler.fit_transform(X_train)
X_test_s  = scaler.transform(X_test)

# Method 1: SelectKBest (univariate — ANOVA F-score)
selector_kbest = SelectKBest(score_func=f_classif, k=10)
selector_kbest.fit(X_train_s, y_train)
selected_mask  = selector_kbest.get_support()
selected_names = feature_names[selected_mask]
scores         = selector_kbest.scores_[selected_mask]

print("\nSelectKBest (top 10 by ANOVA F-score):")
for name, score in sorted(zip(selected_names, scores), key=lambda x: -x[1]):
    print(f"  {name:<35} F={score:.2f}")

X_train_kb = selector_kbest.transform(X_train_s)
X_test_kb  = selector_kbest.transform(X_test_s)

# Method 2: RFE with Logistic Regression (wrapper method)
rfe = RFE(estimator=LogisticRegression(max_iter=1000, random_state=42), n_features_to_select=10)
rfe.fit(X_train_s, y_train)
rfe_names = feature_names[rfe.support_]

print(f"\nRFE (top 10, wrapper with LogisticRegression):")
print(f"  {', '.join(rfe_names)}")

overlap = set(selected_names) & set(rfe_names)
print(f"\nOverlap between KBest and RFE: {len(overlap)} features")
print(f"  {', '.join(sorted(overlap))}")

# Method 3: Feature importance from Random Forest (embedded method)
rf_feat = RandomForestClassifier(n_estimators=100, random_state=42)
rf_feat.fit(X_train_s, y_train)
importance = pd.Series(rf_feat.feature_importances_, index=feature_names)
top10_rf = importance.nlargest(10)
print(f"\nRandom Forest feature importances (top 10):")
for name, imp in top10_rf.items():
    print(f"  {name:<35} {imp:.4f}")

# Use KBest selection for model comparison (X_train_kb, X_test_kb)
print(f"\n→ Using SelectKBest (10 features) for model comparison")


# ── Model 1: Logistic Regression ──────────────────────────────────────────────
print("\n" + "=" * 60)
print("MODEL 1: Logistic Regression")
print("=" * 60)

t0 = time.time()
grid_lr = GridSearchCV(
    LogisticRegression(max_iter=1000, random_state=42),
    {"C": [0.01, 0.1, 1, 10, 100], "solver": ["lbfgs", "liblinear"]},
    cv=cv, scoring="accuracy", n_jobs=-1,
)
grid_lr.fit(X_train_kb, y_train)
t_lr = time.time() - t0
print(f"Best: {grid_lr.best_params_} | CV acc: {grid_lr.best_score_:.4f} | {t_lr:.1f}s")


# ── Model 2: SVM ──────────────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("MODEL 2: SVM")
print("=" * 60)

t0 = time.time()
grid_svm = GridSearchCV(
    SVC(probability=True, random_state=42),
    {"C": [0.1, 1, 10], "kernel": ["rbf", "linear"], "gamma": ["scale", "auto"]},
    cv=cv, scoring="accuracy", n_jobs=-1,
)
grid_svm.fit(X_train_kb, y_train)
t_svm = time.time() - t0
print(f"Best: {grid_svm.best_params_} | CV acc: {grid_svm.best_score_:.4f} | {t_svm:.1f}s")


# ── Model 3: Random Forest ────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("MODEL 3: Random Forest")
print("=" * 60)

t0 = time.time()
grid_rf = GridSearchCV(
    RandomForestClassifier(random_state=42, n_jobs=-1),
    {"n_estimators": [50, 100, 200], "max_depth": [None, 5, 10], "min_samples_split": [2, 5]},
    cv=cv, scoring="accuracy", n_jobs=-1,
)
grid_rf.fit(X_train_kb, y_train)
t_rf = time.time() - t0
print(f"Best: {grid_rf.best_params_} | CV acc: {grid_rf.best_score_:.4f} | {t_rf:.1f}s")


# ── Test set comparison ───────────────────────────────────────────────────────
print("\n" + "=" * 60)
print("MODEL COMPARISON TABLE (test set)")
print("=" * 60)

entries = [
    ("Logistic Regression", grid_lr.best_estimator_, t_lr),
    ("SVM",                 grid_svm.best_estimator_, t_svm),
    ("Random Forest",       grid_rf.best_estimator_, t_rf),
]

rows = []
for name, model, t in entries:
    yp    = model.predict(X_test_kb)
    yprob = model.predict_proba(X_test_kb)[:, 1]
    rows.append({
        "Model":        name,
        "Accuracy":     f"{accuracy_score(y_test, yp):.4f}",
        "F1 (macro)":   f"{f1_score(y_test, yp, average='macro'):.4f}",
        "ROC-AUC":      f"{roc_auc_score(y_test, yprob):.4f}",
        "Grid CV time": f"{t:.1f}s",
    })

df_result = pd.DataFrame(rows).set_index("Model")
print(df_result.to_string())

# 5-fold CV on full dataset
print("\n5-Fold CV (full dataset, best model per type):")
for name, model, _ in entries:
    # rebuild pipeline with scaler + selector for CV on raw X
    pipe = Pipeline([("scaler", StandardScaler()),
                     ("select", SelectKBest(f_classif, k=10)),
                     ("clf",    model)])
    scores = cross_val_score(pipe, X, y, cv=cv, scoring="accuracy")
    print(f"  {name:<22} {scores.mean():.4f} ± {scores.std():.4f}")

best_name = df_result["ROC-AUC"].idxmax()
best_model = [m for n, m, _ in entries if n == best_name][0]
print(f"\nBest model: {best_name}")
print(classification_report(y_test, best_model.predict(X_test_kb),
                             target_names=data.target_names))
