import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  updateDoc,
  doc
} from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useApp } from "../context/AppContext";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useApp(); // Use login function from context

  const companyName = "WarehouseHub";

  const [email, setEmail] = useState("admin@warehouse.com");
  const [password, setPassword] = useState("password123");
  const [rememberMe, setRememberMe] = useState(true);
  const [message, setMessage] = useState(
    "Demo login: admin@warehouse.com / password123"
  );
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;

    setLoading(true);
    setMessage("Signing in...");

    try {
      // 🔹 Check users collection
      const q = query(
        collection(db, "users"),
        where("email", "==", email)
      );
      const snapshot = await getDocs(q);

      console.log("🔍 Firestore query results:", {
        docsCount: snapshot.docs.length,
        docs: snapshot.docs.map(d => ({ id: d.id, data: d.data() }))
      });

      if (snapshot.empty) {
        setMessage("User not found. Please check your email.");
        setLoading(false);
        return;
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();
      
      console.log("👤 User data retrieved:", {
        email: userData.email,
        passwordInDB: userData.password,
        enteredPassword: password,
        passwordMatch: userData.password === password
      });

      if (userData.status === "Disabled") {
        setMessage("Your account has been disabled. Please contact administrator.");
        setLoading(false);
        return;
      }

      if (userData.status === "Pending") {
        setMessage("Your account is pending approval. Please contact administrator.");
        setLoading(false);
        return;
      }

      // Check if password field exists
      if (!userData.hasOwnProperty('password')) {
        console.log("⚠️ Password field missing in Firestore");
        setMessage("Account configuration issue. Using demo login...");
        fallbackToDemoAuthentication(email, password);
        setLoading(false);
        return;
      }

      if (userData.password !== password) {
        console.log("❌ Password mismatch:", {
          stored: userData.password,
          typeOfStored: typeof userData.password,
          entered: password,
          typeOfEntered: typeof password
        });
        setMessage("Invalid password. Please try again.");
        setLoading(false);
        return;
      }

      // 🔹 Update last login
      await updateDoc(doc(db, "users", userDoc.id), {
        lastActive: new Date(),
        lastLogin: new Date().toISOString()
      });

      // 🔹 Create session user
      const sessionUser = {
        id: userDoc.id,
        fullName: userData.fullName || email.split('@')[0],
        firstName: userData.firstName || userData.fullName?.split(' ')[0] || 'User',
        lastName: userData.lastName || userData.fullName?.split(' ')[1] || '',
        email: userData.email,
        role: userData.role || "Staff",
        status: userData.status || "Active",
        department: userData.department || "",
        phone: userData.phone || "",
        avatarInitial: (userData.fullName || 'U').charAt(0).toUpperCase(),
        lastLogin: new Date().toISOString(),
        permissions: getPermissionsForRole(userData.role)
      };

      console.log("✅ Login successful, user session:", sessionUser);

      // ✅ LOGIN USER USING CONTEXT FUNCTION
      login(sessionUser);

      // ✅ Also store user ID separately for notifications
      localStorage.setItem('currentUserId', userDoc.id);

      setMessage("Login successful! Redirecting...");
      
      // Navigate to dashboard after delay
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1000);

    } catch (err) {
      console.error("🔥 Login error:", err);
      setMessage("Login failed. Please try again.");
      // Fallback to demo authentication
      fallbackToDemoAuthentication(email, password);
    } finally {
      setLoading(false);
    }
  };

  const getPermissionsForRole = (role) => {
    switch(role) {
      case 'Admin':
        return {
          canViewDashboard: true,
          canManageUsers: true,
          canManageProducts: true,
          canManageInventory: true,
          canManageStock: true,
          canViewReports: true,
          canManageSettings: true,
          canViewAlerts: true,
          isAdmin: true
        };
      case 'Manager':
        return {
          canViewDashboard: true,
          canManageUsers: false,
          canManageProducts: true,
          canManageInventory: true,
          canManageStock: true,
          canViewReports: true,
          canManageSettings: false,
          canViewAlerts: true,
          isManager: true
        };
      case 'Staff':
        return {
          canViewDashboard: true,
          canManageUsers: false,
          canManageProducts: true,
          canManageInventory: true,
          canManageStock: true,
          canViewReports: false,
          canManageSettings: false,
          canViewAlerts: true,
          isStaff: true
        };
      case 'Viewer':
        return {
          canViewDashboard: true,
          canManageUsers: false,
          canManageProducts: false,
          canManageInventory: false,
          canManageStock: false,
          canViewReports: false,
          canManageSettings: false,
          canViewAlerts: false,
          isViewer: true
        };
      default:
        return {
          canViewDashboard: true,
          canManageUsers: false,
          canManageProducts: false,
          canManageInventory: false,
          canManageStock: false,
          canViewReports: false,
          canManageSettings: false,
          canViewAlerts: false
        };
    }
  };

  const fallbackToDemoAuthentication = (email, password) => {
    console.log("🔄 Falling back to demo authentication...");
    
    const demoUsers = [
      {
        email: 'admin@warehouse.com',
        password: 'password123',
        data: {
          id: 'demo_admin_1',
          fullName: 'Admin User',
          firstName: 'Admin',
          lastName: 'User',
          role: 'Admin',
          status: 'Active',
          department: 'Management',
          phone: '+1 (555) 123-4567',
          avatarInitial: 'A',
          permissions: getPermissionsForRole('Admin')
        }
      },
      {
        email: 'john@warehouse.com',
        password: 'password123',
        data: {
          id: 'demo_manager_1',
          fullName: 'John Manager',
          firstName: 'John',
          lastName: 'Manager',
          role: 'Manager',
          status: 'Active',
          department: 'Operations',
          phone: '+1 (555) 987-6543',
          avatarInitial: 'J',
          permissions: getPermissionsForRole('Manager')
        }
      },
      {
        email: 'sarah@warehouse.com',
        password: 'password123',
        data: {
          id: 'demo_staff_1',
          fullName: 'Sarah Clerk',
          firstName: 'Sarah',
          lastName: 'Clerk',
          role: 'Staff',
          status: 'Active',
          department: 'Inventory',
          phone: '+1 (555) 456-7890',
          avatarInitial: 'S',
          permissions: getPermissionsForRole('Staff')
        }
      }
    ];

    const demoUser = demoUsers.find(user => 
      user.email === email && user.password === password
    );

    if (demoUser) {
      const sessionUser = {
        ...demoUser.data,
        email: email,
        lastLogin: new Date().toISOString()
      };
      
      console.log("✅ Demo login successful:", sessionUser);
      
      // ✅ LOGIN USER USING CONTEXT FUNCTION
      login(sessionUser);
      
      // Also store user ID separately for notifications
      localStorage.setItem('currentUserId', sessionUser.id);
      
      setMessage("Demo login successful! Redirecting...");
      
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1000);
    } else {
      setMessage("Invalid credentials. Try: admin@warehouse.com / password123");
    }
  };

  // Define message color based on content
  const getMessageColor = () => {
    if (message.includes("successful")) return "text-green-600";
    if (message.includes("Invalid") || message.includes("failed") || 
        message.includes("disabled") || message.includes("pending")) return "text-red-600";
    if (message.includes("Signing")) return "text-blue-600";
    return "text-gray-600";
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center 
                 py-4 px-3
                 sm:py-8 sm:px-6 
                 md:py-12 lg:px-8"
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
      }}
    >
      {/* CARD WITH PROPER SCALING */}
      <div className="w-full max-w-xs 
                      sm:max-w-sm 
                      md:max-w-md">
        <div className="bg-white rounded-xl 
                        sm:rounded-2xl 
                        shadow-lg sm:shadow-2xl 
                        p-4 
                        sm:p-6 
                        md:p-8 
                        fade-in">
          
          {/* COMPACT HEADER ON MOBILE */}
          <div className="text-center mb-4 
                          sm:mb-6 
                          md:mb-8">
            <div className="inline-flex items-center justify-center 
                            w-10 h-10 
                            sm:w-12 sm:h-12 
                            md:w-16 md:h-16 
                            bg-blue-500 rounded-full 
                            mb-2 
                            sm:mb-3 
                            md:mb-4">
              <svg 
                className="w-5 h-5 
                           sm:w-6 sm:h-6 
                           md:w-8 md:h-8 
                           text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth="2"
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>

            <h2 className="text-lg font-bold text-gray-900
                           sm:text-xl 
                           md:text-2xl lg:text-3xl">
              {companyName}
            </h2>
            <p className="mt-0.5 text-[11px] text-gray-600
                          sm:mt-1 sm:text-xs 
                          md:mt-2 md:text-sm">
              Warehouse Inventory Management
            </p>
          </div>

          {/* FORM WITH TIGHT MOBILE SPACING */}
          <form 
            onSubmit={handleLogin} 
            className="space-y-3 
                       sm:space-y-4 
                       md:space-y-6"
          >
            {/* EMAIL - COMPACT ON MOBILE */}
            <div>
              <label 
                htmlFor="email" 
                className="block text-[11px] font-medium text-gray-700
                           sm:text-xs 
                           md:text-sm"
              >
                Email / Username
              </label>
              <input 
                id="email" 
                type="text" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full 
                           px-3 py-2 
                           sm:px-3 sm:py-2.5 
                           md:px-4 md:py-3
                           text-sm
                           border border-gray-300 rounded-lg
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                           placeholder:text-gray-400"
                placeholder="admin@warehouse.com"
              />
            </div>

            {/* PASSWORD - COMPACT ON MOBILE */}
            <div>
              <label 
                htmlFor="password" 
                className="block text-[11px] font-medium text-gray-700
                           sm:text-xs 
                           md:text-sm"
              >
                Password
              </label>
              <input 
                id="password" 
                type="password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full 
                           px-3 py-2 
                           sm:px-3 sm:py-2.5 
                           md:px-4 md:py-3
                           text-sm
                           border border-gray-300 rounded-lg
                           focus:ring-2 focus:ring-blue-500 focus:border-transparent 
                           placeholder:text-gray-400"
                placeholder="Enter your password"
              />
            </div>

            {/* OPTIONS - SMALLER TEXT ON MOBILE */}
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input 
                  id="remember" 
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-3.5 w-3.5 
                             sm:h-4 sm:w-4 
                             text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label 
                  htmlFor="remember" 
                  className="ml-1.5 block text-[11px] text-gray-700
                             sm:ml-2 sm:text-xs 
                             md:text-sm"
                >
                  Remember me
                </label>
              </div>
              <a 
                href="#" 
                className="text-[11px] text-blue-600 hover:text-blue-800 font-medium
                           sm:text-xs 
                           md:text-sm"
              >
                Forgot password?
              </a>
            </div>

            {/* BUTTON - PROPERLY SCALED */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full 
                         py-2 px-4
                         sm:py-2.5 
                         md:py-3
                         text-sm font-semibold text-white
                         md:text-base
                         bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed
                         rounded-lg shadow-md 
                         transition-all duration-200
                         active:scale-[0.98] 
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              ) : "Sign In"}
            </button>
          </form>

          {/* DEMO MESSAGE - SMALLER ON MOBILE */}
          <div 
            className={`mt-3 text-center text-[11px] 
                       sm:mt-4 sm:text-xs 
                       md:text-sm ${getMessageColor()}`}
          >
            {message}
          </div>
        </div>
      </div>
    </div>
  );
}