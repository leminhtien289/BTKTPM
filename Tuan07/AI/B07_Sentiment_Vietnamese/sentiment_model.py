"""
B07 — Vietnamese Sentiment Analysis: TF-IDF + Logistic Regression
Dataset: synthetic Vietnamese reviews (tích cực / tiêu cực)
"""

import re
import pickle
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score, classification_report
from sklearn.pipeline import Pipeline


# ── Vietnamese text data ──────────────────────────────────────────────────────
# Positive (1) = tích cực, Negative (0) = tiêu cực
texts = [
    # Positive reviews
    ("sản phẩm rất tốt, chất lượng tuyệt vời, rất hài lòng", 1),
    ("giao hàng nhanh, đóng gói cẩn thận, sẽ mua lại", 1),
    ("hàng đúng mô tả, giá hợp lý, shop uy tín", 1),
    ("chất lượng vượt mong đợi, đẹp hơn ảnh nhiều", 1),
    ("dịch vụ khách hàng tốt, hỗ trợ nhiệt tình", 1),
    ("sản phẩm xịn, bền đẹp, đáng đồng tiền", 1),
    ("mua lần 3 rồi, luôn hài lòng, tin tưởng shop", 1),
    ("chất liệu tốt, màu sắc đẹp như hình", 1),
    ("giao hàng siêu nhanh, hàng chính hãng", 1),
    ("tuyệt vời, không có gì để chê", 1),
    ("sản phẩm ngon, giá rẻ, ship nhanh", 1),
    ("ưng ý lắm, sẽ giới thiệu bạn bè", 1),
    ("đẹp lắm, vừa size, màu y như hình", 1),
    ("cực kỳ hài lòng, đúng hàng không bị lỗi", 1),
    ("chất lượng ổn, giá tốt, đánh giá 5 sao", 1),
    # Negative reviews
    ("hàng kém chất lượng, không giống mô tả chút nào", 0),
    ("giao hàng chậm, bị móp méo, thất vọng quá", 0),
    ("lừa đảo, hàng giả, không mua nữa", 0),
    ("chất liệu tệ, mùi khó chịu, bỏ luôn", 0),
    ("shop không nhiệt tình, hỗ trợ kém", 0),
    ("hàng khác hình nhiều, bị lỗi không đổi được", 0),
    ("tệ lắm, mua về không dùng được", 0),
    ("giá cao mà chất lượng thấp, không đáng", 0),
    ("giao sai hàng, liên hệ không được, rất tức", 0),
    ("đồ dễ hỏng, chỉ dùng được mấy ngày", 0),
    ("màu khác hình, size không đúng, thất vọng", 0),
    ("không như quảng cáo, cảm giác bị lừa", 0),
    ("shop im lặng khi khiếu nại, dịch vụ tệ", 0),
    ("hàng bị ẩm, đóng gói kém, về bị hỏng luôn", 0),
    ("mua rồi hối hận, không giới thiệu được", 0),
]

# Augment dataset (simulate more samples)
texts = texts * 15   # 450 samples
np.random.seed(42)
np.random.shuffle(texts)

corpus = [t[0] for t in texts]
labels = [t[1] for t in texts]


# ── Text preprocessing ────────────────────────────────────────────────────────
def preprocess_vi(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^\w\s]", " ", text)    # remove punctuation
    text = re.sub(r"\s+", " ", text).strip()
    return text

corpus_clean = [preprocess_vi(t) for t in corpus]


# ── Train/test split ──────────────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    corpus_clean, labels, test_size=0.2, random_state=42, stratify=labels
)


# ── Pipeline: TF-IDF + Logistic Regression ───────────────────────────────────
pipeline = Pipeline([
    ("tfidf", TfidfVectorizer(
        ngram_range=(1, 2),     # unigrams + bigrams
        max_features=5000,
        min_df=2,               # ignore rare terms
        sublinear_tf=True,      # log TF
    )),
    ("clf", LogisticRegression(
        C=1.0,
        max_iter=1000,
        random_state=42,
    )),
])

pipeline.fit(X_train, y_train)
y_pred = pipeline.predict(X_test)

print("=" * 50)
print("SENTIMENT MODEL EVALUATION")
print("=" * 50)
print(f"Accuracy: {accuracy_score(y_test, y_pred):.4f}")
print(f"\nClassification Report:")
print(classification_report(y_test, y_pred,
                             target_names=["Negative (0)", "Positive (1)"]))

cv_scores = cross_val_score(pipeline, corpus_clean, labels, cv=5, scoring="accuracy")
print(f"5-Fold CV: {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")


# ── Top features ──────────────────────────────────────────────────────────────
tfidf = pipeline.named_steps["tfidf"]
clf   = pipeline.named_steps["clf"]
features = tfidf.get_feature_names_out()
coef = clf.coef_[0]

top_positive = [(features[i], coef[i]) for i in coef.argsort()[-10:][::-1]]
top_negative = [(features[i], coef[i]) for i in coef.argsort()[:10]]

print("\nTop positive keywords:")
for word, weight in top_positive:
    print(f"  {word:<25} {weight:+.4f}")

print("\nTop negative keywords:")
for word, weight in top_negative:
    print(f"  {word:<25} {weight:+.4f}")


# ── Demo predictions ──────────────────────────────────────────────────────────
demos = [
    "sản phẩm rất tốt, giao hàng nhanh, hài lòng",
    "hàng tệ lắm, bị lừa, không mua nữa",
    "ổn thôi, không có gì đặc biệt",
]
print("\n" + "=" * 50)
print("DEMO PREDICTIONS")
print("=" * 50)
for text in demos:
    pred = pipeline.predict([preprocess_vi(text)])[0]
    prob = pipeline.predict_proba([preprocess_vi(text)])[0]
    label = "POSITIVE" if pred == 1 else "NEGATIVE"
    conf = prob[pred]
    print(f'  "{text[:45]}..."')
    print(f"  → {label} ({conf*100:.1f}% confidence)\n")


# ── Save model ────────────────────────────────────────────────────────────────
with open("sentiment_pipeline.pkl", "wb") as f:
    pickle.dump(pipeline, f)
print("Model saved: sentiment_pipeline.pkl")
