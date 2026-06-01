from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import joblib
import numpy as np
import scipy.sparse as sp

app = FastAPI()

# Allow Chrome extension to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load model and vectorizer once when server starts
model = joblib.load("../model/model.pkl")
vectorizer = joblib.load("../model/vectorizer.pkl")

# Define what the request body looks like
class Review(BaseModel):
    text: str
    rating: float

class AnalyzeRequest(BaseModel):
    reviews: List[Review]

@app.post("/analyze")
def analyze_reviews(request: AnalyzeRequest):
    texts = [r.text for r in request.reviews]
    ratings = [r.rating for r in request.reviews]
    lengths = [len(t.split()) for t in texts]

    # Extract features
    tfidf = vectorizer.transform(texts)
    behavioral = sp.csr_matrix(np.array([ratings, lengths]).T)
    X = sp.hstack([tfidf, behavioral])

    # Predict
    predictions = model.predict(X)
    probabilities = model.predict_proba(X)

    fake_count = int(sum(predictions))
    total = len(predictions)
    trust_score = round((1 - fake_count / total) * 100, 1)
    confidence = round(float(np.mean(np.max(probabilities, axis=1))) * 100, 1)

    # Flag reasons
    flags = []
    if fake_count > total * 0.3:
        flags.append("High proportion of suspicious reviews")
    if any(len(t.split()) < 5 for t in texts):
        flags.append("Some reviews are unusually short")
    if len([r for r in ratings if r == 5.0]) > total * 0.8:
        flags.append("Suspiciously high proportion of 5-star ratings")

    return {
        "trust_score": trust_score,
        "confidence": confidence,
        "total_reviews": total,
        "fake_count": fake_count,
        "flags": flags
    }

@app.get("/")
def root():
    return {"status": "Fake Review Detector API is running"}