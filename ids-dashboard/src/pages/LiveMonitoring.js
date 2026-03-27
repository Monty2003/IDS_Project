import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import axios from "axios";
import API_BASE from "../config";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
} from "chart.js";
import { useIDS } from "../context/IDSContext";
import CyberCard from "../components/CyberCard";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);

function LiveMonitoring() {
  const {
    features,
    setFeatures,
    history,
    setHistory,
    isMonitoring,
    setIsMonitoring,
    stats,
    setStats,
    setResult,
    setConfidence,
    setAlertBox
  } = useIDS();

  const [currentAttackType, setCurrentAttackType] = useState("");
  const [currentSeverity, setCurrentSeverity] = useState("");

  const socketRef = useRef(null);
  const alertTimeoutRef = useRef(null);

  useEffect(() => {
    const loadFeatures = async () => {
      try {
        const response = await axios.get(`${API_BASE}/features`);
        setFeatures(response.data.features);
      } catch (error) {
        console.error(error);
      }
    };

    if (features.length === 0) {
      loadFeatures();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, [features, setFeatures]);

  const showAlert = (type, title, message) => {
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }

    setAlertBox({
      show: true,
      type,
      title,
      message
    });

    alertTimeoutRef.current = setTimeout(() => {
      setAlertBox({
        show: false,
        type: "",
        title: "",
        message: ""
      });
    }, 4000);
  };

  const startMonitoring = () => {
    if (socketRef.current || features.length === 0) return;

    setIsMonitoring(true);
    showAlert("info", "Monitoring Started", "Real-time monitoring active");

    socketRef.current = io(`${API_BASE}`);

    socketRef.current.emit("start_stream");

    socketRef.current.on("live_prediction", (data) => {
      const { prediction, attack_type, confidence, severity, timestamp } = data;

      setResult(prediction);
      setConfidence(confidence);
      setCurrentAttackType(attack_type);
      setCurrentSeverity(severity);

      setHistory((prev) => [
        { time: timestamp, prediction, attack_type, confidence, severity },
        ...prev.slice(0, 49)
      ]);

      if (prediction === "Attack Detected") {
        setStats((prev) => ({
          ...prev,
          attack: prev.attack + 1
        }));

        showAlert(
          "danger",
          "Intrusion Alert",
          `${attack_type} detected (${confidence}%)`
        );
      } else {
        setStats((prev) => ({
          ...prev,
          normal: prev.normal + 1
        }));
      }
    });
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);

    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }

    setCurrentAttackType("");
    setCurrentSeverity("");
    showAlert("info", "Monitoring Stopped", "Real-time monitoring stopped");
  };

  const monitoringHistory = [...history].reverse();

  const lineChartData = {
    labels: monitoringHistory.map((item) => item.time),
    datasets: [
      {
        label: "Normal Traffic",
        data: monitoringHistory.map((item) =>
          item.prediction === "Normal Traffic" ? 1 : 0
        ),
        borderColor: "#22c55e",
        backgroundColor: "#22c55e",
        tension: 0.3
      },
      {
        label: "Attack Detected",
        data: monitoringHistory.map((item) =>
          item.prediction === "Attack Detected" ? 1 : 0
        ),
        borderColor: "#ef4444",
        backgroundColor: "#ef4444",
        tension: 0.3
      }
    ]
  };

  const recentMonitoringRows = history.slice(0, 10);

  const getSeverityClasses = (severity) => {
    if (severity === "Low") return "bg-yellow-400/20 text-yellow-300 border border-yellow-400/30";
    if (severity === "Medium") return "bg-orange-500/20 text-orange-300 border border-orange-400/30";
    if (severity === "High") return "bg-red-500/20 text-red-300 border border-red-400/30";
    if (severity === "Critical") return "bg-red-700/20 text-red-200 border border-red-600/30";
    return "bg-green-500/20 text-green-300 border border-green-400/30";
  };

  const totalTraffic = stats.normal + stats.attack;
  const attackRate =
    totalTraffic > 0 ? ((stats.attack / totalTraffic) * 100).toFixed(2) : "0.00";

  return (
    <div className="space-y-6">
      <CyberCard>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          <div className="cyber-card p-4">
            <p className="text-slate-400 text-sm">Total Live Events</p>
            <h3 className="text-3xl font-bold mt-2">{totalTraffic}</h3>
          </div>

          <div className="cyber-card p-4">
            <p className="text-slate-400 text-sm">Attack Events</p>
            <h3 className="text-3xl font-bold mt-2 text-red-400">{stats.attack}</h3>
          </div>

          <div className="cyber-card p-4">
            <p className="text-slate-400 text-sm">Normal Events</p>
            <h3 className="text-3xl font-bold mt-2 text-green-400">{stats.normal}</h3>
          </div>

          <div className="cyber-card p-4">
            <p className="text-slate-400 text-sm">Attack Rate</p>
            <h3 className="text-3xl font-bold mt-2 text-yellow-400">{attackRate}%</h3>
          </div>
        </div>
      </CyberCard>

      <CyberCard>
        <h2 className="text-xl font-semibold mb-4 text-green-400">Monitoring Control</h2>

        <div className="flex gap-3 mb-4 flex-wrap">
          <button
            onClick={startMonitoring}
            disabled={isMonitoring}
            className={`px-5 py-3 rounded-xl font-semibold ${
              isMonitoring
                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                : "cyber-button cyber-interactive"
            }`}
          >
            ▶ Start Monitoring
          </button>

          <button
            onClick={stopMonitoring}
            disabled={!isMonitoring}
            className={`px-5 py-3 rounded-xl font-semibold ${
              !isMonitoring
                ? "bg-slate-700 text-slate-400 cursor-not-allowed"
                : "bg-purple-500/20 text-purple-300 border border-purple-400/30 cyber-interactive"
            }`}
          >
            ■ Stop Monitoring
          </button>
        </div>

        <p className="mb-4">
          Status:{" "}
          <span className={isMonitoring ? "text-green-400 font-semibold" : "text-yellow-400 font-semibold"}>
            {isMonitoring ? "LIVE STREAM ACTIVE" : "Stopped"}
          </span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="cyber-card p-4">
            <p className="text-slate-400 text-sm">Current Result</p>
            <h3 className="text-lg font-bold mt-2">
              {history.length > 0 ? history[0].prediction : "No Data"}
            </h3>
          </div>

          <div className="cyber-card p-4">
            <p className="text-slate-400 text-sm">Current Attack Type</p>
            <h3 className="text-lg font-bold mt-2 text-yellow-400">
              {currentAttackType || "No Data"}
            </h3>
          </div>

          <div className="cyber-card p-4">
            <p className="text-slate-400 text-sm">Current Severity</p>
            <div className="mt-3">
              {currentSeverity ? (
                <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getSeverityClasses(currentSeverity)}`}>
                  {currentSeverity}
                </span>
              ) : (
                <span className="text-slate-400">No Data</span>
              )}
            </div>
          </div>
        </div>
      </CyberCard>

      <CyberCard>
        <h2 className="text-xl font-semibold mb-4 text-green-400">Live Traffic Trend</h2>
        <Line data={lineChartData} />
      </CyberCard>

      <CyberCard>
        <h2 className="text-xl font-semibold mb-4 text-green-400">Recent Events</h2>

        <div className="cyber-table-wrap overflow-x-auto cyber-scroll">
          <table className="w-full text-left cyber-table">
            <thead>
              <tr>
                <th className="py-3 px-4">Time</th>
                <th className="py-3 px-4">Prediction</th>
                <th className="py-3 px-4">Attack Type</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Confidence</th>
              </tr>
            </thead>

            <tbody>
              {recentMonitoringRows.length === 0 ? (
                <tr>
                  <td className="py-4 px-4" colSpan="5">
                    No events yet
                  </td>
                </tr>
              ) : (
                recentMonitoringRows.map((item, index) => (
                  <tr key={index}>
                    <td className="py-3 px-4">{item.time}</td>
                    <td className={`py-3 px-4 font-semibold ${item.prediction === "Attack Detected" ? "text-red-400" : "text-green-400"}`}>
                      {item.prediction}
                    </td>
                    <td className="py-3 px-4 font-semibold">{item.attack_type || "N/A"}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityClasses(item.severity)}`}>
                        {item.severity || "N/A"}
                      </span>
                    </td>
                    <td className="py-3 px-4">{item.confidence}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </CyberCard>
    </div>
  );
}

export default LiveMonitoring;