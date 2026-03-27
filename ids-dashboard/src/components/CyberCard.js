function CyberCard({ children, className = "" }) {
  return (
    <div className={`cyber-card p-5 cyber-glow ${className}`}>
      {children}
    </div>
  );
}

export default CyberCard;