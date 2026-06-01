import pandas as pd
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report, accuracy_score
import numpy as np
import scipy.sparse as sp
import joblib

print("Starting...")

def load_data(path):
    print("Loading data...")
    df = pd.read_csv(path)
    df = df.dropna(subset=['text_'])
    df['text_'] = df['text_'].str.strip()
    df['label'] = df['label'].map({'CG': 1, 'OR': 0})
    print("Data loaded:", df.shape)
    return df

def extract_features(df, vectorizer=None, fit=True):
    print("Extracting features...")
    df['review_length'] = df['text_'].apply(lambda x: len(x.split()))
    if fit:
        vectorizer = TfidfVectorizer(max_features=5000, stop_words='english')
        tfidf_matrix = vectorizer.fit_transform(df['text_'])
    else:
        tfidf_matrix = vectorizer.transform(df['text_'])
    behavioral = df[['rating', 'review_length']].fillna(0).values
    combined = sp.hstack([tfidf_matrix, sp.csr_matrix(behavioral)])
    print("Features extracted:", combined.shape)
    return combined, vectorizer

def train_model(X_train, y_train):
    print("Training model...")
    model = LogisticRegression(max_iter=1000)
    model.fit(X_train, y_train)
    print("Training done.")
    return model

df = load_data('fake_reviews.csv')
train_df, test_df = train_test_split(df, test_size=0.2, random_state=42)
X_train, vectorizer = extract_features(train_df, fit=True)
X_test, _ = extract_features(test_df, vectorizer=vectorizer, fit=False)
y_train = train_df['label']
y_test = test_df['label']
model = train_model(X_train, y_train)
y_pred = model.predict(X_test)
print("Accuracy:", accuracy_score(y_test, y_pred))
print("\nClassification Report:\n", classification_report(y_test, y_pred))
joblib.dump(model, 'model.pkl')
joblib.dump(vectorizer, 'vectorizer.pkl')
print("\nModel saved!")