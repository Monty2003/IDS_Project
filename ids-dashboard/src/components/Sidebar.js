import { NavLink } from "react-router-dom";
import { useIDS } from "../context/IDSContext";

function Sidebar() {
  const { theme } = useIDS();

  const sidebarClasses =
    theme === "dark"
      ? "bg-slate-950/95 border-slate-800 text-white"
      : "bg-white/85 border-slate-300 text-slate-900 shadow-[0_20px_50px_rgba(15,23,42,0.08)]";

  const activeClasses =
    theme === "dark"
      ? "cyber-active-nav bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-white border border-cyan-400/30"
      : "cyber-active-nav bg-gradient-to-r from-cyan-100 to-blue-100 text-slate-900 border border-cyan-300/70";

  const linkClasses = ({ isActive }) =>
    `cyber-nav-item group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
      isActive
        ? activeClasses
        : theme === "dark"
        ? "text-slate-300 hover:bg-slate-900 hover:text-white border border-transparent"
        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
    }`;

  return (
    <aside
      className={`fixed left-0 top-0 z-50 w-72 h-screen border-r p-5 overflow-y-auto cyber-scroll backdrop-blur-xl ${sidebarClasses}`}
    >
      <div className="mb-8">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-xl shadow-[0_0_20px_rgba(34,211,238,0.25)] cyber-interactive">
            🛡️
          </div>
          <div>
            <h2 className="text-2xl font-extrabold cyber-title">IDS Console</h2>
            <p className={`text-xs ${theme === "dark" ? "text-slate-400" : "text-slate-600"}`}>
              Cyber Defense Dashboard
            </p>
          </div>
        </div>
      </div>

      <nav className="space-y-2">
        <NavLink to="/" className={linkClasses}>
          <span>📊</span>
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/manual-detection" className={linkClasses}>
          <span>🛡️</span>
          <span>Manual Detection</span>
        </NavLink>

        <NavLink to="/live-monitoring" className={linkClasses}>
          <span>📡</span>
          <span>Live Monitoring</span>
        </NavLink>

        <NavLink to="/csv-analysis" className={linkClasses}>
          <span>📁</span>
          <span>CSV Analysis</span>
        </NavLink>

        <NavLink to="/history" className={linkClasses}>
          <span>🕘</span>
          <span>Detection History</span>
        </NavLink>

        <NavLink to="/model-info" className={linkClasses}>
          <span>🤖</span>
          <span>Model Info</span>
        </NavLink>

        <NavLink to="/attack-info" className={linkClasses}>
          <span>⚠️</span>
          <span>Attack Info</span>
        </NavLink>

        <NavLink to="/developer" className={linkClasses}>
          <span>👨‍💻</span>
          <span>Developer</span>
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;