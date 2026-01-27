// ===============================
// HEADER COMPONENT WITH PROFILE PANEL
// ===============================

import { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { Menu, X } from "lucide-react";
import NotificationBell from "./NotificationBell";

function HeaderNavItem({ to, children, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `px-4 py-2.5 rounded-md transition-colors whitespace-nowrap font-medium ${isActive
          ? "bg-blue-600 text-white"
          : "text-gray-300 hover:bg-slate-700 hover:text-white"
        }`
      }
    >
      {children}
    </NavLink>
  );
}

// Profile Panel Component (Integrated in Header)
function ProfilePanel() {
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  // Get real user data on component mount
  useEffect(() => {
    const getUserData = async () => {
      setLoading(true);
      try {
        // 1. Try to get user from AppContext (if you're using it)
        if (window.appContext?.user) {
          setCurrentUser(window.appContext.user);
          return;
        }

        // 2. Get user from localStorage (from your login function)
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          try {
            const user = JSON.parse(storedUser);
            setCurrentUser(user);
            window.currentUser = user;
          } catch (error) {
            console.error('Error parsing localStorage user data:', error);
          }
        }

        // 3. If still no user, try to get from Firestore using stored user ID
        const userId = localStorage.getItem('currentUserId');
        if (userId && !storedUser) {
          try {
            const { doc, getDoc } = await import("firebase/firestore");
            const { db } = await import("../firebase/firebase");

            const userDoc = await getDoc(doc(db, "users", userId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              const user = {
                id: userDoc.id,
                firstName: userData.firstName || '',
                lastName: userData.lastName || '',
                fullName: userData.fullName || '',
                email: userData.email || '',
                role: userData.role || 'Staff',
                department: userData.department || '',
                phone: userData.phone || '',
                avatarInitial: (userData.fullName || userData.email || 'U').charAt(0).toUpperCase(),
                lastLogin: userData.lastLogin || new Date().toISOString(),
                status: userData.status || 'Active'
              };

              // Store for future use
              localStorage.setItem('currentUser', JSON.stringify(user));
              setCurrentUser(user);
              window.currentUser = user;
            }
          } catch (error) {
            console.error('Error fetching user from Firestore:', error);
          }
        }

        // 4. Check if user is authenticated via Firebase Auth
        const { getAuth } = await import("firebase/auth");
        const { auth } = await import("../firebase/firebase");
        const firebaseAuth = getAuth(auth);

        if (firebaseAuth.currentUser) {
          const firebaseUser = firebaseAuth.currentUser;
          const user = {
            id: firebaseUser.uid,
            email: firebaseUser.email,
            firstName: firebaseUser.displayName?.split(' ')[0] || '',
            lastName: firebaseUser.displayName?.split(' ')[1] || '',
            fullName: firebaseUser.displayName || firebaseUser.email,
            avatarInitial: (firebaseUser.displayName || firebaseUser.email || 'U').charAt(0).toUpperCase(),
            role: 'User',
            lastLogin: new Date().toISOString()
          };

          setCurrentUser(user);
          window.currentUser = user;
        }
      } catch (error) {
        console.error('Error getting user data:', error);
      } finally {
        setLoading(false);
      }
    };

    getUserData();

    // Listen for user updates (from login)
    const handleUserUpdate = () => {
      getUserData();
    };

    window.addEventListener('userUpdated', handleUserUpdate);

    return () => {
      window.removeEventListener('userUpdated', handleUserUpdate);
    };
  }, []);

  // Use actual user data or fallback
  const user = currentUser || {
    firstName: "Guest",
    lastName: "User",
    email: "guest@example.com",
    role: "Guest",
    department: "Not assigned",
    phone: "Not provided",
    lastLogin: new Date().toISOString(),
    avatarInitial: "G"
  };

  const avatarInitial = user.avatarInitial || user.firstName?.charAt(0) || user.email?.charAt(0) || 'G';
  const fullName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Guest User';
  const userRole = user.role || 'Guest';
  const userEmail = user.email || 'guest@example.com';

  const toggleProfilePanel = (event) => {
    if (event) event.stopPropagation();
    setIsProfileOpen(!isProfileOpen);
  };

  const closeProfilePanel = () => {
    setIsProfileOpen(false);
  };

  // Safe logout function - matches your login system
  const handleLogout = async () => {
    closeProfilePanel();

    try {
      // Clear local storage (matching your login)
      localStorage.removeItem('currentUser');
      localStorage.removeItem('currentUserId');
      sessionStorage.removeItem('currentUser');
      window.currentUser = null;
      setCurrentUser(null);

      // If using Firebase Auth, sign out
      try {
        const { getAuth, signOut } = await import("firebase/auth");
        const { auth } = await import("../firebase/firebase");
        const firebaseAuth = getAuth(auth);
        await signOut(firebaseAuth);
      } catch (authError) {
        console.log('Not using Firebase Auth or already logged out');
      }

      // Trigger user update event
      window.dispatchEvent(new Event('userUpdated'));

      // Navigate to login
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Still navigate to login on error
      navigate('/login');
    }
  };

  // Safe navigation functions
  const handleAccountSettings = () => {
    closeProfilePanel();
    navigate('/settings');
  };

  const handleChangePassword = () => {
    closeProfilePanel();
    navigate('/change-password');
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      const panel = document.getElementById('profileDropdown');
      const button = document.querySelector('.profile-button');
      if (panel && button && !panel.contains(event.target) && !button.contains(event.target)) {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center gap-2 p-2">
        <div className="w-8 h-8 rounded-full bg-slate-700 animate-pulse"></div>
        <div className="hidden md:block">
          <div className="h-3 w-16 bg-slate-700 rounded animate-pulse mb-1"></div>
          <div className="h-2 w-12 bg-slate-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <button
        onClick={toggleProfilePanel}
        className="profile-button flex items-center gap-2 hover:bg-slate-700 p-2 rounded-lg transition-all duration-200"
      >
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
          {avatarInitial}
        </div>
        <div className="text-left hidden md:block">
          <p className="text-sm font-medium">{fullName}</p>
          <p className="text-xs text-gray-300">{userRole}</p>
        </div>
        <svg
          className={`w-4 h-4 text-gray-300 transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Profile Dropdown Panel */}
      {isProfileOpen && (
        <div
          id="profileDropdown"
          className="absolute right-0 top-full mt-2 w-72 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden animate-fadeIn"
        >
          {/* Profile Header */}
          <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-lg font-bold">
                {avatarInitial}
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">{fullName}</h3>
                <p className="text-sm text-gray-600">{userEmail}</p>
                <span className="inline-block mt-1 px-2 py-0.5 text-xs rounded-full bg-blue-100 text-blue-800">
                  {userRole}
                </span>
              </div>
            </div>
          </div>

          {/* User Details */}
          <div className="p-4 border-b">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Department</span>
                <span className="text-sm font-medium text-gray-900">{user.department || 'Not assigned'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Phone</span>
                <span className="text-sm font-medium text-gray-900">{user.phone || 'Not provided'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Last Login</span>
                <span className="text-sm font-medium text-gray-900">
                  {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Today'}
                </span>
              </div>
              {user.status && (
                <div className="flex justify-between">
                  <span className="text-sm text-gray-500">Status</span>
                  <span className={`text-sm font-medium ${user.status === 'Active' ? 'text-green-600' :
                      user.status === 'Disabled' ? 'text-red-600' :
                        user.status === 'Pending' ? 'text-yellow-600' : 'text-gray-600'
                    }`}>
                    {user.status}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="p-2">
            {userRole !== 'Guest' && userRole !== 'Viewer' && (
              <>
                <button
                  onClick={handleAccountSettings}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  <span>Account Settings</span>
                </button>

                <button
                  onClick={handleChangePassword}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 hover:bg-gray-50 rounded-md transition"
                >
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <span>Change Password</span>
                </button>
              </>
            )}

            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 hover:bg-red-50 rounded-md transition mt-1"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              <span>{userRole === 'Guest' ? 'Login' : 'Logout'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// Main Header Component
export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-slate-800 text-white z-50 w-full border-b border-gray-700">
        <div className="flex items-center justify-between px-6 py-4">
          {/* Left side - Logo and Title */}
          <div className="flex items-center">
            <div className="flex flex-col">
              <h1 className="font-bold text-2xl text-white">WarehouseHub</h1>
              <p className="text-gray-300 text-sm mt-1">Inventory System</p>
            </div>
          </div>

          {/* Right side - Navigation, Notification, Profile */}
          <div className="flex items-center space-x-6">
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-4 bg-slate-900/50 px-4 py-2 rounded-lg">
              <HeaderNavItem to="/">Dashboard</HeaderNavItem>
              <HeaderNavItem to="/inventory">Inventory</HeaderNavItem>
              <HeaderNavItem to="/suppliers">Suppliers</HeaderNavItem>
            </div>

            {/* Notification Bell */}
            <NotificationBell />

            {/* Profile Panel (Integrated) */}
            <ProfilePanel />

            {/* Mobile Menu Button */}
            <button
              className="md:hidden flex-shrink-0"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="Toggle menu"
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-slate-900 border-t border-slate-700">
            <div className="flex flex-col space-y-1 p-4">
              <HeaderNavItem
                to="/"
                onClick={() => setIsMenuOpen(false)}
              >
                Dashboard
              </HeaderNavItem>
              <HeaderNavItem
                to="/inventory"
                onClick={() => setIsMenuOpen(false)}
              >
                Inventory
              </HeaderNavItem>
              <HeaderNavItem
                to="/suppliers"
                onClick={() => setIsMenuOpen(false)}
              >
                Suppliers
              </HeaderNavItem>
            </div>
          </div>
        )}
      </header>
    </>
  );
}