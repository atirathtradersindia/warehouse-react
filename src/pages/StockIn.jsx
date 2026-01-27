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
const PER_PAGE = 4;

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
        snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name))
      )
    );

    const unsubSuppliers = onSnapshot(collection(db, "suppliers"), snap =>
      setSuppliers(
        snap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name))
      )
    );

    const unsubStock = onSnapshot(
      query(collection(db, "stock_in"), orderBy("createdAt", "desc")),
      snap =>
        setStockIn(
          snap.docs.map(d => ({
            id: d.id,
            ...d.data(),
            date: d.data().createdAt?.toDate().toISOString().split("T")[0],
            expiryDate: d.data().expiry || 'N/A'
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
    let data = [...stockIn];

    if (search) {
      data = data.filter(d =>
        [d.productName, d.sku, d.invoice, d.batch, d.supplier]
          .join(" ")
          .toLowerCase()
          .includes(search.toLowerCase())
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
      const location = `${form.zone || 'Zone'} - ${form.rack || 'Rack'} - ${form.bin || 'Bin'}`;

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
        batch: form.batch || `BATCH-${Date.now().toString().slice(-6)}`,
        expiry: form.expiry,
        location,
        remarks: form.remarks,
        createdAt: new Date()
      });

      await updateInventory(product, form.warehouse, Number(form.quantity), form.unit, form.expiry);

      setShowModal(false);
      setForm({});
      alert("Stock In saved!");
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
    <div className="space-y-6 p-4">
      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Stock In</h1>
        <p className="text-gray-600 mt-1">Track incoming inventory from suppliers</p>
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
                placeholder="Search products, SKU, invoice..."
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
              {[...new Set(stockIn.map(s => s.category))].map(c => (
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
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Stock In
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
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">SUPPLIER</th>
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
                        <td className="px-5 py-4">
                          <div className="text-sm text-gray-900">{s.supplier}</div>
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
                                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Product Details</h4>
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
                                  <h4 className="text-sm font-semibold text-gray-700 mb-3">Inventory Info</h4>
                                  <div className="space-y-2">
                                    <div>
                                      <span className="text-xs text-gray-500">Expiry Date:</span>
                                      <p className={`text-sm font-medium ${s.expiryDate === 'N/A' ? 'text-gray-500' : 'text-gray-900'}`}>
                                        {s.expiryDate}
                                      </p>
                                    </div>
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
                        <p className="text-lg font-medium">No stock in records found</p>
                        <p className="text-sm mt-1">Try adjusting your search or add a new stock in</p>
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

      {/* ADD STOCK IN MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={() => setShowModal(false)}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-5 pb-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">Add Stock</h3>
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
                      <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
                      <select
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        value={form.supplier}
                        onChange={e => setForm({ ...form, supplier: e.target.value })}
                        required
                      >
                        <option value="">Select Supplier</option>
                        {suppliers.map(s => (
                          <option key={s.id} value={s.name}>{s.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Invoice Number *</label>
                      <input
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., INV-5001"
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
                        placeholder="e.g., BATCH-001"
                        value={form.batch}
                        onChange={e => setForm({ ...form, batch: e.target.value })}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        value={form.expiry}
                        onChange={e => setForm({ ...form, expiry: e.target.value })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Zone</label>
                        <input
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Zone A"
                          value={form.zone}
                          onChange={e => setForm({ ...form, zone: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rack</label>
                        <input
                          className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Rack 3"
                          value={form.rack}
                          onChange={e => setForm({ ...form, rack: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
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
                    onClick={saveStockIn}
                    className="px-5 py-2.5 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors shadow-sm hover:shadow-md w-full sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? "Processing..." : "Submit Stock In"}
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