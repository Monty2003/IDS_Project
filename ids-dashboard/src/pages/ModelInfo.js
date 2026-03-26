import { useState } from "react";
import CyberCard from "../components/CyberCard";

function ModelInfo() {
  const [selectedTech, setSelectedTech] = useState(null);

  const attackTypes = [
    "BENIGN",
    "DDoS",
    "DoS",
    "PortScan",
    "Bot",
    "Brute Force",
    "Web Attack",
    "Infiltration",
    "Heartbleed"
  ];

  const features = [
    "Packet Length Std",
    "Packet Length Variance",
    "Avg Bwd Segment Size",
    "Max Packet Length",
    "Average Packet Size",
    "Bwd Packet Length Std",
    "Bwd Packet Length Max",
    "Total Length of Fwd Packets",
    "Subflow Fwd Bytes",
    "Total Length of Bwd Packets",
    "Fwd Packet Length Max",
    "Destination Port",
    "Packet Length Mean",
    "Avg Fwd Segment Size",
    "Subflow Fwd Packets",
    "Subflow Bwd Bytes",
    "Bwd Packet Length Mean",
    "Fwd IAT Std",
    "Bwd Header Length",
    "Total Fwd Packets"
  ];

  const techStack = [
    {
      name: "React.js",
      desc: "A JavaScript library used to build fast and interactive user interfaces using reusable components."
    },
    {
      name: "Flask",
      desc: "A lightweight Python web framework used to create backend APIs and connect the machine learning model with the frontend."
    },
    {
      name: "Flask-SocketIO",
      desc: "A library used to enable real-time communication between frontend and backend using WebSocket technology."
    },
    {
      name: "Python",
      desc: "A high-level programming language used in this project for backend development, machine learning, and data processing."
    },
    {
      name: "Scikit-learn",
      desc: "A machine learning library used to train and test the Random Forest classifier for intrusion detection."
    },
    {
      name: "Pandas",
      desc: "A data analysis library used to load, clean, preprocess, and manipulate CSV datasets."
    },
    {
      name: "NumPy",
      desc: "A numerical computing library used for array operations, mathematical calculations, and efficient data handling."
    },
    {
      name: "Chart.js",
      desc: "A charting library used to display visual analytics such as pie charts and line graphs in the dashboard."
    },
    {
      name: "Tailwind CSS",
      desc: "A utility-first CSS framework used to design a modern and responsive cyber security themed UI."
    },
    {
      name: "CICIDS2017",
      desc: "CICIDS2017 is a real-world intrusion detection dataset developed by the Canadian Institute for Cybersecurity. It contains both benign and malicious network traffic and is commonly used to train and evaluate IDS models.",
      link: "https://www.unb.ca/cic/datasets/ids-2017.html",
      linkLabel: "Open official CICIDS2017 dataset page"
    }
  ];

  return (
    <div className="space-y-6">
      <CyberCard>
        <h2 className="text-2xl font-semibold mb-4 text-blue-400">Project Overview</h2>
        <p className="leading-relaxed text-slate-300">
          This project is a full-stack Intrusion Detection System built using the CICIDS2017 dataset.
          It uses machine learning for multiclass cyberattack detection and provides a modern React dashboard
          for manual detection, real-time monitoring, CSV batch analysis, attack history tracking, model explanation,
          severity analysis, settings control, and developer profile display.
        </p>
      </CyberCard>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        <CyberCard>
          <p className="text-slate-400 text-sm">Dataset</p>
          <h3 className="text-xl font-bold mt-1">CICIDS2017</h3>
        </CyberCard>

        <CyberCard>
          <p className="text-slate-400 text-sm">Model</p>
          <h3 className="text-xl font-bold mt-1">Random Forest</h3>
        </CyberCard>

        <CyberCard>
          <p className="text-slate-400 text-sm">Classification Type</p>
          <h3 className="text-xl font-bold mt-1">Multiclass</h3>
        </CyberCard>

        <CyberCard>
          <p className="text-slate-400 text-sm">Selected Features</p>
          <h3 className="text-xl font-bold mt-1">20 Features</h3>
        </CyberCard>
      </div>

      <CyberCard>
        <h2 className="text-2xl font-semibold mb-4 text-blue-400">Model Pipeline</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            [
              "Step 1: Raw Dataset",
              "Combined 8 original CICIDS2017 raw CSV files containing labeled normal and malicious traffic records."
            ],
            [
              "Step 2: Preprocessing",
              "Removed unnecessary columns, handled missing values, replaced infinite values, cleaned numeric features, and preserved the multiclass Label column."
            ],
            [
              "Step 3: Feature Selection",
              "Selected the top 20 most important features using a Random Forest based feature importance approach while keeping the Label column separate as target."
            ],
            [
              "Step 4: Model Training",
              "Trained a multiclass Random Forest classifier to detect both normal traffic and multiple specific cyberattack types."
            ],
            [
              "Step 5: Backend Integration",
              "Exposed prediction APIs using Flask and enabled real-time streaming with Flask-SocketIO for live monitoring."
            ],
            [
              "Step 6: Frontend Dashboard",
              "Built a modular multi-page React dashboard with CSV analysis, live monitoring, history tracking, severity analysis, explainable AI, and settings controls."
            ]
          ].map(([title, text], index) => (
            <div key={index} className="cyber-card p-4">
              <h3 className="font-semibold mb-2">{title}</h3>
              <p className="text-slate-300">{text}</p>
            </div>
          ))}
        </div>
      </CyberCard>

      <CyberCard>
        <h2 className="text-2xl font-semibold mb-4 text-blue-400">Attack Classes</h2>

        <div className="flex flex-wrap gap-3">
          {attackTypes.map((item, index) => (
            <span
              key={index}
              className="px-3 py-2 rounded-full text-sm font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30"
            >
              {item}
            </span>
          ))}
        </div>
      </CyberCard>

      <CyberCard>
        <h2 className="text-2xl font-semibold mb-4 text-blue-400">Top 20 Selected Features</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {features.map((feature, index) => (
            <div key={index} className="cyber-card p-4">
              {index + 1}. {feature}
            </div>
          ))}
        </div>
      </CyberCard>

      <CyberCard>
        <h2 className="text-2xl font-semibold mb-4 text-blue-400">Dashboard Modules</h2>
        <ul className="list-disc ml-6 space-y-2 text-slate-300">
          <li>Dashboard overview with summary cards and recent detections</li>
          <li>Manual detection using custom feature inputs</li>
          <li>Real-time monitoring using WebSocket live stream</li>
          <li>CSV batch analysis with attack type and severity classification</li>
          <li>Detection history with search and filtering</li>
          <li>Explainable AI using feature importance</li>
          <li>Severity classification: Normal, Low, Medium, High, Critical</li>
          <li>Settings panel with dark/light mode and alert control</li>
          <li>Developer profile page</li>
        </ul>
      </CyberCard>

      <CyberCard>
        <h2 className="text-2xl font-semibold mb-4 text-blue-400">Tech Stack</h2>

        <div className="flex flex-wrap gap-3">
          {techStack.map((tech, index) => (
            <span
              key={index}
              onClick={() => setSelectedTech(tech)}
              className="px-3 py-2 rounded-full text-sm font-semibold bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 hover:scale-110 hover:bg-cyan-400/30 hover:shadow-[0_0_15px_rgba(34,211,238,0.6)] transition-all duration-300 cursor-pointer"
            >
              {tech.name}
            </span>
          ))}
        </div>
      </CyberCard>

      {selectedTech && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => setSelectedTech(null)}
        >
          <div
            className="cyber-card max-w-md w-full p-6 text-center relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setSelectedTech(null)}
              className="absolute top-3 right-3 text-white text-2xl"
            >
              ×
            </button>

            <h2 className="text-2xl font-bold text-cyan-400 mb-3">
              {selectedTech.name}
            </h2>

            <p className="text-slate-300 leading-relaxed">
                 {selectedTech.desc}
            </p>

            {selectedTech.link && (
              <div className="mt-5">
                <a
                  href={selectedTech.link}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 hover:bg-cyan-400/30 hover:shadow-[0_0_15px_rgba(34,211,238,0.35)] transition-all duration-300"
                >
                  🔗 {selectedTech.linkLabel || "Open Link"}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ModelInfo;