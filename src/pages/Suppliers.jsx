import React, { useState, useEffect, useCallback } from 'react';
import { 
  collection, 
  addDoc, 
  getDocs, 
  onSnapshot, 
  query, 
  orderBy, 
  doc, 
  updateDoc,
  Timestamp
} from "firebase/firestore";
import { db } from '../firebase/firebase'; // Adjust import path as needed

// ===============================
// SUPPLIERS COMPONENT
// ===============================
const Suppliers = () => {
  // ===============================
  // STATE VARIABLES
  // ===============================
  const [allSuppliers, setAllSuppliers] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [allPOs, setAllPOs] = useState([]);
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [poHistorySearch, setPOHistorySearch] = useState('');
  const [poStatusFilter, setPoStatusFilter] = useState('all');
  
  // Modal States
  const [showAddSupplierModal, setShowAddSupplierModal] = useState(false);
  const [showViewSupplierModal, setShowViewSupplierModal] = useState(false);
  const [showCreatePOModal, setShowCreatePOModal] = useState(false);
  const [showPOHistoryModal, setShowPOHistoryModal] = useState(false);
  const [showPODetailsModal, setShowPODetailsModal] = useState(false);
  
  // Form States
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [viewSupplierData, setViewSupplierData] = useState(null);
  const [selectedPO, setSelectedPO] = useState(null);
  
  // Current PO State
  const [currentPO, setCurrentPO] = useState({
    supplierId: null,
    supplierName: "",
    items: []
  });
  
  const [poItems, setPoItems] = useState([]);
  
  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // Loading States
  const [isLoadingSuppliers, setIsLoadingSuppliers] = useState(true);
  const [isLoadingPOHistory, setIsLoadingPOHistory] = useState(false);
  const [isSavingSupplier, setIsSavingSupplier] = useState(false);
  const [isSavingPO, setIsSavingPO] = useState(false);
  
  // Form Data
  const [supplierForm, setSupplierForm] = useState({
    name: '',
    email: '',
    phone: '',
    gst: ''
  });

  // ===============================
  // TOAST NOTIFICATION
  // ===============================
  const showToast = useCallback((message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'success' });
    }, 3000);
  }, []);

  // ===============================
  // LOAD CATEGORIES AND PRODUCTS
  // ===============================
  const loadCategoriesAndProducts = useCallback(async () => {
    try {
      // Load categories
      const categorySnap = await getDocs(collection(db, "categories"));
      const categories = categorySnap.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name
      }));
      setAllCategories(categories);

      // Load products
      const productSnap = await getDocs(collection(db, "products"));
      const products = productSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAllProducts(products);

    } catch (err) {
      console.error("Failed to load categories/products", err);
      showToast("Failed to load categories & products", "error");
    }
  }, [showToast]);

  // ===============================
  // LOAD SUPPLIERS
  // ===============================
  useEffect(() => {
    const loadSuppliers = () => {
      try {
        const q = query(collection(db, "suppliers"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(
          q,
          (snapshot) => {
            const suppliers = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data()
            }));
            setAllSuppliers(suppliers);
            setIsLoadingSuppliers(false);
          },
          (error) => {
            console.error("Error loading suppliers:", error);
            showToast("Error loading suppliers. Please refresh the page.", "error");
            setIsLoadingSuppliers(false);
          }
        );
        
        return unsubscribe;
      } catch (error) {
        console.error("Error setting up suppliers listener:", error);
        setIsLoadingSuppliers(false);
        return () => {};
      }
    };

    loadCategoriesAndProducts();
    const unsubscribe = loadSuppliers();
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [loadCategoriesAndProducts, showToast]);

  // ===============================
  // FILTERED SUPPLIERS
  // ===============================
  const filteredSuppliers = React.useMemo(() => {
    if (!searchTerm) return allSuppliers;
    
    const query = searchTerm.toLowerCase().trim();
    return allSuppliers.filter(supplier => 
      (supplier.name && supplier.name.toLowerCase().includes(query)) ||
      (supplier.email && supplier.email.toLowerCase().includes(query)) ||
      (supplier.phone && supplier.phone.includes(query)) ||
      (supplier.gst && supplier.gst.toLowerCase().includes(query))
    );
  }, [allSuppliers, searchTerm]);

  // ===============================
  // FILTERED PO HISTORY
  // ===============================
  const filteredPOs = React.useMemo(() => {
    if (!allPOs.length) return [];
    
    const searchTerm = poHistorySearch.toLowerCase().trim();
    
    return allPOs.filter(po => {
      // Search filter
      const matchesSearch = !searchTerm || 
        (po.supplierName && po.supplierName.toLowerCase().includes(searchTerm)) ||
        (po.items && po.items.some(item => 
          item.name && item.name.toLowerCase().includes(searchTerm)
        ));
      
      // Status filter
      const matchesStatus = poStatusFilter === "all" || po.status === poStatusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [allPOs, poHistorySearch, poStatusFilter]);

  // ===============================
  // LOAD PO HISTORY
  // ===============================
  const loadPOHistory = useCallback(() => {
    setIsLoadingPOHistory(true);
    try {
      const q = query(collection(db, "purchaseOrders"), orderBy("createdAt", "desc"));
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const pos = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setAllPOs(pos);
          setIsLoadingPOHistory(false);
        },
        (error) => {
          console.error("Error loading PO history:", error);
          showToast("Error loading purchase orders", "error");
          setIsLoadingPOHistory(false);
        }
      );
      
      return unsubscribe;
    } catch (error) {
      console.error("Error setting up PO history listener:", error);
      setIsLoadingPOHistory(false);
      return () => {};
    }
  }, [showToast]);

  // ===============================
  // MODAL HANDLERS
  // ===============================
  const openAddSupplierModal = () => {
    setShowAddSupplierModal(true);
  };

  const closeAddSupplierModal = () => {
    setShowAddSupplierModal(false);
    setSupplierForm({ name: '', email: '', phone: '', gst: '' });
  };

  const openViewSupplierModal = (supplier) => {
    setViewSupplierData(supplier);
    setShowViewSupplierModal(true);
  };

  const closeViewSupplierModal = () => {
    setShowViewSupplierModal(false);
    setViewSupplierData(null);
  };

  const openCreatePOModal = (supplierId, supplierName) => {
    setCurrentPO({ supplierId, supplierName, items: [] });
    setPoItems([{ id: Date.now(), category: '', product: '', quantity: 1, price: 0, amount: 0 }]);
    setShowCreatePOModal(true);
  };

  const closeCreatePOModal = () => {
    setShowCreatePOModal(false);
    setCurrentPO({ supplierId: null, supplierName: "", items: [] });
    setPoItems([]);
  };

  const openPOHistory = () => {
    setShowPOHistoryModal(true);
    loadPOHistory();
  };

  const closePOHistory = () => {
    setShowPOHistoryModal(false);
    setPOHistorySearch('');
    setPoStatusFilter('all');
  };

  const openPODetails = (po) => {
    setSelectedPO(po);
    setShowPODetailsModal(true);
  };

  const closePODetails = () => {
    setShowPODetailsModal(false);
    setSelectedPO(null);
  };

  // ===============================
  // SUPPLIER CARD COMPONENT
  // ===============================
  const SupplierCard = ({ supplier }) => {
    const initial = supplier.name ? supplier.name.charAt(0).toUpperCase() : '?';
    
    return (
      <div className="bg-white rounded-xl shadow-md p-6 relative hover:shadow-lg transition border border-gray-100 group">
        {/* Avatar Circle */}
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg mb-4 shadow-sm">
          {initial}
        </div>

        {/* Details */}
        <h3 className="text-lg font-semibold text-gray-900 mb-3 truncate">
          {supplier.name}
        </h3>

        <div className="space-y-2 text-sm text-gray-600">
          <p className="flex items-center gap-2 truncate">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="truncate">{supplier.email}</span>
          </p>
          <p className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            <span>{supplier.phone}</span>
          </p>
          <p className="flex items-center gap-2 truncate">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="truncate">GST: {supplier.gst}</span>
          </p>
        </div>

        {/* Actions */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
          <button
            onClick={() => openViewSupplierModal(supplier)}
            className="text-blue-600 hover:text-blue-700 hover:underline text-sm font-medium transition flex items-center gap-1"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
            View Details
          </button>

          <button
            onClick={() => openCreatePOModal(supplier.id, supplier.name)}
            className="px-3 py-1 text-xs font-medium text-green-700 border border-green-600 rounded-lg hover:bg-green-600 hover:text-white transition flex items-center gap-1"
          >
            <span>📝</span>
            <span>Create PO</span>
          </button>
        </div>
      </div>
    );
  };

  // ===============================
  // ADD SUPPLIER HANDLER
  // ===============================
  const handleAddSupplier = async (e) => {
    e.preventDefault();
    
    const { name, email, phone, gst } = supplierForm;
    
    // Basic validation
    if (!name || !email || !phone || !gst) {
      showToast("Please fill in all required fields.", "error");
      return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showToast("Please enter a valid email address.", "error");
      return;
    }
    
    try {
      setIsSavingSupplier(true);
      
      // Add to Firestore
      await addDoc(collection(db, "suppliers"), {
        name: name,
        email: email,
        phone: phone,
        gst: gst,
        createdAt: Timestamp.now()
      });
      
      // Success
      closeAddSupplierModal();
      showToast(`Supplier "${name}" added successfully!`, "success");
      
    } catch (error) {
      console.error("Error adding supplier:", error);
      showToast("Failed to add supplier. Please try again.", "error");
    } finally {
      setIsSavingSupplier(false);
    }
  };

  // ===============================
  // PO ITEM HANDLERS
  // ===============================
  const addPOItemRow = () => {
    setPoItems(prev => [...prev, { 
      id: Date.now(), 
      category: '', 
      product: '', 
      quantity: 1, 
      price: 0, 
      amount: 0 
    }]);
  };

  const removePOItem = (id) => {
    setPoItems(prev => prev.filter(item => item.id !== id));
  };

  const handlePOItemChange = (id, field, value) => {
    setPoItems(prev => prev.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        // If category changed, reset product
        if (field === 'category') {
          updatedItem.product = '';
          updatedItem.price = 0;
        }
        
        // If product changed, get its price
        if (field === 'product' && value) {
          const selectedProduct = allProducts.find(p => p.name === value);
          if (selectedProduct) {
            updatedItem.price = selectedProduct.price || 0;
          }
        }
        
        // Calculate amount
        if (field === 'quantity' || field === 'price') {
          updatedItem.amount = updatedItem.quantity * updatedItem.price;
        }
        
        return updatedItem;
      }
      return item;
    }));
  };

  // ===============================
  // CALCULATE PO TOTALS
  // ===============================
  const poTotals = React.useMemo(() => {
    const subtotal = poItems.reduce((sum, item) => sum + item.amount, 0);
    const tax = subtotal * 0.18;
    const total = subtotal + tax;
    
    return { subtotal, tax, total };
  }, [poItems]);

  // ===============================
  // SAVE PURCHASE ORDER
  // ===============================
  const savePO = async () => {
    // Filter valid items
    const validItems = poItems.filter(item => 
      item.product && item.quantity > 0 && item.price > 0
    ).map(item => ({
      name: item.product,
      quantity: item.quantity,
      unitPrice: item.price,
      amount: item.amount
    }));
    
    // Validation
    if (validItems.length === 0) {
      showToast("Please add at least one item to the purchase order", "error");
      return;
    }
    
    try {
      setIsSavingPO(true);
      
      // Create PO in Firestore
      await addDoc(collection(db, "purchaseOrders"), {
        supplierId: currentPO.supplierId,
        supplierName: currentPO.supplierName,
        items: validItems,
        subtotal: poTotals.subtotal,
        tax: poTotals.tax,
        totalAmount: poTotals.total,
        status: "sent",
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      });
      
      // Success
      closeCreatePOModal();
      showToast(`Purchase Order created for ${currentPO.supplierName}`, "success");
      
    } catch (error) {
      console.error("Error creating PO:", error);
      showToast("Failed to create purchase order. Please try again.", "error");
    } finally {
      setIsSavingPO(false);
    }
  };

  // ===============================
  // MARK PO AS COMPLETED
  // ===============================
  const markPOCompleted = async (poId) => {
    try {
      const poRef = doc(db, "purchaseOrders", poId);
      await updateDoc(poRef, {
        status: "completed",
        updatedAt: Timestamp.now()
      });
      showToast("PO marked as completed", "success");
    } catch (error) {
      console.error("Error updating PO:", error);
      showToast("Failed to update PO", "error");
    }
  };

  // ===============================
  // RENDER PO ITEM ROW
  // ===============================
  const POItemRow = ({ item }) => {
    const filteredProducts = allProducts.filter(p => p.category === item.category);
    
    return (
      <div className="grid grid-cols-12 gap-4 items-center px-3 py-3 border rounded-lg hover:bg-gray-50">
        {/* Category + Product Dropdowns */}
        <div className="col-span-5 flex items-center">
          <div className="grid grid-cols-2 gap-3 w-full">
            {/* Category Dropdown */}
            <select 
              className="h-10 w-full px-3 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={item.category}
              onChange={(e) => handlePOItemChange(item.id, 'category', e.target.value)}
            >
              <option value="">Select Category</option>
              {allCategories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>

            {/* Product Dropdown */}
            <select 
              className="h-10 w-full px-3 border border-gray-300 rounded-md text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
              value={item.product}
              onChange={(e) => handlePOItemChange(item.id, 'product', e.target.value)}
              disabled={!item.category}
            >
              <option value="">Select Product</option>
              {filteredProducts.map(product => (
                <option key={product.id} value={product.name}>{product.name}</option>
              ))}
            </select>
          </div>
        </div>
        
        {/* Quantity */}
        <div className="col-span-2">
          <input 
            type="number" 
            min="1" 
            value={item.quantity}
            placeholder="Qty"
            className="h-10 w-full px-3 text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            onChange={(e) => handlePOItemChange(item.id, 'quantity', parseFloat(e.target.value) || 0)}
          />
        </div>
        
        {/* Price */}
        <div className="col-span-2">
          <input 
            type="number" 
            min="0" 
            step="0.01"
            value={item.price}
            placeholder="Price"
            className="h-10 w-full px-3 text-center border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
            onChange={(e) => handlePOItemChange(item.id, 'price', parseFloat(e.target.value) || 0)}
          />
        </div>
        
        {/* Amount */}
        <div className="col-span-2 flex items-center justify-center h-10">
          <span className="text-sm font-medium">₹{item.amount.toFixed(2)}</span>
        </div>
        
        {/* Delete */}
        <div className="col-span-1 flex items-center justify-center h-10">
          <button
            onClick={() => removePOItem(item.id)}
            className="text-red-500 hover:text-red-700 text-lg leading-none"
          >
            🗑️
          </button>
        </div>
      </div>
    );
  };

  // ===============================
  // RENDER PO HISTORY ROW
  // ===============================
  const PORow = ({ po }) => {
    const itemCount = po.items ? po.items.length : 0;
    const totalAmount = po.totalAmount || 0;
    const createdAt = po.createdAt ? po.createdAt.toDate().toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }) : 'N/A';
    
    // Status badge styling
    let statusClass = "bg-blue-100 text-blue-800";
    let statusText = po.status || "sent";
    
    if (statusText === "sent") {
      statusClass = "bg-blue-100 text-blue-800";
    } else if (statusText === "completed") {
      statusClass = "bg-green-100 text-green-800";
    }
    
    return (
      <tr className="hover:bg-gray-50">
        <td className="px-4 py-3">
          <div className="font-medium text-gray-900">{po.supplierName || 'Unknown Supplier'}</div>
        </td>
        <td className="px-4 py-3">
          <div className="text-sm text-gray-600">{itemCount} item{itemCount !== 1 ? 's' : ''}</div>
          {po.items && po.items.length > 0 && (
            <div className="text-xs text-gray-500 truncate max-w-xs">
              {po.items[0].name || 'Item'}{itemCount > 1 ? ` +${itemCount - 1} more` : ''}
            </div>
          )}
        </td>
        <td className="px-4 py-3 font-medium text-gray-900">
          ₹{totalAmount.toFixed(2)}
        </td>
        <td className="px-4 py-3">
          <span className={`px-2 py-1 text-xs font-medium rounded-full ${statusClass}`}>
            {statusText.charAt(0).toUpperCase() + statusText.slice(1)}
          </span>
        </td>
        <td className="px-4 py-3 text-sm text-gray-600">
          {createdAt}
        </td>
        <td className="px-4 py-3">
          <div className="flex gap-2">
            <button
              onClick={() => openPODetails(po)}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium"
            >
              View
            </button>
            {po.status === "sent" && (
              <button
                onClick={() => markPOCompleted(po.id)}
                className="text-green-600 hover:text-green-800 text-sm font-medium"
              >
                ✓ Complete
              </button>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // ===============================
  // CALCULATE PO HISTORY SUMMARY
  // ===============================
  const poHistorySummary = React.useMemo(() => {
    const totalAmount = filteredPOs.reduce((sum, po) => sum + (po.totalAmount || 0), 0);
    return {
      count: filteredPOs.length,
      totalAmount: totalAmount.toFixed(2)
    };
  }, [filteredPOs]);

  // ===============================
  // MAIN RENDER
  // ===============================
  return (
    <div>
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3 rounded-lg shadow-xl text-sm flex items-center gap-2 min-w-[300px] max-w-md animate-fade-in ${
          toast.type === 'success' ? 'bg-green-600 text-white' : 
          toast.type === 'error' ? 'bg-red-600 text-white' : 
          'bg-blue-600 text-white'
        }`}>
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              {toast.type === 'success' ? '✓' : '✗'}
            </div>
            <div className="flex-1">{toast.message}</div>
          </div>
        </div>
      )}

      {/* PAGE HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Supplier Management</h1>
          <p className="text-gray-600 mt-1">Manage your suppliers and create purchase orders</p>
        </div>

        <button
          onClick={openAddSupplierModal}
          className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          Add Supplier
        </button>
      </div>

      {/* SEARCH AND STATS */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="max-w-sm w-full">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 absolute left-3 top-3 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
            </svg>
            <input
              type="text"
              placeholder="Search suppliers..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        {/* PO HISTORY BUTTON */}
        <button
          onClick={openPOHistory}
          className="text-blue-600 hover:text-blue-700 hover:underline text-sm font-medium transition"
        >
          PO History
        </button>
      </div>

      {/* SUPPLIER CARDS */}
      <div id="supplierGrid" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoadingSuppliers ? (
          <div className="col-span-full text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading suppliers...</p>
          </div>
        ) : filteredSuppliers.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No suppliers found</h3>
            <p className="text-gray-600 mb-4">Try a different search term or add a new supplier</p>
            <button
              onClick={openAddSupplierModal}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              Add New Supplier
            </button>
          </div>
        ) : (
          filteredSuppliers.map(supplier => (
            <SupplierCard key={supplier.id} supplier={supplier} />
          ))
        )}
      </div>

      {/* ADD SUPPLIER MODAL */}
      {showAddSupplierModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Add New Supplier</h3>
              <button
                onClick={closeAddSupplierModal}
                className="text-gray-400 hover:text-gray-600 transition text-2xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  required
                  placeholder="Enter company name"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email Address *
                </label>
                <input
                  required
                  type="email"
                  placeholder="Enter email address"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm(prev => ({ ...prev, email: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number *
                </label>
                <input
                  required
                  placeholder="XXXXX XXXXX"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm(prev => ({ ...prev, phone: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GST Number *
                </label>
                <input
                  required
                  placeholder="Enter GST number"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  value={supplierForm.gst}
                  onChange={(e) => setSupplierForm(prev => ({ ...prev, gst: e.target.value }))}
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={closeAddSupplierModal}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingSupplier}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition flex items-center gap-2"
                >
                  <span>{isSavingSupplier ? 'Adding...' : 'Add Supplier'}</span>
                  {isSavingSupplier && (
                    <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VIEW SUPPLIER MODAL */}
      {showViewSupplierModal && viewSupplierData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Supplier Details</h3>
              <button
                onClick={closeViewSupplierModal}
                className="text-gray-400 hover:text-gray-600 transition text-2xl"
              >
                &times;
              </button>
            </div>
            
            <div className="space-y-4 text-gray-600">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Company Name</label>
                  <p className="text-gray-900 font-medium mt-1">{viewSupplierData.name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</label>
                  <p className="text-gray-900 font-medium mt-1">{viewSupplierData.email}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</label>
                  <p className="text-gray-900 font-medium mt-1">{viewSupplierData.phone}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">GST Number</label>
                  <p className="text-gray-900 font-medium mt-1">{viewSupplierData.gst}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 pt-6 border-t">
              <button
                onClick={closeViewSupplierModal}
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE PO MODAL */}
      {showCreatePOModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-3xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Create Purchase Order</h3>
                <p className="text-sm text-gray-600 mt-1">
                  Supplier: <span className="font-medium text-gray-900">{currentPO.supplierName}</span>
                </p>
              </div>
              <button
                onClick={closeCreatePOModal}
                className="text-gray-400 hover:text-gray-600 transition text-2xl"
              >
                &times;
              </button>
            </div>

            {/* ITEMS TABLE */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-lg font-medium text-gray-900">Items</h4>
                <button
                  onClick={addPOItemRow}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition flex items-center gap-2"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 3a1 1 0 00-1 1v5H4a1 1 0 100 2h5v5a1 1 0 102 0v-5h5a1 1 0 100-2h-5V4a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  Add Item
                </button>
              </div>
              
              {/* ITEMS HEADER */}
              <div className="grid grid-cols-12 gap-4 mb-2 px-3 text-sm font-medium text-gray-700">
                <div className="col-span-5">Item</div>
                <div className="col-span-2 text-center">Qty</div>
                <div className="col-span-2 text-center">Unit Price</div>
                <div className="col-span-2 text-center">Amount</div>
                <div className="col-span-1"></div>
              </div>
              
              {/* ITEMS CONTAINER */}
              <div className="space-y-2 mb-4">
                {poItems.map(item => (
                  <POItemRow key={item.id} item={item} />
                ))}
              </div>
            </div>

            {/* TOTALS */}
            <div className="border-t pt-4 mb-6">
              <div className="flex justify-end">
                <div className="w-64">
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Subtotal:</span>
                    <span>₹{poTotals.subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-gray-600 mb-1">
                    <span>Tax (18%):</span>
                    <span>₹{poTotals.tax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t">
                    <span>Total Amount:</span>
                    <span>₹{poTotals.total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* ACTIONS */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <button
                onClick={closeCreatePOModal}
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={savePO}
                disabled={isSavingPO}
                className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition flex items-center gap-2"
              >
                <span>{isSavingPO ? 'Creating...' : 'Create Purchase Order'}</span>
                {isSavingPO && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PO HISTORY MODAL */}
      {showPOHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-5xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Purchase Order History</h3>
                <p className="text-sm text-gray-600 mt-1">All purchase orders created in the system</p>
              </div>
              <button
                onClick={closePOHistory}
                className="text-gray-400 hover:text-gray-600 transition text-2xl"
              >
                &times;
              </button>
            </div>

            {/* FILTERS */}
            <div className="flex flex-col sm:flex-row gap-3 mb-6">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="Search suppliers or items..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  value={poHistorySearch}
                  onChange={(e) => setPOHistorySearch(e.target.value)}
                />
              </div>
              <select
                value={poStatusFilter}
                onChange={(e) => setPoStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white"
              >
                <option value="all">All Status</option>
                <option value="sent">Sent</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* PO HISTORY TABLE */}
            <div className="overflow-x-auto border border-gray-200 rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Supplier</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Items</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Total Amount</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Status</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Created Date</th>
                    <th className="px-4 py-3 text-left font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {isLoadingPOHistory ? (
                    <tr>
                      <td colSpan="6" className="text-center py-8">
                        <div className="flex flex-col items-center justify-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                          <p className="text-gray-500">Loading purchase orders...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPOs.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12">
                        <div className="text-gray-400 mb-4">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No purchase orders yet</h3>
                        <p className="text-gray-600 mb-4">Create your first purchase order to see it here</p>
                        <button
                          onClick={closePOHistory}
                          className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                        >
                          Start Creating POs
                        </button>
                      </td>
                    </tr>
                  ) : (
                    filteredPOs.map(po => <PORow key={po.id} po={po} />)
                  )}
                </tbody>
              </table>
            </div>

            {/* SUMMARY */}
            <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                {poHistorySummary.count} purchase orders
              </div>
              <div className="text-sm font-medium text-gray-900">
                Total: ₹{poHistorySummary.totalAmount}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PO DETAILS MODAL */}
      {showPODetailsModal && selectedPO && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">Purchase Order Details</h3>
                <p className="text-sm text-gray-600 mt-1">Supplier: {selectedPO.supplierName || 'Unknown Supplier'}</p>
              </div>
              <button
                onClick={closePODetails}
                className="text-gray-400 hover:text-gray-600 transition text-2xl"
              >
                &times;
              </button>
            </div>
            
            <div className="space-y-6">
              {/* PO Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</label>
                  <p className="text-gray-900 font-medium mt-1">{selectedPO.supplierName || 'Unknown Supplier'}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Status</label>
                  <p className="text-gray-900 font-medium mt-1">
                    {selectedPO.status === "sent" ? "Sent to Supplier" : selectedPO.status === "completed" ? "Completed" : "Sent"}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Created Date</label>
                  <p className="text-gray-900 font-medium mt-1">
                    {selectedPO.createdAt ? selectedPO.createdAt.toDate().toLocaleString('en-IN') : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Amount</label>
                  <p className="text-gray-900 font-medium mt-1">₹{selectedPO.totalAmount ? selectedPO.totalAmount.toFixed(2) : '0.00'}</p>
                </div>
              </div>
              
              {/* Items Table */}
              {selectedPO.items && selectedPO.items.length > 0 ? (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-3">Items ({selectedPO.items.length})</h4>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Item</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Quantity</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Unit Price</th>
                          <th className="px-4 py-2 text-left font-medium text-gray-700">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {selectedPO.items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-2">{item.name || 'Unnamed Item'}</td>
                            <td className="px-4 py-2">{item.quantity || 0}</td>
                            <td className="px-4 py-2">₹{item.unitPrice ? item.unitPrice.toFixed(2) : '0.00'}</td>
                            <td className="px-4 py-2 font-medium">₹{item.amount ? item.amount.toFixed(2) : '0.00'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No items in this purchase order</p>
              )}
              
              {/* Totals */}
              {(selectedPO.subtotal || selectedPO.tax) && (
                <div className="border-t pt-4">
                  <div className="flex justify-end">
                    <div className="w-64">
                      {selectedPO.subtotal && (
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Subtotal:</span>
                          <span>₹{selectedPO.subtotal.toFixed(2)}</span>
                        </div>
                      )}
                      {selectedPO.tax && (
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Tax (18%):</span>
                          <span>₹{selectedPO.tax.toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-lg font-semibold text-gray-900 pt-2 border-t">
                        <span>Total Amount:</span>
                        <span>₹{selectedPO.totalAmount ? selectedPO.totalAmount.toFixed(2) : '0.00'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex justify-end gap-3 pt-6 border-t mt-6">
              <button
                onClick={closePODetails}
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Close
              </button>
              {selectedPO.status === "sent" && (
                <button
                  onClick={() => {
                    markPOCompleted(selectedPO.id);
                    closePODetails();
                  }}
                  className="px-5 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition"
                >
                  Mark as Completed
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suppliers;