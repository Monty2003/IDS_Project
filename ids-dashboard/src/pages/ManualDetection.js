import { useEffect, useState } from "react";
import axios from "axios";
import { useIDS } from "../context/IDSContext";
import CyberCard from "../components/CyberCard";
import API_BASE from "../config";

function ManualDetection() {
  const { features, setFeatures, setStats } = useIDS();

  const [formData, setFormData] = useState({});
  const [result, setResult] = useState("");
  const [confidence, setConfidence] = useState("");
  const [severity, setSeverity] = useState("");
  const [attackType, setAttackType] = useState("");
  const [explanation, setExplanation] = useState([]);

  useEffect(() => {
    const loadFeatures = async () => {
      try {
        const response = await axios.get(`${API_BASE}/features`);
        setFeatures(res.data.features);
      } catch (err) {
        console.error(err);
      }
    };

    if (features.length === 0) {
      loadFeatures();
    }
  }, [features, setFeatures]);

  const handleChange = (feature, value) => {
    setFormData({
      ...formData,
      [feature]: value
    });
  };

  const detectAttack = async () => {
    try {
      const response = await axios.post(`${API_BASE}/predict`, formData);

      setResult(res.data.prediction);
      setConfidence(res.data.confidence);
      setSeverity(res.data.severity);
      setAttackType(res.data.attack_type);
      setExplanation(res.data.explanation || []);

      if (res.data.prediction === "Attack Detected") {
        setStats((prev) => ({ ...prev, attack: prev.attack + 1 }));
      } else {
        setStats((prev) => ({ ...prev, normal: prev.normal + 1 }));
      }
    } catch (err) {
      console.error(err);
      setResult("Backend error");
      setConfidence("");
      setSeverity("");
      setAttackType("");
      setExplanation([]);
    }
  };

  const getSeverityClasses = () => {
    if (severity === "Low") return "bg-yellow-400/20 text-yellow-300 border border-yellow-400/30";
    if (severity === "Medium") return "bg-orange-500/20 text-orange-300 border border-orange-400/30";
    if (severity === "High") return "bg-red-500/20 text-red-300 border border-red-400/30";
    if (severity === "Critical") return "bg-red-700/20 text-red-200 border border-red-600/30";
    return "bg-green-500/20 text-green-300 border border-green-400/30";
  };

  return (
    <div className="space-y-6">
      <CyberCard>
        <h2 className="text-xl font-semibold mb-4 text-purple-400">Feature Inputs</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[420px] overflow-y-auto pr-2 cyber-scroll">
          {features.map((feature, index) => (
            <div key={index}>
              <p className="text-sm mb-1 text-slate-300">{feature}</p>
              <input
                type="number"
                step="any"
                className="w-full rounded-xl bg-slate-950 border border-slate-700 px-3 py-2 text-white outline-none focus:border-purple-400 transition"
                value={formData[feature] || ""}
                onChange={(e) => handleChange(feature, e.target.value)}
              />
            </div>
          ))}
        </div>

        <button
          onClick={detectAttack}
          className="cyber-button cyber-interactive mt-5 px-5 py-3"
        >
          🚀 Detect Attack
        </button>
      </CyberCard>

      {result && (
        <CyberCard>
          <h2 className="text-2xl font-semibold">
            Result:{" "}
            <span className={result === "Attack Detected" ? "text-red-400" : "text-green-400"}>
              {result}
            </span>
          </h2>

          <p className="text-lg mt-4">
            Confidence: <span className="font-semibold text-yellow-400">{confidence}%</span>
          </p>

          <div className="mt-4">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getSeverityClasses()}`}>
              {severity} Severity
            </span>
          </div>

          <p className={`text-lg font-semibold mt-4 ${attackType === "BENIGN" ? "text-green-400" : "text-yellow-400"}`}>
            Attack Type: {attackType || "N/A"}
          </p>

          {explanation.length > 0 && (
            <div className="mt-5">
              <h3 className="text-lg font-semibold mb-3 text-purple-400">
                Top Contributing Features
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {explanation.map((item, index) => (
                  <div key={index} className="cyber-card p-4">
                    <p className="font-semibold text-yellow-400">{item.feature}</p>
                    <p className="text-slate-300 mt-1">Importance: {item.importance}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CyberCard>
      )}
    </div>
  );
}

export default ManualDetection;