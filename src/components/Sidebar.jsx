import React from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  PiggyBank,
  CreditCard,
  Receipt,
  Sparkles,
  FlaskConical,
  LogOut,
  X,
} from "lucide-react";

const navItems = [
  { to: "/", icon: LayoutDashboard, label: "Dashboard" },
  { to: "/savings", icon: PiggyBank, label: "Savings" },
  { to: "/loans", icon: CreditCard, label: "Loans" },
  { to: "/expenses", icon: Receipt, label: "Expenses" },
  { to: "/ai-insights", icon: Sparkles, label: "AI Insights" },
  { to: "/simulator", icon: FlaskConical, label: "Simulator" },
];

export default function Sidebar({ user, onLogout, isOpen, onClose }) {
  const initials = user?.name
    ? user.name
        .split(" ")
        .map((w) => w[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={onClose} />}
      <aside className={"sidebar" + (isOpen ? " sidebar-open" : "")}>
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">FT</div>
        <div className="sidebar-logo-text">
          Fin<span>Track</span>
        </div>
        <button className="sidebar-close" onClick={onClose}><X size={18} /></button>
      </div>

      {/* Nav */}
      {navItems.map(({ to, icon: Icon, label }) => (
        <NavLink
          key={to}
          to={to}
          onClick={onClose}
          className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}
        >
          <Icon size={18} />
          {label}
        </NavLink>
      ))}

      {/* User footer */}
      <div className="sidebar-footer">
        <div className="sidebar-avatar">{initials}</div>
        <div>
          <div className="sidebar-user-name">{user?.name || "User"}</div>
          <div className="sidebar-user-email">{user?.email || ""}</div>
        </div>
        <button className="sidebar-logout" onClick={onLogout} title="Sign out">
          <LogOut size={16} />
        </button>
      </div>
      </aside>
    </>
  );
}
