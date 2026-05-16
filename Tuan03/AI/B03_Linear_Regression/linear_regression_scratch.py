"""
B03 — Linear Regression + Logistic Regression từ đầu (Gradient Descent)
So sánh với sklearn
"""

import numpy as np
import matplotlib.pyplot as plt
from sklearn.datasets import make_regression, make_classification
from sklearn.linear_model import LinearRegression, LogisticRegression
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import r2_score, mean_squared_error, accuracy_score, f1_score


# ═══════════════════════════════════════════════════════════
# PHẦN 1 — LINEAR REGRESSION
# ═══════════════════════════════════════════════════════════

class LinearRegressionGD:
    """Linear Regression tự code bằng Gradient Descent."""

    def __init__(self, learning_rate=0.01, n_iterations=1000):
        self.lr = learning_rate
        self.n_iter = n_iterations
        self.weights = None
        self.bias = None
        self.loss_history = []

    def fit(self, X, y):
        n, d = X.shape
        self.weights = np.zeros(d)
        self.bias = 0.0
        for i in range(self.n_iter):
            y_pred = X @ self.weights + self.bias
            loss = np.mean((y_pred - y) ** 2)          # MSE
            self.loss_history.append(loss)
            dw = (2 / n) * X.T @ (y_pred - y)          # gradient w
            db = (2 / n) * np.sum(y_pred - y)           # gradient b
            self.weights -= self.lr * dw
            self.bias    -= self.lr * db
            if i % 200 == 0:
                print(f"  [LR] iter {i:4d}: loss={loss:.4f}")
        return self

    def predict(self, X):
        return X @ self.weights + self.bias


# Dataset
X_reg, y_reg = make_regression(n_samples=500, n_features=4, noise=15, random_state=42)
scaler_reg = StandardScaler()
X_reg_s = scaler_reg.fit_transform(X_reg)
split = int(0.8 * len(X_reg_s))
Xr_tr, Xr_te = X_reg_s[:split], X_reg_s[split:]
yr_tr, yr_te = y_reg[:split], y_reg[split:]

print("=" * 60)
print("PART 1: LINEAR REGRESSION")
print("=" * 60)

lr_gd = LinearRegressionGD(learning_rate=0.05, n_iterations=800)
lr_gd.fit(Xr_tr, yr_tr)
y_pred_lr_gd = lr_gd.predict(Xr_te)

lr_sk = LinearRegression().fit(Xr_tr, yr_tr)
y_pred_lr_sk = lr_sk.predict(Xr_te)

print(f"\n{'Method':<30} {'R²':>8} {'RMSE':>10}")
print("-" * 50)
print(f"{'Gradient Descent (custom)':<30} "
      f"{r2_score(yr_te, y_pred_lr_gd):>8.4f} "
      f"{np.sqrt(mean_squared_error(yr_te, y_pred_lr_gd)):>10.4f}")
print(f"{'sklearn LinearRegression':<30} "
      f"{r2_score(yr_te, y_pred_lr_sk):>8.4f} "
      f"{np.sqrt(mean_squared_error(yr_te, y_pred_lr_sk)):>10.4f}")


# ═══════════════════════════════════════════════════════════
# PHẦN 2 — LOGISTIC REGRESSION
# ═══════════════════════════════════════════════════════════

class LogisticRegressionGD:
    """Logistic Regression tự code bằng Gradient Descent + Binary Cross-Entropy."""

    def __init__(self, learning_rate=0.1, n_iterations=1000, reg_lambda=0.01):
        self.lr = learning_rate
        self.n_iter = n_iterations
        self.reg = reg_lambda       # L2 regularization
        self.weights = None
        self.bias = None
        self.loss_history = []

    @staticmethod
    def _sigmoid(z):
        # Numerically stable sigmoid
        return np.where(z >= 0,
                        1 / (1 + np.exp(-z)),
                        np.exp(z) / (1 + np.exp(z)))

    def fit(self, X, y):
        n, d = X.shape
        self.weights = np.zeros(d)
        self.bias = 0.0

        for i in range(self.n_iter):
            z = X @ self.weights + self.bias
            y_hat = self._sigmoid(z)

            # Binary Cross-Entropy loss + L2 regularization
            loss = -np.mean(y * np.log(y_hat + 1e-9) +
                            (1 - y) * np.log(1 - y_hat + 1e-9))
            loss += (self.reg / (2 * n)) * np.sum(self.weights ** 2)
            self.loss_history.append(loss)

            # Gradients
            dw = (1 / n) * X.T @ (y_hat - y) + (self.reg / n) * self.weights
            db = (1 / n) * np.sum(y_hat - y)

            self.weights -= self.lr * dw
            self.bias    -= self.lr * db

            if i % 200 == 0:
                acc = np.mean((y_hat >= 0.5).astype(int) == y)
                print(f"  [LogR] iter {i:4d}: loss={loss:.4f}, acc={acc:.4f}")
        return self

    def predict_proba(self, X):
        return self._sigmoid(X @ self.weights + self.bias)

    def predict(self, X, threshold=0.5):
        return (self.predict_proba(X) >= threshold).astype(int)


# Dataset
X_cls, y_cls = make_classification(
    n_samples=600, n_features=6, n_informative=4,
    n_redundant=1, random_state=42
)
scaler_cls = StandardScaler()
X_cls_s = scaler_cls.fit_transform(X_cls)
split_c = int(0.8 * len(X_cls_s))
Xc_tr, Xc_te = X_cls_s[:split_c], X_cls_s[split_c:]
yc_tr, yc_te = y_cls[:split_c], y_cls[split_c:]

print("\n" + "=" * 60)
print("PART 2: LOGISTIC REGRESSION")
print("=" * 60)

log_gd = LogisticRegressionGD(learning_rate=0.2, n_iterations=800, reg_lambda=0.01)
log_gd.fit(Xc_tr, yc_tr)
y_pred_log_gd = log_gd.predict(Xc_te)

log_sk = LogisticRegression(C=100, max_iter=1000).fit(Xc_tr, yc_tr)
y_pred_log_sk = log_sk.predict(Xc_te)

print(f"\n{'Method':<30} {'Accuracy':>10} {'F1 (macro)':>12}")
print("-" * 55)
print(f"{'Gradient Descent (custom)':<30} "
      f"{accuracy_score(yc_te, y_pred_log_gd):>10.4f} "
      f"{f1_score(yc_te, y_pred_log_gd, average='macro'):>12.4f}")
print(f"{'sklearn LogisticRegression':<30} "
      f"{accuracy_score(yc_te, y_pred_log_sk):>10.4f} "
      f"{f1_score(yc_te, y_pred_log_sk, average='macro'):>12.4f}")


# ── Plot ──────────────────────────────────────────────────────────────────────
fig, axes = plt.subplots(1, 3, figsize=(15, 4))

axes[0].plot(lr_gd.loss_history)
axes[0].set_title("Linear Regression — Loss curve")
axes[0].set_xlabel("Iteration"); axes[0].set_ylabel("MSE"); axes[0].set_yscale("log")

axes[1].plot(log_gd.loss_history)
axes[1].set_title("Logistic Regression — Loss curve")
axes[1].set_xlabel("Iteration"); axes[1].set_ylabel("BCE Loss")

axes[2].scatter(yr_te, y_pred_lr_gd, alpha=0.4, s=15, label="GD")
axes[2].scatter(yr_te, y_pred_lr_sk, alpha=0.4, s=15, marker="x", label="sklearn")
axes[2].plot([yr_te.min(), yr_te.max()], [yr_te.min(), yr_te.max()], "k--")
axes[2].set_title("Linear Regression — Predictions")
axes[2].set_xlabel("Actual"); axes[2].set_ylabel("Predicted"); axes[2].legend()

plt.tight_layout()
plt.savefig("regression_comparison.png", dpi=100)
print("\nChart saved: regression_comparison.png")
