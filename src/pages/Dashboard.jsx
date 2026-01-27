import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

/* ===============================
   STATIC DASHBOARD DATA
================================ */
const warehouseData = {
  "Warehouse A": {
    week: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      inward: [120, 85, 150, 95, 180, 65, 210],
      outward: [90, 70, 120, 85, 140, 50, 180],
      net: [30, 15, 30, 10, 40, 15, 30],
      categoryPercent: 78,
      categoryTitle: "Warehouse A",
      legend: [
        { label: "Electronics", percent: 42, color: "#3b82f6" },
        { label: "Groceries", percent: 36, color: "#8b5cf6" },
        { label: "Others", percent: 22, color: "#ec4899" },
      ],
    },
    month: {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
      inward: [520, 480, 620, 580, 450],
      outward: [420, 380, 520, 480, 350],
      net: [100, 100, 100, 100, 100],
      categoryPercent: 78,
      categoryTitle: "Warehouse A",
      legend: [
        { label: "Electronics", percent: 38, color: "#3b82f6" },
        { label: "Groceries", percent: 32, color: "#8b5cf6" },
        { label: "Others", percent: 30, color: "#ec4899" },
      ],
    },
    quarter: {
      labels: ["Jan-Mar", "Apr-Jun", "Jul-Sep", "Oct-Dec"],
      inward: [4500, 5200, 4800, 5600],
      outward: [3800, 4300, 4000, 4700],
      net: [700, 900, 800, 900],
      categoryPercent: 78,
      categoryTitle: "Warehouse A",
      legend: [
        { label: "Electronics", percent: 45, color: "#3b82f6" },
        { label: "Groceries", percent: 32, color: "#8b5cf6" },
        { label: "Others", percent: 23, color: "#ec4899" },
      ],
    },
  },
  "Warehouse B": {
    week: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      inward: [95, 110, 135, 120, 160, 85, 195],
      outward: [75, 90, 115, 100, 130, 70, 165],
      net: [20, 20, 20, 20, 30, 15, 30],
      categoryPercent: 65,
      categoryTitle: "Warehouse B",
      legend: [
        { label: "Pharmaceuticals", percent: 38, color: "#10b981" },
        { label: "Electronics", percent: 27, color: "#3b82f6" },
        { label: "Others", percent: 35, color: "#f59e0b" },
      ],
    },
    month: {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
      inward: [480, 520, 580, 540, 420],
      outward: [380, 420, 480, 440, 320],
      net: [100, 100, 100, 100, 100],
      categoryPercent: 65,
      categoryTitle: "Warehouse B",
      legend: [
        { label: "Pharmaceuticals", percent: 38, color: "#10b981" },
        { label: "Electronics", percent: 27, color: "#3b82f6" },
        { label: "Others", percent: 35, color: "#f59e0b" },
      ],
    },
    quarter: {
      labels: ["Jan-Mar", "Apr-Jun", "Jul-Sep", "Oct-Dec"],
      inward: [4200, 4800, 5200, 5000],
      outward: [3500, 4000, 4400, 4200],
      net: [700, 800, 800, 800],
      categoryPercent: 65,
      categoryTitle: "Warehouse B",
      legend: [
        { label: "Pharmaceuticals", percent: 45, color: "#10b981" },
        { label: "Electronics", percent: 30, color: "#3b82f6" },
        { label: "Others", percent: 25, color: "#f59e0b" },
      ],
    },
  },
  "Warehouse C": {
    week: {
      labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
      inward: [150, 120, 180, 140, 210, 90, 240],
      outward: [120, 95, 150, 115, 180, 75, 210],
      net: [30, 25, 30, 25, 30, 15, 30],
      categoryPercent: 45,
      categoryTitle: "Warehouse C",
      legend: [
        { label: "Industrial", percent: 45, color: "#6366f1" },
        { label: "Consumer Goods", percent: 32, color: "#8b5cf6" },
        { label: "Others", percent: 23, color: "#ec4899" },
      ],
    },
    month: {
      labels: ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"],
      inward: [580, 620, 680, 640, 520],
      outward: [480, 520, 580, 540, 420],
      net: [100, 100, 100, 100, 100],
      categoryPercent: 45,
      categoryTitle: "Warehouse C",
      legend: [
        { label: "Industrial", percent: 45, color: "#6366f1" },
        { label: "Consumer Goods", percent: 32, color: "#8b5cf6" },
        { label: "Others", percent: 23, color: "#ec4899" },
      ],
    },
    quarter: {
      labels: ["Jan-Mar", "Apr-Jun", "Jul-Sep", "Oct-Dec"],
      inward: [4800, 5600, 5200, 6000],
      outward: [4000, 4700, 4300, 5100],
      net: [800, 900, 900, 900],
      categoryPercent: 45,
      categoryTitle: "Warehouse C",
      legend: [
        { label: "Industrial", percent: 45, color: "#6366f1" },
        { label: "Consumer Goods", percent: 32, color: "#8b5cf6" },
        { label: "Others", percent: 23, color: "#ec4899" },
      ],
    },
  },
};

/* ===============================
   HELPER COMPONENTS
================================ */
function StatCard({ title, value, change, color, icon, isNavigable = false, onClick }) {
  return (
    <div
      className="stat-card bg-white rounded-lg md:rounded-xl shadow-sm md:shadow-md p-3 md:p-4 lg:p-6 border-l-3 md:border-l-4 cursor-pointer clickable hover:shadow-md md:hover:shadow-lg transition-shadow duration-200"
      style={{ borderColor: color }}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-gray-600 text-xs md:text-sm font-medium truncate">
            {title}
          </p>
          <p className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 mt-1 md:mt-2 truncate">
            {value}
          </p>
          <p
            className={`text-xs md:text-sm mt-0.5 md:mt-1 truncate ${
              change.includes("↑")
                ? "text-green-600"
                : change.includes("↓")
                ? "text-red-600"
                : "text-gray-500"
            }`}
          >
            {change}
          </p>
        </div>
        <div className="text-3xl md:text-4xl lg:text-5xl opacity-80 ml-2 md:ml-3 flex-shrink-0">
          {icon}
        </div>
      </div>
    </div>
  );
}

function ActivityItem({ title, description, time, bgClass, icon, onClick }) {
  const bgColor = bgClass.split(" ")[0];
  const textColor = bgClass.split(" ")[1];

  return (
    <div
      className="flex items-start space-x-2 md:space-x-3 p-2 md:p-3 rounded-lg hover:bg-gray-50 transition-all duration-200 clickable group"
      onClick={onClick}
    >
      <div
        className={`w-8 h-8 md:w-10 md:h-10 ${bgColor} rounded-full flex items-center justify-center flex-shrink-0 group-hover:scale-105 md:group-hover:scale-110 transition-transform`}
      >
        <span className="text-base md:text-lg">{icon}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="text-sm md:text-sm font-medium text-gray-900 truncate">
            {title}
          </p>
          <span
            className={`text-xs ${textColor} font-medium px-1.5 py-0.5 md:px-2 md:py-1 rounded-full bg-opacity-20 whitespace-nowrap`}
          >
            {time}
          </span>
        </div>
        <p className="text-xs md:text-sm text-gray-600 mt-0.5 line-clamp-2">
          {description}
        </p>
      </div>
      <svg
        className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-gray-600 flex-shrink-0 mt-1"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
      </svg>
    </div>
  );
}

function StockMovementBarChart({ data, period, onHover, onLeave, warehouseName }) {
  const width = 320;
  const height = 160;
  const padding = { top: 10, right: 30, bottom: 30, left: 30 };
  const chartWidth = width - padding.left - padding.right;
  const chartHeight = height - padding.top - padding.bottom;

  const maxValue = Math.max(...data.inward, ...data.outward, ...data.net);
  const barWidth = Math.min(15, chartWidth / (data.labels.length * 3));
  const barSpacing = 2;

  const scaleX = (i) => padding.left + (i * chartWidth) / (data.labels.length - 1);
  const scaleY = (v) => padding.top + chartHeight - (v / maxValue) * chartHeight;

  // Format Y-axis labels
  const yAxisLabels = [];
  for (let i = 0; i <= 4; i++) {
    const value = Math.round(maxValue * (1 - i / 4));
    let displayValue = value;

    if (period === "quarter") {
      if (value >= 1000) {
        displayValue = (value / 1000).toFixed(1) + "K";
      }
    } else if (period === "month" && value >= 1000) {
      displayValue = (value / 1000).toFixed(1) + "K";
    }

    yAxisLabels.push(
      <div key={i} className="text-right pr-2 text-xs text-gray-500 font-medium truncate">
        {displayValue}
      </div>
    );
  }

  return (
    <div className="h-48 md:h-56 lg:h-64 relative" id="stockMovementChart">
      <div className="absolute left-0 top-0 bottom-8 md:bottom-10 w-8 md:w-10 flex flex-col justify-between">
        {yAxisLabels}
      </div>

      <div className="absolute left-8 md:left-10 right-0 top-0 bottom-8 md:bottom-10">
        {/* Grid lines */}
        <div className="absolute inset-0">
          {Array.from({ length: 5 }).map((_, i) => (
            <div
              key={`h-${i}`}
              className={`absolute left-0 right-0 top-${i}/4 h-px ${
                i === 4 ? "bg-gray-300" : "bg-gray-200"
              }`}
            />
          ))}
          {Array.from({ length: data.labels.length }).map((_, i) => (
            <div
              key={`v-${i}`}
              className={`absolute top-0 bottom-8 md:bottom-10 left-${i}/${
                data.labels.length - 1
              } w-px ${i === 0 ? "bg-gray-300" : "bg-gray-200"}`}
            />
          ))}
        </div>

        {/* Bar Chart SVG */}
        <svg className="absolute inset-0 w-full h-full" style={{ overflow: "visible" }}>
          {data.labels.map((_, index) => {
            const x = scaleX(index);
            const inwardY = scaleY(data.inward[index]);
            const outwardY = scaleY(data.outward[index]);
            const netY = scaleY(data.net[index]);
            const groupWidth = barWidth * 3 + barSpacing * 2;

            return (
              <g key={`group-${index}`} transform={`translate(${x - groupWidth / 2}, 0)`}>
                {/* Inward Bar */}
                <rect
                  x={0}
                  y={inwardY}
                  width={barWidth}
                  height={chartHeight - inwardY + padding.top}
                  fill="#3b82f6"
                  fillOpacity="0.8"
                  rx="2"
                  className="inward-bar"
                  data-index={index}
                />
                
                {/* Outward Bar */}
                <rect
                  x={barWidth + barSpacing}
                  y={outwardY}
                  width={barWidth}
                  height={chartHeight - outwardY + padding.top}
                  fill="#10b981"
                  fillOpacity="0.8"
                  rx="2"
                  className="outward-bar"
                  data-index={index}
                />
                
                {/* Net Bar */}
                <rect
                  x={(barWidth + barSpacing) * 2}
                  y={netY}
                  width={barWidth}
                  height={chartHeight - netY + padding.top}
                  fill="#8b5cf6"
                  fillOpacity="0.8"
                  rx="2"
                  className="net-bar"
                  data-index={index}
                />
              </g>
            );
          })}
        </svg>

        {/* Hover overlay for tooltips */}
        <div className="absolute inset-0">
          {data.labels.map((label, index) => {
            const x = (index * chartWidth) / (data.labels.length - 1);
            const left = (x / chartWidth) * 100 + "%";
            const width = ((chartWidth / (data.labels.length - 1)) / chartWidth) * 100 + "%";

            return (
              <div
                key={index}
                className="absolute top-0 bottom-8 md:bottom-10"
                style={{ left, width }}
                data-index={index}
                data-label={label}
                data-inward={data.inward[index]}
                data-outward={data.outward[index]}
                data-net={data.net[index]}
                onMouseEnter={(e) => onHover(e.currentTarget)}
                onMouseLeave={onLeave}
                onTouchStart={(e) => {
                  onHover(e.currentTarget);
                  setTimeout(() => onLeave(), 2000);
                }}
              />
            );
          })}
        </div>

        {/* Period annotation */}
        <div className="absolute top-1 md:top-2 right-1 md:right-2">
          <span
            className={`text-xs px-1 md:px-2 py-0.5 md:py-1 rounded-full truncate ${
              period === "quarter"
                ? "bg-purple-100 text-purple-800"
                : period === "month"
                ? "bg-blue-100 text-blue-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {period === "quarter" ? "Annual View" : period === "month" ? "Monthly Trend" : "Weekly"}
          </span>
        </div>

        {/* Warehouse name */}
        <div className="absolute top-1 md:top-2 left-8 md:left-10">
          <span className="text-xs px-1 md:px-2 py-0.5 md:py-1 rounded-full bg-gray-100 text-gray-800 font-medium">
            {warehouseName}
          </span>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="absolute bottom-0 left-8 md:left-10 right-0 h-8 md:h-10 flex justify-between items-center">
        {data.labels.map((label) => (
          <span key={label} className="text-xs text-gray-600 font-medium truncate">
            {label}
          </span>
        ))}
      </div>

      {/* Chart subtitle */}
      <div className="absolute bottom-10 md:bottom-12 left-8 md:left-10 right-0 flex justify-center">
        <div className="text-xs text-gray-500 text-center px-2">
          {period === "week"
            ? "Daily stock movements"
            : period === "month"
            ? "Weekly cumulative totals"
            : "Quarterly aggregated data"}
        </div>
      </div>
    </div>
  );
}

function CategoryPieChart({ data, period, warehouseName }) {
  const [percent, setPercent] = useState(data.categoryPercent);
  const [title, setTitle] = useState(data.categoryTitle);
  const [legend, setLegend] = useState(data.legend);

  useEffect(() => {
    setPercent(data.categoryPercent);
    setTitle(data.categoryTitle);
    setLegend(data.legend);
  }, [data]);

  // Calculate pie chart segments
  const radius = 55;
  const center = 65;
  const strokeWidth = 55;
  
  // Calculate the total percentage for the pie chart
  const totalPercent = legend.reduce((sum, item) => sum + item.percent, 0);
  
  // Generate pie segments
  let currentAngle = 0;
  const segments = legend.map((item) => {
    const segmentAngle = (item.percent / totalPercent) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + segmentAngle;
    currentAngle = endAngle;

    // Convert angles to radians
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;

    // Calculate coordinates for arc
    const x1 = center + radius * Math.cos(startRad);
    const y1 = center + radius * Math.sin(startRad);
    const x2 = center + radius * Math.cos(endRad);
    const y2 = center + radius * Math.sin(endRad);

    // Large arc flag
    const largeArcFlag = segmentAngle > 180 ? 1 : 0;

    const pathData = [
      `M ${center} ${center}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      "Z"
    ].join(" ");

    return {
      ...item,
      pathData,
      startAngle,
      endAngle,
      midAngle: startAngle + segmentAngle / 2,
    };
  });

  // Calculate label positions with adjusted spacing
  const labelRadius = radius + strokeWidth / 2 + 8;
  const labels = segments.map((segment) => {
    const midAngleRad = (segment.midAngle * Math.PI) / 180;
    const x = center + labelRadius * Math.cos(midAngleRad);
    const y = center + labelRadius * Math.sin(midAngleRad);
    const textAnchor = x > center ? "start" : "end";

    return {
      ...segment,
      labelX: x,
      labelY: y,
      textAnchor,
    };
  });

  const getPercentTextColor = (percent) => {
    if (percent < 30) return "text-red-700";
    if (percent < 50) return "text-orange-700";
    if (percent < 70) return "text-yellow-700";
    return "text-green-700";
  };

  return (
    <div className="h-48 md:h-56 lg:h-64 flex flex-col items-center justify-center">
      <div className="relative w-full max-w-[280px] h-40 md:h-44 lg:h-48 mb-2 mx-auto">
        {/* Pie Chart SVG */}
        <svg className="w-full h-full" viewBox="0 0 130 130">
          {segments.map((segment, i) => (
            <path
              key={segment.label}
              d={segment.pathData}
              fill={segment.color}
              stroke="white"
              strokeWidth="2"
              className="pie-segment"
              opacity="0.9"
            />
          ))}

          {/* Center hole */}
          <circle cx={center} cy={center} r={radius - strokeWidth / 2} fill="white" />

          {/* Center text - Only show warehouse percentage */}
          <text
            x={center}
            y={center - 3}
            textAnchor="middle"
            className="text-base font-bold fill-gray-800"
          >
            {percent}%
          </text>
          <text
            x={center}
            y={center + 12}
            textAnchor="middle"
            className="text-[10px] fill-gray-600"
          >
            {warehouseName.replace("Warehouse ", "WH ")}
          </text>

          {/* Labels with adjusted positioning */}
          {labels.map((label) => (
            <g key={label.label}>
              <line
                x1={center + (radius + strokeWidth / 4) * Math.cos((label.midAngle * Math.PI) / 180)}
                y1={center + (radius + strokeWidth / 4) * Math.sin((label.midAngle * Math.PI) / 180)}
                x2={label.labelX}
                y2={label.labelY}
                stroke="#9ca3af"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
              <text
                x={label.labelX}
                y={label.labelY}
                textAnchor={label.textAnchor}
                dy="0.35em"
                className="text-[10px] font-medium fill-gray-700"
              >
                {label.label} ({label.percent}%)
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Legend - Only show category names, not percentages */}
      <div className="w-full px-2">
        <div className="flex flex-wrap justify-center gap-2 md:gap-3 lg:gap-4 mt-1">
          {legend.map((item) => (
            <div key={item.label} className="flex flex-col items-center px-1 min-w-[70px]">
              <div className="flex items-center mb-1">
                <div
                  className="w-2 h-2 md:w-3 md:h-3 rounded-full mr-1"
                  style={{ backgroundColor: item.color }}
                ></div>
                <span className="text-xs text-gray-600 font-medium truncate max-w-[60px]">
                  {item.label}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Period note */}
      <div className="text-xs text-gray-500 text-center mt-2 px-2">
        {period === "week" ? "Current week" : period === "month" ? "Monthly overview" : "Quarterly summary"}
      </div>
    </div>
  );
}

function ChartTooltip({ label, inward, outward, net, visible, position }) {
  if (!visible) return null;

  return (
    <div
      className="absolute bg-gray-900 text-white text-xs md:text-sm rounded-lg py-1 md:py-2 px-2 md:px-3 shadow-xl z-20 max-w-[140px] md:max-w-none"
      style={{ left: position.x, top: position.y }}
    >
      <div className="font-medium mb-1">{label}</div>
      <div className="flex items-center mb-1">
        <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-blue-500 mr-1 md:mr-2"></div>
        <span>
          In: <span className="font-bold">{inward}</span>
        </span>
      </div>
      <div className="flex items-center mb-1">
        <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500 mr-1 md:mr-2"></div>
        <span>
          Out: <span className="font-bold">{outward}</span>
        </span>
      </div>
      <div className="flex items-center">
        <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-purple-500 mr-1 md:mr-2"></div>
        <span>
          Net: <span className="font-bold">{net}</span>
        </span>
      </div>
    </div>
  );
}

function Notification({ message, type, visible, onClose }) {
  if (!visible) return null;

  const bgColor = type === "success" ? "bg-green-100 border-green-200 text-green-800" :
                  type === "error" ? "bg-red-100 border-red-200 text-red-800" :
                  "bg-blue-100 border-blue-200 text-blue-800";

  const icon = type === "success" ? "✓" : type === "error" ? "✗" : "ℹ";

  return (
    <div
      className={`fixed top-4 right-4 px-3 py-2 md:px-4 md:py-3 rounded-lg shadow-lg z-50 transform transition-all duration-300 ${bgColor} border`}
      style={{ transform: "translateX(0)", opacity: 1 }}
    >
      <div className="flex items-center">
        <span className="mr-2">{icon}</span>
        <span className="text-sm md:text-base">{message}</span>
      </div>
    </div>
  );
}

/* ===============================
   MAIN DASHBOARD COMPONENT
================================ */
export default function Dashboard() {
  const { user } = useApp();
  const navigate = useNavigate();

  const [period, setPeriod] = useState("week");
  const [selectedWarehouse, setSelectedWarehouse] = useState("Warehouse A");
  const [showWarehouseDropdown, setShowWarehouseDropdown] = useState(false);
  const [tooltip, setTooltip] = useState({
    visible: false,
    label: "",
    inward: 0,
    outward: 0,
    net: 0,
    position: { x: 0, y: 0 },
  });
  const [notification, setNotification] = useState({
    visible: false,
    message: "",
    type: "info",
  });
  const [activities, setActivities] = useState([
    {
      title: "Stock Added",
      description: "SKU-1247: Rice 25kg - 50 units added to Warehouse A",
      time: "10 mins ago",
      bgClass: "bg-green-100 text-green-600",
      icon: "📥",
    },
    {
      title: "Stock Removed",
      description: "SKU-2341: Wheat Flour - 30 units dispatched",
      time: "25 mins ago",
      bgClass: "bg-red-100 text-red-600",
      icon: "📤",
    },
    {
      title: "Low Stock Alert",
      description: "SKU-8765: Sugar 50kg - Only 5 units left",
      time: "1 hour ago",
      bgClass: "bg-yellow-100 text-yellow-600",
      icon: "⚠️",
    },
    {
      title: "New Product",
      description: "SKU-9999: Premium Basmati Rice added to inventory",
      time: "2 hours ago",
      bgClass: "bg-blue-100 text-blue-600",
      icon: "📦",
    },
    {
      title: "Stock Transfer",
      description: "50 units transferred from Warehouse A to B",
      time: "3 hours ago",
      bgClass: "bg-purple-100 text-purple-600",
      icon: "🔄",
    },
  ]);

  const userName = user?.firstName || user?.fullName?.split(" ")[0] || "User";
  const role = user?.role || "Admin";

  const stats = [
    { title: "Total SKUs", value: "1,247", change: "↑ 12", color: "#3b82f6", icon: "📦", isNavigable: true },
    { title: "Stock Value", value: "₹45.2L", change: "↑ 8%", color: "#10b981", icon: "💰", isNavigable: false },
    { title: "Low Stock Items", value: "23", change: "Action needed", color: "#ef4444", icon: "⚠️", isNavigable: true },
    { title: "Expiring Soon", value: "15", change: "Next 7 days", color: "#f59e0b", icon: "⏰", isNavigable: true },
    { title: "Today's Inward", value: "142", change: "+32 items", color: "#8b5cf6", icon: "📥", isNavigable: true },
    { title: "Today's Outward", value: "98", change: "-18 items", color: "#ec4899", icon: "📤", isNavigable: true },
  ];

  // Get current chart data based on selected warehouse and period
  const currentChartData = warehouseData[selectedWarehouse][period];

  const getNavigationPage = (title) => {
    switch (title) {
      case "Total SKUs":
        return "/products";
      case "Low Stock Items":
        return "/low-stock";
      case "Expiring Soon":
        return "/expiry";
      case "Today's Inward":
        return "/stock-in";
      case "Today's Outward":
        return "/stock-out";
      default:
        return "";
    }
  };

  const showNotification = (message, type = "info") => {
    setNotification({ visible: true, message, type });
    setTimeout(() => {
      setNotification({ ...notification, visible: false });
    }, 3000);
  };

  const handleStatClick = (stat) => {
    const page = getNavigationPage(stat.title);
    if (page) {
      showNotification(`Opening ${stat.title} details...`, "info");
      setTimeout(() => navigate(page), 300);
    } else {
      showNotification(`Displaying ${stat.title} analytics...`, "info");
    }
  };

  const handleViewActivityDetail = (activity) => {
    showNotification(`Loading activity details...`, "info");
    // In a real app, you would open a modal or navigate to detail page
    alert(`Activity Detail: ${activity.title}\n\n${activity.description}`);
  };

  const handleLoadMoreActivity = () => {
    showNotification("Loading all activities...", "info");
    setTimeout(() => {
      const newActivity = {
        title: "Stock Adjusted",
        description: "SKU-4567: Coffee Powder - Quantity adjusted from 100 to 95 units",
        time: "5 hours ago",
        bgClass: "bg-orange-100 text-orange-600",
        icon: "📝",
      };
      setActivities([...activities, newActivity]);
      showNotification("Additional activities loaded", "success");
    }, 800);
  };

  const handleRefreshCategoryData = () => {
    showNotification("Refreshing category distribution data...", "info");
    setTimeout(() => {
      const randomPercent = Math.floor(Math.random() * 86) + 10;
      const newLegend = warehouseData[selectedWarehouse][period].legend.map((item) => ({
        ...item,
        percent: Math.floor(Math.random() * 40) + 10,
      }));
      
      // Normalize percentages
      const total = newLegend.reduce((sum, item) => sum + item.percent, 0);
      newLegend.forEach((item) => {
        item.percent = Math.round((item.percent / total) * (100 - randomPercent));
      });

      warehouseData[selectedWarehouse][period].categoryPercent = randomPercent;
      warehouseData[selectedWarehouse][period].legend = newLegend;
      
      showNotification(`Category data updated for ${selectedWarehouse}!`, "success");
    }, 800);
  };

  const handleChartHover = (element) => {
    const label = element.getAttribute("data-label");
    let inward = parseInt(element.getAttribute("data-inward"));
    let outward = parseInt(element.getAttribute("data-outward"));
    let net = parseInt(element.getAttribute("data-net"));

    // Format numbers based on period
    if (period === "quarter") {
      if (inward >= 1000) inward = (inward / 1000).toFixed(1) + "K";
      if (outward >= 1000) outward = (outward / 1000).toFixed(1) + "K";
      if (net >= 1000) net = (net / 1000).toFixed(1) + "K";
    } else if (period === "month" && inward >= 500) {
      inward = Math.round(inward / 100) / 10 + "K";
      outward = Math.round(outward / 100) / 10 + "K";
      net = Math.round(net / 100) / 10 + "K";
    }

    const rect = element.getBoundingClientRect();
    const chartRect = document.getElementById("stockMovementChart")?.getBoundingClientRect();

    if (!chartRect) return;

    let left = rect.left - chartRect.left + rect.width / 2;
    let top = rect.top - chartRect.top - 70;

    setTooltip({
      visible: true,
      label,
      inward,
      outward,
      net,
      position: { x: left, y: top },
    });
  };

  const handleChartLeave = () => {
    setTooltip({ ...tooltip, visible: false });
  };

  const handleSwitchPeriod = (newPeriod) => {
    setPeriod(newPeriod);
    showNotification(`Switched to ${newPeriod} view for ${selectedWarehouse}`, "success");
  };

  const handleWarehouseChange = (warehouse) => {
    setSelectedWarehouse(warehouse);
    setShowWarehouseDropdown(false);
    showNotification(`Viewing data for ${warehouse}`, "success");
  };

  const toggleWarehouseDropdown = () => {
    setShowWarehouseDropdown(!showWarehouseDropdown);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showWarehouseDropdown && !event.target.closest('.warehouse-dropdown')) {
        setShowWarehouseDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showWarehouseDropdown]);

  // Initialize chart animations on mount and period change
  useEffect(() => {
    const initializeChartAnimations = () => {
      // Animate bars
      const inwardBars = document.querySelectorAll(".inward-bar");
      const outwardBars = document.querySelectorAll(".outward-bar");
      const netBars = document.querySelectorAll(".net-bar");

      inwardBars.forEach((bar, index) => {
        bar.style.transformOrigin = "bottom";
        bar.style.transform = "scaleY(0)";
        
        bar.animate(
          [{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }],
          {
            duration: 800,
            delay: index * 100,
            easing: "ease-out",
            fill: "forwards",
          }
        );
      });

      outwardBars.forEach((bar, index) => {
        bar.style.transformOrigin = "bottom";
        bar.style.transform = "scaleY(0)";
        
        bar.animate(
          [{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }],
          {
            duration: 800,
            delay: index * 100 + 200,
            easing: "ease-out",
            fill: "forwards",
          }
        );
      });

      netBars.forEach((bar, index) => {
        bar.style.transformOrigin = "bottom";
        bar.style.transform = "scaleY(0)";
        
        bar.animate(
          [{ transform: "scaleY(0)" }, { transform: "scaleY(1)" }],
          {
            duration: 800,
            delay: index * 100 + 400,
            easing: "ease-out",
            fill: "forwards",
          }
        );
      });

      // Animate pie segments
      const pieSegments = document.querySelectorAll(".pie-segment");
      pieSegments.forEach((segment, index) => {
        segment.style.opacity = "0";
        segment.style.transform = "scale(0)";
        
        segment.animate(
          [
            { opacity: 0, transform: "scale(0)" },
            { opacity: 0.9, transform: "scale(1)" }
          ],
          {
            duration: 1000,
            delay: index * 200,
            easing: "ease-out",
            fill: "forwards",
          }
        );
      });
    };

    // Add delay to ensure DOM is ready
    const timer = setTimeout(initializeChartAnimations, 100);
    return () => clearTimeout(timer);
  }, [period, selectedWarehouse]);

  return (
    <div className="space-y-4 md:space-y-6 fade-in">
      {/* Header */}
      <div className="mb-4 md:mb-6 fade-in">
        <h1 className="dashboard-title text-xl md:text-2xl lg:text-3xl font-bold text-gray-900">
          Inventory Dashboard
        </h1>
        <p className="text-gray-600 mt-1 text-sm md:text-base">
          Welcome back,{" "}
          <span className="font-semibold text-blue-600">{userName}</span>!
          <span className="text-xs md:text-sm text-gray-500"> ({role})</span>
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 lg:gap-6 mb-4 md:mb-6 fade-in">
        {stats.map((stat) => (
          <StatCard
            key={stat.title}
            title={stat.title}
            value={stat.value}
            change={stat.change}
            color={stat.color}
            icon={stat.icon}
            isNavigable={stat.isNavigable}
            onClick={() => handleStatClick(stat)}
          />
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-4 md:mb-6 fade-in">
        {/* Stock Movement Bar Chart */}
        <div className="bg-white rounded-lg md:rounded-xl shadow-sm md:shadow-md p-3 md:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3 md:mb-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Stock Movement</h3>
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1 md:space-x-2">
                {["week", "month", "quarter"].map((p) => (
                  <button
                    key={p}
                    className={`chart-period-btn px-2 py-1 md:px-3 md:py-1 text-xs md:text-sm rounded-md ${
                      period === p
                        ? "bg-blue-100 text-blue-600 font-medium"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    onClick={() => handleSwitchPeriod(p)}
                  >
                    {p.charAt(0).toUpperCase() + p.slice(1)}
                  </button>
                ))}
              </div>
              
              {/* Warehouse Dropdown */}
              <div className="relative warehouse-dropdown">
                <button
                  onClick={toggleWarehouseDropdown}
                  className="flex items-center px-2 py-1 md:px-3 md:py-1 text-xs md:text-sm rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition border border-gray-300"
                >
                  <span className="mr-1">{selectedWarehouse.replace("Warehouse ", "WH ")}</span>
                  <svg 
                    className={`w-4 h-4 transition-transform ${showWarehouseDropdown ? 'rotate-180' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showWarehouseDropdown && (
                  <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                    <div className="py-1">
                      {["Warehouse A", "Warehouse B", "Warehouse C"].map((wh) => (
                        <button
                          key={wh}
                          onClick={() => handleWarehouseChange(wh)}
                          className={`block w-full text-left px-4 py-2 text-sm ${
                            selectedWarehouse === wh
                              ? "bg-blue-50 text-blue-600"
                              : "text-gray-700 hover:bg-gray-100"
                          }`}
                        >
                          {wh}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <StockMovementBarChart
            data={currentChartData}
            period={period}
            onHover={handleChartHover}
            onLeave={handleChartLeave}
            warehouseName={selectedWarehouse}
          />

          {/* Tooltip */}
          <ChartTooltip
            label={tooltip.label}
            inward={tooltip.inward}
            outward={tooltip.outward}
            net={tooltip.net}
            visible={tooltip.visible}
            position={tooltip.position}
          />

          {/* Legend */}
          <div className="mt-3 md:mt-4 md:pt-4 border-t border-gray-200">
            <div className="flex flex-wrap items-center justify-center gap-2 md:gap-4 text-xs md:text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-blue-500 mr-1 md:mr-2"></div>
                <span>Inward</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-green-500 mr-1 md:mr-2"></div>
                <span>Outward</span>
              </div>
              <div className="flex items-center">
                <div className="w-2 h-2 md:w-3 md:h-3 rounded-full bg-purple-500 mr-1 md:mr-2"></div>
                <span>Net</span>
              </div>
            </div>
          </div>
        </div>

        {/* Category Distribution Pie Chart */}
        <div className="bg-white rounded-lg md:rounded-xl shadow-sm md:shadow-md p-3 md:p-4 lg:p-6">
          <div className="flex justify-between items-center mb-3 md:mb-4">
            <h3 className="text-base md:text-lg font-semibold text-gray-900">Category Distribution</h3>
            <div className="flex items-center space-x-2">
              <span className="text-xs md:text-sm text-gray-600 font-medium whitespace-nowrap">
                {selectedWarehouse}
              </span>
              <button
                className="px-2 py-1 md:px-3 md:py-1 text-xs md:text-sm rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
                onClick={handleRefreshCategoryData}
              >
                Refresh
              </button>
            </div>
          </div>
          <div className="px-2 md:px-4 lg:px-6">
            <CategoryPieChart 
              data={currentChartData} 
              period={period} 
              warehouseName={selectedWarehouse}
            />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg md:rounded-xl shadow-sm md:shadow-md p-3 md:p-4 lg:p-6 fade-in">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 mb-3 md:mb-4">
          <h3 className="text-base md:text-lg font-semibold text-gray-900">Recent Activity</h3>
          <button
            className="px-2 py-1 md:px-3 md:py-1 text-xs md:text-sm rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 transition"
            onClick={handleLoadMoreActivity}
          >
            View All
          </button>
        </div>
        <div className="space-y-2 md:space-y-3" id="activityList">
          {activities.map((activity, index) => (
            <ActivityItem
              key={index}
              title={activity.title}
              description={activity.description}
              time={activity.time}
              bgClass={activity.bgClass}
              icon={activity.icon}
              onClick={() => handleViewActivityDetail(activity)}
            />
          ))}
        </div>
      </div>

      {/* Notification */}
      <Notification
        message={notification.message}
        type={notification.type}
        visible={notification.visible}
        onClose={() => setNotification({ ...notification, visible: false })}
      />
    </div>
  );
}