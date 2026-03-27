import { createContext, useContext, useEffect, useState, useCallback } from "react";
import API_BASE from "../config";

const IDSContext = createContext();

export function IDSProvider({ children }) {
  const [features, setFeatures] = useState([]);
  const [formData, setFormData] = useState({});
  const [result, setResult] = useState("");
  const [confidence, setConfidence] = useState("");
  const [history, setHistory] = useState([]);
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [showAdvancedInputs, setShowAdvancedInputs] = useState(false);

  const [csvFile, setCsvFile] = useState(null);
  const [batchSummary, setBatchSummary] = useState(null);
  const [batchResults, setBatchResults] = useState([]);
  const [csvError, setCsvError] = useState("");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [analysisStage, setAnalysisStage] = useState("idle");

  const [alertBox, setAlertBox] = useState({
    show: false,
    type: "",
    title: "",
    message: ""
  });

  const [stats, setStats] = useState({
    normal: 0,
    attack: 0
  });

  const [theme, setTheme] = useState(
    localStorage.getItem("ids_theme") || "dark"
  );

  const [alertsEnabled, setAlertsEnabled] = useState(() => {
    const saved = localStorage.getItem("ids_alerts_enabled");
    return saved === null ? true : saved === "true";
  });

  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState("");

  const SESSION_DURATION_MS = 10 * 60 * 1000;
  const [sessionRemainingMs, setSessionRemainingMs] = useState(SESSION_DURATION_MS);

  useEffect(() => {
    localStorage.setItem("ids_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("ids_alerts_enabled", alertsEnabled);
  }, [alertsEnabled]);

  const normalizeHistoryRecord = (item) => {
    const prediction = item?.prediction || "Unknown";
    const confidenceValue =
      typeof item?.confidence === "number"
        ? item.confidence
        : parseFloat(item?.confidence || 0);

    let formattedTime = item?.time || "";
    let formattedDate = item?.date || "";

    if ((!formattedTime || !formattedDate) && item?.timestamp) {
      const parsed = new Date(item.timestamp);
      if (!Number.isNaN(parsed.getTime())) {
        formattedTime = parsed.toLocaleTimeString();
        formattedDate = parsed.toLocaleDateString();
      }
    }

    return {
      ...item,
      prediction,
      confidence: Number.isNaN(confidenceValue) ? 0 : confidenceValue,
      time: formattedTime || "N/A",
      date: formattedDate || "",
      attack_type: item?.attack_type || "N/A",
      severity: item?.severity || "N/A",
      source: item?.source || "unknown"
    };
  };

  const fetchHistoryFromDB = useCallback(async () => {
    try {
      setHistoryLoading(true);
      setHistoryError("");

      const response = await fetch(`${API_BASE}/history`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to fetch history");
      }

      const normalized = Array.isArray(data)
        ? data.map(normalizeHistoryRecord)
        : [];

      setHistory(normalized);
    } catch (error) {
      console.error("History fetch error:", error);
      setHistoryError(error.message || "Failed to load history");
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHistoryFromDB();
  }, [fetchHistoryFromDB]);

  useEffect(() => {
    const normalCount = history.filter(
      (item) => item.prediction === "Normal Traffic"
    ).length;

    const attackCount = history.filter(
      (item) => item.prediction === "Attack Detected"
    ).length;

    setStats({
      normal: normalCount,
      attack: attackCount
    });
  }, [history]);

  const resetDashboardData = () => {
    setFormData({});
    setResult("");
    setConfidence("");
    setIsMonitoring(false);
    setCsvFile(null);
    setBatchSummary(null);
    setBatchResults([]);
    setCsvError("");
    setUploadProgress(0);
    setAnalysisStage("idle");
    setAlertBox({
      show: false,
      type: "",
      title: "",
      message: ""
    });
    setHistory([]);
    setStats({
      normal: 0,
      attack: 0
    });
    setHistoryError("");
  };

  const resetSessionTimer = () => {
    setSessionRemainingMs(SESSION_DURATION_MS);
  };

  return (
    <IDSContext.Provider
      value={{
        features,
        setFeatures,
        formData,
        setFormData,
        result,
        setResult,
        confidence,
        setConfidence,
        history,
        setHistory,
        isMonitoring,
        setIsMonitoring,
        showAdvancedInputs,
        setShowAdvancedInputs,
        csvFile,
        setCsvFile,
        batchSummary,
        setBatchSummary,
        batchResults,
        setBatchResults,
        csvError,
        setCsvError,
        uploadProgress,
        setUploadProgress,
        analysisStage,
        setAnalysisStage,
        alertBox,
        setAlertBox,
        stats,
        setStats,
        theme,
        setTheme,
        alertsEnabled,
        setAlertsEnabled,
        resetDashboardData,
        SESSION_DURATION_MS,
        sessionRemainingMs,
        setSessionRemainingMs,
        resetSessionTimer,
        fetchHistoryFromDB,
        historyLoading,
        historyError
      }}
    >
      {children}
    </IDSContext.Provider>
  );
}

export function useIDS() {
  return useContext(IDSContext);
}