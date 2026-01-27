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
const PER_PAGE = 4;

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
  
  // Track which rows are expanded
  const [expandedRows, setExpandedRows] = useState({});

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
        snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name))
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
     TOGGLE ROW EXPANSION
  ================================ */
  const toggleRowExpansion = (id) => {
    setExpandedRows(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

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
          .includes(search.toLowerCase())
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
      const location = `${form.zone || 'Zone'} - ${form.rack || 'Rack'} - ${form.bin || 'Bin'}`;

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
        batch: form.batch || `BATCH-${Date.now().toString().slice(-6)}`,
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
    <div className="space-y-6 p-4">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Stock Out</h1>
        <p className="text-gray-600 mt-1">Track outgoing inventory for sales, damage, or transfers</p>
      </div>

      {/* TOOLBAR */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Search products, SKU, reason..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <select 
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[140px]"
              value={category}
              onChange={e => setCategory(e.target.value)}
            >
              <option value="all">All Categories</option>
              {[...new Set(stockOut.map(s => s.category))].map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            <button className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors">
              Filter
            </button>
            
            <button className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors">
              Export
            </button>
            
            <button 
              onClick={() => setShowModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
              Stock Out
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[1000px]">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">DATE</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">PRODUCT NAME</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">SKU</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">WAREHOUSE</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">QUANTITY</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">UNIT</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">REASON</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">LOCATION</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">DETAILS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {pageData.length > 0 ? (
                  pageData.map(s => (
                    <>
                      <tr key={s.id} className="hover:bg-gray-50 transition-colors duration-150">
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">{s.date}</div>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-sm font-medium text-gray-900">{s.productName}</div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-mono">{s.sku}</div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{s.warehouse}</div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 font-medium">{s.quantity}</div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{s.unit}</div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            s.reason === 'Sales' ? 'bg-green-100 text-green-800' :
                            s.reason === 'Damage' ? 'bg-red-100 text-red-800' :
                            s.reason === 'Expiry' ? 'bg-yellow-100 text-yellow-800' :
                            s.reason === 'Internal Use' ? 'bg-blue-100 text-blue-800' :
                            s.reason === 'Transfer' ? 'bg-purple-100 text-purple-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {s.reason}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="text-sm text-gray-900">{s.location || 'Not specified'}</div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <button
                            onClick={() => toggleRowExpansion(s.id)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-150 flex items-center gap-1"
                          >
                            {expandedRows[s.id] ? 'Hide details' : 'Load more'}
                            <svg 
                              className={`w-4 h-4 transform transition-transform duration-200 ${expandedRows[s.id] ? 'rotate-180' : ''}`}
                              fill="none" 
                              stroke="currentColor" 
                              viewBox="0 0 24 24"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                      
                      {/* EXPANDED DETAILS ROW */}
                      {expandedRows[s.id] && (
                        <tr className="bg-gray-50">
                          <td colSpan="9" className="px-5 py-4">
                            <div className="bg-white p-5 rounded-lg border border-gray-200">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Details</h4>
                                  <div className="space-y-2">
                                    <div>
                                      <span className="text-xs text-gray-500">Category:</span>
                                      <p className="text-sm font-medium text-gray-900">{s.category}</p>
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500">Invoice:</span>
                                      <p className="text-sm font-medium text-gray-900">{s.invoice}</p>
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500">Batch:</span>
                                      <p className="text-sm font-medium text-gray-900">{s.batch || 'N/A'}</p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Warehouse Info</h4>
                                  <div className="space-y-2">
                                    <div>
                                      <span className="text-xs text-gray-500">Warehouse:</span>
                                      <p className="text-sm font-medium text-gray-900">{s.warehouse}</p>
                                    </div>
                                    <div>
                                      <span className="text-xs text-gray-500">Location:</span>
                                      <p className="text-sm font-medium text-gray-900">{s.location || 'Not specified'}</p>
                                    </div>
                                  </div>
                                </div>
                                
                                <div>
                                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Remarks</h4>
                                  <div className="p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-700">{s.remarks || 'N/A'}</p>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))
                ) : (
                  <tr>
                    <td colSpan="9" className="px-5 py-8 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <p className="text-lg font-medium">No stock out records found</p>
                        <p className="text-sm mt-1">Try adjusting your search or add a new stock out</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* PAGINATION */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-gray-600">
          Showing {(page - 1) * PER_PAGE + 1} to {Math.min(page * PER_PAGE, filtered.length)} of {filtered.length} entries
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`px-3 py-1.5 rounded-lg border ${page === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            Previous
          </button>
          
          {Array.from({ length: Math.min(5, totalPages) }).map((_, i) => {
            let pageNum;
            if (totalPages <= 5) {
              pageNum = i + 1;
            } else if (page <= 3) {
              pageNum = i + 1;
            } else if (page >= totalPages - 2) {
              pageNum = totalPages - 4 + i;
            } else {
              pageNum = page - 2 + i;
            }
            
            return (
              <button
                key={pageNum}
                onClick={() => setPage(pageNum)}
                className={`px-3 py-1.5 rounded-lg border ${
                  page === pageNum
                    ? 'bg-blue-600 border-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                {pageNum}
              </button>
            );
          })}
          
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={`px-3 py-1.5 rounded-lg border ${page === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50'}`}
          >
            Next
          </button>
        </div>
      </div>

      {/* ADD STOCK OUT MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setShowModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-5 pb-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Remove Stock</h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className="text-gray-400 hover:text-gray-500 p-1 rounded-full hover:bg-gray-100"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Product *</label>
                    <select
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                      value={form.productId}
                      onChange={e => setForm({ ...form, productId: e.target.value })}
                      required
                    >
                      <option value="">Select Product</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                      <input
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                        value={form.category}
                        readOnly
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                      <input
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-gray-50"
                        value={form.unit}
                        readOnly
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse *</label>
                      <select
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        value={form.warehouse}
                        onChange={e => setForm({ ...form, warehouse: e.target.value })}
                        required
                      >
                        <option value="">Select Warehouse</option>
                        {warehouses.map(w => (
                          <option key={w.id} value={w.name}>{w.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity *</label>
                      <input
                        type="number"
                        min="1"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter quantity"
                        value={form.quantity}
                        onChange={e => setForm({ ...form, quantity: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Reason *</label>
                      <select
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        value={form.reason}
                        onChange={e => setForm({ ...form, reason: e.target.value })}
                        required
                      >
                        <option value="">Select Reason</option>
                        <option value="Sales">Sales</option>
                        <option value="Damage">Damage</option>
                        <option value="Expiry">Expiry</option>
                        <option value="Internal Use">Internal Use</option>
                        <option value="Transfer">Transfer</option>
                        <option value="Sample">Sample</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number *</label>
                      <input
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., OUT-1092"
                        value={form.invoice}
                        onChange={e => setForm({ ...form, invoice: e.target.value })}
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Batch Number</label>
                      <input
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., BATCH-031"
                        value={form.batch}
                        onChange={e => setForm({ ...form, batch: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                      <input
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Zone C"
                        value={form.zone}
                        onChange={e => setForm({ ...form, zone: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rack</label>
                        <input
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Rack 4"
                          value={form.rack}
                          onChange={e => setForm({ ...form, rack: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bin</label>
                        <input
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Bin 1"
                          value={form.bin}
                          onChange={e => setForm({ ...form, bin: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                    <textarea
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Additional notes or remarks"
                      rows="3"
                      value={form.remarks}
                      onChange={e => setForm({ ...form, remarks: e.target.value })}
                    />
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
                  <button 
                    type="button"
                    className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button 
                    type="button"
                    disabled={saving}
                    onClick={saveStockOut}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors shadow-sm hover:shadow-md w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Processing..." : "Submit Stock Out"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}