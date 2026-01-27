import React, { useState, useEffect, useMemo } from 'react';

// ===============================
// LOW STOCK COMPONENT
// ===============================
const LowStock = () => {
  // ===============================
  // STATE VARIABLES
  // ===============================
  const [allLowStockData, setAllLowStockData] = useState([]);
  const [filteredLowStockData, setFilteredLowStockData] = useState([]);
  const [currentSearchTerm, setCurrentSearchTerm] = useState('');
  const [currentWarehouseFilter, setCurrentWarehouseFilter] = useState('all');
  const [lowStockPage, setLowStockPage] = useState(1);
  const LOWSTOCK_PER_PAGE = 5;

  // ===============================
  // MOCK DATA (Replace with Firestore data later)
  // ===============================
  const mockData = useMemo(() => [
    { sku: 'SKU-1003', product: 'Red Chili Powder', warehouse: 'Warehouse B', available: 40, min: 50 },
    { sku: 'SKU-1004', product: 'Turmeric Powder', warehouse: 'Warehouse B', available: 18, min: 50 },
    { sku: 'SKU-1011', product: 'Sugar', warehouse: 'Warehouse A', available: 22, min: 100 },
    { sku: 'SKU-1015', product: 'Salt', warehouse: 'Warehouse C', available: 10, min: 60 },
    { sku: 'SKU-1020', product: 'Rice', warehouse: 'Warehouse A', available: 45, min: 200 },
    { sku: 'SKU-1021', product: 'Wheat Flour', warehouse: 'Warehouse B', available: 30, min: 120 },
    { sku: 'SKU-1022', product: 'Olive Oil', warehouse: 'Warehouse C', available: 8, min: 30 },
    { sku: 'SKU-1023', product: 'Cooking Oil', warehouse: 'Warehouse A', available: 15, min: 40 }
  ], []);

  // ===============================
  // INITIALIZE DATA
  // ===============================
  useEffect(() => {
    setAllLowStockData(mockData);
    applyLowStockFilters(mockData, '', 'all', 1);
  }, [mockData]);

  // ===============================
  // APPLY FILTERS WITH PAGINATION
  // ===============================
  const applyLowStockFilters = (data, searchTerm, warehouseFilter, page) => {
    let filtered = [...data];
    
    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(item => {
        return (
          (item.sku && item.sku.toLowerCase().includes(searchTerm)) ||
          (item.product && item.product.toLowerCase().includes(searchTerm))
        );
      });
    }
    
    // Apply warehouse filter
    if (warehouseFilter !== 'all') {
      filtered = filtered.filter(item => 
        item.warehouse === warehouseFilter
      );
    }
    
    setFilteredLowStockData(filtered);
    setLowStockPage(1); // Reset to first page when filters change
  };

  // ===============================
  // APPLY FILTERS WHEN SEARCH OR FILTER CHANGES
  // ===============================
  useEffect(() => {
    if (allLowStockData.length > 0) {
      applyLowStockFilters(allLowStockData, currentSearchTerm, currentWarehouseFilter, 1);
    }
  }, [allLowStockData, currentSearchTerm, currentWarehouseFilter]);

  // ===============================
  // RENDER LOW STOCK ROW
  // ===============================
  const renderLowStockRow = (item) => {
    const isCritical = item.available <= (item.min * 0.2);
    const isWarning = item.available <= (item.min * 0.5);
    const status = isCritical ? 'Critical' : isWarning ? 'Warning' : 'Low';
    
    return (
      <tr key={`${item.sku}-${item.warehouse}`} className={`hover:bg-gray-50 ${isCritical ? 'bg-white-50' : isWarning ? 'bg-white-50' : ''}`}>
        <td className="px-6 py-4 text-sm font-mono text-gray-900">{item.sku}</td>
        <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.product}</td>
        <td className="px-6 py-4 text-sm text-gray-600">{item.warehouse}</td>
        <td className={`px-6 py-4 text-sm ${isCritical ? 'text-red-600' : isWarning ? 'text-yellow-600' : 'text-gray-900'} font-bold`}>
          {item.available}
        </td>
        <td className="px-6 py-4 text-sm text-gray-600">{item.min}</td>
        <td className="px-6 py-4">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            isCritical ? 'bg-red-100 text-red-800' :
            isWarning ? 'bg-yellow-100 text-yellow-800' :
            'bg-green-100 text-green-800'
          }`}>
            {status}
          </span>
        </td>
        <td className="px-6 py-4 text-sm">
          <button
            onClick={() => window.location.hash = '#/stockIn'}
            className="text-blue-600 hover:underline font-medium"
          >
            Add Stock
          </button>
        </td>
      </tr>
    );
  };

  // ===============================
  // PAGINATION CALCULATIONS
  // ===============================
  const totalItems = filteredLowStockData.length;
  const totalPages = Math.ceil(totalItems / LOWSTOCK_PER_PAGE);
  const currentPage = Math.min(lowStockPage, totalPages || 1);
  const startIndex = (currentPage - 1) * LOWSTOCK_PER_PAGE;
  const endIndex = startIndex + LOWSTOCK_PER_PAGE;
  const pageItems = filteredLowStockData.slice(startIndex, endIndex);

  // ===============================
  // PAGINATION COMPONENT
  // ===============================
  const renderLowStockPagination = () => {
    const startDisplay = totalItems === 0 ? 0 : startIndex + 1;
    const endDisplay = Math.min(endIndex, totalItems);

    const changePage = (page) => {
      if (page < 1 || page > totalPages) return;
      setLowStockPage(page);
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
    setCurrentSearchTerm(e.target.value.toLowerCase().trim());
  };

  // ===============================
  // WAREHOUSE FILTER HANDLER
  // ===============================
  const handleWarehouseFilterChange = (e) => {
    setCurrentWarehouseFilter(e.target.value);
  };

  // ===============================
  // EXPORT TO CSV FUNCTION
  // ===============================
  const exportLowStockCSV = () => {
    if (filteredLowStockData.length === 0) {
      alert('No data to export.');
      return;
    }

    const csv = [
      'SKU,Product,Warehouse,Available Quantity,Minimum Quantity,Status'
    ].concat(
      filteredLowStockData.map(item => {
        const isCritical = item.available <= (item.min * 0.2);
        const isWarning = item.available <= (item.min * 0.5);
        const status = isCritical ? 'Critical' : isWarning ? 'Warning' : 'Low';
        
        return `"${item.sku}","${item.product}","${item.warehouse}","${item.available}","${item.min}","${status}"`;
      })
    ).join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `low-stock-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  // ===============================
  // REFRESH LOW STOCK DATA
  // ===============================
  const refreshLowStockTable = () => {
    // For now, we'll just re-apply filters
    applyLowStockFilters(allLowStockData, currentSearchTerm, currentWarehouseFilter, 1);
    alert('Low stock data refreshed!');
  };

  // ===============================
  // APPLY FILTER BUTTON HANDLER
  // ===============================
  const handleApplyFilter = () => {
    // Already handled by useEffect, but we can keep it for UI consistency
    applyLowStockFilters(allLowStockData, currentSearchTerm, currentWarehouseFilter, 1);
  };

  // ===============================
  // MAIN RENDER
  // ===============================
  return (
    <div>
      {/* PAGE TITLE */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Low Stock Items</h1>
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
        {/* LEFT: Search + Warehouse Filter */}
        <div className="flex flex-col sm:flex-row gap-3 flex-1">
          <input
            id="lowStockSearch"
            type="text"
            placeholder="Search SKU / Product..."
            className="px-4 py-2 border border-gray-300 rounded-lg w-full sm:w-64 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={currentSearchTerm}
            onChange={handleSearchChange}
          />

          <select
            id="warehouseFilter"
            className="px-4 py-2 border border-gray-300 rounded-lg w-full sm:w-48 focus:ring-2 focus:ring-blue-500 focus:outline-none"
            value={currentWarehouseFilter}
            onChange={handleWarehouseFilterChange}
          >
            <option value="all">All Warehouses</option>
            <option value="Warehouse A">Warehouse A</option>
            <option value="Warehouse B">Warehouse B</option>
            <option value="Warehouse C">Warehouse C</option>
          </select>
        </div>

        {/* RIGHT: Buttons */}
        <div className="flex items-center gap-3">
          <button
            id="lowStockFilterBtn"
            className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition"
            onClick={handleApplyFilter}
          >
            <i className="fas fa-filter mr-2"></i> Apply Filter
          </button>
          
          <button
            id="lowStockExportBtn"
            className="px-5 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition"
            onClick={exportLowStockCSV}
          >
            <i className="fas fa-download mr-2"></i> Export CSV
          </button>

          <button
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition whitespace-nowrap"
            onClick={refreshLowStockTable}
          >
            <i className="fas fa-sync-alt mr-2"></i> Refresh
          </button>
        </div>
      </div>

      {/* LOW STOCK TABLE */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-blue-600 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">SKU</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Warehouse</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Available Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Min Qty</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-white uppercase">Action</th>
              </tr>
            </thead>
            <tbody id="lowStockTableBody">
              {totalItems === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-8 text-center text-gray-500">
                    No low stock items found. {(currentSearchTerm || currentWarehouseFilter !== 'all') ? 'Try changing your filters.' : 'All items are above minimum stock levels.'}
                  </td>
                </tr>
              ) : (
                pageItems.map(renderLowStockRow)
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200">
          {renderLowStockPagination()}
        </div>
      </div>
    </div>
  );
};

export default LowStock;