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
const ROLE_PERMISSIONS = {
  Admin: "Full access to all features including Users & Settings",
  Manager: "Full menu access (same as Admin)",
  Staff: "Can view Reports, no access to Users & Settings",
  Viewer: "Read-only access to Products and Inventory"
};

const ROLE_DESC = {
  Admin: "Full System Access",
  Manager: "Full Menu Access",
  Staff: "Reports + Inventory + Stock",
  Viewer: "Read-only access"
};

// Function to generate gradient colors based on user's name or role
const getUserGradient = (user) => {
  const gradients = [
    "bg-gradient-to-br from-blue-500 to-purple-600",
    "bg-gradient-to-br from-green-500 to-teal-600",
    "bg-gradient-to-br from-orange-500 to-red-600",
    "bg-gradient-to-br from-purple-500 to-pink-600",
    "bg-gradient-to-br from-teal-500 to-blue-600",
    "bg-gradient-to-br from-red-500 to-orange-600",
    "bg-gradient-to-br from-indigo-500 to-purple-600",
    "bg-gradient-to-br from-pink-500 to-rose-600"
  ];
  
  // Use the first character of the name to pick a consistent gradient
  if (user.fullName) {
    const charCode = user.fullName.charCodeAt(0);
    return gradients[charCode % gradients.length];
  }
  
  // Fallback based on role
  switch(user.role) {
    case 'Admin': return "bg-gradient-to-br from-purple-500 to-pink-600";
    case 'Manager': return "bg-gradient-to-br from-blue-500 to-cyan-600";
    case 'Staff': return "bg-gradient-to-br from-green-500 to-teal-600";
    default: return "bg-gradient-to-br from-gray-500 to-gray-700";
  }
};

export default function Users() {
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

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

  const [formErrors, setFormErrors] = useState({});

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
      setLoading(false);
    }, (error) => {
      console.error("Error loading users:", error);
      setLoading(false);
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
        u.role?.toLowerCase().includes(search) ||
        u.department?.toLowerCase().includes(search);

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
     VALIDATE FORM
  ================================ */
  const validateForm = () => {
    const errors = {};
    
    if (!form.fullName.trim()) {
      errors.fullName = "Full Name is required";
    }
    
    if (!form.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      errors.email = "Invalid email format";
    }
    
    if (!editUser && !form.password) {
      errors.password = "Password is required";
    } else if (!editUser && form.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    } else if (editUser && form.password && form.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /* ===============================
     SAVE USER
  ================================ */
  const saveUser = async e => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    if (!editUser) {
      // check email duplicate
      const q = query(
        collection(db, "users"),
        where("email", "==", form.email)
      );
      const snap = await getDocs(q);
      if (!snap.empty) {
        setFormErrors(prev => ({ ...prev, email: "Email already exists" }));
        return;
      }
    } else {
      // For edit, check email duplicate only if email changed
      if (form.email !== editUser.email) {
        const q = query(
          collection(db, "users"),
          where("email", "==", form.email)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setFormErrors(prev => ({ ...prev, email: "Email already exists" }));
          return;
        }
      }
    }

    const payload = {
      fullName: form.fullName,
      email: form.email,
      role: form.role,
      status: form.status,
      department: form.department,
      phone: form.phone,
      updatedAt: new Date()
    };

    // Only include password if it's provided (for new users or password change)
    if (form.password) {
      payload.password = form.password;
    }

    try {
      if (editUser) {
        await updateDoc(doc(db, "users", editUser.id), payload);
      } else {
        payload.createdAt = new Date();
        await addDoc(collection(db, "users"), payload);
      }
      closeModal();
    } catch (error) {
      console.error("Error saving user:", error);
      alert("Error saving user. Please try again.");
    }
  };

  /* ===============================
     TOGGLE USER STATUS (DISABLE/ENABLE)
  ================================ */
  const toggleUserStatus = async user => {
    const newStatus = user.status === "Active" ? "Disabled" : "Active";
    const action = user.status === "Active" ? "disable" : "enable";
    
    if (!window.confirm(`Are you sure you want to ${action} ${user.fullName}?`)) return;
    
    try {
      await updateDoc(doc(db, "users", user.id), {
        status: newStatus,
        updatedAt: new Date()
      });
    } catch (error) {
      console.error("Error updating user status:", error);
      alert("Error updating user status. Please try again.");
    }
  };

  /* ===============================
     DELETE USER
  ================================ */
  const deleteUserHandler = async user => {
    if (!window.confirm(`Are you sure you want to delete ${user.fullName}? This action cannot be undone.`)) return;
    
    try {
      await deleteDoc(doc(db, "users", user.id));
    } catch (error) {
      console.error("Error deleting user:", error);
      alert("Error deleting user. Please try again.");
    }
  };

  /* ===============================
     GENERATE RANDOM PASSWORD
  ================================ */
  const generateRandomPassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*";
    let password = "";
    for (let i = 0; i < 10; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setForm(prev => ({ ...prev, password }));
    if (formErrors.password) {
      setFormErrors(prev => ({ ...prev, password: "" }));
    }
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
    setFormErrors({});
    setShowPassword(false);
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
      password: "" // Empty for edit - user can choose to change it
    });
    setFormErrors({});
    setShowPassword(false);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditUser(null);
    setFormErrors({});
    setShowPassword(false);
  };

  /* ===============================
     HANDLE INPUT CHANGE
  ================================ */
  const handleInputChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (formErrors[field]) {
      setFormErrors(prev => ({ ...prev, [field]: "" }));
    }
  };

  /* ===============================
     UI
  ================================ */
  return (
    <div className="space-y-6 p-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">User Management</h1>
          <p className="text-gray-600 mt-1">Manage user accounts, roles, and access permissions</p>
        </div>
        <button 
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg font-medium transition-colors shadow-sm hover:shadow-md flex items-center gap-2 w-full sm:w-auto justify-center"
          onClick={openAdd}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add User
        </button>
      </div>

      {/* FILTERS */}
      <div className="bg-white p-4 rounded-lg shadow-sm border">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Search users by name, email, or role..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-3">
            <select 
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[140px]"
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="all">All Roles</option>
              <option value="Admin">Admin</option>
              <option value="Manager">Manager</option>
              <option value="Staff">Staff</option>
              <option value="Viewer">Viewer</option>
            </select>

            <select
              className="px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[140px]"
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Disabled">Disabled</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
        </div>
      </div>

      {/* STATS GRID - WITH FIXED ICONS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Users - Blue Card */}
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Total Users</p>
              <p className="text-3xl font-bold text-blue-800 mt-2">{stats.total}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
             <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
  <path d="M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z" />
</svg>
            </div>
          </div>
        </div>
        
        {/* Active - Green Card */}
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Active</p>
              <p className="text-3xl font-bold text-green-800 mt-2">{stats.active}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Disabled - Red Card */}
        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Disabled</p>
              <p className="text-3xl font-bold text-red-800 mt-2">{stats.disabled}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        
        {/* Admins - Purple Card */}
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 p-5 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700">Admins</p>
              <p className="text-3xl font-bold text-purple-800 mt-2">{stats.admins}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
              <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* ROLE PERMISSIONS - MATCHING SCREENSHOT LAYOUT */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="px-5 py-4 border-b bg-gray-50">
          <h2 className="text-lg font-semibold text-gray-800">Role Permissions</h2>
        </div>
        <div className="overflow-x-auto">
          <div className="min-w-full">
            <div className="grid grid-cols-1 md:grid-cols-4 divide-x divide-gray-200">
              {/* Admin Column - Purple */}
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 bg-purple-500 rounded-full"></div>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">Admin</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{ROLE_PERMISSIONS.Admin}</p>
              </div>
              
              {/* Manager Column - Blue */}
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 bg-blue-500 rounded-full"></div>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">Manager</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{ROLE_PERMISSIONS.Manager}</p>
              </div>
              
              {/* Staff Column - Green */}
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 bg-green-500 rounded-full"></div>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">Staff</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{ROLE_PERMISSIONS.Staff}</p>
              </div>
              
              {/* Viewer Column - Gray */}
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 bg-gray-500 rounded-full"></div>
                  </div>
                  <h3 className="font-bold text-lg text-gray-900">Viewer</h3>
                </div>
                <p className="text-sm text-gray-600 leading-relaxed">{ROLE_PERMISSIONS.Viewer}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* USERS TABLE - WITH HORIZONTAL SCROLLING */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <div className="min-w-[800px]">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">USER</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">EMAIL</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ROLE</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ACCESS</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">STATUS</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">LAST ACTIVE</th>
                  <th className="px-5 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">ACTIONS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading ? (
                  <tr>
                    <td colSpan="7" className="px-5 py-8 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <p className="mt-3 text-gray-600">Loading users...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map(u => (
                    <tr 
                      key={u.id} 
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {/* UPDATED: Gradient user icon */}
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 shadow-sm ${getUserGradient(u)}`}>
                            <span className="text-sm font-medium text-white">
                              {u.fullName?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {u.fullName}
                            </div>
                            {u.department && (
                              <div className="text-sm text-gray-500">{u.department}</div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{u.email}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          u.role === 'Admin' ? 'bg-purple-100 text-purple-800' :
                          u.role === 'Manager' ? 'bg-blue-100 text-blue-800' :
                          u.role === 'Staff' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{ROLE_DESC[u.role]}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                          u.status === 'Active' ? 'bg-green-100 text-green-800' :
                          u.status === 'Disabled' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{u.lastActive}</div>
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-800 p-1.5 rounded hover:bg-blue-50 transition-colors duration-150"
                            onClick={() => openEdit(u)}
                            title="Edit user"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          <button
                            className={`p-1.5 rounded transition-colors duration-150 ${
                              u.status === "Active" 
                                ? "text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50" 
                                : "text-green-600 hover:text-green-800 hover:bg-green-50"
                            }`}
                            onClick={() => toggleUserStatus(u)}
                            title={u.status === "Active" ? "Disable user" : "Enable user"}
                          >
                            {u.status === "Active" ? (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                          <button
                            className="text-red-600 hover:text-red-800 p-1.5 rounded hover:bg-red-50 transition-colors duration-150"
                            onClick={() => deleteUserHandler(u)}
                            title="Delete user"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="px-5 py-8 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-500">
                        <svg className="w-12 h-12 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5 4.5V9.25m0 0l-3-3m3 3l-3 3" />
                        </svg>
                        <p className="text-lg font-medium">No users found</p>
                        <p className="text-sm mt-1">Try adjusting your search or filters</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ADD/EDIT USER MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true" onClick={closeModal}>
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-white px-6 pt-5 pb-6 sm:p-8">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-semibold text-gray-900">
                    {editUser ? "Edit User" : "Add New User"}
                  </h3>
                  <button
                    onClick={closeModal}
                    className="text-gray-400 hover:text-gray-500 p-1 rounded-full hover:bg-gray-100"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={saveUser} className="space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        className={`w-full px-3 py-2.5 border ${formErrors.fullName ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                        placeholder="John Doe"
                        value={form.fullName}
                        onChange={e => handleInputChange('fullName', e.target.value)}
                        required
                      />
                      {formErrors.fullName && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.fullName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        className={`w-full px-3 py-2.5 border ${formErrors.email ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors`}
                        placeholder="john@example.com"
                        type="email"
                        value={form.email}
                        onChange={e => handleInputChange('email', e.target.value)}
                        required
                      />
                      {formErrors.email && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password 
                        {!editUser && <span className="text-red-500">*</span>}
                        {editUser && <span className="text-gray-500 text-xs ml-1">(Leave blank to keep current)</span>}
                      </label>
                      <div className="relative">
                        <input
                          className={`w-full px-3 py-2.5 border ${formErrors.password ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors pr-10`}
                          placeholder={editUser ? "Enter new password (optional)" : "Enter password"}
                          type={showPassword ? "text" : "password"}
                          value={form.password}
                          onChange={e => handleInputChange('password', e.target.value)}
                          autoComplete="new-password"
                        />
                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="text-gray-400 hover:text-gray-600"
                            title={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L6.59 6.59m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                              </svg>
                            ) : (
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                              </svg>
                            )}
                          </button>
                          {!editUser && (
                            <button
                              type="button"
                              onClick={generateRandomPassword}
                              className="text-blue-400 hover:text-blue-600"
                              title="Generate random password"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>
                      {formErrors.password && (
                        <p className="mt-1 text-sm text-red-600">{formErrors.password}</p>
                      )}
                      {!editUser && !formErrors.password && (
                        <p className="mt-1 text-xs text-gray-500">Minimum 6 characters</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Role
                      </label>
                      <select
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        value={form.role}
                        onChange={e => handleInputChange('role', e.target.value)}
                      >
                        <option value="Admin">Admin</option>
                        <option value="Manager">Manager</option>
                        <option value="Staff">Staff</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Status
                      </label>
                      <select
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                        value={form.status}
                        onChange={e => handleInputChange('status', e.target.value)}
                      >
                        <option value="Active">Active</option>
                        <option value="Disabled">Disabled</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Department
                      </label>
                      <input
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="e.g., Operations, Sales"
                        value={form.department}
                        onChange={e => handleInputChange('department', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Phone Number
                      </label>
                      <input
                        className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="+1 (555) 123-4567"
                        value={form.phone}
                        onChange={e => handleInputChange('phone', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
                    <button 
                      type="button"
                      className="px-5 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors w-full sm:w-auto"
                      onClick={closeModal}
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit"
                      className="px-5 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow-md w-full sm:w-auto"
                    >
                      {editUser ? "Update User" : "Create User"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}