import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  CategoryScale,
  LinearScale,
  PointElement,
} from "chart.js";

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement);

export default function GraphCard({ title, labels, data, color }) {
  const chartData = {
    labels,
    datasets: [
      {
        label: title,
        data,
        fill: false,
        borderColor: color,
        tension: 0.1,
      },
    ],
  };

  return (
    <div style={{ width: "360px", margin: "20px", padding: "20px", background: "white", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
      <Line data={chartData} />
    </div>
  );
}
