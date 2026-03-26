import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report, accuracy_score

INPUT_FILE = "../data/processed/cicids_multiclass_selected.csv"
MODEL_OUTPUT = "../models/ids_model.pkl"


def main():
    print("Loading dataset...")
    df = pd.read_csv(INPUT_FILE)

    # Split features and label
    X = df.drop("Label", axis=1)
    y = df["Label"]

    print("Classes:", y.unique())

    # Train-test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )

    print("Training model...")

    model = RandomForestClassifier(
        n_estimators=50,
        max_depth=15,
        n_jobs=-1,
        random_state=42
    )

    model.fit(X_train, y_train)

    print("Model training completed")

    # Predictions
    y_pred = model.predict(X_test)

    # Accuracy
    acc = accuracy_score(y_test, y_pred)
    print(f"\n🔥 Accuracy: {acc * 100:.2f}%")

    # Classification Report
    print("\n📊 Classification Report:")
    print(classification_report(y_test, y_pred))

    # Save model
    joblib.dump(model, MODEL_OUTPUT)
    print(f"\n✅ Model saved at: {MODEL_OUTPUT}")


if __name__ == "__main__":
    main()