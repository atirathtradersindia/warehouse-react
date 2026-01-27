import { useState } from "react";

export default function Settings() {
  /* ===============================
     LOCAL STATE (can be saved to Firestore later)
  ================================ */
  const [company, setCompany] = useState({
    name: "WarehouseHub Pvt Ltd",
    gst: "29ABCDE1234F1Z5",
    address: "123 Business Park, Mumbai, Maharashtra 400001"
  });

  return (
    <div className="max-w-7xl mx-auto space-y-8">

      {/* PAGE TITLE */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-1">
          Manage your warehouse system configuration
        </p>
      </div>

      {/* COMPANY PROFILE */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Company Profile</h2>

        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className="label">Company Name</label>
              <input
                className="input"
                value={company.name}
                onChange={e =>
                  setCompany({ ...company, name: e.target.value })
                }
              />
            </div>

            <div>
              <label className="label">GST Number</label>
              <input
                className="input"
                value={company.gst}
                onChange={e =>
                  setCompany({ ...company, gst: e.target.value })
                }
              />
            </div>
          </div>

          <div>
            <label className="label">Address</label>
            <textarea
              rows="3"
              className="input"
              value={company.address}
              onChange={e =>
                setCompany({ ...company, address: e.target.value })
              }
            />
          </div>
        </div>
      </div>

      {/* INVENTORY RULES */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Inventory Rules</h2>

        <div className="space-y-3">
          <Rule
            title="Stock Method"
            desc="FIFO (First In First Out)"
          />

          <Rule
            title="Low Stock Threshold"
            desc="Alert when stock falls below 20%"
          />

          <Rule
            title="Expiry Alerts"
            desc="7, 15, 30 days before expiry"
          />
        </div>
      </div>

      {/* BACKUP & SECURITY */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold mb-4">Backup & Security</h2>

        <div className="space-y-3">
          <InfoRow label="Last Backup" value="Today, 3:00 AM" />
          <InfoRow label="Backup Frequency" value="Daily" />

          <button className="btn-primary w-full mt-4">
            Backup Now
          </button>
        </div>
      </div>
    </div>
  );
}

/* ===============================
   SMALL REUSABLE COMPONENTS
================================ */

function Rule({ title, desc }) {
  return (
    <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg">
      <div>
        <p className="font-medium">{title}</p>
        <p className="text-sm text-gray-500">{desc}</p>
      </div>
      <button className="btn-primary text-sm">Configure</button>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b last:border-b-0">
      <span className="text-sm text-gray-700">{label}</span>
      <span className="font-medium text-gray-900">{value}</span>
    </div>
  );
}
