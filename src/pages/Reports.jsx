import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";

/* ===============================
   REPORT DEFINITIONS
================================ */
const REPORTS = [
  { icon: "📊", title: "Stock Report", color: "bg-blue-600" },
  { icon: "📈", title: "Inward/Outward Report", color: "bg-green-600" },
  { icon: "⏰", title: "Expiry Report", color: "bg-orange-600" },
  { icon: "💰", title: "Stock Valuation", color: "bg-purple-600" },
  { icon: "🔍", title: "Audit Log", color: "bg-gray-600" },
  { icon: "⚠️", title: "Low Stock Report", color: "bg-red-600" }
];

export default function Reports() {
  const [categories, setCategories] = useState(["All"]);
  const [warehouses, setWarehouses] = useState(["All"]);
  const [generated, setGenerated] = useState([]);

  const [currentType, setCurrentType] = useState(null);
  const [params, setParams] = useState({});

  /* ===============================
     REALTIME DATA
  ================================ */
  useEffect(() => {
    const unsubCat = onSnapshot(collection(db, "categories"), snap => {
      setCategories(["All", ...snap.docs.map(d => d.data().name)]);
    });

    const unsubWh = onSnapshot(collection(db, "warehouses"), snap => {
      setWarehouses(["All", ...snap.docs.map(d => d.data().name)]);
    });

    return () => {
      unsubCat();
      unsubWh();
    };
  }, []);

  /* ===============================
     FORM SCHEMA
  ================================ */
  const formSchema = useMemo(() => {
    if (!currentType) return [];

    const baseDates = [
      { name: "fromDate", label: "From Date", type: "date" },
      { name: "toDate", label: "To Date", type: "date" }
    ];

    switch (currentType) {
      case "Stock Report":
        return [
          ...baseDates,
          { name: "warehouse", label: "Warehouse", type: "select", options: warehouses },
          { name: "category", label: "Category", type: "select", options: categories }
        ];

      case "Inward/Outward Report":
        return [
          ...baseDates,
          { name: "txnType", label: "Transaction Type", type: "select", options: ["All", "Inward", "Outward"] },
          { name: "warehouse", label: "Warehouse", type: "select", options: warehouses }
        ];

      case "Expiry Report":
        return [
          { name: "expiryDays", label: "Expiry Within", type: "select", options: ["7 days", "15 days", "30 days"] },
          { name: "warehouse", label: "Warehouse", type: "select", options: warehouses }
        ];

      case "Low Stock Report":
        return [
          { name: "threshold", label: "Stock Threshold (%)", type: "number" },
          { name: "warehouse", label: "Warehouse", type: "select", options: warehouses }
        ];

      case "Stock Valuation":
        return [
          { name: "asOnDate", label: "As On Date", type: "date" },
          { name: "method", label: "Valuation Method", type: "select", options: ["FIFO", "LIFO", "Average"] }
        ];

      case "Audit Log":
        return [
          ...baseDates,
          { name: "action", label: "Action Type", type: "select", options: ["All", "Create", "Update", "Delete"] }
        ];

      default:
        return [];
    }
  }, [currentType, categories, warehouses]);

  /* ===============================
     GENERATE REPORT
  ================================ */
  const generateReport = e => {
    e.preventDefault();

    setGenerated(prev => [
      {
        type: currentType,
        params,
        generatedAt: new Date().toLocaleString()
      },
      ...prev
    ]);

    setCurrentType(null);
    setParams({});
  };

  /* ===============================
     CSV DOWNLOAD
  ================================ */
  const downloadCSV = report => {
    const rows = [
      ["Report", "Generated At", ...Object.keys(report.params)],
      [
        report.type,
        report.generatedAt,
        ...Object.values(report.params)
      ]
    ];

    const csv = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${report.type.replace(/\s+/g, "_")}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  /* ===============================
     PDF DOWNLOAD
  ================================ */
  const downloadPDF = report => {
    const win = window.open("", "_blank");
    win.document.write(`
      <h1>${report.type}</h1>
      <p>Generated At: ${report.generatedAt}</p>
      <hr/>
      ${Object.entries(report.params)
        .map(([k, v]) => `<p><b>${k}:</b> ${v}</p>`)
        .join("")}
      <script>
        window.onload = () => { window.print(); window.close(); }
      </script>
    `);
    win.document.close();
  };

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Reports & Analytics</h1>

      {/* REPORT CARDS */}
      <div className="grid md:grid-cols-3 gap-6">
        {REPORTS.map(r => (
          <div key={r.title} className="card">
            <div className={`${r.color} text-white p-4 rounded-lg`}>
              <h3 className="text-lg font-semibold">{r.icon} {r.title}</h3>
            </div>
            <button
              className="btn-primary mt-4 w-full"
              onClick={() => setCurrentType(r.title)}
            >
              Generate Report
            </button>
          </div>
        ))}
      </div>

      {/* GENERATED REPORTS */}
      <div className="card">
        <h2 className="font-semibold mb-4">Generated Reports</h2>

        {generated.length === 0 ? (
          <p className="text-gray-500">No reports generated yet.</p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Report</th>
                <th>Parameters</th>
                <th>Generated At</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {generated.map((r, i) => (
                <tr key={i}>
                  <td>{r.type}</td>
                  <td>
                    {Object.entries(r.params).map(([k, v]) => (
                      <div key={k}>
                        <b>{k}:</b> {v}
                      </div>
                    ))}
                  </td>
                  <td>{r.generatedAt}</td>
                  <td className="flex gap-2">
                    <button onClick={() => downloadCSV(r)} className="link">
                      CSV
                    </button>
                    <button onClick={() => downloadPDF(r)} className="link">
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* MODAL */}
      {currentType && (
        <div className="modal">
          <form className="modal-box space-y-4" onSubmit={generateReport}>
            <h3 className="font-semibold">{currentType}</h3>

            {formSchema.map(f => (
              <div key={f.name}>
                <label className="label">{f.label}</label>

                {f.type === "select" ? (
                  <select
                    className="input"
                    onChange={e =>
                      setParams({ ...params, [f.name]: e.target.value })
                    }
                  >
                    {f.options.map(o => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={f.type}
                    className="input"
                    onChange={e =>
                      setParams({ ...params, [f.name]: e.target.value })
                    }
                  />
                )}
              </div>
            ))}

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setCurrentType(null)}>
                Cancel
              </button>
              <button className="btn-primary">Generate</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
