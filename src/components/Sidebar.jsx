import { NavLink, useNavigate } from "react-router-dom";
import {
  FiPackage,
  FiHome,
  FiDownload,
  FiUpload,
  FiAlertTriangle,
  FiCalendar,
  FiPieChart,
  FiUsers,
  FiSettings,
  FiLogOut,
} from "react-icons/fi";

function NavItem({ to, children, icon: Icon, iconColor }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-slate-800 transition-colors ${
          isActive ? "bg-slate-800 text-white" : "text-slate-300"
        }`
      }
    >
      <Icon className={`w-5 h-5 ${iconColor}`} />
      <span>{children}</span>
    </NavLink>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    navigate('/login');
  };

  return (
<aside className="w-64 bg-slate-900 text-white hidden lg:block fixed left-0 top-[88px] bottom-10 border-r border-slate-800">      {/* Container for scrollable content */}
      <div className="h-full flex flex-col">
        {/* Scrollable nav items - this will scroll */}
        <nav className="space-y-1 p-4 overflow-y-auto flex-1">
          <NavItem to="/products" icon={FiPackage} iconColor="text-blue-400">
            Products
          </NavItem>
          <NavItem to="/warehouses" icon={FiHome} iconColor="text-purple-400">
            Warehouses
          </NavItem>
          <NavItem to="/stock-in" icon={FiDownload} iconColor="text-green-400">
            Stock In
          </NavItem>
          <NavItem to="/stock-out" icon={FiUpload} iconColor="text-orange-400">
            Stock Out
          </NavItem>
          <NavItem to="/low-stock" icon={FiAlertTriangle} iconColor="text-yellow-400">
            Low Stock
          </NavItem>
          <NavItem to="/expiry-alerts" icon={FiCalendar} iconColor="text-red-400">
            Expiry Alerts
          </NavItem>
          <NavItem to="/reports" icon={FiPieChart} iconColor="text-teal-400">
            Reports
          </NavItem>
          <NavItem to="/users" icon={FiUsers} iconColor="text-pink-400">
            Users
          </NavItem>
          <NavItem to="/settings" icon={FiSettings} iconColor="text-gray-400">
            Settings
          </NavItem>
        </nav>
        
        {/* Fixed Logout button with space around it */}
        <div className="p-4 border-t border-slate-800 shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-red-600 hover:bg-red-700 transition-colors text-white rounded-lg"
          >
            <FiLogOut className="w-4 h-4" />
            <span className="text-sm">Logout</span>
          </button>
        </div>
      </div>
    </aside>
  );
}