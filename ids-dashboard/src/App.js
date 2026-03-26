import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useEffect } from "react";
import Sidebar from "./components/Sidebar";
import AlertToast from "./components/AlertToast";
import SettingsPanel from "./components/SettingsPanel";
import SessionTimer from "./components/SessionTimer";
import SystemStatus from "./components/SystemStatus";
import DownloadReportButton from "./components/DownloadReportButton";
import DateTimeLocation from "./components/DateTimeLocation";
import DashboardHome from "./pages/DashboardHome";
import ManualDetection from "./pages/ManualDetection";
import LiveMonitoring from "./pages/LiveMonitoring";
import CSVAnalysis from "./pages/CSVAnalysis";
import DetectionHistory from "./pages/DetectionHistory";
import Developer from "./pages/Developer";
import ModelInfo from "./pages/ModelInfo";
import AttackInfo from "./pages/AttackInfo";
import PageTransition from "./components/PageTransition";
import { IDSProvider, useIDS } from "./context/IDSContext";

function TopbarTitle() {
  const location = useLocation();

  const pageMap = {
    "/": {
      icon: "🛡️",
      title: "Intrusion Detection Command Center",
      subtitle: "Real-time visibility, analytics, and defensive monitoring"
    },
    "/manual-detection": {
      icon: "🧪",
      title: "Manual Detection Interface",
      subtitle: "Test custom feature inputs against the detection model"
    },
    "/live-monitoring": {
      icon: "📡",
      title: "Live Monitoring Console",
      subtitle: "Observe streaming activity and simulated intrusion signals"
    },
    "/csv-analysis": {
      icon: "📁",
      title: "CSV Threat Analysis",
      subtitle: "Batch-inspect network traffic records using ML detection"
    },
    "/history": {
      icon: "🕘",
      title: "Detection History Ledger",
      subtitle: "Track recent predictions, alerts, and response events"
    },
    "/model-info": {
      icon: "🤖",
      title: "Model Intelligence Center",
      subtitle: "Review classifier details, feature design, and dataset info"
    },
    "/attack-info": {
      icon: "⚠️",
      title: "Threat Knowledge Base",
      subtitle: "Explore attack types and brief intrusion descriptions"
    },
    "/developer": {
      icon: "👨‍💻",
      title: "Developer Profile",
      subtitle: "Project author, contribution details, and build context"
    }
  };

  const current = pageMap[location.pathname] || pageMap["/"];

  return (
    <div>
      <div className="flex items-center gap-3">
        <div className="text-3xl">{current.icon}</div>
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold cyber-title tracking-wide">
            {current.title}
          </h1>
          <p className="text-sm cyber-subtitle">{current.subtitle}</p>
        </div>
      </div>
      <div className="cyber-line mt-3"></div>
    </div>
  );
}

function AnimatedRoutes() {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route
          path="/"
          element={
            <PageTransition>
              <DashboardHome />
            </PageTransition>
          }
        />
        <Route
          path="/manual-detection"
          element={
            <PageTransition>
              <ManualDetection />
            </PageTransition>
          }
        />
        <Route
          path="/live-monitoring"
          element={
            <PageTransition>
              <LiveMonitoring />
            </PageTransition>
          }
        />
        <Route
          path="/csv-analysis"
          element={
            <PageTransition>
              <CSVAnalysis />
            </PageTransition>
          }
        />
        <Route
          path="/history"
          element={
            <PageTransition>
              <DetectionHistory />
            </PageTransition>
          }
        />
        <Route
          path="/developer"
          element={
            <PageTransition>
              <Developer />
            </PageTransition>
          }
        />
        <Route
          path="/model-info"
          element={
            <PageTransition>
              <ModelInfo />
            </PageTransition>
          }
        />
        <Route
          path="/attack-info"
          element={
            <PageTransition>
              <AttackInfo />
            </PageTransition>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

function AppLayout() {
  const { theme } = useIDS();

  useEffect(() => {
    document.documentElement.classList.remove("theme-dark", "theme-light");
    document.body.classList.remove("theme-dark", "theme-light");

    const activeTheme = theme === "dark" ? "theme-dark" : "theme-light";
    document.documentElement.classList.add(activeTheme);
    document.body.classList.add(activeTheme);
  }, [theme]);

  const appClasses =
    theme === "dark"
      ? "bg-slate-950 text-white"
      : "bg-slate-50 text-slate-900";

  const topbarClasses =
    theme === "dark"
      ? "bg-slate-950/85 border-slate-800"
      : "bg-white/70 border-slate-300 shadow-[0_8px_30px_rgba(15,23,42,0.05)]";

  return (
    <Router>
      <div className={`min-h-screen ${appClasses}`}>
        <div className="cyber-bg-glow"></div>
        <Sidebar />

        <main className="ml-72 min-h-screen">
          <div
            className={`sticky top-0 z-40 border-b backdrop-blur-xl px-6 py-5 ${topbarClasses}`}
          >
            <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
              <TopbarTitle />

              <div className="flex items-center gap-4 flex-wrap justify-end">
                <DateTimeLocation />
                <SystemStatus />
                <SessionTimer />
                <DownloadReportButton />
                <SettingsPanel />
              </div>
            </div>
          </div>

          <div className="p-6">
            <AlertToast />
            <AnimatedRoutes />
          </div>
        </main>
      </div>
    </Router>
  );
}

function App() {
  return (
    <IDSProvider>
      <AppLayout />
    </IDSProvider>
  );
}

export default App;