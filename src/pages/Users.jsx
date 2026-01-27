import { useEffect, useMemo, useState } from "react";
import {
  collection,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  orderBy,
  where,
  getDocs
} from "firebase/firestore";
import { db } from "../firebase/firebase";

/* ===============================
   ROLE PERMISSIONS
================================ */
const ROLE_DESC = {
  Admin: "Full System Access",
  Manager: "Full Menu Access (no Users & Settings)",
  Staff: "Reports + Inventory + Stock",
  Viewer: "Read-only access"
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [showModal, setShowModal] = useState(false);
  const [editUser, setEditUser] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    role: "Staff",
    status: "Active",
    department: "",
    phone: "",
    password: ""
  });

  /* ===============================
     LOAD USERS (REALTIME)
  ================================ */
  useEffect(() => {
    const q = query(collection(db, "users"), orderBy("fullName"));
    const unsub = onSnapshot(q, snap => {
      setUsers(
        snap.docs.map(d => ({
          id: d.id,
          ...d.data(),
          lastActive: d.data().lastActive
            ? d.data().lastActive.toDate().toLocaleDateString()
            : "Never"
        }))
      );
    });
    return () => unsub();
  }, []);

  /* ===============================
     FILTER USERS
  ================================ */
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchesSearch =
        u.fullName?.toLowerCase().includes(search) ||
        u.email?.toLowerCase().includes(search) ||
        u.role?.toLowerCase().includes(search);

      const matchesRole = roleFilter === "all" || u.role === roleFilter;
      const matchesStatus =
        statusFilter === "all" || u.status === statusFilter;

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  /* ===============================
     STATS
  ================================ */
  const stats = {
    total: users.length,
    active: users.filter(u => u.status === "Active").length,
    disabled: users.filter(u => u.status === "Disabled").length,
    admins: users.filter(u => u.role === "Admin").length
  };

  /* ===============================
     SAVE USER
  ================================ */
  const saveUser = async e => {
    e.preventDefault();

    if (!editUser) {
      // check email duplicate
      const q = query(
        collection(db, "users"),
        where("email", "==", form.email)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        alert("Email already exists");
        return;
      }
    }

    const payload = {
      ...form,
      updatedAt: new Date()
    };

    if (editUser) {
      await updateDoc(doc(db, "users", editUser.id), payload);
    } else {
      if (form.password.length < 6) {
        alert("Password must be at least 6 chars");
        return;
      }
      payload.createdAt = new Date();
      await addDoc(collection(db, "users"), payload);
    }

    closeModal();
  };

  /* ===============================
     TOGGLE STATUS
  ================================ */
  const toggleStatus = async user => {
    await updateDoc(doc(db, "users", user.id), {
      status: user.status === "Active" ? "Disabled" : "Active",
      updatedAt: new Date()
    });
  };

  /* ===============================
     DELETE USER
  ================================ */
  const deleteUserHandler = async user => {
    if (!window.confirm(`Delete ${user.fullName}?`)) return;
    await deleteDoc(doc(db, "users", user.id));
  };

  /* ===============================
     MODAL HANDLERS
  ================================ */
  const openAdd = () => {
    setEditUser(null);
    setForm({
      fullName: "",
      email: "",
      role: "Staff",
      status: "Active",
      department: "",
      phone: "",
      password: ""
    });
    setShowModal(true);
  };

  const openEdit = user => {
    setEditUser(user);
    setForm({
      fullName: user.fullName || "",
      email: user.email || "",
      role: user.role || "Staff",
      status: user.status || "Active",
      department: user.department || "",
      phone: user.phone || "",
      password: user.password || ""
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditUser(null);
  };

  /* ===============================
     UI
  ================================ */
  return (
    <div className="space-y-6">
      <div className="flex justify-between">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button className="btn-primary" onClick={openAdd}>
          + Add User
        </button>
      </div>

      {/* FILTERS */}
      <div className="flex gap-3">
        <input
          className="input"
          placeholder="Search users..."
          onChange={e => setSearch(e.target.value.toLowerCase())}
        />

        <select className="input" onChange={e => setRoleFilter(e.target.value)}>
          <option value="all">All Roles</option>
          <option>Admin</option>
          <option>Manager</option>
          <option>Staff</option>
          <option>Viewer</option>
        </select>

        <select
          className="input"
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="all">All Status</option>
          <option>Active</option>
          <option>Disabled</option>
          <option>Pending</option>
        </select>
      </div>

      {/* STATS */}
      <div className="grid md:grid-cols-4 gap-4">
        <Stat title="Total" value={stats.total} />
        <Stat title="Active" value={stats.active} />
        <Stat title="Disabled" value={stats.disabled} />
        <Stat title="Admins" value={stats.admins} />
      </div>

      {/* USERS TABLE */}
      <div className="card overflow-x-auto">
        <table className="table">
          <thead>
            <tr>
              <th>User</th>
              <th>Email</th>
              <th>Role</th>
              <th>Access</th>
              <th>Status</th>
              <th>Last Active</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(u => (
              <tr key={u.id}>
                <td>{u.fullName}</td>
                <td>{u.email}</td>
                <td>{u.role}</td>
                <td>{ROLE_DESC[u.role]}</td>
                <td>{u.status}</td>
                <td>{u.lastActive}</td>
                <td className="flex gap-2">
                  <button
                    className="link"
                    onClick={() => toggleStatus(u)}
                  >
                    {u.status === "Active" ? "Disable" : "Enable"}
                  </button>
                  <button className="link" onClick={() => openEdit(u)}>
                    Edit
                  </button>
                  <button
                    className="link text-red-600"
                    onClick={() => deleteUserHandler(u)}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="modal">
          <form onSubmit={saveUser} className="modal-box space-y-3">
            <h3 className="font-semibold">
              {editUser ? "Edit User" : "Add User"}
            </h3>

            <input
              className="input"
              placeholder="Full Name"
              value={form.fullName}
              onChange={e =>
                setForm({ ...form, fullName: e.target.value })
              }
              required
            />

            <input
              className="input"
              placeholder="Email"
              type="email"
              value={form.email}
              onChange={e =>
                setForm({ ...form, email: e.target.value })
              }
              required
            />

            <input
              className="input"
              placeholder="Password"
              type="text"
              value={form.password}
              onChange={e =>
                setForm({ ...form, password: e.target.value })
              }
            />

            <select
              className="input"
              value={form.role}
              onChange={e =>
                setForm({ ...form, role: e.target.value })
              }
            >
              <option>Admin</option>
              <option>Manager</option>
              <option>Staff</option>
              <option>Viewer</option>
            </select>

            <select
              className="input"
              value={form.status}
              onChange={e =>
                setForm({ ...form, status: e.target.value })
              }
            >
              <option>Active</option>
              <option>Disabled</option>
              <option>Pending</option>
            </select>

            <div className="flex justify-end gap-2">
              <button type="button" onClick={closeModal}>
                Cancel
              </button>
              <button className="btn-primary">Save</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/* ===============================
   SMALL STAT CARD
================================ */
function Stat({ title, value }) {
  return (
    <div className="card">
      <p className="text-sm text-gray-500">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
