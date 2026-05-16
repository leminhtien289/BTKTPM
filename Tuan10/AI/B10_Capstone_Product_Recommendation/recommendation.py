"""
B10 — Capstone: AI Product Recommendation
Collaborative Filtering (User-Based + Item-Based) + TF-IDF Content-Based
"""

import numpy as np
import pandas as pd
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.feature_extraction.text import TfidfVectorizer

np.random.seed(42)


# ── 1. Generate synthetic e-commerce data ─────────────────────────────────────
USERS    = [f"user_{i}" for i in range(1, 31)]   # 30 users
PRODUCTS = {
    "P001": "điện thoại samsung galaxy s24 ultra màn hình amoled",
    "P002": "laptop macbook air m2 chip apple silicon",
    "P003": "tai nghe sony wh-1000xm5 chống ồn bluetooth",
    "P004": "máy ảnh canon eos r50 mirrorless",
    "P005": "đồng hồ apple watch series 9",
    "P006": "loa bluetooth jbl charge 5",
    "P007": "bàn phím cơ keychron k2 wireless",
    "P008": "chuột logitech mx master 3",
    "P009": "màn hình lg 27 inch 4k",
    "P010": "ổ cứng ssd samsung 1tb nvme",
}

# User-Product ratings matrix (0 = not rated, 1-5 = rating)
ratings_data = np.array([
    # P001 P002 P003 P004 P005 P006 P007 P008 P009 P010
    [  5,   4,   0,   0,   5,   3,   0,   0,   0,   0],  # user_1  (phone/smartwatch)
    [  0,   5,   0,   0,   0,   0,   4,   5,   4,   5],  # user_2  (laptop/accessories)
    [  4,   0,   5,   4,   0,   4,   0,   0,   0,   0],  # user_3  (phone/audio)
    [  0,   4,   0,   0,   0,   0,   5,   4,   5,   4],  # user_4  (laptop/peripherals)
    [  5,   0,   4,   0,   4,   5,   0,   0,   0,   0],  # user_5
    [  0,   5,   0,   0,   0,   0,   4,   0,   4,   5],  # user_6
    [  3,   0,   0,   5,   0,   0,   0,   0,   4,   0],  # user_7  (camera/monitor)
    [  0,   0,   5,   0,   0,   4,   0,   0,   0,   0],  # user_8  (audio)
    [  4,   3,   0,   0,   3,   0,   0,   0,   0,   3],  # user_9
    [  0,   5,   0,   0,   0,   0,   0,   5,   5,   4],  # user_10
], dtype=float)

# Pad to 30 users with some noise
extra = np.random.randint(0, 6, (20, 10)).astype(float)
extra[extra < 2] = 0  # sparse matrix (most are 0)
ratings = np.vstack([ratings_data, extra])

df_ratings = pd.DataFrame(ratings, index=USERS, columns=list(PRODUCTS.keys()))


# ── 2. User-Based Collaborative Filtering ────────────────────────────────────
def user_based_cf(df: pd.DataFrame, user_id: str, top_n: int = 3) -> list[tuple]:
    """Recommend products based on similar users."""
    user_vec = df.loc[user_id].values.reshape(1, -1)

    # Cosine similarity between target user and all others
    sims = cosine_similarity(user_vec, df.values)[0]
    sim_users = pd.Series(sims, index=df.index).drop(user_id).nlargest(5)

    # Weighted sum of ratings from similar users
    weighted_ratings = np.zeros(df.shape[1])
    sim_sum = 0
    for sim_user, sim_score in sim_users.items():
        weighted_ratings += sim_score * df.loc[sim_user].values
        sim_sum += sim_score

    pred_ratings = weighted_ratings / (sim_sum + 1e-10)

    # Filter out already-rated products
    already_rated = df.loc[user_id] > 0
    pred_ratings[already_rated.values] = 0

    top_idx = pred_ratings.argsort()[::-1][:top_n]
    return [(df.columns[i], round(pred_ratings[i], 2)) for i in top_idx if pred_ratings[i] > 0]


# ── 3. Item-Based Collaborative Filtering ────────────────────────────────────
def item_based_cf(df: pd.DataFrame, user_id: str, top_n: int = 3) -> list[tuple]:
    """Recommend products similar to what user already liked."""
    item_sim = cosine_similarity(df.T)   # product × product similarity
    item_sim_df = pd.DataFrame(item_sim, index=df.columns, columns=df.columns)

    user_ratings = df.loc[user_id]
    liked = user_ratings[user_ratings >= 4].index.tolist()

    if not liked:
        return []

    # Aggregate similarity scores from liked items
    scores = pd.Series(0.0, index=df.columns)
    for item in liked:
        scores += item_sim_df[item]
    scores[liked] = 0  # exclude already-liked

    top = scores.nlargest(top_n)
    return [(prod, round(score, 4)) for prod, score in top.items()]


# ── 4. Content-Based Filtering (TF-IDF) ──────────────────────────────────────
tfidf = TfidfVectorizer(ngram_range=(1, 2))
item_matrix = tfidf.fit_transform(list(PRODUCTS.values()))
content_sim = cosine_similarity(item_matrix)
content_sim_df = pd.DataFrame(content_sim, index=PRODUCTS.keys(), columns=PRODUCTS.keys())

def content_based(product_id: str, top_n: int = 3) -> list[tuple]:
    """Recommend products with similar description."""
    sims = content_sim_df[product_id].drop(product_id).nlargest(top_n)
    return [(prod, round(score, 4)) for prod, score in sims.items()]


# ── 5. Hybrid Recommender ─────────────────────────────────────────────────────
def hybrid_recommend(df: pd.DataFrame, user_id: str, top_n: int = 5) -> pd.DataFrame:
    """Combine collaborative + content-based scores."""
    user_cf  = dict(user_based_cf(df, user_id, top_n=10))
    item_cf  = dict(item_based_cf(df, user_id, top_n=10))
    all_products = set(user_cf) | set(item_cf)

    rows = []
    for prod in all_products:
        u_score = user_cf.get(prod, 0)
        i_score = item_cf.get(prod, 0)
        hybrid  = 0.5 * u_score + 0.5 * i_score
        rows.append({"product_id": prod,
                     "name": PRODUCTS.get(prod, ""),
                     "user_cf": u_score,
                     "item_cf": i_score,
                     "hybrid_score": round(hybrid, 4)})

    result = pd.DataFrame(rows).sort_values("hybrid_score", ascending=False).head(top_n)
    return result.reset_index(drop=True)


# ── 6. Demo ───────────────────────────────────────────────────────────────────
target_user = "user_1"
rated = df_ratings.loc[target_user]
print(f"{'=' * 60}")
print(f"USER: {target_user}")
print(f"{'=' * 60}")
print("Already rated:")
for prod, rating in rated[rated > 0].items():
    print(f"  {prod} ({PRODUCTS[prod][:35]}...): {int(rating)}/5")

print(f"\nUser-Based CF recommendations:")
for prod, score in user_based_cf(df_ratings, target_user):
    print(f"  {prod} — {PRODUCTS[prod][:40]} (pred rating: {score})")

print(f"\nItem-Based CF recommendations:")
for prod, score in item_based_cf(df_ratings, target_user):
    print(f"  {prod} — {PRODUCTS[prod][:40]} (sim: {score})")

print(f"\nContent-Based (for P001 — Samsung phone):")
for prod, score in content_based("P001"):
    print(f"  {prod} — {PRODUCTS[prod][:40]} (content sim: {score})")

print(f"\nHybrid Recommendations (top 5):")
recs = hybrid_recommend(df_ratings, target_user)
print(recs[["product_id", "name", "user_cf", "item_cf", "hybrid_score"]].to_string(index=False))
