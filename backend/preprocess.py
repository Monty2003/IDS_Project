import os
import glob
import pandas as pd
import numpy as np


RAW_DATA_FOLDER = "../data/raw"
PROCESSED_DATA_FOLDER = "../data/processed"
OUTPUT_FILE = os.path.join(PROCESSED_DATA_FOLDER, "cicids_multiclass_clean.csv")


def map_attack(label: str) -> str:
    label = str(label).strip()

    if label == "BENIGN":
        return "BENIGN"
    elif "DDoS" in label:
        return "DDoS"
    elif "DoS" in label:
        return "DoS"
    elif "PortScan" in label:
        return "PortScan"
    elif "Bot" in label:
        return "Bot"
    elif "Patator" in label:
        return "Brute Force"
    elif "Web Attack" in label or "Brute Force" in label or "XSS" in label or "Sql Injection" in label:
        return "Web Attack"
    elif "Infiltration" in label:
        return "Infiltration"
    elif "Heartbleed" in label:
        return "Heartbleed"
    else:
        return "Other"


def load_and_merge_csv_files(folder_path: str) -> pd.DataFrame:
    csv_files = glob.glob(os.path.join(folder_path, "*.csv"))

    if not csv_files:
        raise FileNotFoundError(f"No CSV files found in {folder_path}")

    df_list = []

    for file in csv_files:
        print(f"Loading: {file}")
        temp_df = pd.read_csv(file, low_memory=False)
        df_list.append(temp_df)

    merged_df = pd.concat(df_list, ignore_index=True)
    print(f"Merged dataset shape: {merged_df.shape}")

    return merged_df


def clean_dataset(df: pd.DataFrame) -> pd.DataFrame:
    df.columns = df.columns.str.strip()

    if "Label" not in df.columns:
        raise ValueError("Label column not found in raw dataset.")

    # Remove duplicate rows
    df = df.drop_duplicates()

    # Replace inf values
    df = df.replace([np.inf, -np.inf], np.nan)

    # Drop rows with missing label
    df = df.dropna(subset=["Label"])

    # Strip label text
    df["Label"] = df["Label"].astype(str).str.strip()

    # Optional grouping of labels
    df["Label"] = df["Label"].apply(map_attack)

    # Drop columns that are clearly identifiers or non-useful if present
    columns_to_drop = [col for col in ["Flow ID", "Source IP", "Destination IP", "Timestamp"] if col in df.columns]
    if columns_to_drop:
        df = df.drop(columns=columns_to_drop)
        print(f"Dropped columns: {columns_to_drop}")

    # Convert feature columns to numeric where possible
    feature_columns = [col for col in df.columns if col != "Label"]

    for col in feature_columns:
        df[col] = pd.to_numeric(df[col], errors="coerce")

    # Replace remaining NaN in features with 0
    df[feature_columns] = df[feature_columns].fillna(0)

    print(f"Cleaned dataset shape: {df.shape}")
    return df


def main():
    os.makedirs(PROCESSED_DATA_FOLDER, exist_ok=True)

    df = load_and_merge_csv_files(RAW_DATA_FOLDER)
    df = clean_dataset(df)

    print("\nLabel distribution:")
    print(df["Label"].value_counts())

    df.to_csv(OUTPUT_FILE, index=False)
    print(f"\nSaved cleaned multiclass dataset to: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()