import React, { useState, useEffect, createContext, useContext } from "react";
import { Routes, Route, Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import { LayoutDashboard, TrendingUp, CreditCard, Receipt, User } from "lucide-react";
import Dashboard from "./components/Dashboard";
import Investments from "./components/Investments";
import Loans from "./components/Loans";
import Expenses from "./components/Expenses";
import Profile from "./components/Profile";
import Auth from "./components/Auth";
import { loadData, saveData } from "./utils/storage";

export const DataContext = createContext(null);
export function useData() { return useContext(DataContext); }

const PAGE_TITLES = {
  "/": "Dashboard",
  "/investments": "Investments",
  "/loans": "Loans",
  "/expenses": "Expenses",
  "/profile": "Profile",
};

function Topbar({ user, pageTitle }) {
  const navigate = useNavigate();
  const initials = user && user.name
    ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "U";
  return (
    <header className="topbar">
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 28, height: 28, background: "var(--gold)", borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 900, fontSize: 11, color: "#000" }}>FT</div>
      </div>
      <span className="topbar-title">{pageTitle}</span>
      <button className="topbar-profile-btn" onClick={() => navigate("/profile")} title="Profile">
        {initials}
      </button>
    </header>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [data, setData] = useState(null);
  const [authReady, setAuthReady] = useState(false);
  const loc = useLocation();
  const pageTitle = PAGE_TITLES[loc.pathname] || "FinTrack";

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const u = { uid: firebaseUser.uid, name: firebaseUser.displayName || firebaseUser.email.split("@")[0], email: firebaseUser.email };
        setUser(u);
        const d = await loadData(firebaseUser.uid);
        setData(d);
      } else {
        setUser(null);
        setData(null);
      }
      setAuthReady(true);
    });
    return unsub;
  }, []);

  async function updateData(newData) {
    setData(newData);
    if (user) await saveData(newData, user.uid);
  }
  async function handleLogin(u) {
    setUser(u);
    const d = await loadData(u.uid);
    setData(d);
  }
  async function handleLogout() {
    await signOut(auth);
    setUser(null);
    setData(null);
  }

  if (!authReady) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-page)", display: "flex",
        alignItems: "center", justifyContent: "center", color: "var(--gold)", fontSize: 18, fontWeight: 700 }}>
        Loading...
      </div>
    );
  }

  if (!user || !data) return <Auth onLogin={handleLogin} />;

  const isProfile = loc.pathname === "/profile";

  return (
    <DataContext.Provider value={{ data, updateData, user }}>
      <div className="app-shell">
        <nav className="desktop-sidebar">
          <div className="desktop-sidebar-logo">
            <div className="desktop-sidebar-logo-icon">FT</div>
            <span className="desktop-sidebar-logo-text">FinTrack</span>
          </div>
          {[
            { to: "/", icon: <LayoutDashboard size={18} />, label: "Dashboard" },
            { to: "/investments", icon: <TrendingUp size={18} />, label: "Investments" },
            { to: "/loans", icon: <CreditCard size={18} />, label: "Loans" },
            { to: "/expenses", icon: <Receipt size={18} />, label: "Expenses" },
          ].map(({ to, icon, label }) => (
            <NavLink key={to} to={to} end={to === "/"}
              className={({ isActive }) => "desktop-nav-item" + (isActive ? " active" : "")}>
              {icon} {label}
            </NavLink>
          ))}
          <div style={{ marginTop: "auto", borderTop: "1px solid var(--border)", paddingTop: 12 }}>
            <NavLink to="/profile"
              className={({ isActive }) => "desktop-nav-item" + (isActive ? " active" : "")}>
              <User size={18} /> Profile
            </NavLink>
          </div>
        </nav>

        <div className="desktop-main">
          {!isProfile && <Topbar user={user} pageTitle={pageTitle} />}
          <div className={isProfile ? "" : "page-content"}>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/investments" element={<Investments />} />
              <Route path="/loans" element={<Loans />} />
              <Route path="/expenses" element={<Expenses />} />
              <Route path="/profile" element={<Profile user={user} onLogout={handleLogout} />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </div>

        <nav className="bottom-nav">
          {[
            { to: "/", icon: LayoutDashboard, label: "Dashboard" },
            { to: "/investments", icon: TrendingUp, label: "Investment" },
            { to: "/loans", icon: CreditCard, label: "Loan" },
            { to: "/expenses", icon: Receipt, label: "Expense" },
          ].map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === "/"}
              className={({ isActive }) => "bottom-nav-item" + (isActive ? " active" : "")}>
              <div className="nav-icon-wrap"><Icon size={20} /></div>
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </DataContext.Provider>
  );
}
