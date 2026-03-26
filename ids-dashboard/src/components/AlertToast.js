import { useIDS } from "../context/IDSContext";

function AlertToast() {
  const { alertBox, setAlertBox, alertsEnabled } = useIDS();

  if (!alertsEnabled || !alertBox.show) return null;

  const getAlertClasses = () => {
    if (alertBox.type === "danger") {
      return "bg-red-500/20 border-red-400/40 text-red-100";
    }
    if (alertBox.type === "warning") {
      return "bg-yellow-500/20 border-yellow-400/40 text-yellow-100";
    }
    if (alertBox.type === "success") {
      return "bg-green-500/20 border-green-400/40 text-green-100";
    }
    return "bg-cyan-500/20 border-cyan-400/40 text-cyan-100";
  };

  return (
    <div className={`fixed top-5 right-5 z-50 w-[360px] border px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md cyber-interactive ${getAlertClasses()}`}>
      <div className="flex justify-between items-start gap-3">
        <div>
          <h3 className="font-bold text-base">{alertBox.title}</h3>
          <p className="text-sm mt-1">{alertBox.message}</p>
        </div>

        <button
          onClick={() =>
            setAlertBox({
              show: false,
              type: "",
              title: "",
              message: ""
            })
          }
          className="font-bold text-lg"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export default AlertToast;