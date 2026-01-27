import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function Layout() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      
      <div className="flex-1 flex flex-col">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6 bg-slate-100">
          <Outlet />
        </main>

        <footer className="h-10 bg-slate-800 text-gray-300 text-xs flex items-center justify-center">
          © {new Date().getFullYear()} WarehouseHub
        </footer>
      </div>
    </div>
  );
}