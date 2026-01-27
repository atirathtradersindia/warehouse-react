import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  query,
  where,
  orderBy
} from "firebase/firestore";
import { db } from "../firebase/firebase";

const PER_PAGE = 5;

/* ===============================
   HELPERS
================================ */
const formatDate = d =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });

const getStatus = expiry => {
  const today = new Date();
  const exp = new Date(expiry);
  const days = Math.ceil((exp - today) / 86400000);

  if (days < 0)
    return { status: "expired", label: "Expired", color: "red", days };
  if (days <= 7)
    return { status: "critical", label: "Critical", color: "orange", days };
  return { status: "warning", label: "Warning", color: "yellow", days };
};

/* ===============================
   COMPONENT
================================ */
export default function ExpiryAlerts() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);

  /* ===============================
     LOAD DATA
  =============================== */
  useEffect(() => {
    loadExpiryData();
  }, []);

  async function loadExpiryData() {
    try {
      const q = query(
        collection(db, "products"),
        where("expiryDate", "!=", null),
        orderBy("expiryDate", "asc")
      );

      const snap = await getDocs(q);
      const data = snap.docs.map(d => ({
        id: d.id,
        sku: d.data().sku,
        product: d.data().name,
        batch: d.data().batch || "N/A",
        qty: d.data().quantity || "-",
        expiry: d.data().expiryDate
      }));

      setItems(data);
    } catch {
      // fallback demo data
      setItems([
        { sku: "SKU-101", product: "Rice", batch: "B-01", qty: "100kg", expiry: "2025-02-01" },
        { sku: "SKU-102", product: "Oil", batch: "B-02", qty: "20L", expiry: "2025-01-15" },
        { sku: "SKU-103", product: "Sugar", batch: "B-03", qty: "50kg", expiry: "2024-12-25" }
      ]);
    }
  }

  /* ===============================
     FILTERING
  =============================== */
  const filtered = useMemo(() => {
    return items.filter(i => {
      const s = i.sku.toLowerCase().includes(search) ||
                i.product.toLowerCase().includes(search) ||
                i.batch.toLowerCase().includes(search);

      const st = getStatus(i.expiry).status;
      return s && (status === "all" || status === st);
    });
  }, [items, search, status]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageData = filtered.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE
  );

  /* ===============================
     COUNTS
  =============================== */
  const summary = useMemo(() => {
    const c = { expired: 0, critical: 0, warning: 0 };
    items.forEach(i => c[getStatus(i.expiry).status]++);
    return c;
  }, [items]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Expiry Alerts</h1>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {["expired","critical","warning"].map(k => (
          <div key={k} className="p-4 rounded-xl bg-white shadow border-l-4 border-blue-500">
            <p className="text-sm text-gray-500 capitalize">{k}</p>
            <p className="text-2xl font-bold">{summary[k]}</p>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="flex gap-3">
        <input
          placeholder="Search SKU / Product / Batch"
          className="px-4 py-2 border rounded-lg"
          onChange={e => { setSearch(e.target.value.toLowerCase()); setPage(1); }}
        />

        <select
          className="px-4 py-2 border rounded-lg"
          onChange={e => { setStatus(e.target.value); setPage(1); }}
        >
          <option value="all">All</option>
          <option value="expired">Expired</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-blue-600 text-white">
            <tr>
              {["Status","SKU","Product","Batch","Qty","Expiry","Days"].map(h =>
                <th key={h} className="px-6 py-3 text-left text-xs uppercase">{h}</th>
              )}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                  No expiry alerts
                </td>
              </tr>
            ) : (
              pageData.map(i => {
                const st = getStatus(i.expiry);
                return (
                  <tr key={i.sku} className="border-b">
                    <td className={`px-6 py-3 font-medium text-${st.color}-600`}>
                      {st.label}
                    </td>
                    <td className="px-6 py-3 font-mono">{i.sku}</td>
                    <td className="px-6 py-3">{i.product}</td>
                    <td className="px-6 py-3">{i.batch}</td>
                    <td className="px-6 py-3">{i.qty}</td>
                    <td className="px-6 py-3">{formatDate(i.expiry)}</td>
                    <td className={`px-6 py-3 font-bold text-${st.color}-600`}>
                      {st.days < 0 ? `${Math.abs(st.days)}d ago` : `${st.days}d`}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center">
        <span className="text-sm text-gray-600">
          Showing {(page-1)*PER_PAGE+1}–{Math.min(page*PER_PAGE, filtered.length)} of {filtered.length}
        </span>

        <div className="flex gap-2">
          {Array.from({ length: totalPages }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i+1)}
              className={`w-8 h-8 border rounded ${
                page === i+1 ? "bg-blue-600 text-white" : ""
              }`}
            >
              {i+1}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
