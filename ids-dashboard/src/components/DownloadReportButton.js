import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useIDS } from "../context/IDSContext";

function DownloadReportButton() {
  const { stats, history, batchSummary, batchResults } = useIDS();

  const createPieChartImage = (normalCount, attackCount) => {
    const canvas = document.createElement("canvas");
    canvas.width = 500;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");

    if (!ctx) return null;

    const total = normalCount + attackCount;
    const normalAngle = total > 0 ? (normalCount / total) * Math.PI * 2 : 0;
    const attackAngle = total > 0 ? (attackCount / total) * Math.PI * 2 : 0;

    const centerX = 160;
    const centerY = 150;
    const radius = 90;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#111827";
    ctx.font = "bold 20px Arial";
    ctx.fillText("Traffic Distribution", 20, 30);

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, 0, normalAngle);
    ctx.closePath();
    ctx.fillStyle = "#22c55e";
    ctx.fill();

    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, normalAngle, normalAngle + attackAngle);
    ctx.closePath();
    ctx.fillStyle = "#ef4444";
    ctx.fill();

    ctx.beginPath();
    ctx.arc(centerX, centerY, 38, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff";
    ctx.fill();

    ctx.fillStyle = "#22c55e";
    ctx.fillRect(320, 90, 18, 18);
    ctx.fillStyle = "#111827";
    ctx.font = "16px Arial";
    ctx.fillText(`Normal: ${normalCount}`, 350, 104);

    ctx.fillStyle = "#ef4444";
    ctx.fillRect(320, 130, 18, 18);
    ctx.fillStyle = "#111827";
    ctx.fillText(`Attack: ${attackCount}`, 350, 144);

    ctx.fillStyle = "#111827";
    ctx.font = "14px Arial";
    ctx.fillText(`Total: ${total}`, 320, 190);

    return canvas.toDataURL("image/png");
  };

  const generatePdfReport = () => {
    const doc = new jsPDF();

    const totalTraffic = stats.normal + stats.attack;
    const attackRate =
      totalTraffic > 0 ? ((stats.attack / totalTraffic) * 100).toFixed(2) : "0.00";

    const chartImage = createPieChartImage(stats.normal, stats.attack);

    doc.setFillColor(15, 23, 42);
    doc.rect(0, 0, 210, 297, "F");

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(24);
    doc.text("Intrusion Detection System", 105, 60, { align: "center" });

    doc.setFontSize(18);
    doc.text("Security Analysis Report", 105, 78, { align: "center" });

    doc.setFontSize(13);
    doc.text("Developer: Raj Deep Suman", 105, 115, { align: "center" });
    doc.text("Role: B.Tech Student", 105, 125, { align: "center" });
    doc.text("College: Gitam University", 105, 135, { align: "center" });

    doc.setFontSize(11);
    doc.text(`Generated On: ${new Date().toLocaleString()}`, 105, 170, {
      align: "center"
    });

    doc.setTextColor(180, 220, 255);
    doc.text("Dataset: CICIDS2017 | Model: Random Forest | Type: Multiclass IDS", 105, 190, {
      align: "center"
    });

    doc.addPage();
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text("1. System Summary", 14, 20);

    autoTable(doc, {
      startY: 28,
      head: [["Metric", "Value"]],
      body: [
        ["Project", "Intrusion Detection System"],
        ["Dataset", "CICIDS2017"],
        ["Model", "Random Forest Classifier"],
        ["Classification Type", "Multiclass"],
        ["Total Traffic Checked", totalTraffic],
        ["Normal Traffic", stats.normal],
        ["Attack Traffic", stats.attack],
        ["Attack Rate", `${attackRate}%`]
      ],
      styles: { fontSize: 10 },
      headStyles: { fillColor: [30, 41, 59] }
    });

    let nextY = doc.lastAutoTable.finalY + 10;

    if (chartImage) {
      doc.setFontSize(16);
      doc.text("Traffic Distribution Chart", 14, nextY);
      doc.addImage(chartImage, "PNG", 14, nextY + 6, 150, 90);
    }

    doc.addPage();
    doc.setFontSize(18);
    doc.text("2. CSV Analysis Summary", 14, 20);

    if (batchSummary) {
      autoTable(doc, {
        startY: 28,
        head: [["Metric", "Value"]],
        body: [
          ["Total Rows", batchSummary.total_rows || 0],
          ["Normal Rows", batchSummary.normal || 0],
          ["Attack Rows", batchSummary.attack || 0],
          ["Attack Rate", `${batchSummary.attack_rate || 0}%`],
          ["Risk Level", batchSummary.risk_level || "N/A"]
        ],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [30, 41, 59] }
      });
    } else {
      doc.setFontSize(11);
      doc.text("No CSV batch analysis data available.", 14, 32);
    }

    doc.addPage();
    doc.setFontSize(18);
    doc.text("3. Recent Detection History", 14, 20);

    const recentHistory = history.slice(0, 12).map((item) => [
      item.time || "N/A",
      item.prediction || "N/A",
      item.attack_type || "N/A",
      item.severity || "N/A",
      `${item.confidence || 0}%`
    ]);

    if (recentHistory.length > 0) {
      autoTable(doc, {
        startY: 28,
        head: [["Time", "Prediction", "Attack Type", "Severity", "Confidence"]],
        body: recentHistory,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 41, 59] }
      });
    } else {
      doc.setFontSize(11);
      doc.text("No detection history available.", 14, 32);
    }

    doc.addPage();
    doc.setFontSize(18);
    doc.text("4. CSV Detection Preview", 14, 20);

    const csvPreview = batchResults.slice(0, 12).map((item) => [
      item.row || "N/A",
      item.prediction || "N/A",
      item.attack_type || "N/A",
      item.severity || "N/A",
      `${item.confidence || 0}%`
    ]);

    if (csvPreview.length > 0) {
      autoTable(doc, {
        startY: 28,
        head: [["Row", "Prediction", "Attack Type", "Severity", "Confidence"]],
        body: csvPreview,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [30, 41, 59] }
      });
    } else {
      doc.setFontSize(11);
      doc.text("No CSV preview available.", 14, 32);
    }

    doc.addPage();
    doc.setFontSize(18);
    doc.text("5. Project Features", 14, 20);

    const features = [
      "Manual intrusion detection using selected network features",
      "Real-time monitoring using WebSocket streaming",
      "Multiclass attack classification",
      "CSV batch analysis with attack type and severity",
      "Detection history with search and filtering",
      "Explainable AI using feature importance",
      "Session timer and settings panel",
      "Developer page and model info page"
    ];

    let y = 35;
    doc.setFontSize(11);

    features.forEach((feature, index) => {
      doc.text(`${index + 1}. ${feature}`, 18, y);
      y += 12;
    });

    doc.save("ids_security_report.pdf");
  };

  return (
    <button
      onClick={generatePdfReport}
      className="cyber-button cyber-interactive px-4 py-2 rounded-xl font-medium"
    >
      Download PDF Report
    </button>
  );
}

export default DownloadReportButton;