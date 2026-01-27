import React, { useState, useEffect, useCallback, useMemo } from 'react';

// ===============================
// EXPIRY ALERTS COMPONENT
// ===============================
const ExpiryAlerts = () => {
  // ===============================
  // STATE VARIABLES
  // ===============================
  const [allExpiryData, setAllExpiryData] = useState([]);
  const [filteredExpiryData, setFilteredExpiryData] = useState([]);
  const [expirySearchTerm, setExpirySearchTerm] = useState('');
  const [expiryStatusFilter, setExpiryStatusFilter] = useState('all');
  const [expiryPage, setExpiryPage] = useState(1);
  const [toast, setToast] = useState({ show: false, message: '', type: 'info' });
  const EXPIRY_PER_PAGE = 5;

  // ===============================
  // HELPER FUNCTIONS
  // ===============================
  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const getDateString = (daysOffset) => {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString().split('T')[0]; // YYYY-MM-DD format
  };

  const isRelevantExpiry = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const diffDays = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    return diffDays >= -30 && diffDays <= 30;
  };

  const calculateStatusAndDays = (expiryDate) => {
    const today = new Date();
    const expiry = new Date(expiryDate);
    const daysLeft = Math.ceil((expiry - today) / (1000 * 60 * 60 * 24));
    
    let status = 'warning';
    let statusText = 'Warning';
    let statusClass = 'bg-yellow-100 text-yellow-700';
    let daysClass = 'text-yellow-600';
    
    if (daysLeft < 0) {
      status = 'expired';
      statusText = 'Expired';
      statusClass = 'bg-red-100 text-red-700';
      daysClass = 'text-red-600';
    } else if (daysLeft <= 7) {
      status = 'critical';
      statusText = 'Critical';
      statusClass = 'bg-orange-100 text-orange-700';
      daysClass = 'text-orange-600';
    }
    
    return { daysLeft, status, statusText, statusClass, daysClass };
  };

  // ===============================
  // DEMO DATA (Replace with Firebase data later)
  // ===============================
  const getDemoExpiryData = useCallback(() => {
    const rawExpiryData = [
      // Recently expired (within last 30 days)
      ['SKU-1020', 'Cooking Oil', 'BATCH-2024-045', '12 L', getDateString(-5)],
      ['SKU-1003', 'Red Chili Powder', 'BATCH-2024-033', '85 kg', getDateString(-10)],
      ['SKU-1012', 'Dry Fruits Mix', 'BATCH-2024-018', '25 kg', getDateString(-20)],
      
      // Critical (expiring within 7 days)
      ['SKU-1015', 'Sunflower Oil', 'BATCH-2024-021', '50 L', getDateString(3)],
      ['SKU-1008', 'Basmati Rice', 'BATCH-2024-029', '200 kg', getDateString(6)],
      
      // Warning (expiring within 30 days)
      ['SKU-1025', 'Wheat Flour', 'BATCH-2024-012', '150 kg', getDateString(12)],
      ['SKU-1018', 'Sugar', 'BATCH-2024-025', '100 kg', getDateString(18)],
      ['SKU-1030', 'Tea Powder', 'BATCH-2024-030', '75 kg', getDateString(25)],
      ['SKU-1035', 'Coffee Beans', 'BATCH-2024-035', '60 kg', getDateString(30)],
    ];
    
    return rawExpiryData
      .filter(item => isRelevantExpiry(item[4]))
      .map(([sku, product, batch, qty, expiry]) => {
        const { status } = calculateStatusAndDays(expiry);
        return { sku, product, batch, qty, expiry, status };
      });
  }, []);

  // ===============================
  // FETCH DATA
  // ===============================
  const fetchExpiryData = useCallback(async () => {
    // For now, use demo data. Replace with Firebase fetch later
    const data = getDemoExpiryData();
    setAllExpiryData(data);
    applyExpiryFilters(data, '', 'all');
    
    // Calculate summary counts
    const expiredCount = data.filter(item => item.status === 'expired').length;
    const criticalCount = data.filter(item => item.status === 'critical').length;
    const warningCount = data.filter(item => item.status === 'warning').length;
    
    // Update counts in state if needed, or just calculate on render
    return { expiredCount, criticalCount, warningCount };
  }, [getDemoExpiryData]);

  // ===============================
  // APPLY FILTERS
  // ===============================
  const applyExpiryFilters = useCallback((data, searchTerm, statusFilter) => {
    let filtered = [...data];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => {
        return (
          item.sku.toLowerCase().includes(searchTerm) ||
          item.product.toLowerCase().includes(searchTerm) ||
          item.batch.toLowerCase().includes(searchTerm)
        );
      });
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === statusFilter);
    }
    
    setFilteredExpiryData(filtered);
    setExpiryPage(1); // Reset to first page when filters change
  }, []);

  // ===============================
  // TRIGGER NOTIFICATIONS
  // ===============================
  const triggerExpiryNotifications = useCallback((expiryItems) => {
    // This would connect to your notification system
    console.log('Triggering notifications for:', expiryItems.length, 'items');
    
    // Count critical and expired items
    const criticalItems = expiryItems.filter(item => {
      const { daysLeft } = calculateStatusAndDays(item.expiry);
      return daysLeft <= 7 || daysLeft < 0;
    });
    
    if (criticalItems.length > 0) {
      showToast(`Found ${criticalItems.length} critical/expired items requiring attention`, 'warning');
    }
  }, []);

  // ===============================
  // TOAST NOTIFICATION
  // ===============================
  const showToast = useCallback((message, type = 'info') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: 'info' });
    }, 3000);
  }, []);

  // ===============================
  // INITIALIZE DATA
  // ===============================
  useEffect(() => {
    fetchExpiryData().then(({ expiredCount, criticalCount, warningCount }) => {
      // Data is already set, we could store counts if needed
    });
  }, [fetchExpiryData]);

  // ===============================
  // APPLY FILTERS WHEN SEARCH OR FILTER CHANGES
  // ===============================
  useEffect(() => {
    if (allExpiryData.length > 0) {
      applyExpiryFilters(allExpiryData, expirySearchTerm, expiryStatusFilter);
    }
  }, [allExpiryData, expirySearchTerm, expiryStatusFilter, applyExpiryFilters]);

  // ===============================
  // RENDER EXPIRY ROW
  // ===============================
  const renderExpiryRow = (item) => {
    const { daysLeft, statusText, statusClass, daysClass } = calculateStatusAndDays(item.expiry);
    const daysText = daysLeft < 0 ? `${Math.abs(daysLeft)}d ago` : `${daysLeft}d`;
    
    return (
      <tr key={`${item.sku}-${item.batch}`} className="hover:bg-gray-50">
        {/* STATUS */}
        <td className="px-6 py-4">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${statusClass}`}>
            {statusText}
          </span>
        </td>
        
        {/* SKU */}
        <td className="px-6 py-4 text-sm font-mono text-gray-900 font-medium">{item.sku}</td>
        
        {/* PRODUCT */}
        <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.product}</td>
        
        {/* BATCH */}
        <td className="px-6 py-4 text-sm text-gray-600">{item.batch}</td>
        
        {/* QUANTITY */}
        <td className="px-6 py-4 text-sm text-gray-600">{item.qty}</td>
        
        {/* EXPIRY DATE */}
        <td className={`px-6 py-4 text-sm ${daysClass}`}>
          {formatDate(item.expiry)}
        </td>
        
        {/* DAYS LEFT */}
        <td className={`px-6 py-4 text-sm font-bold ${daysClass}`}>
          {daysText}
        </td>
        
        {/* ACTIONS */}
        <td className="px-6 py-4 text-sm">
          <button
            onClick={() => viewBatchDetails(item.sku, item.batch)}
            className="text-blue-600 hover:text-blue-800 font-medium mr-4 hover:underline"
          >
            View
          </button>
          <button
            onClick={() => moveToStockOut(item.sku, item.batch)}
            className="text-red-600 hover:text-red-800 font-medium hover:underline"
          >
            Move
          </button>
        </td>
      </tr>
    );
  };

  // ===============================
  // ACTION FUNCTIONS
  // ===============================
  const moveToStockOut = (sku, batch) => {
    showToast(`Moving ${sku} - ${batch} to Stock Out`, 'info');
    // In actual app, this would open Stock Out modal with pre-filled data
  };

  const viewBatchDetails = (sku, batch) => {
    showToast(`Viewing details for ${sku} - ${batch}`, 'info');
    // In actual app, this would open a modal with batch details
  };

  // ===============================
  // PAGINATION CALCULATIONS
  // ===============================
  const totalItems = filteredExpiryData.length;
  const totalPages = Math.ceil(totalItems / EXPIRY_PER_PAGE);
  const currentPage = Math.min(expiryPage, totalPages || 1);
  const startIndex = (currentPage - 1) * EXPIRY_PER_PAGE;
  const endIndex = startIndex + EXPIRY_PER_PAGE;
  const pageItems = filteredExpiryData.slice(startIndex, endIndex);

  // ===============================
  // CALCULATE SUMMARY COUNTS
  // ===============================
  const expiredCount = allExpiryData.filter(item => item.status === 'expired').length;
  const criticalCount = allExpiryData.filter(item => item.status === 'critical').length;
  const warningCount = allExpiryData.filter(item => item.status === 'warning').length;

  // ===============================
  // PAGINATION COMPONENT
  // ===============================
  const renderExpiryPagination = () => {
    const startDisplay = totalItems === 0 ? 0 : startIndex + 1;
    const endDisplay = Math.min(endIndex, totalItems);

    const changePage = (page) => {
      if (page < 1 || page > totalPages) return;
      setExpiryPage(page);
    };

    return (
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 w-full">
        <p className="text-sm text-gray-600">
          Showing {startDisplay}-{endDisplay} of {totalItems} entries
        </p>
        <div className="flex gap-2">
          <button
            className={`px-3 py-1 rounded-lg border border-gray-300 text-sm ${
              currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'
            }`}
            disabled={currentPage === 1}
            onClick={() => changePage(currentPage - 1)}
          >
            <i className="fas fa-chevron-left"></i>
          </button>
          
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(pageNum => (
            <button
              key={pageNum}
              className={`px-3 py-1 rounded-lg border text-sm ${
                currentPage === pageNum
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white hover:bg-gray-100 border-gray-300'
              }`}
              onClick={() => changePage(pageNum)}
            >
              {pageNum}
            </button>
          ))}
          
          <button
            className={`px-3 py-1 rounded-lg border border-gray-300 text-sm ${
              currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'hover:bg-gray-100'
            }`}
            disabled={currentPage === totalPages}
            onClick={() => changePage(currentPage + 1)}
          >
            <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      </div>
    );
  };

  // ===============================
  // SEARCH HANDLER
  // ===============================
  const handleSearchChange = (e) => {
    setExpirySearchTerm(e.target.value.toLowerCase().trim());
  };

  // ===============================
  // STATUS FILTER HANDLER
  // ===============================
  const handleStatusFilterChange = (e) => {
    setExpiryStatusFilter(e.target.value);
  };

  // ===============================
  // EXPORT CSV FUNCTION
  // ===============================
  const exportExpiryCSV = () => {
    if (filteredExpiryData.length === 0) {
      showToast('No data to export.', 'warning');
      return;
    }

    const csv = [
      'SKU,Product,Batch,Quantity,Expiry Date,Status,Days Left/Ago'
    ].concat(
      filteredExpiryData.map(item => {
        const { daysLeft, statusText } = calculateStatusAndDays(item.expiry);
        const daysText = daysLeft < 0 ? `${Math.abs(daysLeft)} days ago` : `${daysLeft} days left`;
        
        return `"${item.sku}","${item.product}","${item.batch}","${item.qty}","${formatDate(item.expiry)}","${statusText}","${daysText}"`;
      })
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `expiry-alerts-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    
    showToast('Expiry alerts exported successfully!', 'success');
  };

  // ===============================
  // REFRESH FUNCTION
  // ===============================
  const refreshExpiryAlerts = async () => {
    showToast('Refreshing expiry alerts...', 'info');
    
    // Fetch latest data
    const { expiredCount, criticalCount, warningCount } = await fetchExpiryData();
    
    // Trigger notifications for expiry alerts
    triggerExpiryNotifications(allExpiryData);
    
    showToast('Expiry alerts refreshed! Notifications updated.', 'success');
  };

  // ===============================
  // APPLY FILTER BUTTON HANDLER
  // ===============================
  const handleApplyFilter = () => {
    // Already handled by useEffect, but we can keep it for UI consistency
    applyExpiryFilters(allExpiryData, expirySearchTerm, expiryStatusFilter);
  };

  // ===============================
  // MAIN RENDER
  // ===============================
  return (
    <div>
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-4 right-4 px-4 py-2 rounded-lg shadow-lg z-50 ${
          toast.type === 'success' ? 'bg-green-500 text-white' : 
          toast.type === 'error' ? 'bg-red-500 text-white' : 
          toast.type === 'warning' ? 'bg-yellow-500 text-white' :
          'bg-blue-500 text-white'
        }`}>
          {toast.message}
        </div>
      )}

      {/* PAGE TITLE */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Expiry Alerts</h1>
        <p className="text-gray-600 mt-1">Monitor products expiring within the next 30 days</p>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Expired Card */}
        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-5">
          <p className="text-sm text-red-600 font-medium mb-1">Recently Expired</p>
          <p className="text-2xl font-bold text-red-700">{expiredCount} items</p>
          <p className="text-xs text-red-500 mt-2">Within last 30 days</p>
        </div>

        {/* Next 7 Days Card */}
        <div className="bg-orange-50 border-l-4 border-orange-500 rounded-lg p-5">
          <p className="text-sm text-orange-600 font-medium mb-1">Next 7 Days</p>
          <p className="text-2xl font-bold text-orange-700">{criticalCount} items</p>
          <p className="text-xs text-orange-500 mt-2">High priority items</p>
        </div>

        {/* Next 30 Days Card */}
        <div className="bg-yellow-50 border-l-4 border-yellow-500 rounded-lg p-5">
          <p className="text-sm text-yellow-600 font-medium mb-1">Next 30 Days</p>
          <p className="text-2xl font-bold text-yellow-700">{warningCount} items</p>
          <p className="text-xs text-yellow-500 mt-2">Requires planning</p>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* LEFT: SEARCH + FILTER */}
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search SKU, product or batch..."
            className="px-4 py-2.5 border border-gray-300 rounded-lg w-full sm:w-64 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={expirySearchTerm}
            onChange={handleSearchChange}
          />

          <select
            className="px-4 py-2.5 border border-gray-300 rounded-lg w-full sm:w-48 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={expiryStatusFilter}
            onChange={handleStatusFilterChange}
          >
            <option value="all">All Status</option>
            <option value="expired">Expired (last 30 days)</option>
            <option value="critical">Critical (&lt; 7 days)</option>
            <option value="warning">Warning (7-30 days)</option>
          </select>
        </div>

        {/* RIGHT: ACTIONS */}
        <div className="flex gap-2">
          <button
            className="px-4 py-2.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            onClick={handleApplyFilter}
          >
            <i className="fas fa-filter mr-2"></i> Filter
          </button>
          <button
            className="px-4 py-2.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
            onClick={exportExpiryCSV}
          >
            <i className="fas fa-download mr-2"></i> Export
          </button>
          <button
            className="px-4 py-2.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
            onClick={refreshExpiryAlerts}
          >
            <i className="fas fa-sync-alt mr-2"></i> Refresh
          </button>
        </div>
      </div>

      {/* EXPIRY ALERTS TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase whitespace-nowrap">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase whitespace-nowrap">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase whitespace-nowrap">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase whitespace-nowrap">Batch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase whitespace-nowrap">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase whitespace-nowrap">Expiry Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase whitespace-nowrap">Days</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {totalItems === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <i className="fas fa-check-circle text-green-500 text-3xl mb-3"></i>
                      <h3 className="text-lg font-medium text-gray-900 mb-1">
                        {expirySearchTerm ? 'No search results' : 'All Good!'}
                      </h3>
                      <p className="text-gray-600">
                        {expirySearchTerm ? 'Try a different search term' : 'No expiry alerts for the next 30 days.'}
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pageItems.map(renderExpiryRow)
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200">
          {renderExpiryPagination()}
        </div>
      </div>
      
      {/* NOTIFICATION INFO */}
      <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="text-blue-600 text-lg mr-3">💡</div>
          <div>
            <p className="text-sm text-blue-800 font-medium">Notifications Active</p>
            <p className="text-xs text-blue-600 mt-1">
              Critical and expired items will appear in the notification bell icon (🔔) at the top right.
              Click "Refresh" to update notifications.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpiryAlerts;