import { useEffect, useRef, useState } from "react";
import { useIDS } from "../context/IDSContext";

function SettingsPanel() {
  const {
    theme,
    setTheme,
    alertsEnabled,
    setAlertsEnabled,
    resetDashboardData
  } = useIDS();

  const [open, setOpen] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    if (open) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [open]);

  const subText = theme === "dark" ? "text-slate-400" : "text-slate-700";
  const maintenanceBorder = theme === "dark" ? "border-slate-700" : "border-slate-300";

  return (
    <div className="relative" ref={panelRef}>
      <button
        onClick={() => setOpen(!open)}
        className="cyber-button px-4 py-3 shadow-lg cyber-interactive"
        title="Open Settings"
      >
        ⚙️
      </button>

      {open && (
        <div className="absolute right-0 mt-3 w-80 cyber-card p-5 z-50 animate-[fadeIn_0.2s_ease]">
          <h2 className="text-lg font-bold cyber-title mb-4">System Preferences</h2>

          <div className="space-y-5">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">Theme Mode</p>
                <p className={`text-sm ${subText}`}>Switch dashboard appearance</p>
              </div>

              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="cyber-button px-3 py-2 cyber-interactive"
              >
                {theme === "dark" ? "☀️ Light" : "🌙 Dark"}
              </button>
            </div>

            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold">Alert Popups</p>
                <p className={`text-sm ${subText}`}>Enable or disable notifications</p>
              </div>

              <button
                onClick={() => setAlertsEnabled(!alertsEnabled)}
                className={`px-3 py-2 rounded-xl font-semibold cyber-interactive ${
                  alertsEnabled
                    ? "bg-green-500/20 text-green-500 border border-green-500/30"
                    : "bg-red-500/20 text-red-500 border border-red-500/30"
                }`}
              >
                {alertsEnabled ? "ON" : "OFF"}
              </button>
            </div>

            <div className={`pt-3 border-t ${maintenanceBorder}`}>
              <p className="font-semibold mb-2">Maintenance</p>

              <button
                onClick={() => {
                  resetDashboardData();
                  setOpen(false);
                }}
                className="w-full rounded-xl bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 transition cyber-interactive"
              >
                Reset Dashboard Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default SettingsPanel;