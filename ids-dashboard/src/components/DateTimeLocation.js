import { useEffect, useState } from "react";
import { useIDS } from "../context/IDSContext";

function DateTimeLocation() {
  const { theme } = useIDS();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [location, setLocation] = useState("Detecting location...");
  const [timeFormat, setTimeFormat] = useState(
    localStorage.getItem("ids-time-format") || "12hr"
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    localStorage.setItem("ids-time-format", timeFormat);
  }, [timeFormat]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocation("Location not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&addressdetails=1&zoom=18&lat=${latitude}&lon=${longitude}`
          );

          const data = await response.json();
          const address = data.address || {};

          let locality =
            address.suburb ||
            address.neighbourhood ||
            address.village ||
            address.hamlet ||
            address.city_district ||
            address.town ||
            address.municipality ||
            address.city ||
            address.county ||
            "Unknown City";

          const state =
            address.state ||
            address.state_district ||
            address.region ||
            "";

          const country = address.country || "";

          // Manual correction map for known wrong localities
          const localityCorrections = {
            Byadarahalli: "Nagadenehalli"
          };

          if (localityCorrections[locality]) {
            locality = localityCorrections[locality];
          }

          const fullLocation = [locality, state, country]
            .filter(Boolean)
            .join(", ");

          setLocation(fullLocation || "Location unavailable");
        } catch (error) {
          console.error("Location fetch error:", error);
          setLocation("Location unavailable");
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocation("Location permission denied");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  }, []);

  const formattedDate = currentTime.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

  const formattedTime = currentTime.toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: timeFormat === "12hr"
  });

  const boxClasses =
    theme === "dark"
      ? "bg-slate-800 border border-slate-700 text-white"
      : "bg-white border border-slate-300 text-slate-900";

  const toggleClasses =
    theme === "dark"
      ? "bg-slate-700 hover:bg-slate-600 text-white"
      : "bg-slate-200 hover:bg-slate-300 text-slate-900";

  return (
    <div className={`px-4 py-3 rounded-xl shadow-sm min-w-[280px] ${boxClasses}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs opacity-70">Date & Time</p>
          <p className="text-sm font-semibold">{formattedDate}</p>
          <p className="text-sm font-semibold">{formattedTime}</p>
        </div>

        <button
          onClick={() =>
            setTimeFormat((prev) => (prev === "12hr" ? "24hr" : "12hr"))
          }
          className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${toggleClasses}`}
        >
          {timeFormat === "12hr" ? "12H" : "24H"}
        </button>
      </div>

      <div className="mt-3">
        <p className="text-xs opacity-70">Location</p>
        <p className="text-sm font-semibold break-words">{location}</p>
      </div>
    </div>
  );
}

export default DateTimeLocation;