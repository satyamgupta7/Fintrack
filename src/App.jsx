import React, { useState, createContext, useContext } from "react";
import {
  Routes,
  Route,
  Navigate,
  NavLink,
  useLocation,
} from "react-router-dom";
import {
  LayoutDashboard,
  PiggyBank,
  CreditCard,
  Receipt,
  MoreHorizontal,
  LogOut,
  BarChart3,
} from "lucide-react";
import Sidebar from "./components/Sidebar";
import Dashboard from "./components/Dashboard";
import Savings from "./components/Savings";
import Loans from "./components/Loans";
import Expenses from "./components/Expenses";
import Analytics from "./components/Analytics";
import Auth from "./components/Auth";
import { loadData, saveData } from "./utils/storage";

export const DataContext = createContext(null);
export function useData() {
  return useContext(DataContext);
}

function getStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem("ft_user"));
  } catch {
    return null;
  }
}

const PAGE_TITLES = {
  "/": "Dashboard",
  "/savings": "Savings",
  "/loans": "Loans",
  "/expenses": "Expenses",
  "/analytics": "Planning & Insights",
};

function AppHeader({ user, onLogout }) {
  const loc = useLocation();
  const firstName = user?.name ? user.name.split(" ")[0] : "User";
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";
  const pageTitle = PAGE_TITLES[loc.pathname] || "FinTrack";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <header className="app-header">
      <div className="app-header-greeting">
        {greeting}, <strong>{firstName}</strong> 👋
      </div>
      <div className="app-header-right">
        <div className="app-header-avatar" title={user?.name}>
          {initials}
        </div>
        <div className="app-header-userinfo">
          <div className="app-header-name">{user?.name || "User"}</div>
        </div>
        <button
          className="app-header-logout"
          onClick={onLogout}
          title="Sign out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}

export default function App() {
  const [user, setUser] = useState(getStoredUser);
  const [data, setData] = useState(() => loadData(getStoredUser()?.email));
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const loc = useLocation();
  const pageTitle = PAGE_TITLES[loc.pathname] || "FinTrack";

  function updateData(newData) {
    setData(newData);
    saveData(newData, user?.email);
  }

  function handleLogin(u) {
    sessionStorage.setItem("ft_user", JSON.stringify(u));
    setUser(u);
    setData(loadData(u.email));
  }

  function handleLogout() {
    sessionStorage.removeItem("ft_user");
    setUser(null);
  }

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  if (!user) return <Auth onLogin={handleLogin} />;

  return (
    <DataContext.Provider value={{ data, updateData }}>
      <div className="app-layout">
        <Sidebar
          user={user}
          onLogout={handleLogout}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />
        <main className="main-content">
          {/* Mobile topbar */}
          <header className="mobile-topbar">
            <div className="mobile-topbar-left">
              <div
                className="sidebar-logo-icon"
                style={{ width: 30, height: 30, fontSize: 13 }}
              >
                FT
              </div>
              <span className="sidebar-logo-text" style={{ fontSize: 16 }}>
                Fin<span>Track</span>
              </span>
            </div>
            <div className="mobile-topbar-title">{pageTitle}</div>
            <div className="mobile-topbar-avatar" title={user?.name}>
              {initials}
            </div>
          </header>
          <div className="page-content">
            {/* Desktop header */}
            <AppHeader user={user} onLogout={handleLogout} />
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/savings" element={<Savings />} />
              <Route path="/loans" element={<Loans />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </main>
      </div>
      <nav className="bottom-nav">
        {[
          { to: "/", icon: LayoutDashboard, label: "Dashboard" },
          { to: "/savings", icon: PiggyBank, label: "Savings" },
          { to: "/loans", icon: CreditCard, label: "Loans" },
          { to: "/expenses", icon: Receipt, label: "Expenses" },
          { to: "/analytics", icon: BarChart3, label: "Analytics" },
        ].map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              "bottom-nav-item" + (isActive ? " active" : "")
            }
          >
            <Icon size={20} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </DataContext.Provider>
  );
}
