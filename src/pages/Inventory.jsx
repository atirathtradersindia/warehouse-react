import { useMemo, useState } from "react";

/* ===============================
   INVENTORY DATA (TEMP STATIC)
   (Later replace with Firebase)
================================ */
const INVENTORY_PER_PAGE = 5;

const inventoryData = [
  { sku: "SKU-1001", name: "Basmati Rice Premium", warehouse: "Warehouse A", batch: "BATCH-001", qty: 450, unit: "kg", expiry: "2026-01-15" },
  { sku: "SKU-1002", name: "Wheat Flour", warehouse: "Warehouse A", batch: "BATCH-014", qty: 320, unit: "kg", expiry: "2025-10-10" },
  { sku: "SKU-1003", name: "Red Chili Powder", warehouse: "Warehouse B", batch: "BATCH-021", qty: 40, unit: "kg", expiry: "2024-12-20" },
  { sku: "SKU-1004", name: "Turmeric Powder", warehouse: "Warehouse B", batch: "BATCH-009", qty: 18, unit: "kg", expiry: "2024-09-05" },
  { sku: "SKU-1005", name: "Sugar", warehouse: "Warehouse A", batch: "BATCH-015", qty: 220, unit: "kg", expiry: "2026-03-15" },
  { sku: "SKU-1006", name: "Cooking Oil", warehouse: "Warehouse C", batch: "BATCH-012", qty: 75, unit: "L", expiry: "2025-08-30" },
  { sku: "SKU-1007", name: "Olive Oil", warehouse: "Warehouse C", batch: "BATCH-008", qty: 30, unit: "L", expiry: "2025-06-20" },
  { sku: "SKU-1008", name: "Salt", warehouse: "Warehouse B", batch: "BATCH-006", qty: 180, unit: "kg", expiry: "2026-12-31" },
];

/* ===============================
   INVENTORY COMPONENT
================================ */
export default function Inventory() {
  const [search, setSearch] = useState("");
  const [warehouse, setWarehouse] = useState("all");
  const [page, setPage] = useState(1);

  /* ===============================
     FILTER + SEARCH
  ================================ */
  const filteredData = useMemo(() => {
    return inventoryData.filter(item => {
      const matchSearch =
        item.sku.toLowerCase().includes(search) ||
        item.name.toLowerCase().includes(search) ||
        item.batch.toLowerCase().includes(search);

      const matchWarehouse =
        warehouse === "all" || item.warehouse === warehouse;

      return matchSearch && matchWarehouse;
    });
  }, [search, warehouse]);

  /* ===============================
     PAGINATION
  ================================ */
  const totalPages = Math.ceil(filteredData.length / INVENTORY_PER_PAGE);
  const pageData = filteredData.slice(
    (page - 1) * INVENTORY_PER_PAGE,
    page * INVENTORY_PER_PAGE
  );

  const start = filteredData.length === 0 ? 0 : (page - 1) * INVENTORY_PER_PAGE + 1;
  const end = Math.min(page * INVENTORY_PER_PAGE, filteredData.length);

  /* ===============================
     CSV EXPORT
  ================================ */
  const exportCSV = () => {
    if (filteredData.length === 0) {
      alert("No data to export");
      return;
    }

    const csv = [
      "SKU,Product,Warehouse,Batch,Quantity,Unit,Expiry,Status",
      ...filteredData.map(i =>
        `"${i.sku}","${i.name}","${i.warehouse}","${i.batch}","${i.qty}","${i.unit}","${i.expiry}","${i.qty < 50 ? "Low Stock" : "Available"}"`
      )
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `inventory-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6 fade-in">

      {/* HEADER */}
      <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>

      {/* SEARCH + FILTER */}
      <div className="flex flex-col md:flex-row md:justify-between gap-4">
        <div className="flex gap-3">
          <input
            placeholder="Search..."
            className="px-4 py-2 border rounded-lg w-64"
            onChange={e => {
              setSearch(e.target.value.toLowerCase());
              setPage(1);
            }}
          />

          <select
            className="px-4 py-2 border rounded-lg"
            onChange={e => {
              setWarehouse(e.target.value);
              setPage(1);
            }}
          >
            <option value="all">All Warehouses</option>
            <option>Warehouse A</option>
            <option>Warehouse B</option>
            <option>Warehouse C</option>
          </select>
        </div>

        <div className="flex gap-2">
          <button onClick={exportCSV} className="px-4 py-2 border rounded-lg">
            Export
          </button>
          <button
            onClick={() => alert("Inventory refreshed!")}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-blue-600 text-white">
            <tr>
              {["SKU", "Product", "Warehouse", "Batch", "Qty", "Unit", "Expiry", "Status"].map(h => (
                <th key={h} className="px-6 py-3 text-left text-xs font-medium uppercase">
                  {h}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y">
            {pageData.length === 0 ? (
              <tr>
                <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                  No inventory items found
                </td>
              </tr>
            ) : (
              pageData.map(item => (
                <tr key={item.sku} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{item.sku}</td>
                  <td className="px-6 py-4">{item.name}</td>
                  <td className="px-6 py-4">{item.warehouse}</td>
                  <td className="px-6 py-4">{item.batch}</td>
                  <td className="px-6 py-4">{item.qty}</td>
                  <td className="px-6 py-4">{item.unit}</td>
                  <td className="px-6 py-4">{item.expiry}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      item.qty < 50
                        ? "bg-red-100 text-red-700"
                        : "bg-green-100 text-green-700"
                    }`}>
                      {item.qty < 50 ? "Low Stock" : "Available"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* FOOTER */}
        <div className="px-6 py-4 flex justify-between items-center text-sm text-gray-600">
          <span>
            Showing {start}-{end} of {filteredData.length} entries
          </span>

          <div className="flex gap-2">
            <button
              disabled={page === 1}
              onClick={() => setPage(p => p - 1)}
              className="w-8 h-8 border rounded disabled:text-gray-400"
            >
              ‹
            </button>

            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i + 1)}
                className={`w-8 h-8 border rounded ${
                  page === i + 1 ? "bg-blue-600 text-white" : ""
                }`}
              >
                {i + 1}
              </button>
            ))}

            <button
              disabled={page === totalPages}
              onClick={() => setPage(p => p + 1)}
              className="w-8 h-8 border rounded disabled:text-gray-400"
            >
              ›
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
