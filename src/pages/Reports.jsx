import React, { useState, useEffect } from 'react';

// ===============================
// REPORT DEFINITIONS
// ===============================
const REPORTS = [
  {
    icon: "📊",
    title: "Stock Report",
    color: "bg-blue-600",
    description: "Current inventory status"
  },
  {
    icon: "📈",
    title: "Inward/Outward Report",
    color: "bg-green-600",
    description: "Stock movement analysis"
  },
  {
    icon: "⏰",
    title: "Expiry Report",
    color: "bg-orange-600",
    description: "Product expiry tracking"
  },
  {
    icon: "💰",
    title: "Stock Valuation",
    color: "bg-purple-600",
    description: "Financial inventory value"
  },
  {
    icon: "🔍",
    title: "Audit Log",
    color: "bg-gray-600",
    description: "System activity tracking"
  },
  {
    icon: "⚠️",
    title: "Low Stock Report",
    color: "bg-red-600",
    description: "Inventory alerts"
  }
];

// ===============================
// MAIN REPORTS COMPONENT
// ===============================
export default function Reports() {
  const [generatedReports, setGeneratedReports] = useState([]);
  const [currentReportType, setCurrentReportType] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({});

  // Real-time data stores (you can replace these with actual Firebase data)
  const [liveCategories] = useState(['All', 'Electronics', 'Food', 'Clothing', 'Books', 'Toys']);
  const [liveWarehouses] = useState(['All', 'Main Warehouse', 'East Warehouse', 'West Warehouse', 'North Storage']);

  // Load reports from localStorage on component mount
  useEffect(() => {
    const savedReports = localStorage.getItem('generatedReports');
    if (savedReports) {
      setGeneratedReports(JSON.parse(savedReports));
    }
  }, []);

  // Save reports to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('generatedReports', JSON.stringify(generatedReports));
  }, [generatedReports]);

  // ===============================
  // FORM CONFIGURATION
  // ===============================
  const REPORT_FORM_CONFIG = {
    'Stock Report': () => (
      <>
        {dateInput('From Date', 'fromDate')}
        {dateInput('To Date', 'toDate')}
        {selectInput('Warehouse', 'warehouse', liveWarehouses)}
        {selectInput('Category', 'category', liveCategories)}
        {checkboxInput('Include Zero Stock Items', 'includeZero')}
      </>
    ),

    'Inward/Outward Report': () => (
      <>
        {dateInput('From Date', 'fromDate')}
        {dateInput('To Date', 'toDate')}
        {selectInput('Transaction Type', 'txnType', ['All', 'Inward', 'Outward'])}
        {selectInput('Warehouse', 'warehouse', liveWarehouses)}
        {selectInput('Product', 'product', ['All Products', 'Product A', 'Product B', 'Product C'])}
      </>
    ),

    'Expiry Report': () => (
      <>
        {selectInput('Expiry Within', 'expiryDays', ['7 days', '15 days', '30 days', '60 days'])}
        {selectInput('Warehouse', 'warehouse', liveWarehouses)}
        {selectInput('Category', 'category', liveCategories)}
      </>
    ),

    'Low Stock Report': () => (
      <>
        {numberInput('Stock Threshold (%)', 'threshold', 10)}
        {selectInput('Warehouse', 'warehouse', liveWarehouses)}
        {selectInput('Category', 'category', liveCategories)}
        {checkboxInput('Include Critical Items Only', 'criticalOnly')}
      </>
    ),

    'Stock Valuation': () => (
      <>
        {dateInput('As On Date', 'asOnDate')}
        {selectInput('Valuation Method', 'method', ['FIFO', 'LIFO', 'Average', 'Weighted Average'])}
        {selectInput('Warehouse', 'warehouse', liveWarehouses)}
        {selectInput('Currency', 'currency', ['USD', 'EUR', 'GBP', 'INR'])}
      </>
    ),

    'Audit Log': () => (
      <>
        {dateInput('From Date', 'fromDate')}
        {dateInput('To Date', 'toDate')}
        {selectInput('Action Type', 'action', ['All Actions', 'Create', 'Update', 'Delete'])}
        {selectInput('User', 'user', ['All Users', 'Admin', 'Manager', 'Staff'])}
      </>
    )
  };

  // ===============================
  // INPUT COMPONENTS
  // ===============================
  const dateInput = (label, name) => {
    const today = new Date().toISOString().split('T')[0];
    const defaultValue = name === 'fromDate'
      ? new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : today;

    return (
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        <input
          type="date"
          name={name}
          defaultValue={defaultValue}
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
        />
      </div>
    );
  };

  const selectInput = (label, name, options) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        name={name}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
        defaultValue={options[0]}
      >
        {options.map(opt => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );

  const numberInput = (label, name, defaultValue) => (
    <div className="mb-4">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type="number"
        name={name}
        defaultValue={defaultValue}
        min="0"
        max="100"
        step="1"
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
        onChange={(e) => setFormData({ ...formData, [name]: e.target.value })}
      />
    </div>
  );

  const checkboxInput = (label, name) => (
    <div className="flex items-center mb-4">
      <input
        type="checkbox"
        name={name}
        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
        onChange={(e) => setFormData({ ...formData, [name]: e.target.checked })}
      />
      <label className="ml-2 block text-sm text-gray-700">
        {label}
      </label>
    </div>
  );

  // ===============================
  // MODAL FUNCTIONS
  // ===============================
  const openReportModal = (reportType) => {
    setCurrentReportType(reportType);
    setFormData({});
    setShowModal(true);
  };

  const closeReportModal = () => {
    setShowModal(false);
    setCurrentReportType(null);
    setFormData({});
  };

  // ===============================
  // FORM SUBMISSION HANDLER
  // ===============================
  const handleReportSubmit = (e) => {
    e.preventDefault();

    if (!currentReportType) {
      alert('No report type selected');
      return;
    }

    // Collect all form data
    const form = e.target;
    const formDataObj = new FormData(form);
    const params = {};

    for (let [key, value] of formDataObj.entries()) {
      params[key] = value;
    }

    // Add checkboxes that might not be in formDataObj
    Object.keys(formData).forEach(key => {
      if (formData[key] === true && !params[key]) {
        params[key] = 'Yes';
      }
    });

    // Create new report object
    const newReport = {
      type: currentReportType,
      ...params,
      generatedAt: new Date().toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    };

    // Add to generated reports (at beginning)
    setGeneratedReports(prev => [newReport, ...prev]);

    // Close modal
    closeReportModal();

    // Show success message
    setTimeout(() => {
      alert(`✅ ${currentReportType} generated successfully!`);
    }, 100);
  };

  // ===============================
  // DOWNLOAD FUNCTIONS
  // ===============================
  const downloadCSV = (index) => {
    const report = generatedReports[index];

    // Create CSV content
    const headers = Object.keys(report);
    const row = headers.map(key => report[key]);

    const csvContent = [
      headers.join(','),
      row.map(value => `"${value}"`).join(',')
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${report.type.replace(/\s+/g, '_')}_${new Date().getTime()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`📥 ${report.type} downloaded as CSV!`);
  };

  const downloadPDF = (index) => {
    const report = generatedReports[index];

    // Open print dialog with formatted content
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${report.type}</title>
        <style>
          body { 
            font-family: Arial, sans-serif; 
            padding: 30px; 
            margin: 0;
          }
          h1 { 
            color: #333; 
            border-bottom: 2px solid #4F46E5; 
            padding-bottom: 10px; 
            margin-bottom: 20px; 
          }
          .report-info { 
            margin-bottom: 30px; 
          }
          .info-item { 
            margin-bottom: 8px; 
            padding: 5px 0;
          }
          .info-label { 
            font-weight: bold; 
            color: #555; 
            display: inline-block; 
            width: 150px; 
          }
          .info-value { 
            color: #333; 
          }
          .footer { 
            margin-top: 40px; 
            padding-top: 20px; 
            border-top: 1px solid #ddd; 
            font-size: 12px; 
            color: #666; 
            text-align: center; 
          }
          @media print {
            body { 
              padding: 20px; 
              font-size: 12pt;
            }
            button { 
              display: none; 
            }
          }
        </style>
      </head>
      <body>
        <h1>${report.type}</h1>
        
        <div class="report-info">
          ${Object.entries(report)
        .map(([key, value]) => `
              <div class="info-item">
                <span class="info-label">${key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:</span>
                <span class="info-value">${value}</span>
              </div>
            `).join('')}
        </div>
        
        <div class="footer">
          Generated by WarehouseHub Inventory System • ${new Date().toLocaleDateString()}
        </div>
        
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
              setTimeout(() => window.close(), 100);
            }, 500);
          };
        </script>
      </body>
      </html>
    `);

    printWindow.document.close();
  };

  // ===============================
  // RENDER FUNCTIONS
  // ===============================
  const renderReportsTable = () => {
    if (generatedReports.length === 0) {
      return (
        <div className="text-center py-8">
          <p className="text-gray-500">
            No reports generated yet. Generate a report to see it here.
          </p>
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Report
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Parameters
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Generated At
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {generatedReports.map((report, index) => (
              <tr key={index} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div className="font-medium text-gray-900">{report.type}</div>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  <div className="text-xs space-y-1">
                    {Object.entries(report)
                      .filter(([key]) => !['type', 'generatedAt'].includes(key))
                      .map(([key, value]) => (
                        <div key={key}>
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}:
                          <span className="font-medium ml-1">{value}</span>
                        </div>
                      ))}
                  </div>
                </td>
                <td className="px-4 py-3 text-gray-600">{report.generatedAt}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => downloadCSV(index)}
                      className="px-3 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded text-xs font-medium transition-colors"
                    >
                      CSV
                    </button>
                    <button
                      onClick={() => downloadPDF(index)}
                      className="px-3 py-1 bg-red-100 text-red-700 hover:bg-red-200 rounded text-xs font-medium transition-colors"
                    >
                      PDF
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // ===============================
  // MAIN RENDER
  // ===============================
  return (
    <div className="max-w-7xl mx-auto space-y-8 pr-4 md:pr-6 pb-4 md:pb-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports & Analytics</h1>

      {/* 6 REPORT CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {REPORTS.map((report) => (
          <div
            key={report.title}
            className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition"
          >
            <div className={`${report.color} text-white p-5`}>
              <div className="flex items-center gap-3">
                <span className="text-2xl">{report.icon}</span>
                <span className="text-lg font-semibold">{report.title}</span>
              </div>
            </div>
            <div className="p-5">
              <p className="text-gray-600 mb-5">{report.description}</p>
              <button
                onClick={() => openReportModal(report.title)}
                className={`w-full py-2.5 ${report.color} hover:opacity-90 text-white rounded-lg font-medium transition`}
              >
                Generate Report
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* GENERATED REPORTS TABLE */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Generated Reports</h2>
        {renderReportsTable()}
      </div>

      {/* MODAL */}
      {showModal && currentReportType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleReportSubmit} className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-gray-900" id="reportTypeDisplay">
                  {currentReportType}
                </h2>
                <button
                  type="button"
                  onClick={closeReportModal}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  &times;
                </button>
              </div>

              <div id="reportFormContainer" className="space-y-4">
                {REPORT_FORM_CONFIG[currentReportType]?.() || (
                  <p className="text-red-500">Form configuration not found</p>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-6 border-t mt-6">
                <button
                  type="button"
                  onClick={closeReportModal}
                  className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
                >
                  Generate Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}