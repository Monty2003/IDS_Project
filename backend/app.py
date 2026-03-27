import eventlet
eventlet.monkey_patch()

from flask import Flask, request, jsonify, send_file, g
from flask_cors import CORS
from flask_socketio import SocketIO, emit
from flask_limiter import Limiter
from flask_limiter.util import get_remote_address
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.server_api import ServerApi
import os
import joblib
import numpy as np
import pandas as pd
import time
import random
import io
import secrets
from datetime import datetime
from functools import wraps

# =========================
# LOAD ENV
# =========================
load_dotenv()

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY", "ids-secret-key")
app.config["MAX_CONTENT_LENGTH"] = 1024 * 1024 * 1024  # 1 GB

# =========================
# CORS + SOCKETIO
# =========================
CORS(
    app,
    resources={
        r"/*": {
            "origins": "*"
        }
    }
)

socketio = SocketIO(
    app,
    cors_allowed_origins="*",
    async_mode="eventlet"
)

# =========================
# RATE LIMITER
# =========================
limiter = Limiter(
    key_func=get_remote_address,
    default_limits=["200 per hour"],
    app=app
)

# =========================
# MODEL LOAD
# =========================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODELS_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "models"))
LOG_FILE = os.path.abspath(os.path.join(BASE_DIR, "..", "backend_logs.txt"))

model_path = os.path.join(MODELS_DIR, "ids_model.pkl")
feature_columns_path = os.path.join(MODELS_DIR, "feature_columns.pkl")

model = joblib.load(model_path)
feature_columns = joblib.load(feature_columns_path)

print("Multiclass model loaded successfully")

# =========================
# MONGODB ATLAS CONNECTION
# =========================
MONGO_URI = os.getenv("MONGO_URI")

if not MONGO_URI:
    raise ValueError("MONGO_URI not found. Please add it to your .env file.")

mongo_client = MongoClient(MONGO_URI, server_api=ServerApi("1"))
mongo_db = mongo_client["ids_project_db"]

detections_collection = mongo_db["detections"]
csv_reports_collection = mongo_db["csv_reports"]
live_logs_collection = mongo_db["live_logs"]

try:
    mongo_client.admin.command("ping")
    print("MongoDB Atlas connected successfully")
except Exception as e:
    print(f"MongoDB Atlas connection failed: {e}")

latest_csv_result = None

# =========================
# SIMPLE AUTH CONFIG
# =========================
ADMIN_USERNAME = "admin"
ADMIN_PASSWORD = "admin123"

active_tokens = set()
client_stream_status = {}


# =========================
# HELPER FUNCTIONS
# =========================
def write_log(message: str):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(f"[{timestamp}] {message}\n")
    except Exception as e:
        print(f"Log write failed: {e}")


def get_severity(prediction, confidence):
    if prediction == "BENIGN":
        return "Normal"
    if confidence < 70:
        return "Low"
    elif confidence < 85:
        return "Medium"
    elif confidence < 95:
        return "High"
    return "Critical"


def get_explanation():
    try:
        importance = model.feature_importances_
        pairs = list(zip(feature_columns, importance))
        top_features = sorted(pairs, key=lambda x: x[1], reverse=True)[:5]
        return [{"feature": f, "importance": round(float(i), 4)} for f, i in top_features]
    except Exception:
        return []


def prepare_csv_input(df):
    df.columns = df.columns.str.strip()

    drop_candidates = [
        "Label", "label", "Attack", "attack", "Class", "class",
        "Flow ID", "Source IP", "Destination IP", "Timestamp"
    ]
    df = df.drop(columns=[c for c in drop_candidates if c in df.columns], errors="ignore")

    df = df.replace([np.inf, -np.inf], np.nan)

    csv_col_map = {col.strip().lower(): col for col in df.columns}
    matched_columns = {}
    missing_features = []

    for feature in feature_columns:
        key = feature.strip().lower()

        if feature in df.columns:
            matched_columns[feature] = df[feature]
        elif key in csv_col_map:
            matched_columns[feature] = df[csv_col_map[key]]
        else:
            matched_columns[feature] = 0
            missing_features.append(feature)

    df_input = pd.DataFrame(matched_columns)
    df_input = df_input.apply(pd.to_numeric, errors="coerce").fillna(0)

    matched_count = len(feature_columns) - len(missing_features)
    overlap_ratio = matched_count / len(feature_columns) if feature_columns else 0

    return df_input, matched_count, missing_features, overlap_ratio


def get_bearer_token():
    auth_header = request.headers.get("Authorization", "")

    if not auth_header.startswith("Bearer "):
        return None

    return auth_header.replace("Bearer ", "", 1).strip()


def require_auth(func):
    @wraps(func)
    def wrapper(*args, **kwargs):
        token = get_bearer_token()

        if not token or token not in active_tokens:
            return jsonify({"error": "Unauthorized access"}), 401

        return func(*args, **kwargs)
    return wrapper


def validate_json_payload(data):
    if data is None:
        return "No JSON body received"

    if not isinstance(data, dict):
        return "Invalid JSON format"

    return None


def build_model_input_from_json(data):
    input_data = []

    for feature in feature_columns:
        value = data.get(feature, 0)

        try:
            value = float(value)
        except (ValueError, TypeError):
            raise ValueError(f"Invalid numeric value for feature: {feature}")

        input_data.append(value)

    return np.array(input_data).reshape(1, -1)


def validate_uploaded_csv():
    if "file" not in request.files:
        return None, ("No file uploaded", 400)

    file = request.files["file"]

    if file.filename == "":
        return None, ("No selected file", 400)

    if not file.filename.lower().endswith(".csv"):
        return None, ("Only CSV files are allowed", 400)

    return file, None


def generate_random_traffic():
    data = {}

    for feature in feature_columns:
        name = feature.lower()

        if "bytes" in name:
            data[feature] = random.uniform(100, 50000)
        elif "packets" in name:
            data[feature] = random.uniform(1, 2000)
        elif "duration" in name:
            data[feature] = random.uniform(1, 5000)
        elif "rate" in name:
            data[feature] = random.uniform(0, 1000)
        else:
            data[feature] = random.uniform(0, 100)

    return data


# =========================
# MIDDLEWARE: REQUEST LOGGING
# =========================
@app.before_request
def before_request_logging():
    g.start_time = time.time()


@app.after_request
def after_request_logging(response):
    try:
        duration = round((time.time() - g.start_time) * 1000, 2)
    except Exception:
        duration = -1

    write_log(
        f"{request.method} {request.path} | "
        f"status={response.status_code} | "
        f"ip={request.remote_addr} | "
        f"duration_ms={duration}"
    )
    return response


# =========================
# GLOBAL ERROR HANDLERS
# =========================
@app.errorhandler(400)
def bad_request(error):
    return jsonify({"error": "Bad request"}), 400


@app.errorhandler(401)
def unauthorized(error):
    return jsonify({"error": "Unauthorized"}), 401


@app.errorhandler(404)
def not_found(error):
    return jsonify({"error": "Route not found"}), 404


@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({"error": "File too large. Maximum allowed size is 1 GB"}), 413


@app.errorhandler(429)
def rate_limit_exceeded(error):
    return jsonify({"error": "Too many requests. Please try again later"}), 429


@app.errorhandler(500)
def internal_error(error):
    return jsonify({"error": "Internal server error"}), 500


# =========================
# BASIC ROUTES
# =========================
@app.route("/")
@limiter.limit("60 per minute")
def home():
    return "IDS Backend Running"


@app.route("/features", methods=["GET"])
@limiter.limit("60 per minute")
def get_features():
    return jsonify({"features": feature_columns})


@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "database": "mongodb_atlas",
        "model_loaded": True
    })


# =========================
# AUTH ROUTES
# =========================
@app.route("/login", methods=["POST"])
@limiter.limit("10 per minute")
def login():
    data = request.get_json()

    if not data:
        return jsonify({"error": "No JSON body received"}), 400

    username = data.get("username", "")
    password = data.get("password", "")

    if username == ADMIN_USERNAME and password == ADMIN_PASSWORD:
        token = secrets.token_hex(24)
        active_tokens.add(token)

        write_log(f"/login success username={username}")

        return jsonify({
            "message": "Login successful",
            "token": token
        })

    write_log(f"/login failed username={username}")
    return jsonify({"error": "Invalid username or password"}), 401


@app.route("/logout", methods=["POST"])
def logout():
    token = get_bearer_token()

    if token and token in active_tokens:
        active_tokens.remove(token)
        write_log("/logout success")
        return jsonify({"message": "Logout successful"})

    return jsonify({"error": "Invalid or missing token"}), 401


@app.route("/auth-status", methods=["GET"])
def auth_status():
    token = get_bearer_token()

    if token and token in active_tokens:
        return jsonify({"authenticated": True})

    return jsonify({"authenticated": False}), 401


# =========================
# SINGLE PREDICTION
# =========================
@app.route("/predict", methods=["POST"])
@limiter.limit("30 per minute")
def predict():
    data = request.get_json()
    validation_error = validate_json_payload(data)
    if validation_error:
        return jsonify({"error": validation_error}), 400

    try:
        input_array = build_model_input_from_json(data)

        prediction = model.predict(input_array)[0]
        probabilities = model.predict_proba(input_array)[0]
        confidence = float(max(probabilities) * 100)

        if prediction == "BENIGN":
            result = "Normal Traffic"
            attack_type = "BENIGN"
        else:
            result = "Attack Detected"
            attack_type = prediction

        severity = get_severity(prediction, confidence)
        explanation = get_explanation()

        detection_record = {
            "source": "manual",
            "input_data": data,
            "prediction": result,
            "attack_type": attack_type,
            "confidence": round(confidence, 2),
            "severity": severity,
            "timestamp": datetime.utcnow()
        }
        detections_collection.insert_one(detection_record)

        write_log(
            f"/predict result={result} attack_type={attack_type} "
            f"confidence={round(confidence, 2)} severity={severity}"
        )

        return jsonify({
            "prediction": result,
            "attack_type": attack_type,
            "confidence": round(confidence, 2),
            "severity": severity,
            "explanation": explanation
        })

    except ValueError as e:
        return jsonify({"error": str(e)}), 400
    except Exception as e:
        write_log(f"/predict error={str(e)}")
        return jsonify({"error": str(e)}), 500


# =========================
# CSV BATCH PREDICTION
# =========================
@app.route("/predict-csv", methods=["POST"])
@limiter.limit("10 per minute")
def predict_csv():
    global latest_csv_result

    file, error = validate_uploaded_csv()
    if error:
        message, code = error
        return jsonify({"error": message}), code

    try:
        original_filename = file.filename
        df_original = pd.read_csv(file)

        if df_original.empty:
            return jsonify({"error": "Uploaded CSV is empty"}), 400

        df_input, matched_count, missing_features, overlap_ratio = prepare_csv_input(df_original.copy())

        if overlap_ratio < 0.60:
            return jsonify({
                "error": "Uploaded CSV does not match the trained model feature structure well enough.",
                "matched_features": matched_count,
                "total_model_features": len(feature_columns),
                "overlap_percent": round(overlap_ratio * 100, 2),
                "missing_features_sample": missing_features[:20]
            }), 400

        predictions = model.predict(df_input)
        probabilities = model.predict_proba(df_input)
        confidences = probabilities.max(axis=1) * 100

        prediction_labels = []
        attack_types = []
        severities = []

        normal_count = 0
        attack_count = 0
        attack_type_counts = {}

        results = []

        for i in range(len(df_input)):
            pred = predictions[i]
            conf = float(confidences[i])
            severity = get_severity(pred, conf)

            if pred == "BENIGN":
                result_label = "Normal Traffic"
                attack_type = "BENIGN"
                normal_count += 1
            else:
                result_label = "Attack Detected"
                attack_type = pred
                attack_count += 1
                attack_type_counts[attack_type] = attack_type_counts.get(attack_type, 0) + 1

            prediction_labels.append(result_label)
            attack_types.append(attack_type)
            severities.append(severity)

            row_result = {
                "row": i + 1,
                "prediction": result_label,
                "attack_type": attack_type,
                "confidence": round(conf, 2),
                "severity": severity
            }
            results.append(row_result)

        total_rows = len(df_input)
        attack_rate = round((attack_count / total_rows) * 100, 2) if total_rows > 0 else 0
        normal_rate = round((normal_count / total_rows) * 100, 2) if total_rows > 0 else 0

        if attack_rate >= 60:
            overall_risk = "High Risk"
        elif attack_rate >= 25:
            overall_risk = "Medium Risk"
        else:
            overall_risk = "Low Risk"

        df_download = df_original.copy()
        df_download["Prediction"] = prediction_labels
        df_download["Attack Type"] = attack_types
        df_download["Confidence"] = np.round(confidences, 2)
        df_download["Severity"] = severities
        latest_csv_result = df_download

        top_attack_types = [
            {"attack_type": k, "count": v}
            for k, v in sorted(attack_type_counts.items(), key=lambda x: x[1], reverse=True)
        ]

        csv_report_record = {
            "source": "csv_summary",
            "filename": original_filename,
            "total_rows": int(total_rows),
            "normal": int(normal_count),
            "attack": int(attack_count),
            "normal_rate": float(normal_rate),
            "attack_rate": float(attack_rate),
            "risk_level": overall_risk,
            "matched_features": int(matched_count),
            "total_model_features": int(len(feature_columns)),
            "overlap_percent": float(round(overlap_ratio * 100, 2)),
            "missing_features_sample": missing_features[:20],
            "top_attack_types": top_attack_types,
            "timestamp": datetime.utcnow()
        }
        csv_reports_collection.insert_one(csv_report_record)

        max_rows_to_send = 2000

        write_log(
            f"/predict-csv total_rows={total_rows} normal={normal_count} "
            f"attack={attack_count} risk={overall_risk}"
        )

        return jsonify({
            "total_rows": total_rows,
            "normal": normal_count,
            "attack": attack_count,
            "normal_rate": normal_rate,
            "attack_rate": attack_rate,
            "risk_level": overall_risk,
            "matched_features": matched_count,
            "total_model_features": len(feature_columns),
            "overlap_percent": round(overlap_ratio * 100, 2),
            "missing_features_sample": missing_features[:20],
            "top_attack_types": top_attack_types,
            "results": results[:max_rows_to_send]
        })

    except pd.errors.EmptyDataError:
        return jsonify({"error": "CSV file is empty or invalid"}), 400
    except pd.errors.ParserError:
        return jsonify({"error": "CSV parsing failed"}), 400
    except Exception as e:
        write_log(f"/predict-csv error={str(e)}")
        return jsonify({"error": str(e)}), 500


# =========================
# DOWNLOAD FULL CSV RESULTS
# =========================
@app.route("/download-csv", methods=["GET"])
@limiter.limit("20 per minute")
def download_csv():
    global latest_csv_result

    if latest_csv_result is None:
        return jsonify({"error": "No CSV analysis available for download"}), 400

    output = io.StringIO()
    latest_csv_result.to_csv(output, index=False)
    mem = io.BytesIO()
    mem.write(output.getvalue().encode("utf-8"))
    mem.seek(0)

    return send_file(
        mem,
        mimetype="text/csv",
        as_attachment=True,
        download_name="ids_prediction_results.csv"
    )


# =========================
# MODEL INFO DATA
# =========================
@app.route("/model-info-data", methods=["GET"])
def model_info_data():
    return jsonify({
        "model_name": "Random Forest Classifier",
        "dataset": "CICIDS2017",
        "classification_type": "Multiclass",
        "selected_feature_count": len(feature_columns),
        "selected_features": feature_columns
    })


# =========================
# HISTORY ROUTES
# =========================
@app.route("/history", methods=["GET"])
@limiter.limit("60 per minute")
def get_history():
    try:
        records = list(
            detections_collection.find().sort("timestamp", -1).limit(100)
        )

        for record in records:
            record["_id"] = str(record["_id"])
            ts = record.get("timestamp")
            if ts:
                record["time"] = ts.strftime("%H:%M:%S")
                record["date"] = ts.strftime("%Y-%m-%d")
                record["timestamp"] = ts.isoformat()

        return jsonify(records)
    except Exception as e:
        write_log(f"/history error={str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/csv-history", methods=["GET"])
@limiter.limit("30 per minute")
def get_csv_history():
    try:
        reports = list(
            csv_reports_collection.find().sort("timestamp", -1).limit(50)
        )

        for report in reports:
            report["_id"] = str(report["_id"])
            ts = report.get("timestamp")
            if ts:
                report["timestamp"] = ts.isoformat()

        return jsonify(reports)
    except Exception as e:
        write_log(f"/csv-history error={str(e)}")
        return jsonify({"error": str(e)}), 500


@app.route("/live-history", methods=["GET"])
@limiter.limit("30 per minute")
def get_live_history():
    try:
        records = list(
            live_logs_collection.find().sort("timestamp", -1).limit(100)
        )

        for record in records:
            record["_id"] = str(record["_id"])
            ts = record.get("timestamp")
            if ts:
                record["time"] = ts.strftime("%H:%M:%S")
                record["date"] = ts.strftime("%Y-%m-%d")
                record["timestamp"] = ts.isoformat()

        return jsonify(records)
    except Exception as e:
        write_log(f"/live-history error={str(e)}")
        return jsonify({"error": str(e)}), 500


# =========================
# WEBSOCKET EVENTS
# =========================
@socketio.on("connect")
def handle_connect():
    write_log("WebSocket client connected")
    print("WebSocket client connected")


@socketio.on("disconnect")
def handle_disconnect():
    sid = request.sid
    client_stream_status[sid] = False
    write_log(f"WebSocket client disconnected sid={sid}")
    print(f"WebSocket client disconnected sid={sid}")


def live_stream_task(sid):
    write_log(f"Live stream started sid={sid}")

    while client_stream_status.get(sid, False):
        try:
            data = generate_random_traffic()

            input_data = []
            for feature in feature_columns:
                input_data.append(float(data.get(feature, 0)))

            input_array = np.array(input_data).reshape(1, -1)

            prediction = model.predict(input_array)[0]
            probabilities = model.predict_proba(input_array)[0]
            confidence = float(max(probabilities) * 100)

            if prediction == "BENIGN":
                result = "Normal Traffic"
                attack_type = "BENIGN"
            else:
                result = "Attack Detected"
                attack_type = prediction

            severity = get_severity(prediction, confidence)

            live_record = {
                "source": "live_monitoring",
                "input_data": data,
                "prediction": result,
                "attack_type": attack_type,
                "confidence": round(confidence, 2),
                "severity": severity,
                "timestamp": datetime.utcnow()
            }
            live_logs_collection.insert_one(live_record)

            socketio.emit("live_prediction", {
                "prediction": result,
                "attack_type": attack_type,
                "confidence": round(confidence, 2),
                "severity": severity,
                "timestamp": time.strftime("%H:%M:%S")
            }, room=sid)

            socketio.sleep(3)

        except Exception as e:
            write_log(f"Live stream error sid={sid}: {str(e)}")
            socketio.emit("live_prediction_error", {"error": str(e)}, room=sid)
            socketio.sleep(3)

    write_log(f"Live stream stopped sid={sid}")


@socketio.on("start_stream")
def start_stream():
    sid = request.sid

    if client_stream_status.get(sid, False):
        emit("stream_status", {"message": "Stream already running"})
        return

    client_stream_status[sid] = True
    socketio.start_background_task(live_stream_task, sid)

    emit("stream_status", {"message": "Live monitoring started"})
    write_log(f"start_stream received sid={sid}")


@socketio.on("stop_stream")
def stop_stream():
    sid = request.sid
    client_stream_status[sid] = False
    emit("stream_status", {"message": "Live monitoring stopped"})
    write_log(f"stop_stream received sid={sid}")


# =========================
# MAIN
# =========================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    socketio.run(app, host="0.0.0.0", port=port, debug=False)