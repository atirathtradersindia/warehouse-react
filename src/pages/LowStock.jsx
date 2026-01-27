import { useEffect, useMemo, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";

const PER_PAGE = 5;

export default function LowStock() {
  const [inventory, setInventory] = useState([]);
  const [search, setSearch] = useState("");
  const [warehouse, setWarehouse] = useState("all");
  const [page, setPage] = useState(1);

  /* ===============================
     LOAD INVENTORY (REALTIME)
  ================================ */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "inventory"), snap => {
      const data = snap.docs.map(d => ({
        id: d.id,
        ...d.data(),
        available: d.data().quantity || 0,
        min: d.data().minStock || 0,
        product: d.data().productName,
        warehouse: d.data().warehouse
      }));

      // only LOW stock items
      setInventory(data.filter(i => i.available <= i.min));
    });

    return () => unsub();
  }, []);

  /* ===============================
     FILTERS
  ================================ */
  const filtered = useMemo(() => {
    let data = [...inventory];

    if (search) {
      data = data.filter(i =>
        [i.sku, i.product].join(" ").toLowerCase().includes(search)
      );
    }

    if (warehouse !== "all") {
      data = data.filter(i => i.warehouse === warehouse);
    }

    return data;
  }, [inventory, search, warehouse]);

  /* ===============================
     PAGINATION
  ================================ */
  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageData = filtered.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE
  );

  /* ===============================
     CSV EXPORT
  ================================ */
  const exportCSV = () => {
    if (!filtered.length) {
      alert("No data to export");
      return;
    }

    const csv = [
      "SKU,Product,Warehouse,Available,Minimum,Status",
      ...filtered.map(i => {
        const status =
          i.available <= i.min * 0.2
            ? "Critical"
            : i.available <= i.min * 0.5
            ? "Warning"
            : "Low";

        return `"${i.sku}","${i.product}","${i.warehouse}","${i.available}","${i.min}","${status}"`;
      })
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `low-stock-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  /* ===============================
     UI
  ================================ */
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Low Stock Items</h1>

      {/* TOOLBAR */}
      <div className="flex flex-wrap gap-3">
        <input
          placeholder="Search SKU / Product..."
          className="input"
          onChange={e => {
            setSearch(e.target.value.toLowerCase());
            setPage(1);
          }}
        />

        <select
          className="input"
          onChange={e => {
            setWarehouse(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All Warehouses</option>
          {[...new Set(inventory.map(i => i.warehouse))].map(w => (
            <option key={w}>{w}</option>
          ))}
        </select>

        <button onClick={exportCSV} className="btn-outline">
          Export CSV
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="p-3 text-left">SKU</th>
              <th className="p-3 text-left">Product</th>
              <th className="p-3 text-left">Warehouse</th>
              <th className="p-3 text-left">Available</th>
              <th className="p-3 text-left">Min</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan="7" className="p-6 text-center text-gray-500">
                  No low stock items found
                </td>
              </tr>
            ) : (
              pageData.map(i => {
                const critical = i.available <= i.min * 0.2;
                const warning = i.available <= i.min * 0.5;

                return (
                  <tr key={i.id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-mono">{i.sku}</td>
                    <td className="p-3 font-medium">{i.product}</td>
                    <td className="p-3">{i.warehouse}</td>
                    <td
                      className={`p-3 font-bold ${
                        critical
                          ? "text-red-600"
                          : warning
                          ? "text-yellow-600"
                          : "text-gray-900"
                      }`}
                    >
                      {i.available}
                    </td>
                    <td className="p-3">{i.min}</td>
                    <td className="p-3">
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          critical
                            ? "bg-red-100 text-red-800"
                            : warning
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {critical ? "Critical" : warning ? "Warning" : "Low"}
                      </span>
                    </td>
                    <td className="p-3">
                      <a
                        href="/stock-in"
                        className="text-blue-600 hover:underline font-medium"
                      >
                        Add Stock
                      </a>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex gap-2">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className={`px-3 py-1 rounded border ${
              page === i + 1 ? "bg-blue-600 text-white" : ""
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>
    </div>
  );
}
