import { useEffect } from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { useIDS } from "../context/IDSContext";
import PageHeader from "../components/PageHeader";
import CyberCard from "../components/CyberCard";

ChartJS.register(ArcElement, Tooltip, Legend);

function DashboardHome() {
  const {
    stats,
    history,
    theme,
    fetchHistoryFromDB,
    historyLoading,
    historyError
  } = useIDS();

  useEffect(() => {
    fetchHistoryFromDB();
  }, [fetchHistoryFromDB]);

  const totalTraffic = stats.normal + stats.attack;
  const attackRate =
    totalTraffic > 0 ? ((stats.attack / totalTraffic) * 100).toFixed(2) : "0.00";

  const mutedText = theme === "dark" ? "text-slate-400" : "text-slate-700";
  const headingText = theme === "dark" ? "text-cyan-400" : "text-cyan-700";
  const emptyRowText = theme === "dark" ? "text-slate-300" : "text-slate-800";

  const chartData = {
    labels: ["Normal", "Attack"],
    datasets: [
      {
        data: [stats.normal, stats.attack],
        backgroundColor: ["#22c55e", "#ef4444"],
        borderWidth: 0
      }
    ]
  };

  const recentHistory = history.slice(0, 5);

  return (
    <div className="space-y-6">
      <PageHeader
        icon="📊"
        title="Threat Activity Overview"
        subtitle="High-level monitoring summary for traffic, detections, and recent system response."
        accent="cyan"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <CyberCard>
          <p className={`${mutedText} text-sm`}>Total Traffic Checked</p>
          <h3 className="text-3xl font-bold mt-2">{totalTraffic}</h3>
        </CyberCard>

        <CyberCard>
          <p className={`${mutedText} text-sm`}>Attack Detections</p>
          <h3 className="text-3xl font-bold mt-2 text-red-500">{stats.attack}</h3>
        </CyberCard>

        <CyberCard>
          <p className={`${mutedText} text-sm`}>Normal Traffic</p>
          <h3 className="text-3xl font-bold mt-2 text-green-500">{stats.normal}</h3>
        </CyberCard>

        <CyberCard>
          <p className={`${mutedText} text-sm`}>Attack Rate</p>
          <h3 className="text-3xl font-bold mt-2 text-yellow-500">{attackRate}%</h3>
        </CyberCard>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <CyberCard>
          <h2 className={`text-xl font-semibold mb-4 ${headingText}`}>
            Detection Distribution
          </h2>

          <div className="max-w-sm mx-auto">
            <Pie data={chartData} />
          </div>

          <div className="mt-6 flex flex-col gap-2">
            <span className="cyber-pill bg-green-500/15 text-green-500 border border-green-500/20">
              ● Normal: {stats.normal}
            </span>
            <span className="cyber-pill bg-red-500/15 text-red-500 border border-red-500/20">
              ● Attack: {stats.attack}
            </span>
          </div>
        </CyberCard>

        <CyberCard>
          <div className="flex items-center justify-between gap-4 mb-4">
            <h2 className={`text-xl font-semibold ${headingText}`}>
              Recent Detection History
            </h2>

            <button
              onClick={fetchHistoryFromDB}
              className="cyber-button cyber-interactive px-3 py-2 text-sm"
            >
              Refresh
            </button>
          </div>

          {historyLoading ? (
            <p className={emptyRowText}>Loading history...</p>
          ) : historyError ? (
            <p className="text-red-500">{historyError}</p>
          ) : (
            <div className="cyber-table-wrap overflow-x-auto cyber-scroll">
              <table className="w-full text-left cyber-table">
                <thead>
                  <tr>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Prediction</th>
                    <th className="py-3 px-4">Confidence</th>
                  </tr>
                </thead>

                <tbody>
                  {recentHistory.length === 0 ? (
                    <tr>
                      <td className={`py-4 px-4 ${emptyRowText}`} colSpan="3">
                        No detections yet
                      </td>
                    </tr>
                  ) : (
                    recentHistory.map((item, index) => (
                      <tr key={item._id || index}>
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
                        <td className="py-3 px-4">{item.confidence}%</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CyberCard>
      </div>
    </div>
  );
}

export default DashboardHome;