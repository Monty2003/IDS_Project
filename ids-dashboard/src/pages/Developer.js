import { useState } from "react";
import profile from "../assets/profile.jpeg";
import CyberCard from "../components/CyberCard";

function Developer() {
  const [showImageModal, setShowImageModal] = useState(false);

  return (
    <div className="space-y-6">
      <CyberCard className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <button
            onClick={() => setShowImageModal(true)}
            className="cyber-interactive rounded-full"
          >
            <img
              src={profile}
              alt="Developer"
              className="w-40 h-40 rounded-full object-cover border-4 border-cyan-500 shadow-[0_0_22px_rgba(34,211,238,0.18)] cursor-pointer"
            />
          </button>

          <div>
            <h1 className="text-3xl font-bold">Raj Deep Suman</h1>
            <p className="text-cyan-400 text-lg mt-1">B.Tech Student</p>
            <p className="text-slate-300 mt-2">Gitam University</p>
            <p className="text-slate-300 mt-1">
              📍 Place: <span className="text-cyan-400">Bihar, Patna</span>
            </p>
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-purple-400">About Me</h2>
          <p className="text-slate-300 leading-relaxed">
            I am a Computer Science Engineering student with a strong interest in
            Cybersecurity, Machine Learning, and Full Stack Development.
            This Intrusion Detection System project is built using CICIDS2017 dataset
            with real-time monitoring, multiclass attack detection, and a modern React dashboard.
          </p>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-purple-400">Skills & Technologies</h2>

          <div className="flex flex-wrap gap-4">
            {[
              "MySQL",
              "React.js",
              "Flask",
              "Azure",
              "Video Editing",
              "Canva",
              "Unity",
              "Machine Learning",
              "Flutter"
            ].map((skill, index) => (
              <span
                key={index}
                className="px-4 py-2 rounded-full text-sm font-medium 
                bg-cyan-500/20 text-cyan-300 border border-cyan-400/30
                transition-all duration-300 
                hover:scale-110 hover:shadow-[0_0_15px_rgba(34,211,238,0.6)]
                hover:bg-cyan-400/30 cursor-pointer
                active:scale-95"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-purple-400">Programming Languages Known</h2>

          <div className="flex flex-wrap gap-4">
            {["C", "Java", "Python", "JavaScript"].map((lang, index) => (
              <span
                key={index}
                className="px-4 py-2 rounded-full text-sm font-medium 
                bg-green-500/20 text-green-300 border border-green-400/30
                transition-all duration-300 
                hover:scale-110 hover:shadow-[0_0_15px_rgba(34,197,94,0.5)]
                hover:bg-green-400/30 cursor-pointer
                active:scale-95"
              >
                {lang}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-purple-400">Languages Known</h2>

          <div className="flex flex-wrap gap-4">
            {["Hindi", "English", "Bhojpuri"].map((language, index) => (
              <span
                key={index}
                className="px-4 py-2 rounded-full text-sm font-medium 
                bg-yellow-500/20 text-yellow-300 border border-yellow-400/30
                transition-all duration-300 
                hover:scale-110 hover:shadow-[0_0_15px_rgba(234,179,8,0.5)]
                hover:bg-yellow-400/30 cursor-pointer
                active:scale-95"
              >
                {language}
              </span>
            ))}
          </div>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-purple-400">Project</h2>
          <p className="text-slate-300">
            Intrusion Detection System using CICIDS2017 dataset with:
          </p>

          <ul className="list-disc ml-6 mt-2 text-slate-300 space-y-1">
            <li>Real-time monitoring (WebSocket)</li>
            <li>Multiclass attack detection</li>
            <li>CSV batch analysis</li>
            <li>Explainable AI (feature importance)</li>
            <li>Interactive dashboard with charts</li>
          </ul>
        </div>

        <div className="mt-8">
          <h2 className="text-2xl font-semibold mb-3 text-purple-400">Contact</h2>

          <div className="space-y-2 text-slate-300">
            <p>
              📧 Email:{" "}
              <a
                href="mailto:rsuman@gitam.in"
                className="text-cyan-400 hover:underline"
              >
                rsuman@gitam.in
              </a>
            </p>
            <p>📱 Phone: 9380027487</p>
            <p>
              💻 GitHub:{" "}
              <a
                href="https://github.com/Monty2003"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline"
              >
                github.com/Monty2003
              </a>
            </p>
            <p>
              🔗 LinkedIn:{" "}
              <a
                href="https://www.linkedin.com/in/raj-deep-suman-186408293/"
                target="_blank"
                rel="noreferrer"
                className="text-cyan-400 hover:underline"
              >
                raj-deep-suman
              </a>
            </p>
          </div>
        </div>
      </CyberCard>

      {showImageModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center px-4"
          onClick={() => setShowImageModal(false)}
        >
          <div
            className="cyber-card w-full max-w-md p-5 relative text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute top-3 right-3 text-white text-2xl leading-none cyber-interactive"
            >
              ×
            </button>

            <img
              src={profile}
              alt="Raj Deep Suman"
              className="w-full max-h-[420px] object-cover rounded-2xl border border-cyan-400/30 shadow-[0_0_22px_rgba(34,211,238,0.18)]"
            />

            <h3 className="mt-4 text-xl font-bold text-cyan-400">
              Raj Deep Suman
            </h3>
          </div>
        </div>
      )}
    </div>
  );
}

export default Developer;