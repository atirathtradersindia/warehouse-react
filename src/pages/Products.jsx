import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  collection, 
  addDoc, 
  getDoc,
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc, 
  doc,
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { db } from '../firebase/firebase';

// ===============================
// PRODUCTS COMPONENT
// ===============================
const Products = () => {
  // ===============================
  // STATE VARIABLES
  // ===============================
  const [allProducts, setAllProducts] = useState([]);
  const [allCategories, setAllCategories] = useState([]);
  const [allBrands, setAllBrands] = useState([]);
  
  // UI State
  const [currentPageNumber, setCurrentPageNumber] = useState(1);
  const [currentCategoryFilter, setCurrentCategoryFilter] = useState('all');
  const [categoryView, setCategoryView] = useState('preview'); // preview | all
  const [brandView, setBrandView] = useState('preview'); // preview | all
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Modal States
  const [showEntityModal, setShowEntityModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  
  // Entity Modal State
  const [entityModal, setEntityModal] = useState({
    type: 'category', // 'category' or 'brand'
    mode: 'add', // 'add' or 'edit'
    id: null,
    name: ''
  });
  
  // Delete Modal State
  const [deleteModal, setDeleteModal] = useState({
    type: '', // 'product', 'category', 'brand'
    id: '',
    name: ''
  });
  
  // Toast State
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // Editing Product State
  const [editingProductId, setEditingProductId] = useState(null);
  
  // Constants
  const ITEMS_PER_PAGE = 5;

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
  // LOAD DATA
  // ===============================
  useEffect(() => {
    // Load products
    const productsUnsub = onSnapshot(
      query(collection(db, 'products'), orderBy('sku')),
      (snapshot) => {
        const products = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllProducts(products);
        setIsLoading(false);
      },
      (error) => {
        console.error('Error loading products:', error);
        showToast('Error loading products', 'error');
        setIsLoading(false);
      }
    );
    
    // Load categories
    const categoriesUnsub = onSnapshot(
      query(collection(db, 'categories'), orderBy('name')),
      (snapshot) => {
        const categories = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllCategories(categories);
      },
      (error) => {
        console.error('Error loading categories:', error);
      }
    );
    
    // Load brands
    const brandsUnsub = onSnapshot(
      query(collection(db, 'brands'), orderBy('name')),
      (snapshot) => {
        const brands = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setAllBrands(brands);
      },
      (error) => {
        console.error('Error loading brands:', error);
      }
    );
    
    return () => {
      productsUnsub();
      categoriesUnsub();
      brandsUnsub();
    };
  }, [showToast]);

  // ===============================
  // FILTERED PRODUCTS
  // ===============================
  const filteredProducts = useMemo(() => {
    let filtered = [...allProducts];
    
    // Apply search filter
    if (currentSearchTerm) {
      filtered = filtered.filter(p =>
        (p.name || '').toLowerCase().includes(currentSearchTerm) ||
        (p.sku || '').toLowerCase().includes(currentSearchTerm) ||
        (p.brand || '').toLowerCase().includes(currentSearchTerm) ||
        (p.category || '').toLowerCase().includes(currentSearchTerm)
      );
    }
    
    // Apply category filter
    if (currentCategoryFilter !== 'all') {
      filtered = filtered.filter(p => p.category === currentCategoryFilter);
    }
    
    return filtered;
  }, [allProducts, currentSearchTerm, currentCategoryFilter]);

  // ===============================
  // PAGINATION CALCULATIONS
  // ===============================
  const totalItems = filteredProducts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const currentPage = Math.min(currentPageNumber, totalPages || 1);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const pageItems = filteredProducts.slice(startIndex, endIndex);

  // ===============================
  // MODAL HANDLERS
  // ===============================
  const openEntityModal = (type, data = null) => {
    setEntityModal({
      type: type,
      mode: data ? 'edit' : 'add',
      id: data?.id || null,
      name: data?.name || ''
    });
    setShowEntityModal(true);
  };

  const closeEntityModal = () => {
    setShowEntityModal(false);
    setEntityModal({ type: 'category', mode: 'add', id: null, name: '' });
  };

  const openDeleteModal = (type, id, name) => {
    setDeleteModal({ type, id, name });
    setShowDeleteModal(true);
  };

  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteModal({ type: '', id: '', name: '' });
  };

  // ===============================
  // SAVE CATEGORY/BRAND
  // ===============================
  const handleEntitySave = async (e) => {
    e.preventDefault();
    
    const name = entityModal.name.trim();
    
    if (!name) {
      showToast('Please enter a name', 'error');
      return;
    }
    
    try {
      const collectionName = entityModal.type === 'category' ? 'categories' : 'brands';
      
      if (entityModal.mode === 'add') {
        await addDoc(collection(db, collectionName), {
          name: name,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        });
        showToast(`${entityModal.type.charAt(0).toUpperCase() + entityModal.type.slice(1)} added successfully`, 'success');
      } else {
        await updateDoc(doc(db, collectionName, entityModal.id), {
          name: name,
          updatedAt: Timestamp.now()
        });
        showToast(`${entityModal.type.charAt(0).toUpperCase() + entityModal.type.slice(1)} updated successfully`, 'success');
      }
      
      closeEntityModal();
    } catch (error) {
      console.error(`Error saving ${entityModal.type}:`, error);
      showToast(`Failed to save ${entityModal.type}`, 'error');
    }
  };

  // ===============================
  // DELETE HANDLER
  // ===============================
  const handleDelete = async () => {
    try {
      let collectionName = '';
      
      switch (deleteModal.type) {
        case 'product':
          collectionName = 'products';
          break;
        case 'category':
          collectionName = 'categories';
          break;
        case 'brand':
          collectionName = 'brands';
          break;
        default:
          return;
      }
      
      await deleteDoc(doc(db, collectionName, deleteModal.id));
      showToast(`${deleteModal.type.charAt(0).toUpperCase() + deleteModal.type.slice(1)} deleted successfully`, 'success');
      closeDeleteModal();
    } catch (error) {
      console.error(`Error deleting ${deleteModal.type}:`, error);
      showToast(`Failed to delete ${deleteModal.type}`, 'error');
    }
  };

  // ===============================
  // NAVIGATION
  // ===============================
  const navigateToAddProduct = (productId = null) => {
    setEditingProductId(productId);
    window.location.hash = productId ? `#/addProduct?edit=${productId}` : '#/addProduct';
  };

  // ===============================
  // RENDER PRODUCTS TABLE
  // ===============================
  const renderProductsTable = () => {
    if (isLoading) {
      return (
        <tr>
          <td colSpan="8" className="px-6 py-8 text-center text-slate-500">
            Loading products...
          </td>
        </tr>
      );
    }
    
    if (totalItems === 0) {
      return (
        <tr>
          <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
            No products found.
          </td>
        </tr>
      );
    }

    return pageItems.map(product => (
      <tr key={product.id} className="hover:bg-slate-50 transition-colors duration-150 border-b border-slate-100">
        <td className="px-4 py-3 text-sm font-medium text-gray-900 whitespace-nowrap">{product.sku || 'N/A'}</td>
        <td className="px-4 py-3 text-sm whitespace-nowrap">{product.name || 'Unnamed'}</td>
        <td className="px-4 py-3 text-sm whitespace-nowrap">{product.category || 'Uncategorized'}</td>
        <td className="px-4 py-3 text-sm whitespace-nowrap">{product.brand || 'No Brand'}</td>
        <td className="px-4 py-3 text-sm whitespace-nowrap">{product.unit || 'N/A'}</td>
        <td className="px-4 py-3 text-sm whitespace-nowrap">{product.minStock || 0}</td>
        <td className="px-4 py-3 whitespace-nowrap">
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
            product.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {product.status || 'Active'}
          </span>
        </td>
        <td className="px-4 py-3 space-x-3 whitespace-nowrap">
          <button
            onClick={() => navigateToAddProduct(product.id)}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm"
          >
            Edit
          </button>
          <button
            onClick={() => openDeleteModal('product', product.id, product.name)}
            className="text-red-500 hover:text-red-700 font-medium text-sm"
          >
            Delete
          </button>
        </td>
      </tr>
    ));
  };

  // ===============================
  // RENDER PAGINATION CONTROLS
  // ===============================
  const renderPaginationControls = () => {
    if (totalItems === 0) return null;
    
    const start = totalItems === 0 ? 0 : startIndex + 1;
    const end = Math.min(endIndex, totalItems);
    
    const buttons = [];
    for (let i = 1; i <= totalPages; i++) {
      buttons.push(
        <button
          key={i}
          className={`px-3 py-1 rounded-lg border text-sm ${
            i === currentPage
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white hover:bg-gray-100 border-gray-300'
          }`}
          onClick={() => setCurrentPageNumber(i)}
        >
          {i}
        </button>
      );
    }
    
    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="text-sm text-gray-600">
          Showing {start}-{end} of {totalItems} entries
        </p>
        <div className="flex gap-2">
          {buttons}
        </div>
      </div>
    );
  };

  // ===============================
  // RENDER CATEGORIES LIST (REUSABLE)
  // ===============================
  const renderCategoriesList = (limit = false) => {
    if (allCategories.length === 0) {
      return <div className="p-4 border rounded-lg"><p className="text-slate-500">No categories found</p></div>;
    }
    
    const list = limit ? allCategories.slice(0, 3) : allCategories;
    
    return (
      <div className={`space-y-4 ${!limit ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : ''}`}>
        {list.map(category => {
          // Count products in this category
          const productCount = allProducts.filter(p => p.category === category.name).length;
          
          return (
            <div 
              key={category.id} 
              className={`bg-white border rounded-lg hover:bg-slate-50 transition-colors ${!limit ? 'p-5' : 'p-4'}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-slate-900 text-lg mb-1">{category.name}</p>
                  <p className="text-sm text-slate-500">
                    {productCount} product{productCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="space-x-3">
                  <button
                    onClick={() => openEntityModal('category', category)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteModal('category', category.id, category.name)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ===============================
  // RENDER BRANDS LIST (REUSABLE)
  // ===============================
  const renderBrandsList = (limit = false) => {
    if (allBrands.length === 0) {
      return <div className="p-4 border rounded-lg"><p className="text-slate-500">No brands found</p></div>;
    }
    
    const list = limit ? allBrands.slice(0, 4) : allBrands;
    
    return (
      <div className={`space-y-4 ${!limit ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'grid grid-cols-1 md:grid-cols-2 gap-4'}`}>
        {list.map(brand => {
          // Count products in this brand
          const productCount = allProducts.filter(p => p.brand === brand.name).length;
          
          return (
            <div 
              key={brand.id} 
              className={`bg-white border rounded-lg hover:bg-slate-50 transition-colors ${!limit ? 'p-5' : 'p-4'}`}
            >
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold text-slate-900 text-lg mb-1">{brand.name}</p>
                  <p className="text-sm text-slate-500">
                    {productCount} product{productCount !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="space-x-3">
                  <button
                    onClick={() => openEntityModal('brand', brand)}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => openDeleteModal('brand', brand.id, brand.name)}
                    className="text-red-500 hover:text-red-700 text-sm font-medium"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // ===============================
  // ALL CATEGORIES PAGE VIEW
  // ===============================
  if (categoryView === 'all') {
    return (
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">All Categories</h1>
          <button
            onClick={() => setCategoryView('preview')}
            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
          >
            <span>←</span> Back to Products
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderCategoriesList(false)}
          </div>
        </div>

        {/* Entity Modal (Category/Brand) */}
        {showEntityModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {entityModal.mode === 'add' ? 'Add' : 'Edit'} {entityModal.type.charAt(0).toUpperCase() + entityModal.type.slice(1)}
                </h3>
                <button
                  onClick={closeEntityModal}
                  className="text-gray-400 hover:text-gray-600 transition text-2xl"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleEntitySave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {entityModal.type === 'category' ? 'Category Name *' : 'Brand Name *'}
                  </label>
                  <input
                    type="text"
                    value={entityModal.name}
                    onChange={(e) => setEntityModal({...entityModal, name: e.target.value})}
                    placeholder={entityModal.type === 'category' ? 'Enter category name' : 'Enter brand name'}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={closeEntityModal}
                    className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                  >
                    {entityModal.mode === 'add' ? 'Add' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Confirm Delete</h3>
                <button
                  onClick={closeDeleteModal}
                  className="text-gray-400 hover:text-gray-600 transition text-2xl"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600">
                  Are you sure you want to delete <span className="font-semibold text-gray-900">{deleteModal.name}</span>?
                </p>
                <p className="text-sm text-red-600">
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  onClick={closeDeleteModal}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===============================
  // ALL BRANDS PAGE VIEW
  // ===============================
  if (brandView === 'all') {
    return (
      <div className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-slate-900">All Brands</h1>
          <button
            onClick={() => setBrandView('preview')}
            className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center gap-2"
          >
            <span>←</span> Back to Products
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {renderBrandsList(false)}
          </div>
        </div>

        {/* Entity Modal (Category/Brand) */}
        {showEntityModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">
                  {entityModal.mode === 'add' ? 'Add' : 'Edit'} {entityModal.type.charAt(0).toUpperCase() + entityModal.type.slice(1)}
                </h3>
                <button
                  onClick={closeEntityModal}
                  className="text-gray-400 hover:text-gray-600 transition text-2xl"
                >
                  &times;
                </button>
              </div>

              <form onSubmit={handleEntitySave} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    {entityModal.type === 'category' ? 'Category Name *' : 'Brand Name *'}
                  </label>
                  <input
                    type="text"
                    value={entityModal.name}
                    onChange={(e) => setEntityModal({...entityModal, name: e.target.value})}
                    placeholder={entityModal.type === 'category' ? 'Enter category name' : 'Enter brand name'}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t">
                  <button
                    type="button"
                    onClick={closeEntityModal}
                    className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                  >
                    {entityModal.mode === 'add' ? 'Add' : 'Update'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900">Confirm Delete</h3>
                <button
                  onClick={closeDeleteModal}
                  className="text-gray-400 hover:text-gray-600 transition text-2xl"
                >
                  &times;
                </button>
              </div>

              <div className="space-y-4">
                <p className="text-gray-600">
                  Are you sure you want to delete <span className="font-semibold text-gray-900">{deleteModal.name}</span>?
                </p>
                <p className="text-sm text-red-600">
                  This action cannot be undone.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  onClick={closeDeleteModal}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ===============================
  // MAIN RENDER (PRODUCTS PAGE)
  // ===============================
  return (
    <div className="mb-6">
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

      <h1 className="text-2xl font-bold mb-4">Products</h1>

      {/* Search and Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[180px] sm:min-w-[240px] md:min-w-[300px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search products, SKU..."
            value={currentSearchTerm}
            onChange={(e) => setCurrentSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm bg-white text-gray-800 border border-gray-300 rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <select
          value={currentCategoryFilter}
          onChange={(e) => setCurrentCategoryFilter(e.target.value)}
          className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[150px]"
        >
          <option value="all">All Categories</option>
          {allCategories.map(cat => (
            <option key={cat.id} value={cat.name}>
              {cat.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => navigateToAddProduct()}
          className="px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition whitespace-nowrap"
        >
          + Add Product
        </button>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-md mb-4 border-t-4 border-blue-600 overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead className="bg-blue-600 border-b border-slate-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide whitespace-nowrap">SKU</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide whitespace-nowrap">Product Name</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide whitespace-nowrap">Category</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide whitespace-nowrap">Brand</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide whitespace-nowrap">Unit</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide whitespace-nowrap">Min Stock</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide whitespace-nowrap">Status</th>
              <th className="px-6 py-3 text-left text-xs font-semibold text-white uppercase tracking-wide whitespace-nowrap">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {renderProductsTable()}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 mb-8">
        {renderPaginationControls()}
      </div>

      {/* Categories Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Categories</h2>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-blue-600">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Add New Category</h3>
            <button
              onClick={() => openEntityModal('category')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              + Add Category
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-blue-600">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Existing Categories</h3>
            <div className="space-y-4">
              {renderCategoriesList(true)}
            </div>
            
            {allCategories.length > 3 && (
              <div className="mt-4">
                <button
                  onClick={() => setCategoryView('all')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All Categories ({allCategories.length})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Brands Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">Brands</h2>
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-blue-600">
            <h3 className="text-lg font-semibold text-slate-900 mb-6">Add New Brand</h3>
            <button
              onClick={() => openEntityModal('brand')}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              + Add Brand
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6 border-t-4 border-blue-600">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Existing Brands</h3>
            <div className="space-y-4">
              {renderBrandsList(true)}
            </div>
            
            {allBrands.length > 4 && (
              <div className="mt-4">
                <button
                  onClick={() => setBrandView('all')}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  View All Brands ({allBrands.length})
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ===============================
      // MODALS
      // =============================== */}

      {/* Entity Modal (Category/Brand) */}
      {showEntityModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {entityModal.mode === 'add' ? 'Add' : 'Edit'} {entityModal.type.charAt(0).toUpperCase() + entityModal.type.slice(1)}
              </h3>
              <button
                onClick={closeEntityModal}
                className="text-gray-400 hover:text-gray-600 transition text-2xl"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleEntitySave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {entityModal.type === 'category' ? 'Category Name *' : 'Brand Name *'}
                </label>
                <input
                  type="text"
                  value={entityModal.name}
                  onChange={(e) => setEntityModal({...entityModal, name: e.target.value})}
                  placeholder={entityModal.type === 'category' ? 'Enter category name' : 'Enter brand name'}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  required
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t">
                <button
                  type="button"
                  onClick={closeEntityModal}
                  className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                >
                  {entityModal.mode === 'add' ? 'Add' : 'Update'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Confirm Delete</h3>
              <button
                onClick={closeDeleteModal}
                className="text-gray-400 hover:text-gray-600 transition text-2xl"
              >
                &times;
              </button>
            </div>

            <div className="space-y-4">
              <p className="text-gray-600">
                Are you sure you want to delete <span className="font-semibold text-gray-900">{deleteModal.name}</span>?
              </p>
              <p className="text-sm text-red-600">
                This action cannot be undone.
              </p>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <button
                onClick={closeDeleteModal}
                className="px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ===============================
// ADD PRODUCT COMPONENT (UNCHANGED)
// ===============================
export const AddProduct = ({ productId = null }) => {
  const [allCategories, setAllCategories] = useState([]);
  const [allBrands, setAllBrands] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  
  // Form State
  const [formData, setFormData] = useState({
    sku: '',
    name: '',
    category: '',
    brand: '',
    unit: 'kg',
    stock: 0,
    minStock: 10,
    price: 0,
    warehouse: 'Main Warehouse',
    expiryDate: '',
    description: ''
  });

  // ===============================
  // LOAD CATEGORIES AND BRANDS
  // ===============================
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      
      // Load categories
      const categoriesUnsub = onSnapshot(
        query(collection(db, 'categories'), orderBy('name')),
        (snapshot) => {
          const categories = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setAllCategories(categories);
        },
        (error) => {
          console.error('Error loading categories:', error);
        }
      );
      
      // Load brands
      const brandsUnsub = onSnapshot(
        query(collection(db, 'brands'), orderBy('name')),
        (snapshot) => {
          const brands = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setAllBrands(brands);
        },
        (error) => {
          console.error('Error loading brands:', error);
        }
      );
      
      // Load product data if editing
      if (productId) {
        try {
          const productSnap = await getDoc(doc(db, 'products', productId));
          if (productSnap.exists()) {
            const product = productSnap.data();
            setFormData({
              sku: product.sku || '',
              name: product.name || '',
              category: product.category || '',
              brand: product.brand || '',
              unit: product.unit || 'kg',
              stock: product.stock || 0,
              minStock: product.minStock || 10,
              price: product.price || 0,
              warehouse: product.warehouse || 'Main Warehouse',
              expiryDate: product.expiryDate || '',
              description: product.description || ''
            });
          }
        } catch (error) {
          console.error('Error loading product:', error);
        }
      }
      
      setIsLoading(false);
      
      return () => {
        categoriesUnsub();
        brandsUnsub();
      };
    };
    
    loadData();
  }, [productId]);

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
  // FORM HANDLING
  // ===============================
  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.sku.trim() || !formData.name.trim() || !formData.category || !formData.brand.trim()) {
      showToast('Please fill in all required fields', 'error');
      return;
    }

    try {
      const product = {
        sku: formData.sku.trim(),
        name: formData.name.trim(),
        category: formData.category,
        brand: formData.brand.trim(),
        unit: formData.unit,
        stock: Number(formData.stock),
        minStock: Number(formData.minStock),
        price: Number(formData.price),
        warehouse: formData.warehouse,
        expiryDate: formData.expiryDate || null,
        description: formData.description.trim(),
        status: 'Active',
        updatedAt: Timestamp.now()
      };

      if (productId) {
        await updateDoc(doc(db, 'products', productId), product);
        showToast('Product updated successfully!', 'success');
      } else {
        product.createdAt = Timestamp.now();
        await addDoc(collection(db, 'products'), product);
        showToast('Product added successfully!', 'success');
      }
      
      // Navigate back to products list
      window.location.hash = '#/products';
      
    } catch (error) {
      console.error('Error saving product:', error);
      showToast('Failed to save product', 'error');
    }
  };

  // ===============================
  // NAVIGATION
  // ===============================
  const navigateToProducts = () => {
    window.location.hash = '#/products';
  };

  if (isLoading) {
    return (
      <div className="mb-6">
        <h1 className="text-2xl font-bold mb-4">{productId ? 'Edit Product' : 'Add New Product'}</h1>
        <div className="bg-white rounded-xl shadow-md p-6 max-w-4xl border-t-4 border-blue-600">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mb-6">
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

      <h1 className="text-2xl font-bold mb-4">{productId ? 'Edit Product' : 'Add New Product'}</h1>
      
      <div className="bg-white rounded-xl shadow-md p-6 max-w-4xl border-t-4 border-blue-600">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
            <input
              id="sku"
              type="text"
              value={formData.sku}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g., SKU-1005"
              required
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="e.g., Basmati Rice"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Category *</label>
            <select
              id="category"
              value={formData.category}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            >
              <option value="">Select Category</option>
              {allCategories.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Brand *</label>
            <select
              id="brand"
              value={formData.brand}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            >
              <option value="">Select Brand</option>
              {allBrands.map(brand => (
                <option key={brand.id} value={brand.name}>{brand.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Unit *</label>
            <select
              id="unit"
              value={formData.unit}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            >
              <option value="kg">kg</option>
              <option value="g">g</option>
              <option value="pcs">pcs</option>
              <option value="liter">liter</option>
              <option value="pack">pack</option>
              <option value="box">box</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock *</label>
            <input
              id="stock"
              type="number"
              value={formData.stock}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="0"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock *</label>
            <input
              id="minStock"
              type="number"
              value={formData.minStock}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="10"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹) *</label>
            <input
              id="price"
              type="number"
              step="0.01"
              value={formData.price}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="0.00"
              min="0"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse *</label>
            <select
              id="warehouse"
              value={formData.warehouse}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              required
            >
              <option value="">Select Warehouse</option>
              <option value="Main Warehouse">Main Warehouse</option>
              <option value="North Branch">North Branch</option>
              <option value="South Branch">South Branch</option>
              <option value="East Branch">East Branch</option>
              <option value="West Branch">West Branch</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Expiry Date</label>
            <input
              id="expiryDate"
              type="date"
              value={formData.expiryDate}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              id="description"
              rows="3"
              value={formData.description}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="Product description..."
            />
          </div>

          <div className="md:col-span-2 flex justify-end space-x-3 pt-4 border-t">
            <button
              type="button"
              onClick={navigateToProducts}
              className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
            >
              {productId ? 'Update Product' : 'Save Product'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Products;