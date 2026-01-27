import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

/* ===============================
   STATIC DASHBOARD DATA
================================ */
const chartData = {
  week: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    inward: [120, 85, 150, 95, 180, 65, 210],
    outward: [90, 70, 120, 85, 140, 50, 180],
    net: [30, 15, 30, 10, 40, 15, 30],
  },
  month: {
    labels: ["W1", "W2", "W3", "W4", "W5"],
    inward: [520, 480, 620, 580, 450],
    outward: [420, 380, 520, 480, 350],
    net: [100, 100, 100, 100, 100],
  },
  quarter: {
    labels: ["Q1", "Q2", "Q3", "Q4"],
    inward: [4500, 5200, 4800, 5600],
    outward: [3800, 4300, 4000, 4700],
    net: [700, 900, 800, 900],
  }
};

/* ===============================
   DASHBOARD COMPONENT
================================ */
export default function Dashboard() {
  const { user } = useApp();
  const navigate = useNavigate();

  const [period, setPeriod] = useState("week");

  const userName =
    user?.firstName || user?.fullName?.split(" ")[0] || "User";
  const role = user?.role || "Admin";

  const stats = [
    { title: "Total SKUs", value: "1,247", page: "/products", icon: "📦" },
    { title: "Stock Value", value: "₹45.2L", icon: "💰" },
    { title: "Low Stock", value: "23", page: "/low-stock", icon: "⚠️" },
    { title: "Expiring Soon", value: "15", icon: "⏰" },
    { title: "Today's Inward", value: "142", page: "/stock-in", icon: "📥" },
    { title: "Today's Outward", value: "98", page: "/stock-out", icon: "📤" },
  ];

  return (
    <div className="space-y-6 fade-in">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Inventory Dashboard
        </h1>
        <p className="text-gray-600">
          Welcome back,{" "}
          <span className="font-semibold text-blue-600">
            {userName}
          </span>{" "}
          <span className="text-sm text-gray-500">({role})</span>
        </p>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((s) => (
          <div
            key={s.title}
            onClick={() => s.page && navigate(s.page)}
            className="bg-white rounded-xl shadow-md p-4 cursor-pointer hover:shadow-lg transition"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-600">{s.title}</p>
                <p className="text-2xl font-bold text-gray-900">
                  {s.value}
                </p>
              </div>
              <div className="text-4xl">{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* CHART */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Stock Movement</h3>
          <div className="flex space-x-2">
            {["week", "month", "quarter"].map((p) => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3 py-1 rounded-md text-sm ${
                  period === p
                    ? "bg-blue-100 text-blue-600 font-medium"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <SimpleLineChart data={chartData[period]} />
      </div>

      {/* RECENT ACTIVITY */}
      <div className="bg-white rounded-xl shadow-md p-4">
        <h3 className="text-lg font-semibold mb-3">Recent Activity</h3>
        <ul className="space-y-2 text-sm">
          <li>📥 Stock Added – Rice 25kg (50 units)</li>
          <li>📤 Stock Removed – Wheat Flour (30 units)</li>
          <li>⚠️ Low Stock – Sugar 50kg</li>
          <li>📦 New Product – Premium Basmati Rice</li>
        </ul>
      </div>

    </div>
  );
}

/* ===============================
   SIMPLE SVG LINE CHART
================================ */
function SimpleLineChart({ data }) {
  const width = 320;
  const height = 160;
  const padding = 20;

  const max = Math.max(
    ...data.inward,
    ...data.outward,
    ...data.net
  );

  const scaleX = (i) =>
    padding + (i * (width - padding * 2)) / (data.labels.length - 1);

  const scaleY = (v) =>
    height - padding - (v / max) * (height - padding * 2);

  const path = (arr) =>
    arr
      .map(
        (v, i) =>
          `${i === 0 ? "M" : "L"} ${scaleX(i)} ${scaleY(v)}`
      )
      .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-48">
      <path d={path(data.inward)} fill="none" stroke="#3b82f6" strokeWidth="2" />
      <path d={path(data.outward)} fill="none" stroke="#10b981" strokeWidth="2" />
      <path d={path(data.net)} fill="none" stroke="#8b5cf6" strokeWidth="2" />
    </svg>
  );
}
