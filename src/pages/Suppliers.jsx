import { useEffect, useMemo, useState } from "react";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  doc,
  getDocs
} from "firebase/firestore";
import { db } from "../firebase/firebase";

const TAX_RATE = 0.18;

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const [viewSupplier, setViewSupplier] = useState(null);

  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);

  const [poSupplier, setPoSupplier] = useState(null);
  const [poItems, setPoItems] = useState([]);

  const [poHistory, setPoHistory] = useState([]);
  const [showPOHistory, setShowPOHistory] = useState(false);

  /* ===============================
     LOAD SUPPLIERS (REALTIME)
  ================================ */
  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "suppliers"), orderBy("createdAt", "desc")),
      snap => {
        setSuppliers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );
    return () => unsub();
  }, []);

  /* ===============================
     LOAD CATEGORIES & PRODUCTS
  ================================ */
  useEffect(() => {
    getDocs(collection(db, "categories")).then(s =>
      setCategories(s.docs.map(d => d.data()))
    );
    getDocs(collection(db, "products")).then(s =>
      setProducts(s.docs.map(d => d.data()))
    );
  }, []);

  /* ===============================
     LOAD PO HISTORY
  ================================ */
  useEffect(() => {
    if (!showPOHistory) return;

    const unsub = onSnapshot(
      query(collection(db, "purchaseOrders"), orderBy("createdAt", "desc")),
      snap => {
        setPoHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      }
    );
    return () => unsub();
  }, [showPOHistory]);

  /* ===============================
     FILTERED SUPPLIERS
  ================================ */
  const filteredSuppliers = useMemo(() => {
    if (!search) return suppliers;
    return suppliers.filter(s =>
      [s.name, s.email, s.phone, s.gst]
        .join(" ")
        .toLowerCase()
        .includes(search)
    );
  }, [suppliers, search]);

  /* ===============================
     ADD SUPPLIER
  ================================ */
  const addSupplier = async e => {
    e.preventDefault();
    const f = e.target;

    await addDoc(collection(db, "suppliers"), {
      name: f.name.value,
      email: f.email.value,
      phone: f.phone.value,
      gst: f.gst.value,
      createdAt: new Date()
    });

    setShowAdd(false);
    f.reset();
  };

  /* ===============================
     PO LOGIC
  ================================ */
  const addPOItem = () =>
    setPoItems([...poItems, { category: "", product: "", qty: 1, price: 0 }]);

  const subtotal = poItems.reduce((s, i) => s + i.qty * i.price, 0);
  const tax = subtotal * TAX_RATE;
  const total = subtotal + tax;

  const savePO = async () => {
    if (!poItems.length) return alert("Add at least one item");

    await addDoc(collection(db, "purchaseOrders"), {
      supplierId: poSupplier.id,
      supplierName: poSupplier.name,
      items: poItems.map(i => ({
        name: i.product,
        quantity: i.qty,
        unitPrice: i.price,
        amount: i.qty * i.price
      })),
      subtotal,
      tax,
      totalAmount: total,
      status: "sent",
      createdAt: new Date(),
      updatedAt: new Date()
    });

    setPoSupplier(null);
    setPoItems([]);
  };

  /* ===============================
     MARK PO COMPLETE
  ================================ */
  const markCompleted = async id => {
    await updateDoc(doc(db, "purchaseOrders", id), {
      status: "completed",
      updatedAt: new Date()
    });
  };

  /* ===============================
     UI
  ================================ */
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">Suppliers</h1>
        <button onClick={() => setShowAdd(true)} className="btn-primary">
          + Add Supplier
        </button>
      </div>

      <input
        className="input"
        placeholder="Search suppliers..."
        onChange={e => setSearch(e.target.value.toLowerCase())}
      />

      {/* SUPPLIER GRID */}
      <div className="grid md:grid-cols-3 gap-6">
        {filteredSuppliers.map(s => (
          <div key={s.id} className="card">
            <h3 className="font-semibold">{s.name}</h3>
            <p>{s.email}</p>
            <p>{s.phone}</p>
            <p className="text-xs">GST: {s.gst}</p>

            <div className="flex justify-between mt-4">
              <button onClick={() => setViewSupplier(s)} className="link">
                View
              </button>
              <button
                onClick={() => {
                  setPoSupplier(s);
                  setPoItems([]);
                }}
                className="btn-outline"
              >
                Create PO
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ADD SUPPLIER MODAL */}
      {showAdd && (
        <div className="modal">
          <form onSubmit={addSupplier} className="modal-box space-y-3">
            <h3 className="font-semibold">Add Supplier</h3>
            <input name="name" placeholder="Company" className="input" required />
            <input name="email" placeholder="Email" className="input" required />
            <input name="phone" placeholder="Phone" className="input" required />
            <input name="gst" placeholder="GST" className="input" required />

            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowAdd(false)}>
                Cancel
              </button>
              <button className="btn-primary">Save</button>
            </div>
          </form>
        </div>
      )}

      {/* CREATE PO MODAL */}
      {poSupplier && (
        <div className="modal">
          <div className="modal-box space-y-4 max-w-3xl">
            <h3 className="font-semibold">
              Create PO – {poSupplier.name}
            </h3>

            {poItems.map((item, idx) => (
              <div key={idx} className="grid grid-cols-4 gap-2">
                <select
                  className="input"
                  onChange={e =>
                    setPoItems(p =>
                      p.map((x, i) =>
                        i === idx ? { ...x, category: e.target.value } : x
                      )
                    )
                  }
                >
                  <option value="">Category</option>
                  {categories.map(c => (
                    <option key={c.name}>{c.name}</option>
                  ))}
                </select>

                <select
                  className="input"
                  onChange={e =>
                    setPoItems(p =>
                      p.map((x, i) =>
                        i === idx ? { ...x, product: e.target.value } : x
                      )
                    )
                  }
                >
                  <option value="">Product</option>
                  {products
                    .filter(p => p.category === item.category)
                    .map(p => (
                      <option key={p.name}>{p.name}</option>
                    ))}
                </select>

                <input
                  type="number"
                  className="input"
                  value={item.qty}
                  onChange={e =>
                    setPoItems(p =>
                      p.map((x, i) =>
                        i === idx ? { ...x, qty: +e.target.value } : x
                      )
                    )
                  }
                />

                <input
                  type="number"
                  className="input"
                  value={item.price}
                  onChange={e =>
                    setPoItems(p =>
                      p.map((x, i) =>
                        i === idx ? { ...x, price: +e.target.value } : x
                      )
                    )
                  }
                />
              </div>
            ))}

            <button onClick={addPOItem} className="btn-outline">
              + Add Item
            </button>

            <div className="text-right">
              <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
              <p>Tax: ₹{tax.toFixed(2)}</p>
              <p className="font-semibold">Total: ₹{total.toFixed(2)}</p>
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => setPoSupplier(null)}>Cancel</button>
              <button onClick={savePO} className="btn-primary">
                Save PO
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PO HISTORY */}
      <button
        onClick={() => setShowPOHistory(true)}
        className="link"
      >
        View PO History
      </button>

      {showPOHistory && (
        <div className="modal">
          <div className="modal-box max-w-5xl">
            <h3 className="font-semibold mb-4">PO History</h3>

            <table className="table">
              <thead>
                <tr>
                  <th>Supplier</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {poHistory.map(po => (
                  <tr key={po.id}>
                    <td>{po.supplierName}</td>
                    <td>{po.items.length}</td>
                    <td>₹{po.totalAmount}</td>
                    <td>{po.status}</td>
                    <td>
                      {po.status === "sent" && (
                        <button
                          onClick={() => markCompleted(po.id)}
                          className="link"
                        >
                          Complete
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="text-right mt-4">
              <button onClick={() => setShowPOHistory(false)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
