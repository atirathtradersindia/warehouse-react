import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  query,
  orderBy,
  doc,
  getDoc,
  setDoc,
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
export default function StockIn() {
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [stockIn, setStockIn] = useState([]);

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
    supplier: "",
    invoice: "",
    batch: "",
    expiry: "",
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
        snap.docs
          .map(d => d.data().name)
          .sort((a, b) => a.localeCompare(b))
      )
    );

    const unsubSuppliers = onSnapshot(collection(db, "suppliers"), snap =>
      setSuppliers(
        snap.docs
          .map(d => d.data().name)
          .sort((a, b) => a.localeCompare(b))
      )
    );

    const unsubStock = onSnapshot(
      query(collection(db, "stock_in"), orderBy("createdAt", "desc")),
      snap =>
        setStockIn(
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
      unsubSuppliers();
      unsubStock();
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
    let data = [...stockIn];

    if (search) {
      data = data.filter(d =>
        [d.productName, d.sku, d.invoice, d.batch, d.supplier]
          .join(" ")
          .toLowerCase()
          .includes(search)
      );
    }

    if (category !== "all") {
      data = data.filter(d => d.category === category);
    }

    return data;
  }, [stockIn, search, category]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const pageData = filtered.slice(
    (page - 1) * PER_PAGE,
    page * PER_PAGE
  );

  /* ===============================
     SAVE STOCK IN
  ================================ */
  const saveStockIn = async () => {
    if (!form.productId || !form.warehouse || !form.quantity || !form.invoice || !form.supplier) {
      alert("Please fill all required fields");
      return;
    }

    try {
      setSaving(true);

      const product = products.find(p => p.id === form.productId);
      const location = `${form.zone}-${form.rack}-${form.bin}`;

      await addDoc(collection(db, "stock_in"), {
        productId: product.id,
        productName: product.name,
        sku: product.sku,
        category: product.category,
        warehouse: form.warehouse,
        quantity: Number(form.quantity),
        unit: form.unit,
        supplier: form.supplier,
        invoice: form.invoice,
        batch: form.batch,
        expiry: form.expiry,
        location,
        remarks: form.remarks,
        createdAt: new Date()
      });

      await updateInventory(product, form.warehouse, Number(form.quantity), form.unit, form.expiry);

      setShowModal(false);
      setForm({});
    } catch {
      alert("Failed to save Stock In");
    } finally {
      setSaving(false);
    }
  };

  /* ===============================
     RENDER
  ================================ */
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Stock In</h1>

      {/* FILTER BAR */}
      <div className="flex gap-3">
        <input
          placeholder="Search..."
          className="input"
          onChange={e => setSearch(e.target.value.toLowerCase())}
        />
        <select onChange={e => setCategory(e.target.value)} className="input">
          <option value="all">All Categories</option>
          {[...new Set(stockIn.map(s => s.category))].map(c =>
            <option key={c}>{c}</option>
          )}
        </select>
        <button onClick={() => setShowModal(true)} className="btn-primary">
          + Stock In
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
              <th>Supplier</th>
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
                <td>{s.supplier}</td>
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
            <h2 className="font-semibold">Add Stock</h2>

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

            <select onChange={e => setForm({ ...form, supplier: e.target.value })} className="input">
              <option>Select Supplier</option>
              {suppliers.map(s => <option key={s}>{s}</option>)}
            </select>

            <input placeholder="Invoice" onChange={e => setForm({ ...form, invoice: e.target.value })} className="input" />

            <div className="flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-outline">Cancel</button>
              <button disabled={saving} onClick={saveStockIn} className="btn-primary">
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ===============================
   INVENTORY UPDATE
================================ */
async function updateInventory(product, warehouse, qty, unit, expiry) {
  const id = `${product.sku}_${warehouse}`;
  const ref = doc(db, "inventory", id);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    await updateDoc(ref, {
      quantity: snap.data().quantity + qty,
      updatedAt: new Date()
    });
  } else {
    await setDoc(ref, {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      category: product.category,
      warehouse,
      quantity: qty,
      unit,
      expiry,
      createdAt: new Date()
    });
  }
}
