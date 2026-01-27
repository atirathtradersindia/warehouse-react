import { useEffect, useState } from "react";
import { collection, addDoc, onSnapshot } from "firebase/firestore";
import { db } from "../firebase/firebase";

/* ===============================
   RACK CARD (STATIC)
================================ */
function RackCard({ zone, rack }) {
  return (
    <div className="border border-gray-200 rounded-lg p-2.5 text-center bg-gray-50 min-w-[200px] hover:shadow-md transition">
      <p className="text-[11px] text-gray-500">{zone}</p>
      <h4 className="text-sm font-semibold text-gray-900">{rack}</h4>
      <p className="text-[11px] text-green-600">Available</p>
    </div>
  );
}

/* ===============================
   WAREHOUSE CARD
================================ */
function WarehouseCard({ w }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border hover:shadow-md transition p-6">
      <div className="flex justify-between mb-2">
        <h3 className="text-lg font-semibold text-slate-900">{w.name}</h3>
        <span
          className={`px-3 py-1 text-xs rounded-full ${
            w.status === "Active"
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {w.status}
        </span>
      </div>

      <p className="text-sm text-slate-500 mb-4">📍 {w.location}</p>

      <div className="flex justify-between text-sm font-medium mb-2">
        <span>Utilization</span>
        <span>{w.utilization || 0}%</span>
      </div>

      <div className="w-full h-2 bg-gray-200 rounded-full">
        <div
          className="h-full bg-blue-600 rounded-full"
          style={{ width: `${w.utilization || 0}%` }}
        />
      </div>
    </div>
  );
}

/* ===============================
   MAIN PAGE
================================ */
export default function Warehouses() {
  const [warehouses, setWarehouses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: "",
    location: "",
    status: "Active",
    utilization: 0
  });

  /* ===============================
     REALTIME LISTENER
  ================================ */
  useEffect(() => {
    const unsub = onSnapshot(collection(db, "warehouses"), snap => {
      const data = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          if (a.status !== b.status) {
            return a.status === "Active" ? -1 : 1;
          }
          return a.name.localeCompare(b.name);
        });

      setWarehouses(data);
    });

    return () => unsub();
  }, []);

  /* ===============================
     SUBMIT HANDLER
  ================================ */
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.name.trim() || !form.location.trim()) {
      alert("Please fill required fields");
      return;
    }

    const duplicate = warehouses.some(
      w => w.name.toLowerCase() === form.name.toLowerCase()
    );

    if (duplicate) {
      alert("Warehouse with same name already exists");
      return;
    }

    try {
      setSaving(true);

      await addDoc(collection(db, "warehouses"), {
        ...form,
        utilization: Number(form.utilization),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      setShowModal(false);
      setForm({ name: "", location: "", status: "Active", utilization: 0 });
    } catch (err) {
      alert("Failed to save warehouse");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold">Warehouses</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          + Add Warehouse
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {warehouses.length === 0 ? (
          <div className="col-span-full text-center text-gray-500">
            No warehouses added yet
          </div>
        ) : (
          warehouses.map(w => <WarehouseCard key={w.id} w={w} />)
        )}
      </div>

      {/* STATIC LAYOUT */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-6">Warehouse Layout</h2>

        <div className="overflow-x-auto">
          <div className="grid grid-cols-4 gap-4 min-w-[900px]">
            {["A","B","C"].flatMap(zone =>
              [1,2,3,4].map(rack => (
                <RackCard
                  key={`${zone}${rack}`}
                  zone={`Zone ${zone}`}
                  rack={`Rack ${rack}`}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md">
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <h2 className="text-lg font-semibold">Add Warehouse</h2>

              <input
                placeholder="Warehouse Name"
                className="w-full px-4 py-2 border rounded-lg"
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
              />

              <input
                placeholder="Location"
                className="w-full px-4 py-2 border rounded-lg"
                value={form.location}
                onChange={e => setForm({ ...form, location: e.target.value })}
              />

              <select
                className="w-full px-4 py-2 border rounded-lg"
                value={form.status}
                onChange={e => setForm({ ...form, status: e.target.value })}
              >
                <option>Active</option>
                <option>Inactive</option>
              </select>

              <input
                type="number"
                min="0"
                max="100"
                className="w-full px-4 py-2 border rounded-lg"
                value={form.utilization}
                onChange={e => setForm({ ...form, utilization: e.target.value })}
              />

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border rounded-lg"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
