import { useEffect, useState } from "react";
import { useIDS } from "../context/IDSContext";

function SessionTimer() {
  const { theme } = useIDS();
  const [timeLeft, setTimeLeft] = useState(600);

  useEffect(() => {
    const resetTimer = () => {
      setTimeLeft(600);
    };

    const events = ["click", "mousemove", "keydown", "scroll"];

    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          return 600;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
    };
  }, []);

  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");

  const cardClasses =
    theme === "dark"
      ? "bg-slate-800 border border-slate-700 text-white"
      : "bg-white border border-slate-300 text-slate-900";

  const textColor =
    timeLeft <= 60
      ? "text-red-400"
      : theme === "dark"
      ? "text-white"
      : "text-slate-900";

  return (
    <div
      className={`px-4 py-3 rounded-xl shadow-sm w-[92px] flex items-center justify-center ${cardClasses}`}
    >
      <span className={`text-lg font-bold tabular-nums ${textColor}`}>
        {minutes}:{seconds}
      </span>
    </div>
  );
}

export default SessionTimer;