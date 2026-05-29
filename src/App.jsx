import React, { useState, useEffect, createContext, useContext } from "react";
import { Routes, Route, Navigate, NavLink, useLocation, useNavigate } from "react-router-dom";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { auth } from "./firebase";
import {
  LayoutDashboard, TrendingUp, CreditCard, Receipt,
  User, ChevronLeft, Tag, LayoutGrid,
  Wallet, Bell, Palette, Download, Shield, Trash2,
  MessageSquare, LogOut, ChevronRight,
  Building2, PiggyBank, BarChart3, Lock
} from "lucide-react";
import Dashboard from "./components/Dashboard";
import Investments from "./components/Investments";
import Loans from "./components/Loans";
import Expenses from "./components/Expenses";
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

function ManageWidgets({ onBack }) {
  const [widgets, setWidgets] = useState({
    bankAccounts: true, creditCards: true, investments: true,
    fixedDeposit: true, mutualFunds: true, holdings: true,
    epf: true, wallets: true, cash: true,
  });
  const items = [
    { key: "bankAccounts", label: "Bank Accounts", icon: <Building2 size={16} />, indent: false },
    { key: "creditCards",  label: "Credit Cards",  icon: <CreditCard size={16} />, indent: false },
    { key: "investments",  label: "Investments",   icon: <BarChart3 size={16} />, indent: false },
    { key: "fixedDeposit", label: "Fixed Deposit", icon: <PiggyBank size={16} />, indent: true },
    { key: "mutualFunds",  label: "Mutual funds",  icon: <BarChart3 size={16} />, indent: true },
    { key: "holdings",     label: "Holdings",      icon: <BarChart3 size={16} />, indent: true },
    { key: "epf",          label: "EPF",           icon: <Lock size={16} />, indent: true },
    { key: "wallets",      label: "Wallets",       icon: <Wallet size={16} />, indent: false },
    { key: "cash",         label: "Cash",          icon: <Receipt size={16} />, indent: false },
  ];
  return (
    <div style={{ padding: "0 16px 90px" }}>
      <div className="profile-header">
        <button className="profile-back" onClick={onBack}><ChevronLeft size={24} /></button>
        <span className="profile-header-title">Manage Dashboard Widgets</span>
      </div>
      <div className="profile-menu-card">
        {items.map(item => (
          <div key={item.key} className="widget-manage-item">
            <span className="widget-manage-icon" style={{ marginLeft: item.indent ? 20 : 0 }}>{item.icon}</span>
            <span className="widget-manage-label">{item.label}</span>
            <label className="toggle">
              <input type="checkbox" checked={widgets[item.key]}
                onChange={() => setWidgets(p => ({ ...p, [item.key]: !p[item.key] }))} />
              <span className="toggle-slider" />
            </label>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfilePage({ user, onLogout }) {
  const navigate = useNavigate();
  const [subPage, setSubPage] = useState(null);
  const initials = user && user.name
    ? user.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2) : "U";

  if (subPage === "widgets") return <ManageWidgets onBack={() => setSubPage(null)} />;

  const menuGroups = [
    {
      label: "General",
      items: [
        { icon: <User size={16} />, label: "Account Details", dot: true, action: () => {} },
        { icon: <Tag size={16} />, label: "Manage Transaction Tags", action: () => {} },
        { icon: <LayoutGrid size={16} />, label: "Manage Dashboard Widgets", action: () => setSubPage("widgets") },
        { icon: <Wallet size={16} />, label: "Manage Budget", action: () => {} },
        { icon: <MessageSquare size={16} />, label: "Report Messages", action: () => {} },
        { icon: <CreditCard size={16} />, label: "Bills & Subscriptions", action: () => {} },
        { icon: <Bell size={16} />, label: "Manage Notifications", action: () => {} },
        { icon: <Palette size={16} />, label: "Theme", action: () => {} },
        { icon: <Download size={16} />, label: "Export Settings", action: () => {} },
        { icon: <Shield size={16} />, label: "Privacy", action: () => {} },
        { icon: <Trash2 size={16} />, label: "Trash", action: () => {} },
      ],
    },
    {
      label: "Contact",
      items: [
        { icon: <MessageSquare size={16} />, label: "Submit feedback", action: () => {} },
      ],
    },
  ];

  return (
    <div className="profile-page">
      <div className="profile-header">
        <button className="profile-back" onClick={() => navigate(-1)}><ChevronLeft size={24} /></button>
        <span className="profile-header-title">Profile</span>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24,
        background: "var(--bg-card)", borderRadius: 14, padding: "16px", border: "1px solid var(--border)" }}>
        <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--gold)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 800, fontSize: 18, color: "#000", flexShrink: 0 }}>{initials}</div>
        <div>
          <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>{user ? user.name : "User"}</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginTop: 2 }}>{user ? user.email : ""}</div>
        </div>
        <button className="btn-icon" style={{ marginLeft: "auto" }} onClick={onLogout} title="Sign out">
          <LogOut size={16} />
        </button>
      </div>
      {menuGroups.map(group => (
        <div key={group.label}>
          <div className="profile-section-label">{group.label}</div>
          <div className="profile-menu-card">
            {group.items.map(item => (
              <div key={item.label} className="profile-menu-item" onClick={item.action}>
                <div className="profile-menu-icon">{item.icon}</div>
                <span className="profile-menu-text">{item.label}</span>
                {item.dot && <div className="profile-dot" />}
                <ChevronRight size={16} color="var(--text-muted)" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

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

  // Listen to Firebase auth state
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
    <DataContext.Provider value={{ data, updateData }}>
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
              <Route path="/profile" element={<ProfilePage user={user} onLogout={handleLogout} />} />
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
