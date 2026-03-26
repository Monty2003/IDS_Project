function PageHeader({ icon, title, subtitle, accent = "cyan" }) {
  const accentMap = {
    cyan: "from-cyan-400 via-blue-400 to-transparent",
    red: "from-red-400 via-orange-400 to-transparent",
    green: "from-green-400 via-emerald-400 to-transparent",
    yellow: "from-yellow-400 via-orange-400 to-transparent",
    purple: "from-purple-400 via-fuchsia-400 to-transparent",
    blue: "from-blue-400 via-cyan-400 to-transparent"
  };

  return (
    <div className="mb-6">
      <div className="flex items-start gap-3">
        <div className="text-3xl">{icon}</div>
        <div>
          <h1 className="text-3xl font-extrabold cyber-title tracking-wide">
            {title}
          </h1>
          <p className="cyber-subtitle mt-1">{subtitle}</p>
        </div>
      </div>

      <div
        className={`mt-3 h-[3px] w-56 rounded-full bg-gradient-to-r ${accentMap[accent] || accentMap.cyan}`}
      ></div>
    </div>
  );
}

export default PageHeader;