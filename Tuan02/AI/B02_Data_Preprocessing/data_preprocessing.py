"""
B02 — Data Preprocessing (không dùng sklearn preprocessing)
Tự implement: Normalization, Missing Values, Encoding, Train/Test Split
"""

import numpy as np
import pandas as pd


# ── Sample dataset ─────────────────────────────────────────────────────────────
np.random.seed(42)
n = 200

df = pd.DataFrame({
    "age":        np.random.randint(18, 70, n).astype(float),
    "income":     np.random.randint(20000, 150000, n).astype(float),
    "experience": np.random.randint(0, 40, n).astype(float),
    "city":       np.random.choice(["HCM", "HN", "DN", "CT"], n),
    "education":  np.random.choice(["high_school", "bachelor", "master", "phd"], n),
    "purchased":  np.random.choice([0, 1], n),
})

# Inject 10% missing values
for col in ["age", "income", "experience"]:
    mask = np.random.choice([True, False], n, p=[0.1, 0.9])
    df.loc[mask, col] = np.nan

print("=" * 55)
print("ORIGINAL DATA")
print("=" * 55)
print(df.head(5))
print(f"\nMissing:\n{df.isnull().sum()}")


# ── Step 1: Handle Missing Values (tự implement — dùng median) ────────────────
print("\n" + "=" * 55)
print("STEP 1: Fill Missing Values (median, tự tính)")
print("=" * 55)

def fill_median(series: pd.Series) -> pd.Series:
    median = series.dropna().sort_values().iloc[len(series.dropna()) // 2]
    return series.fillna(median)

for col in ["age", "income", "experience"]:
    median_val = df[col].dropna().sort_values().iloc[len(df[col].dropna()) // 2]
    df[col] = df[col].fillna(median_val)
    print(f"  {col}: median = {median_val:.1f}")

print(f"Missing after fill: {df.isnull().sum().sum()}")


# ── Step 2: Encode Categorical (tự implement) ──────────────────────────────────
print("\n" + "=" * 55)
print("STEP 2: Encode Categorical (tự implement)")
print("=" * 55)

# Label Encoding cho ordinal (education)
edu_order = {"high_school": 0, "bachelor": 1, "master": 2, "phd": 3}
df["education_enc"] = df["education"].map(edu_order)
print("Education label encoded:", df[["education","education_enc"]].drop_duplicates().sort_values("education_enc").values)

# One-Hot Encoding cho nominal (city) — tự viết
def one_hot_encode(series: pd.Series) -> pd.DataFrame:
    categories = sorted(series.unique())
    result = {}
    for cat in categories[1:]:          # drop_first để tránh multicollinearity
        result[f"{series.name}_{cat}"] = (series == cat).astype(int)
    return pd.DataFrame(result, index=series.index)

city_ohe = one_hot_encode(df["city"])
df = pd.concat([df, city_ohe], axis=1)
df.drop(columns=["city", "education"], inplace=True)
print(f"City OHE columns: {[c for c in df.columns if c.startswith('city_')]}")


# ── Step 3: Train/Test Split (tự implement — stratified) ─────────────────────
print("\n" + "=" * 55)
print("STEP 3: Train/Test Split (tự implement, stratified)")
print("=" * 55)

def train_test_split_manual(X: np.ndarray, y: np.ndarray,
                             test_size: float = 0.2,
                             random_state: int = 42) -> tuple:
    rng = np.random.default_rng(random_state)
    classes = np.unique(y)
    train_idx, test_idx = [], []
    for cls in classes:
        idx = np.where(y == cls)[0]
        rng.shuffle(idx)
        n_test = max(1, int(len(idx) * test_size))
        test_idx.extend(idx[:n_test])
        train_idx.extend(idx[n_test:])
    rng.shuffle(train_idx); rng.shuffle(test_idx)
    return (X[train_idx], X[test_idx], y[train_idx], y[test_idx])

X = df.drop(columns=["purchased"]).values.astype(float)
y = df["purchased"].values

X_train, X_test, y_train, y_test = train_test_split_manual(X, y, test_size=0.2)
print(f"Train: {X_train.shape}, Test: {X_test.shape}")
print(f"Class balance train: {dict(zip(*np.unique(y_train, return_counts=True)))}")
print(f"Class balance test:  {dict(zip(*np.unique(y_test, return_counts=True)))}")


# ── Step 4: Standardization (tự implement — Z-score) ─────────────────────────
print("\n" + "=" * 55)
print("STEP 4: Standardize (Z-score, tự implement)")
print("=" * 55)

def standardize(X_train: np.ndarray, X_test: np.ndarray,
                cols: list[int]) -> tuple[np.ndarray, np.ndarray]:
    """Fit on train, transform both — tránh data leakage."""
    X_train, X_test = X_train.copy(), X_test.copy()
    for col in cols:
        mean = X_train[:, col].mean()
        std  = X_train[:, col].std() + 1e-8   # avoid division by zero
        X_train[:, col] = (X_train[:, col] - mean) / std
        X_test[:, col]  = (X_test[:, col]  - mean) / std
    return X_train, X_test

# columns 0,1,2 = age, income, experience
X_train_s, X_test_s = standardize(X_train, X_test, cols=[0, 1, 2])
print(f"Mean col[0-2] after std (train): {X_train_s[:, :3].mean(axis=0).round(4)}")
print(f"Std  col[0-2] after std (train): {X_train_s[:, :3].std(axis=0).round(4)}")


# ── Step 5: Min-Max Normalization (tự implement) ──────────────────────────────
print("\n" + "=" * 55)
print("STEP 5: Min-Max Normalize (tự implement)")
print("=" * 55)

def minmax_normalize(X_train: np.ndarray, X_test: np.ndarray,
                     cols: list[int]) -> tuple[np.ndarray, np.ndarray]:
    X_train, X_test = X_train.copy(), X_test.copy()
    for col in cols:
        x_min = X_train[:, col].min()
        x_max = X_train[:, col].max()
        X_train[:, col] = (X_train[:, col] - x_min) / (x_max - x_min + 1e-8)
        X_test[:, col]  = (X_test[:, col]  - x_min) / (x_max - x_min + 1e-8)
    return X_train, X_test

X_train_mm, X_test_mm = minmax_normalize(X_train, X_test, cols=[0, 1, 2])
print(f"Min col[0-2] after norm (train): {X_train_mm[:, :3].min(axis=0).round(4)}")
print(f"Max col[0-2] after norm (train): {X_train_mm[:, :3].max(axis=0).round(4)}")

print(f"\nFinal X_train shape: {X_train_s.shape}")
print("Preprocessing hoàn tất (0 sklearn preprocessing used).")
