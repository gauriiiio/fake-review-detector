# Fake Review Detector

A Chrome extension that detects fake product reviews on Amazon and Flipkart using NLP and machine learning.

## Demo
Open any Amazon product page and click the extension icon to get an instant trust score.

## Features
- Real-time fake review detection on Amazon and Flipkart
- Trust score (0-100%) with model confidence
- Flags suspicious patterns — review bursts, unusually short reviews, rating manipulation
- Handles "no reviews" case with listing-level red flags

## Tech Stack
- **ML Model** — Logistic Regression + TF-IDF + behavioral features, trained on 40k labeled reviews (86% accuracy)
- **Backend** — FastAPI deployed on Render
- **Extension** — Chrome MV3 (Manifest V3)

## Architecture
```
Chrome Extension (JS)
       ↓
FastAPI Backend (Python) — live at https://fake-review-detector-cmlm.onrender.com
       ↓
Scikit-learn Model (TF-IDF + Logistic Regression)
```

## Local Setup

**Backend**
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn api.main:app --reload
```

**Extension**
1. Open `chrome://extensions/`
2. Enable Developer Mode
3. Click Load Unpacked → select the `extension/` folder

## Model Details
- Dataset: 40,432 labeled Amazon reviews (balanced — 50% genuine, 50% fake)
- Features: TF-IDF (5000 features) + review length + star rating
- Accuracy: 86% on held-out test set
- Saved as `model.pkl` + `vectorizer.pkl`, loaded at API startup

## API
`POST /analyze`
```json
{
  "reviews": [
    {"text": "Amazing product!", "rating": 5.0}
  ]
}
```
Returns trust score, confidence, fake count, and flags.