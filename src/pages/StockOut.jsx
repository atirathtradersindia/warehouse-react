import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  query,
  orderBy,
  doc,
  getDoc,
  updateDoc
} from "firebase/firestore";
import { db } from "../firebase/firebase";

/* ===============================
   CONSTANTS
================================ */
const PER_PAGE = 5;

/* ===============================
   MAIN COMPONENT
================================ */
export default function StockOut() {
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [stockOut, setStockOut] = useState([]);

  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [page, setPage] = useState(1);

  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    productId: "",
    category: "",
    warehouse: "",
    quantity: "",
    unit: "",
    reason: "",
    invoice: "",
    batch: "",
    zone: "",
    rack: "",
    bin: "",
    remarks: ""
  });

  /* ===============================
     REALTIME LISTENERS
  ================================ */
  useEffect(() => {
    const unsubProducts = onSnapshot(collection(db, "products"), snap =>
      setProducts(
        snap.docs
          .map(d => ({ id: d.id, ...d.data() }))
          .sort((a, b) => a.name.localeCompare(b.name))
      )
    );

    const unsubWarehouses = onSnapshot(collection(db, "warehouses"), snap =>
      setWarehouses(
        snap.docs.map(d => d.data().name).sort((a, b) => a.localeCompare(b))
      )
    );

    const unsubStockOut = onSnapshot(
      query(collection(db, "stock_out"), orderBy("createdAt", "desc")),
      snap =>
        setStockOut(
          snap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            date: d.data().createdAt?.toDate().toISOString().split("T")[0]
          }))
        )
    );

    return () => {
      unsubProducts();
      unsubWarehouses();
      unsubStockOut();
    };
  }, []);

  /* ===============================
     AUTO PRODUCT FILL
  ================================ */
  useEffect(() => {
    const product = products.find(p => p.id === form.productId);
    if (product) {
      setForm(f => ({
        ...f,
        category: product.category,
        unit: product.unit
      }));
    }
  }, [form.productId, products]);

  /* ===============================
     FILTER + PAGINATION
  ================================ */
  const filtered = useMemo(() => {
    let data = [...stockOut];

    if (search) {
      data = data.filter(d =>
        [d.productName, d.sku, d.reason, d.invoice, d.batch]
          .join(" ")
          .toLowerCase()
          .includes(search)
      );
    }

    if (category !== "all") {
      data = data.filter(d => d.category === category);
    }

    return data;
  }, [stockOut, search, category]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageData = filtered.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE
  );

  /* ===============================
     SAVE STOCK OUT
  ================================ */
  const saveStockOut = async () => {
    if (!form.productId || !form.warehouse || !form.quantity || !form.reason || !form.invoice) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setSaving(true);

      const product = products.find(p => p.id === form.productId);
      const location = `${form.zone}-${form.rack}-${form.bin}`;

      const inventoryRef = doc(db, "inventory", `${product.sku}_${form.warehouse}`);
      const invSnap = await getDoc(inventoryRef);

      if (!invSnap.exists() || invSnap.data().quantity < Number(form.quantity)) {
        alert("Insufficient stock available");
        return;
      }

      await addDoc(collection(db, "stock_out"), {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        category: product.category,
        warehouse: form.warehouse,
        quantity: Number(form.quantity),
        unit: form.unit,
        reason: form.reason,
        invoice: form.invoice,
        batch: form.batch,
        location,
        remarks: form.remarks,
        createdAt: new Date()
      });

      await updateDoc(inventoryRef, {
        quantity: invSnap.data().quantity - Number(form.quantity),
        updatedAt: new Date()
      });

      setShowModal(false);
      setForm({});
      alert("Stock Out saved!");
    } catch {
      alert("Failed to process Stock Out");
    } finally {
      setSaving(false);
    }
  };

  /* ===============================
     RENDER
  ================================ */
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Stock Out</h1>

      {/* TOOLBAR */}
      <div className="flex gap-3">
        <input
          placeholder="Search..."
          className="input"
          onChange={e => setSearch(e.target.value.toLowerCase())}
        />
        <select onChange={e => setCategory(e.target.value)} className="input">
          <option value="all">All Categories</option>
          {[...new Set(stockOut.map(s => s.category))].map(c =>
            <option key={c}>{c}</option>
          )}
        </select>
        <button onClick={() => setShowModal(true)} className="bg-red-600 text-white px-4 py-2 rounded">
          − Stock Out
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-blue-600 text-white text-sm">
            <tr>
              <th>Date</th>
              <th>Product</th>
              <th>SKU</th>
              <th>Warehouse</th>
              <th>Qty</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {pageData.map(s => (
              <tr key={s.id} className="border-b">
                <td>{s.date}</td>
                <td>{s.productName}</td>
                <td>{s.sku}</td>
                <td>{s.warehouse}</td>
                <td>{s.quantity} {s.unit}</td>
                <td>{s.reason}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* PAGINATION */}
      <div className="flex gap-2">
        {Array.from({ length: totalPages }).map((_, i) => (
          <button
            key={i}
            onClick={() => setPage(i + 1)}
            className={`px-3 py-1 rounded ${
              page === i + 1 ? "bg-blue-600 text-white" : "border"
            }`}
          >
            {i + 1}
          </button>
        ))}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl w-full max-w-2xl space-y-4">
            <h2 className="font-semibold">Remove Stock</h2>

            <select onChange={e => setForm({ ...form, productId: e.target.value })} className="input">
              <option>Select Product</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            <select disabled className="input">
              <option>{form.category}</option>
            </select>

            <select onChange={e => setForm({ ...form, warehouse: e.target.value })} className="input">
              <option>Select Warehouse</option>
              {warehouses.map(w => <option key={w}>{w}</option>)}
            </select>

            <input placeholder="Quantity" type="number"
              onChange={e => setForm({ ...form, quantity: e.target.value })} className="input" />

            <select onChange={e => setForm({ ...form, reason: e.target.value })} className="input">
              <option>Select Reason</option>
              <option>Sales</option>
              <option>Damage</option>
              <option>Expiry</option>
              <option>Transfer</option>
              <option>Sample</option>
            </select>

            <input placeholder="Invoice Number"
              onChange={e => setForm({ ...form, invoice: e.target.value })} className="input" />

            <textarea placeholder="Remarks"
              onChange={e => setForm({ ...form, remarks: e.target.value })}
              className="input" />

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
              <button disabled={saving} onClick={saveStockOut}
                className="bg-red-600 text-white px-4 py-2 rounded">
                {saving ? "Processing..." : "Submit"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
