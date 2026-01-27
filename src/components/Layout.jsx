import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Sidebar from "../components/Sidebar";

export default function Layout() {
  return (
    <div className="min-h-screen bg-slate-100">
      {/* Fixed Header at top */}
      <div className="fixed top-0 left-0 right-0 z-10">
        <Header />
      </div>
      
      {/* Fixed Footer at bottom */}
      <footer className="fixed bottom-0 left-0 right-0 h-10 bg-slate-800 text-gray-300 text-xs flex items-center justify-between px-4 z-10">
        {/* Empty div for spacing to center the copyright */}
        <div className="w-1/3"></div>
        
        {/* Center - Copyright */}
        <div className="text-center">
          © {new Date().getFullYear()} WarehouseHub
        </div>
        
        {/* Right side - Links */}
        <div className="flex items-center justify-end gap-4 w-1/3">
          <button 
            onClick={() => {/* Add navigation to privacy policy */}}
            className="hover:text-white transition-colors"
          >
            Privacy Policy
          </button>
          <button 
            onClick={() => {/* navigation to terms */}}
            className="hover:text-white transition-colors"
          >
            Terms
          </button>
          <button 
            onClick={() => {/* navigation to support */}}
            className="hover:text-white transition-colors"
          >
            Support
          </button>
        </div>
      </footer>
      
      {/* Main content area - scrolls between header and footer */}
      <div className="flex pt-[88px] pb-10 h-screen">
        <Sidebar />
        
        {/* Scrollable content area */}
        <div className="flex-1 lg:ml-64 overflow-y-auto p-4 md:p-6">
          <Outlet />
        </div>
      </div>
    </div>
  );
}