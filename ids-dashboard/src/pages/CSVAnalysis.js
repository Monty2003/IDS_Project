import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import axios from "axios";
import { useIDS } from "../context/IDSContext";
import CyberCard from "../components/CyberCard";
import API_BASE from "../config";
import { useState, useEffect, useRef } from "react";

ChartJS.register(ArcElement, Tooltip, Legend);

function CSVAnalysis() {
  const {
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
    setAnalysisStage
  } = useIDS();

  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 50;
  const tableTopRef = useRef(null);

  const totalPages = Math.ceil(batchResults.length / rowsPerPage);
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = batchResults.slice(indexOfFirstRow, indexOfLastRow);

  useEffect(() => {
    setCurrentPage(1);
  }, [batchResults]);

  const goToPage = (pageNumber) => {
    setCurrentPage(pageNumber);

    setTimeout(() => {
      tableTopRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 0);
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
        `${API_BASE}/predict-csv`,
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
          normal_rate: response.data.normal_rate,
          attack_rate: response.data.attack_rate,
          risk_level: response.data.risk_level,
          matched_features: response.data.matched_features,
          total_model_features: response.data.total_model_features,
          overlap_percent: response.data.overlap_percent,
          missing_features_sample: response.data.missing_features_sample || [],
          top_attack_types: response.data.top_attack_types || []
        });

        setBatchResults(response.data.results || []);
        setUploadProgress(100);
        setAnalysisStage("completed");
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
    }
  };

  const exportBatchResultsCSV = () => {
    window.open(`${API_BASE}/download-csv`, "_blank");
  };

  const getBatchRiskColor = () => {
    if (!batchSummary) return "text-slate-300";
    if (batchSummary.risk_level === "High Risk") return "text-red-400";
    if (batchSummary.risk_level === "Medium Risk") return "text-yellow-400";
    if (batchSummary.risk_level === "Low Risk") return "text-green-400";
    return "text-slate-300";
  };

  const getSeverityClasses = (severity) => {
    if (severity === "Low") {
      return "bg-yellow-400/20 text-yellow-300 border border-yellow-400/30";
    }
    if (severity === "Medium") {
      return "bg-orange-500/20 text-orange-300 border border-orange-400/30";
    }
    if (severity === "High") {
      return "bg-red-500/20 text-red-300 border border-red-400/30";
    }
    if (severity === "Critical") {
      return "bg-red-700/20 text-red-200 border border-red-600/30";
    }
    return "bg-green-500/20 text-green-300 border border-green-400/30";
  };

  const batchChartData = batchSummary
    ? {
        labels: ["Normal", "Attack"],
        datasets: [
          {
            label: "CSV Detection",
            data: [batchSummary.normal, batchSummary.attack],
            backgroundColor: ["#22c55e", "#ef4444"],
            borderWidth: 0
          }
        ]
      }
    : null;

  const getStageText = () => {
    if (analysisStage === "uploading") return "Uploading CSV";
    if (analysisStage === "analyzing") return "Analyzing Network Traffic";
    if (analysisStage === "completed") return "Analysis Complete";
    return "";
  };

  const progressValue =
    analysisStage === "analyzing" ? 100 : uploadProgress;

  return (
    <div className="space-y-6">
      <CyberCard>
        <h2 className="text-2xl mb-4 font-semibold text-yellow-400">
          Upload CSV File
        </h2>

        <div className="cyber-card p-4 mb-4">
          <p className="font-semibold mb-2">Upload Instructions</p>
          <p className="text-sm text-slate-300">
            Maximum allowed CSV file size: <span className="font-bold">1 GB</span>
          </p>
          <p className="text-sm text-slate-300 mt-1">
            Large network traffic CSV files are supported, but very large files may
            take more time to upload and analyze.
          </p>
        </div>

        <input
          type="file"
          accept=".csv"
          onChange={(e) => {
            setCsvFile(e.target.files[0]);
            setCsvError("");
            setUploadProgress(0);
            setAnalysisStage("idle");
          }}
          className="mb-3 block w-full text-sm file:mr-4 file:rounded-xl file:border-0 file:px-4 file:py-2 file:bg-slate-800 file:text-white"
        />

        {csvFile && (
          <p className="text-sm text-slate-300 mb-3">
            Selected File:{" "}
            <span className="font-semibold text-white">{csvFile.name}</span>
          </p>
        )}

        <button
          onClick={handleCSVUpload}
          disabled={analysisStage === "uploading" || analysisStage === "analyzing"}
          className={`px-5 py-3 rounded-xl font-semibold ${
            analysisStage === "uploading" || analysisStage === "analyzing"
              ? "bg-slate-700 text-slate-400 cursor-not-allowed"
              : "cyber-button cyber-interactive"
          }`}
        >
          {analysisStage === "uploading" || analysisStage === "analyzing"
            ? "Processing CSV..."
            : "Upload and Detect CSV"}
        </button>

        {analysisStage !== "idle" && (
          <div className="mt-5">
            <div className="cyber-card p-4">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div>
                  <p className="text-sm text-slate-400">Processing Status</p>
                  <p className="text-base font-semibold text-yellow-400">
                    {getStageText()}
                  </p>
                </div>

                <div className="px-3 py-1 rounded-full bg-yellow-500/20 text-yellow-300 border border-yellow-400/30 text-sm font-bold min-w-[78px] text-center">
                  {progressValue}%
                </div>
              </div>

              <div className="relative w-full h-5 rounded-full bg-slate-950 border border-slate-700 overflow-hidden shadow-inner">
                <div
                  className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-400 via-yellow-400 to-orange-400 transition-all duration-500"
                  style={{
                    width: `${progressValue}%`,
                    boxShadow: "0 0 20px rgba(34, 211, 238, 0.35)"
                  }}
                ></div>

                <div
                  className="absolute inset-y-0 w-16 bg-white/35 blur-sm rounded-full transition-all duration-500"
                  style={{
                    left: `calc(${progressValue}% - 2rem)`
                  }}
                ></div>

                <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.08),transparent)] animate-pulse"></div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-slate-400 gap-3">
                <span>
                  {analysisStage === "uploading" &&
                    "Uploading selected CSV to backend server"}
                  {analysisStage === "analyzing" &&
                    "Scanning uploaded traffic and generating predictions"}
                  {analysisStage === "completed" &&
                    "CSV analysis completed successfully"}
                </span>

                <span className="text-slate-300 font-medium whitespace-nowrap">
                  {analysisStage === "completed" ? "Done" : "In Progress"}
                </span>
              </div>
            </div>
          </div>
        )}

        {csvError && <p className="mt-3 text-red-400 text-sm">{csvError}</p>}
      </CyberCard>

      {batchSummary && (
        <CyberCard>
          <h2 className="text-2xl mb-4 font-semibold text-yellow-400">
            CSV Batch Summary
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="cyber-card p-4">
              <p className="text-slate-400">Total Rows</p>
              <h3 className="text-2xl font-bold mt-2">{batchSummary.total_rows}</h3>
            </div>

            <div className="cyber-card p-4">
              <p className="text-slate-400">Normal Traffic</p>
              <h3 className="text-2xl font-bold mt-2 text-green-400">
                {batchSummary.normal}
              </h3>
            </div>

            <div className="cyber-card p-4">
              <p className="text-slate-400">Attack Traffic</p>
              <h3 className="text-2xl font-bold mt-2 text-red-400">
                {batchSummary.attack}
              </h3>
            </div>

            <div className="cyber-card p-4">
              <p className="text-slate-400">Attack Rate</p>
              <h3 className="text-2xl font-bold mt-2 text-yellow-400">
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

            <p className="text-slate-300">
              Feature Match: {batchSummary.matched_features} /{" "}
              {batchSummary.total_model_features}
            </p>

            <p className="text-slate-300">
              Overlap: {batchSummary.overlap_percent}%
            </p>

            <button
              onClick={exportBatchResultsCSV}
              className="cyber-button cyber-interactive px-4 py-2"
            >
              Download Full CSV with Predictions
            </button>
          </div>

          {batchSummary.top_attack_types?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold mb-3 text-yellow-400">
                Top Attack Types
              </h3>
              <div className="flex flex-wrap gap-3">
                {batchSummary.top_attack_types.map((item, index) => (
                  <div key={index} className="cyber-card px-4 py-2">
                    <span className="font-semibold text-red-400">
                      {item.attack_type}
                    </span>
                    <span className="ml-2">({item.count})</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {batchSummary.missing_features_sample?.length > 0 && (
            <div className="mb-6">
              <p className="text-slate-300 mb-2">Missing Features Sample:</p>
              <div className="flex flex-wrap gap-2">
                {batchSummary.missing_features_sample.map((feature, index) => (
                  <span key={index} className="cyber-card px-3 py-1 text-sm">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}

          {batchChartData && (
            <div className="max-w-md">
              <Pie data={batchChartData} />
            </div>
          )}
        </CyberCard>
      )}

      {batchResults.length > 0 && (
        <CyberCard>
          <div
            ref={tableTopRef}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4"
          >
            <h2 className="text-2xl font-semibold text-yellow-400">
              CSV Batch Results
            </h2>

            <div className="text-sm text-slate-300">
              Showing page <span className="font-bold text-white">{currentPage}</span> of{" "}
              <span className="font-bold text-white">{totalPages}</span>{" "}
              | Total rows: <span className="font-bold text-white">{batchResults.length}</span>
            </div>
          </div>

          <div className="cyber-table-wrap overflow-x-auto cyber-scroll">
            <table className="w-full text-left cyber-table min-w-[760px]">
              <thead>
                <tr>
                  <th className="py-3 px-4">Row</th>
                  <th className="py-3 px-4">Prediction</th>
                  <th className="py-3 px-4">Attack Type</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Confidence</th>
                </tr>
              </thead>

              <tbody>
                {currentRows.map((item, index) => (
                  <tr key={index}>
                    <td className="py-3 px-4">{item.row}</td>
                    <td
                      className={`py-3 px-4 font-semibold ${
                        item.prediction === "Attack Detected"
                          ? "text-red-400"
                          : "text-green-400"
                      }`}
                    >
                      {item.prediction}
                    </td>
                    <td className="py-3 px-4 font-semibold">{item.attack_type}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${getSeverityClasses(
                          item.severity
                        )}`}
                      >
                        {item.severity}
                      </span>
                    </td>
                    <td className="py-3 px-4">{item.confidence}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4 flex-wrap gap-3">
            <button
              onClick={() => goToPage(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className={`px-4 py-2 rounded-lg ${
                currentPage === 1
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-slate-700 hover:bg-slate-600 text-white"
              }`}
            >
              ⬅ Prev
            </button>

            <div className="flex gap-2 flex-wrap">
              {Array.from({ length: totalPages }, (_, i) => (
                <button
                  key={i}
                  onClick={() => goToPage(i + 1)}
                  className={`px-3 py-1 rounded-lg ${
                    currentPage === i + 1
                      ? "bg-cyan-500 text-black font-bold"
                      : "bg-slate-700 hover:bg-slate-600 text-white"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => goToPage(Math.min(currentPage + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-4 py-2 rounded-lg ${
                currentPage === totalPages
                  ? "bg-slate-800 text-slate-500 cursor-not-allowed"
                  : "bg-slate-700 hover:bg-slate-600 text-white"
              }`}
            >
              Next ➡
            </button>
          </div>
        </CyberCard>
      )}
    </div>
  );
}

export default CSVAnalysis;