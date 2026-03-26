import { useEffect, useState } from "react";
import axios from "axios";
import { useIDS } from "../context/IDSContext";

function SystemStatus() {
  const { theme } = useIDS();
  const [backendStatus, setBackendStatus] = useState("Checking...");

  useEffect(() => {
    let mounted = true;

    const checkBackend = async () => {
      try {
        await axios.get("http://127.0.0.1:5000/");
        if (mounted) {
          setBackendStatus("Backend Connected");
        }
      } catch (error) {
        if (mounted) {
          setBackendStatus("Backend Disconnected");
        }
      }
    };

    checkBackend();
    const interval = setInterval(checkBackend, 5000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const cardClasses =
    theme === "dark"
      ? "bg-slate-800 border border-slate-700 text-white"
      : "bg-white border border-slate-300 text-slate-900";

  const statusDotClasses =
    backendStatus === "Backend Connected"
      ? "bg-green-500"
      : backendStatus === "Backend Disconnected"
      ? "bg-red-500"
      : "bg-yellow-400";

  const statusTextClasses =
    backendStatus === "Backend Connected"
      ? "text-green-400"
      : backendStatus === "Backend Disconnected"
      ? "text-red-400"
      : "text-yellow-400";

  return (
    <div className={`px-4 py-3 rounded-xl shadow-sm min-w-[190px] ${cardClasses}`}>
      <p className="text-xs opacity-70 mb-1">System Status</p>

      <div className="flex items-center gap-2">
        <span className={`w-3 h-3 rounded-full ${statusDotClasses}`}></span>
        <span className={`text-sm font-semibold ${statusTextClasses}`}>
          {backendStatus}
        </span>
      </div>
    </div>
  );
}

export default SystemStatus;