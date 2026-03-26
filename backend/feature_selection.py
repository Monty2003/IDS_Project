import os
import joblib
import pandas as pd
from sklearn.ensemble import RandomForestClassifier

INPUT_FILE = "../data/processed/cicids_multiclass_clean.csv"
OUTPUT_FILE = "../data/processed/cicids_multiclass_selected.csv"
MODEL_FEATURES_FILE = "../models/feature_columns.pkl"


def main():
    df = pd.read_csv(INPUT_FILE)

    if "Label" not in df.columns:
        raise ValueError("Label column not found in cleaned dataset.")

    X = df.drop("Label", axis=1)
    y = df["Label"]

    print(f"Input feature shape: {X.shape}")
    print(f"Target classes: {y.nunique()}")

    selector_model = RandomForestClassifier(
        n_estimators=100,
        random_state=42,
        n_jobs=-1
    )
    selector_model.fit(X, y)

    importances = selector_model.feature_importances_
    feature_importance_df = pd.DataFrame({
        "feature": X.columns,
        "importance": importances
    }).sort_values(by="importance", ascending=False)

    top_n = 20
    top_features = feature_importance_df.head(top_n)["feature"].tolist()

    print(f"\nTop {top_n} selected features:")
    print(top_features)

    X_selected = X[top_features]

    # Add Label back
    df_selected = X_selected.copy()
    df_selected["Label"] = y

    os.makedirs("../models", exist_ok=True)
    df_selected.to_csv(OUTPUT_FILE, index=False)
    joblib.dump(top_features, MODEL_FEATURES_FILE)

    print(f"\nSaved selected dataset to: {OUTPUT_FILE}")
    print(f"Saved feature columns to: {MODEL_FEATURES_FILE}")


if __name__ == "__main__":
    main()