import { useEffect, useMemo, useState } from "react";
import { useIDS } from "../context/IDSContext";
import CyberCard from "../components/CyberCard";

function DetectionHistory() {
  const {
    history,
    theme,
    fetchHistoryFromDB,
    historyLoading,
    historyError
  } = useIDS();

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetchHistoryFromDB();
  }, [fetchHistoryFromDB]);

  const selectClasses =
    theme === "dark"
      ? "rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white"
      : "rounded-xl bg-white border border-slate-300 px-3 py-2 text-slate-900";

  const inputClasses =
    theme === "dark"
      ? "rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white w-full md:w-72"
      : "rounded-xl bg-white border border-slate-300 px-3 py-2 text-slate-900 w-full md:w-72";

  const headingText = theme === "dark" ? "text-blue-400" : "text-blue-700";
  const emptyText = theme === "dark" ? "text-slate-300" : "text-slate-800";

  const exportHistoryCSV = () => {
    if (history.length === 0) {
      alert("No detection history to export");
      return;
    }

    const headers = [
      "Date",
      "Time",
      "Prediction",
      "Attack Type",
      "Confidence",
      "Severity",
      "Source"
    ];

    const rows = history.map((item) => [
      item.date || "",
      item.time || "",
      item.prediction || "",
      item.attack_type || "",
      item.confidence || 0,
      item.severity || "",
      item.source || ""
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "ids_detection_history.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const matchesFilter =
        filter === "all" ||
        (filter === "attack" && item.prediction === "Attack Detected") ||
        (filter === "normal" && item.prediction === "Normal Traffic");

      const query = search.toLowerCase();

      const matchesSearch =
        (item.time || "").toLowerCase().includes(query) ||
        (item.date || "").toLowerCase().includes(query) ||
        (item.prediction || "").toLowerCase().includes(query) ||
        (item.attack_type || "").toLowerCase().includes(query) ||
        (item.severity || "").toLowerCase().includes(query) ||
        (item.source || "").toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }, [history, filter, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div></div>

        <div className="flex gap-3 flex-wrap">
          <button
            onClick={fetchHistoryFromDB}
            className="cyber-button cyber-interactive px-4 py-2"
          >
            Refresh History
          </button>

          <button
            onClick={exportHistoryCSV}
            className="cyber-button cyber-interactive px-4 py-2"
          >
            Export History CSV
          </button>
        </div>
      </div>

      <CyberCard>
        <div className="flex flex-wrap gap-4 items-center">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={selectClasses}
          >
            <option value="all">All</option>
            <option value="attack">Only Attacks</option>
            <option value="normal">Only Normal</option>
          </select>

          <input
            type="text"
            placeholder="Search by date, time, prediction, attack type..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClasses}
          />
        </div>
      </CyberCard>

      <CyberCard>
        <h2 className={`text-2xl mb-4 font-semibold ${headingText}`}>
          Filtered Detection Results
        </h2>

        {historyLoading ? (
          <p className={emptyText}>Loading detection history...</p>
        ) : historyError ? (
          <p className="text-red-500">{historyError}</p>
        ) : (
          <div className="cyber-table-wrap overflow-x-auto max-h-[600px] overflow-y-auto cyber-scroll">
            <table className="w-full text-left cyber-table">
              <thead>
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4">Prediction</th>
                  <th className="py-3 px-4">Attack Type</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Severity</th>
                  <th className="py-3 px-4">Source</th>
                </tr>
              </thead>

              <tbody>
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td className={`py-4 px-4 ${emptyText}`} colSpan="7">
                      No matching records
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((item, index) => (
                    <tr key={item._id || index}>
                      <td className="py-3 px-4">{item.date || "-"}</td>
                      <td className="py-3 px-4">{item.time}</td>
                      <td
                        className={`py-3 px-4 font-semibold ${
                          item.prediction === "Attack Detected"
                            ? "text-red-500"
                            : "text-green-500"
                        }`}
                      >
                        {item.prediction}
                      </td>
                      <td className="py-3 px-4">{item.attack_type}</td>
                      <td className="py-3 px-4">{item.confidence}%</td>
                      <td className="py-3 px-4">{item.severity}</td>
                      <td className="py-3 px-4 capitalize">{item.source}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </CyberCard>
    </div>
  );
}

export default DetectionHistory;