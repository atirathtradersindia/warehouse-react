import { NavLink } from "react-router-dom";

function NavItem({ to, children }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        `block px-3 py-2 rounded hover:bg-slate-700 ${
          isActive ? "bg-slate-700" : ""
        }`
      }
    >
      {children}
    </NavLink>
  );
}

export default function Sidebar() {
  return (
    <aside className="w-64 bg-slate-900 text-white hidden lg:block">
      <div className="p-4 font-bold text-lg">WarehouseHub</div>

      <nav className="space-y-2 px-4">
        <NavItem to="/">Dashboard</NavItem>
        <NavItem to="/products">Products</NavItem>
        <NavItem to="/inventory">Inventory</NavItem>
        <NavItem to="/stock-in">Stock In</NavItem>
        <NavItem to="/stock-out">Stock Out</NavItem>
        <NavItem to="/low-stock">Low Stock</NavItem>
        <NavItem to="/expiry-alerts">Expiry Alerts</NavItem>
        <NavItem to="/suppliers">Suppliers</NavItem>
        <NavItem to="/warehouses">Warehouses</NavItem>
        <NavItem to="/reports">Reports</NavItem>
        <NavItem to="/users">Users</NavItem>
        <NavItem to="/settings">Settings</NavItem>
      </nav>
    </aside>
  );
}