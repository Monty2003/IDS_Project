import { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Pie, Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
} from "chart.js";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement
);

function Dashboard() {
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

  const intervalRef = useRef(null);
  const alertTimeoutRef = useRef(null);

  useEffect(() => {
    const loadFeatures = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:5000/features");
        setFeatures(response.data.features);
      } catch (error) {
        console.error(error);
        setResult("Could not load feature list");
      }
    };

    loadFeatures();

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      if (alertTimeoutRef.current) {
        clearTimeout(alertTimeoutRef.current);
      }
    };
  }, []);

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

  const closeAlert = () => {
    if (alertTimeoutRef.current) {
      clearTimeout(alertTimeoutRef.current);
    }

    setAlertBox({
      show: false,
      type: "",
      title: "",
      message: ""
    });
  };

  const handleChange = (feature, value) => {
    setFormData({
      ...formData,
      [feature]: value
    });
  };

  const updateStats = (prediction, confidenceValue) => {
    setResult(prediction);
    setConfidence(confidenceValue);

    const time = new Date().toLocaleTimeString();

    setHistory((prev) => [
      { time, prediction, confidence: confidenceValue },
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
        `Attack detected with ${confidenceValue}% confidence`
      );
    } else {
      setStats((prev) => ({
        ...prev,
        normal: prev.normal + 1
      }));
    }
  };

  const detectAttack = async () => {
    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/predict",
        formData
      );

      updateStats(response.data.prediction, response.data.confidence);
    } catch (error) {
      console.error(error);
      setResult("Backend connection error");
      showAlert("danger", "Backend Error", "Could not connect to prediction API");
    }
  };

  const buildNormalTraffic = () => {
    let normalData = {};

    features.forEach((feature) => {
      const name = feature.toLowerCase();

      if (name.includes("bytes") || name.includes("packet length")) {
        normalData[feature] = Math.random() * 300;
      } else if (name.includes("packets") || name.includes("count")) {
        normalData[feature] = Math.random() * 20;
      } else if (name.includes("duration")) {
        normalData[feature] = Math.random() * 50;
      } else if (name.includes("rate")) {
        normalData[feature] = Math.random();
      } else {
        normalData[feature] = Math.random() * 10;
      }
    });

    return normalData;
  };

  const buildSuspiciousTraffic = () => {
    let suspiciousData = {};

    features.forEach((feature) => {
      const name = feature.toLowerCase();

      if (name.includes("bytes") || name.includes("packet length")) {
        suspiciousData[feature] = 5000 + Math.random() * 50000;
      } else if (name.includes("packets") || name.includes("count")) {
        suspiciousData[feature] = 100 + Math.random() * 2000;
      } else if (name.includes("duration")) {
        suspiciousData[feature] = 500 + Math.random() * 5000;
      } else if (name.includes("rate")) {
        suspiciousData[feature] = 10 + Math.random() * 1000;
      } else {
        suspiciousData[feature] = 100 + Math.random() * 5000;
      }
    });

    return suspiciousData;
  };

  const simulateNormalTraffic = async () => {
    try {
      const normalData = buildNormalTraffic();

      const response = await axios.post(
        "http://127.0.0.1:5000/predict",
        normalData
      );

      updateStats(response.data.prediction, response.data.confidence);
    } catch (error) {
      console.error(error);
      setResult("Backend connection error");
      showAlert("danger", "Backend Error", "Could not connect to prediction API");
    }
  };

  const simulateSuspiciousTraffic = async () => {
    try {
      const suspiciousData = buildSuspiciousTraffic();

      const response = await axios.post(
        "http://127.0.0.1:5000/predict",
        suspiciousData
      );

      updateStats(response.data.prediction, response.data.confidence);
    } catch (error) {
      console.error(error);
      setResult("Backend connection error");
      showAlert("danger", "Backend Error", "Could not connect to prediction API");
    }
  };

  const simulateMixedTraffic = async () => {
    try {
      const useSuspicious = Math.random() < 0.4;
      const trafficData = useSuspicious
        ? buildSuspiciousTraffic()
        : buildNormalTraffic();

      const response = await axios.post(
        "http://127.0.0.1:5000/predict",
        trafficData
      );

      updateStats(response.data.prediction, response.data.confidence);
    } catch (error) {
      console.error(error);
      setResult("Backend connection error");
      showAlert("danger", "Backend Error", "Could not connect to prediction API");
    }
  };

  const startMonitoring = () => {
    if (intervalRef.current) return;

    setIsMonitoring(true);
    showAlert("info", "Monitoring Started", "Live monitoring is now active");

    intervalRef.current = setInterval(() => {
      simulateMixedTraffic();
    }, 3000);
  };

  const stopMonitoring = () => {
    setIsMonitoring(false);

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    showAlert("info", "Monitoring Stopped", "Live monitoring has been stopped");
  };

  const exportHistoryCSV = () => {
    if (history.length === 0) {
      alert("No detection history to export");
      return;
    }

    const headers = ["Time", "Prediction", "Confidence"];
    const rows = history.map((item) => [
      item.time,
      item.prediction,
      item.confidence
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.join(","))
      .join("\n");

    const blob = new Blob([csvContent], {
      type: "text/csv;charset=utf-8;"
    });

    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ids_detection_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showAlert("success", "Export Complete", "Detection history CSV downloaded");
  };

  const handleCSVUpload = async () => {
    if (!csvFile) {
      alert("Please select a CSV file first");
      return;
    }

    setCsvError("");
    setBatchSummary(null);
    setBatchResults([]);
    setUploadProgress(0);
    setAnalysisStage("uploading");

    const uploadData = new FormData();
    uploadData.append("file", csvFile);

    try {
      const response = await axios.post(
        "http://127.0.0.1:5000/predict-csv",
        uploadData,
        {
          headers: {
            "Content-Type": "multipart/form-data"
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percent);
            }
          }
        }
      );

      setAnalysisStage("analyzing");

      setTimeout(() => {
        setBatchSummary({
          total_rows: response.data.total_rows,
          normal: response.data.normal,
          attack: response.data.attack,
          attack_rate: response.data.attack_rate,
          risk_level: response.data.risk_level
        });

        setBatchResults(response.data.results || []);
        setUploadProgress(100);
        setAnalysisStage("completed");

        if (response.data.risk_level === "High Risk") {
          showAlert(
            "danger",
            "High Risk Traffic",
            `${response.data.attack} attack rows detected in uploaded CSV`
          );
        } else if (response.data.risk_level === "Medium Risk") {
          showAlert(
            "warning",
            "Medium Risk Traffic",
            `${response.data.attack} suspicious rows detected in uploaded CSV`
          );
        } else {
          showAlert(
            "success",
            "CSV Analysis Complete",
            `Mostly normal traffic detected in uploaded CSV`
          );
        }
      }, 800);
    } catch (error) {
      console.error(error);

      if (error.response && error.response.data) {
        setCsvError(error.response.data.error || "CSV upload failed");
      } else {
        setCsvError("CSV upload failed");
      }

      setAnalysisStage("idle");
      setUploadProgress(0);
      showAlert("danger", "CSV Upload Failed", "Could not analyze uploaded CSV");
    }
  };

  const exportBatchResultsCSV = () => {
    window.open("http://127.0.0.1:5000/download-csv", "_blank");
    showAlert(
      "success",
      "Download Started",
      "Full CSV with predictions is being downloaded"
    );
  };

  const getBatchRiskColor = () => {
    if (!batchSummary) return "text-slate-300";

    if (batchSummary.risk_level === "High Risk") return "text-red-400";
    if (batchSummary.risk_level === "Medium Risk") return "text-yellow-400";
    if (batchSummary.risk_level === "Low Risk") return "text-green-400";

    return "text-slate-300";
  };

  const getAlertClasses = () => {
    if (alertBox.type === "danger") {
      return "bg-red-600 border-red-400 text-white";
    }
    if (alertBox.type === "warning") {
      return "bg-yellow-500 border-yellow-300 text-black";
    }
    if (alertBox.type === "success") {
      return "bg-green-600 border-green-400 text-white";
    }
    return "bg-blue-600 border-blue-400 text-white";
  };

  const totalTraffic = stats.normal + stats.attack;
  const attackRate =
    totalTraffic > 0 ? ((stats.attack / totalTraffic) * 100).toFixed(2) : "0.00";

  const chartData = {
    labels: ["Normal", "Attack"],
    datasets: [
      {
        label: "Prediction Count",
        data: [stats.normal, stats.attack],
        backgroundColor: ["#22c55e", "#ef4444"],
        borderWidth: 1
      }
    ]
  };

  const batchChartData = batchSummary
    ? {
        labels: ["Normal", "Attack"],
        datasets: [
          {
            label: "CSV Detection",
            data: [batchSummary.normal, batchSummary.attack],
            backgroundColor: ["#22c55e", "#ef4444"],
            borderWidth: 1
          }
        ]
      }
    : null;

  const trendHistory = [...history].reverse();

  const lineChartData = {
    labels: trendHistory.map((item) => item.time),
    datasets: [
      {
        label: "Normal Traffic",
        data: trendHistory.map((item) =>
          item.prediction === "Normal Traffic" ? 1 : 0
        ),
        borderColor: "#22c55e",
        backgroundColor: "#22c55e",
        tension: 0.3
      },
      {
        label: "Attack Detected",
        data: trendHistory.map((item) =>
          item.prediction === "Attack Detected" ? 1 : 0
        ),
        borderColor: "#ef4444",
        backgroundColor: "#ef4444",
        tension: 0.3
      }
    ]
  };

  const getStageText = () => {
    if (analysisStage === "uploading") return "Uploading CSV";
    if (analysisStage === "analyzing") return "Analyzing Network Traffic";
    if (analysisStage === "completed") return "Analysis Complete";
    return "";
  };

  return (
    <div className="space-y-6">
      {alertBox.show && (
        <div
          className={`fixed top-4 right-4 z-50 w-[360px] border px-4 py-3 rounded-xl shadow-2xl ${getAlertClasses()}`}
        >
          <div className="flex justify-between items-start gap-3">
            <div>
              <h3 className="font-bold text-base">{alertBox.title}</h3>
              <p className="text-sm mt-1">{alertBox.message}</p>
            </div>
            <button
              onClick={closeAlert}
              className="font-bold text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-4 rounded-xl shadow-lg">
          <p className="text-slate-400 text-sm">Total Traffic Checked</p>
          <h3 className="text-2xl font-bold">{totalTraffic}</h3>
        </div>

        <div className="bg-slate-800 p-4 rounded-xl shadow-lg">
          <p className="text-slate-400 text-sm">Attack Detections</p>
          <h3 className="text-2xl font-bold text-red-400">{stats.attack}</h3>
        </div>

        <div className="bg-slate-800 p-4 rounded-xl shadow-lg">
          <p className="text-slate-400 text-sm">Normal Traffic</p>
          <h3 className="text-2xl font-bold text-green-400">{stats.normal}</h3>
        </div>

        <div className="bg-slate-800 p-4 rounded-xl shadow-lg">
          <p className="text-slate-400 text-sm">Attack Rate</p>
          <h3 className="text-2xl font-bold text-yellow-400">{attackRate}%</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-slate-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl mb-4 font-semibold">
            Intrusion Detection Control
          </h2>

          <div className="flex flex-wrap gap-3 mb-4">
            <button
              onClick={simulateNormalTraffic}
              className="bg-green-500 hover:bg-green-600 px-4 py-2 rounded"
            >
              Simulate Normal Traffic
            </button>

            <button
              onClick={simulateSuspiciousTraffic}
              className="bg-yellow-500 hover:bg-yellow-600 px-4 py-2 rounded text-black"
            >
              Simulate Suspicious Traffic
            </button>

            <button
              onClick={detectAttack}
              className="bg-red-500 hover:bg-red-600 px-4 py-2 rounded"
            >
              Detect Attack From Inputs
            </button>
          </div>

          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={startMonitoring}
              disabled={isMonitoring}
              className={`px-4 py-2 rounded ${
                isMonitoring
                  ? "bg-slate-500 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600"
              }`}
            >
              Start Live Monitoring
            </button>

            <button
              onClick={stopMonitoring}
              disabled={!isMonitoring}
              className={`px-4 py-2 rounded ${
                !isMonitoring
                  ? "bg-slate-500 cursor-not-allowed"
                  : "bg-purple-500 hover:bg-purple-600"
              }`}
            >
              Stop Live Monitoring
            </button>

            <button
              onClick={() => setShowAdvancedInputs(!showAdvancedInputs)}
              className="bg-slate-600 hover:bg-slate-500 px-4 py-2 rounded"
            >
              {showAdvancedInputs ? "Hide Advanced Inputs" : "Show Advanced Inputs"}
            </button>

            <button
              onClick={exportHistoryCSV}
              className="bg-cyan-500 hover:bg-cyan-600 px-4 py-2 rounded text-black"
            >
              Export History CSV
            </button>
          </div>

          <div className="bg-slate-700 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold mb-3">CSV Batch Detection</h3>

            <input
              type="file"
              accept=".csv"
              onChange={(e) => {
                setCsvFile(e.target.files[0]);
                setCsvError("");
                setUploadProgress(0);
                setAnalysisStage("idle");
              }}
              className="mb-3 block w-full text-sm"
            />

            {csvFile && (
              <p className="text-sm text-slate-300 mb-3">
                Selected File: <span className="font-semibold">{csvFile.name}</span>
              </p>
            )}

            <button
              onClick={handleCSVUpload}
              disabled={analysisStage === "uploading" || analysisStage === "analyzing"}
              className={`px-4 py-2 rounded text-black ${
                analysisStage === "uploading" || analysisStage === "analyzing"
                  ? "bg-orange-300 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-600"
              }`}
            >
              {analysisStage === "uploading" || analysisStage === "analyzing"
                ? "Processing CSV..."
                : "Upload and Detect CSV"}
            </button>

            {analysisStage !== "idle" && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1 text-slate-300">
                  <span>{getStageText()}</span>
                  <span>{uploadProgress}%</span>
                </div>

                <div className="w-full bg-slate-600 rounded-full h-4 overflow-hidden">
                  <div
                    className="bg-orange-500 h-4 transition-all duration-300"
                    style={{
                      width: `${
                        analysisStage === "analyzing" ? 100 : uploadProgress
                      }%`
                    }}
                  ></div>
                </div>
              </div>
            )}

            {csvError && (
              <p className="mt-3 text-red-400 text-sm">{csvError}</p>
            )}
          </div>

          <span className="text-sm text-slate-300 block mb-4">
            Status: {isMonitoring ? "Live Monitoring Active" : "Stopped"}
          </span>

          {showAdvancedInputs && (
            <>
              <h3 className="text-lg mb-2">Advanced Feature Inputs</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[400px] overflow-y-auto pr-2">
                {features.map((feature, index) => (
                  <div key={index}>
                    <p className="text-sm mb-1">{feature}</p>
                    <input
                      type="number"
                      step="any"
                      className="text-black p-2 w-full rounded"
                      value={formData[feature] || ""}
                      onChange={(e) => handleChange(feature, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </>
          )}

          <h2 className="mt-4 text-xl font-semibold">
            Result:{" "}
            <span
              className={
                result === "Attack Detected"
                  ? "text-red-400"
                  : "text-green-400"
              }
            >
              {result}
            </span>
          </h2>

          {confidence !== "" && (
            <p className="mt-2 text-sm text-slate-300">
              Confidence: {confidence}%
            </p>
          )}
        </div>

        <div className="bg-slate-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl mb-4 font-semibold">Detection Stats</h2>
          <Pie data={chartData} />

          <div className="mt-6">
            <p className="text-green-400">Normal: {stats.normal}</p>
            <p className="text-red-400">Attack: {stats.attack}</p>
          </div>
        </div>

        <div className="lg:col-span-3 bg-slate-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl mb-4 font-semibold">Live Traffic Trend</h2>
          <Line data={lineChartData} />
        </div>

        {batchSummary && (
          <div className="lg:col-span-3 bg-slate-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl mb-4 font-semibold">CSV Batch Summary</h2>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-slate-300">Total Rows</p>
                <h3 className="text-2xl font-bold">{batchSummary.total_rows}</h3>
              </div>

              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-slate-300">Normal Traffic</p>
                <h3 className="text-2xl font-bold text-green-400">
                  {batchSummary.normal}
                </h3>
              </div>

              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-slate-300">Attack Traffic</p>
                <h3 className="text-2xl font-bold text-red-400">
                  {batchSummary.attack}
                </h3>
              </div>

              <div className="bg-slate-700 p-4 rounded-lg">
                <p className="text-slate-300">Attack Rate</p>
                <h3 className="text-2xl font-bold text-yellow-400">
                  {batchSummary.attack_rate}%
                </h3>
              </div>
            </div>

            <div className="mb-6 flex flex-wrap items-center gap-6">
              <p className="text-lg">
                Risk Level:{" "}
                <span className={`font-bold ${getBatchRiskColor()}`}>
                  {batchSummary.risk_level}
                </span>
              </p>

              <button
                onClick={exportBatchResultsCSV}
                className="bg-indigo-500 hover:bg-indigo-600 px-4 py-2 rounded text-white"
              >
                Download Full CSV with Predictions
              </button>
            </div>

            {batchChartData && (
              <div className="max-w-md">
                <Pie data={batchChartData} />
              </div>
            )}
          </div>
        )}

        {batchResults.length > 0 && (
          <div className="lg:col-span-3 bg-slate-800 p-6 rounded-xl shadow-lg">
            <h2 className="text-2xl mb-4 font-semibold">CSV Batch Results</h2>

            <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-600">
                    <th className="py-2">Row</th>
                    <th className="py-2">Prediction</th>
                    <th className="py-2">Confidence</th>
                  </tr>
                </thead>

                <tbody>
                  {batchResults.map((item, index) => (
                    <tr key={index} className="border-b border-slate-700">
                      <td className="py-2">{item.row}</td>
                      <td
                        className={`py-2 ${
                          item.prediction === "Attack Detected"
                            ? "text-red-400"
                            : "text-green-400"
                        }`}
                      >
                        {item.prediction}
                      </td>
                      <td className="py-2">{item.confidence}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="lg:col-span-3 bg-slate-800 p-6 rounded-xl shadow-lg">
          <h2 className="text-2xl mb-4 font-semibold">Detection History</h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-600">
                  <th className="py-2">Time</th>
                  <th className="py-2">Prediction</th>
                  <th className="py-2">Confidence</th>
                </tr>
              </thead>

              <tbody>
                {history.length === 0 ? (
                  <tr>
                    <td className="py-3" colSpan="3">
                      No detections yet
                    </td>
                  </tr>
                ) : (
                  history.map((item, index) => (
                    <tr key={index} className="border-b border-slate-700">
                      <td className="py-2">{item.time}</td>
                      <td
                        className={`py-2 ${
                          item.prediction === "Attack Detected"
                            ? "text-red-400"
                            : "text-green-400"
                        }`}
                      >
                        {item.prediction}
                      </td>
                      <td className="py-2">{item.confidence}%</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;