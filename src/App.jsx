import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppProvider, useApp } from "./context/AppContext";

import Layout from "./components/Layout";

// Pages
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Products from "./pages/Products";
import AddEditProduct from "./pages/AddEditProduct";
import Inventory from "./pages/Inventory";
import Warehouses from "./pages/Warehouses";
import StockIn from "./pages/StockIn";
import StockOut from "./pages/StockOut";
import LowStock from "./pages/LowStock";
import ExpiryAlerts from "./pages/ExpiryAlerts";
import Suppliers from "./pages/Suppliers";
import Users from "./pages/Users";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";

function ProtectedRoute({ children }) {
  const { user } = useApp();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <Routes>
          {/* PUBLIC */}
          <Route path="/login" element={<Login />} />

          {/* PROTECTED */}
          <Route
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Dashboard />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/add" element={<AddEditProduct />} />
            <Route path="/products/edit/:id" element={<AddEditProduct />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/warehouses" element={<Warehouses />} />
            <Route path="/stock-in" element={<StockIn />} />
            <Route path="/stock-out" element={<StockOut />} />
            <Route path="/low-stock" element={<LowStock />} />
            <Route path="/expiry-alerts" element={<ExpiryAlerts />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/users" element={<Users />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/settings" element={<Settings />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AppProvider>
  );
}
