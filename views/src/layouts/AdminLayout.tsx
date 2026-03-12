import React, { useState } from "react";
import { Outlet, NavLink, useNavigate, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Package,
  MessageSquare,
  Car,
  LogOut,
  Menu,
  X,
  ChevronDown,
  Users,
  UserCircle,
} from "lucide-react";
import shortLogo from "@/assets/branding/logo pendek.png";
import { useAuth } from "../contexts/AuthContext";
import { useToast } from "../contexts/ToastContext";

export const AdminLayout: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { addToast } = useToast();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      addToast("Logged out successfully", "success");
      navigate("/admin/login", { state: { skipVerify: true } });
    } catch (error) {
      addToast("Logout failed", "error");
    }
  };

  const navItems = [
    {
      path: "/admin/dashboard",
      icon: <LayoutDashboard className="h-5 w-5" />,
      label: "Dashboard",
    },
    {
      path: "/admin/packages",
      icon: <Package className="h-5 w-5" />,
      label: "Packages",
    },
    { path: "/admin/cars", icon: <Car className="h-5 w-5" />, label: "Cars" },
    {
      path: "/admin/inquiries",
      icon: <MessageSquare className="h-5 w-5" />,
      label: "Inquiries",
    },
    {
      path: "/admin/admins",
      icon: <Users className="h-5 w-5" />,
      label: "Admins",
    },
  ];

  return (
    <div className="min-h-screen bg-sky-50">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 text-white transform transition-transform duration-300 lg:translate-x-0 flex flex-col ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{
          background: "linear-gradient(180deg, #0c4a6e 0%, #0d4f5c 100%)",
        }}
      >
        {/* Sidebar header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <Link to="/admin/dashboard" className="flex items-center gap-3">
            <img src={shortLogo} alt="TripXB" className="h-10 w-auto" />
            <div>
              <p className="text-base font-bold leading-tight text-white">
                TripXB
              </p>
              <p className="text-[10px] text-sky-300 tracking-wide uppercase">
                Admin Panel
              </p>
            </div>
          </Link>
          <button
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden text-sky-300 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${
                  isActive
                    ? "bg-teal-500/90 text-white shadow-md shadow-teal-900/30"
                    : "text-sky-100 hover:bg-white/10 hover:text-white"
                }`
              }
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {/* Bottom: profile + logout */}
        <div className="px-3 pb-4 border-t border-white/10 pt-3 space-y-1">
          <NavLink
            to="/admin/profile"
            onClick={() => setIsSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all text-sm font-medium ${
                isActive
                  ? "bg-teal-500/90 text-white"
                  : "text-sky-100 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            <UserCircle className="h-5 w-5" />
            <span>My Profile</span>
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sky-100 hover:bg-red-500/20 hover:text-red-300 transition-all w-full text-sm font-medium"
          >
            <LogOut className="h-5 w-5" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main area */}
      <div className="lg:ml-64 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="bg-white border-b border-sky-100 sticky top-0 z-40 shadow-sm">
          <div className="flex items-center justify-between px-5 py-3">
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="lg:hidden text-sky-700 hover:text-sky-900 p-1"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="hidden lg:flex items-center gap-2">
              <div className="h-5 w-1 rounded-full bg-teal-500" />
              <span className="text-sm font-semibold text-sky-900">
                TripXB Dashboard
              </span>
            </div>

            <div className="ml-auto relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-sky-50 transition-colors"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm bg-gradient-to-br from-sky-600 to-teal-500">
                  {user?.name.charAt(0).toUpperCase() || "A"}
                </div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-semibold text-sky-900">
                    {user?.name || "Admin"}
                  </p>
                  <p className="text-xs text-gray-400">{user?.email}</p>
                </div>
                <ChevronDown className="h-4 w-4 text-gray-400" />
              </button>

              {isUserMenuOpen && (
                <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl shadow-xl py-2 border border-sky-100 z-50">
                  <Link
                    to="/admin/profile"
                    onClick={() => setIsUserMenuOpen(false)}
                    className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-sky-50 flex items-center gap-2 transition-colors"
                  >
                    <UserCircle className="h-4 w-4 text-sky-600" />
                    My Profile
                  </Link>
                  <hr className="my-1 border-sky-100" />
                  <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2 transition-colors"
                  >
                    <LogOut className="h-4 w-4" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 p-6">
          <Outlet />
        </main>
      </div>

      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
};
