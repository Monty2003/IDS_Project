import { NavLink } from "react-router-dom";
import { useIDS } from "../context/IDSContext";

function Sidebar() {
  const { theme } = useIDS();

  const sidebarClasses =
    theme === "dark"
      ? "bg-slate-950/70 border-cyan-400/10 text-white backdrop-blur-2xl"
      : "bg-white/80 border-slate-300 text-slate-900 backdrop-blur-xl shadow-[0_20px_50px_rgba(15,23,42,0.08)]";

  const activeClasses =
    theme === "dark"
      ? "cyber-active-nav bg-gradient-to-r from-cyan-500/20 to-purple-500/10 text-white border border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.15)]"
      : "cyber-active-nav bg-gradient-to-r from-cyan-100 to-blue-100 text-slate-900 border border-cyan-300/70";

  const linkClasses = ({ isActive }) =>
    `cyber-nav-item group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
      isActive
        ? activeClasses
        : theme === "dark"
        ? "text-slate-300 hover:bg-slate-900/70 hover:text-white border border-transparent"
        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 border border-transparent"
    }`;

  return (
    <aside
      className={`fixed left-0 top-0 z-50 w-72 h-screen border-r p-5 overflow-y-auto cyber-scroll ${sidebarClasses}`}
    >
      {/* LOGO SECTION */}
      <div className="mb-10">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-cyan-400 via-blue-500 to-purple-600 flex items-center justify-center text-xl shadow-[0_0_25px_rgba(34,211,238,0.35)] cyber-interactive">
            🛡️
          </div>

          <div>
            <h2 className="text-2xl font-extrabold cyber-title tracking-wide">
              IDS Console
            </h2>
            <p
              className={`text-xs ${
                theme === "dark" ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Cyber Defense Dashboard
            </p>
          </div>
        </div>
      </div>

      {/* NAVIGATION */}
      <nav className="space-y-2">
        <NavLink to="/" className={linkClasses}>
          <span className="text-lg group-hover:scale-110 transition">📊</span>
          <span>Dashboard</span>
        </NavLink>

        <NavLink to="/manual-detection" className={linkClasses}>
          <span className="text-lg group-hover:scale-110 transition">🧪</span>
          <span>Manual Detection</span>
        </NavLink>

        <NavLink to="/live-monitoring" className={linkClasses}>
          <span className="text-lg group-hover:scale-110 transition">📡</span>
          <span>Live Monitoring</span>
        </NavLink>

        <NavLink to="/csv-analysis" className={linkClasses}>
          <span className="text-lg group-hover:scale-110 transition">📁</span>
          <span>CSV Analysis</span>
        </NavLink>

        <NavLink to="/history" className={linkClasses}>
          <span className="text-lg group-hover:scale-110 transition">🕘</span>
          <span>Detection History</span>
        </NavLink>

        <NavLink to="/model-info" className={linkClasses}>
          <span className="text-lg group-hover:scale-110 transition">🤖</span>
          <span>Model Info</span>
        </NavLink>

        <NavLink to="/attack-info" className={linkClasses}>
          <span className="text-lg group-hover:scale-110 transition">⚠️</span>
          <span>Attack Info</span>
        </NavLink>

        <NavLink to="/developer" className={linkClasses}>
          <span className="text-lg group-hover:scale-110 transition">👨‍💻</span>
          <span>Developer</span>
        </NavLink>
      </nav>

      {/* FOOTER */}
      <div className="mt-10 pt-6 border-t border-slate-700/40 text-xs text-slate-500">
        <p>System Status: <span className="text-green-400">Active</span></p>
        <p className="mt-1">v1.0 Cyber IDS</p>
      </div>
    </aside>
  );
}

export default Sidebar;