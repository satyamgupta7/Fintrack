import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft, ChevronRight, LogOut,
  User, Tag, LayoutGrid, Wallet, MessageSquare,
  CreditCard, Bell, Palette, Download, Shield, Trash2,
  Building2, PiggyBank, BarChart3, Lock, Receipt,
} from "lucide-react";
import { auth } from "../firebase";

// ── Manage Widgets sub-page ────────────────────────────────────────────────
function ManageWidgets({ onBack }) {
  const [widgets, setWidgets] = useState({
    bankAccounts: true, creditCards: true, investments: true,
    fixedDeposit: true, mutualFunds: true, holdings: true,
    epf: true, wallets: true, cash: true,
  });

  const items = [
    { key: "bankAccounts", label: "Bank Accounts", icon: <Building2 size={20} />, indent: false, dividerAfter: true },
    { key: "creditCards",  label: "Credit Cards",  icon: <CreditCard size={20} />, indent: false, dividerAfter: true },
    { key: "investments",  label: "Investments",   icon: <BarChart3 size={20} />, indent: false, dividerAfter: false },
    { key: "fixedDeposit", label: "Fixed Deposit", icon: <PiggyBank size={18} />, indent: true,  dividerAfter: false },
    { key: "mutualFunds",  label: "Mutual funds",  icon: <BarChart3 size={18} />, indent: true,  dividerAfter: false },
    { key: "holdings",     label: "Holdings",      icon: <BarChart3 size={18} />, indent: true,  dividerAfter: false },
    { key: "epf",          label: "EPF",           icon: <Lock size={18} />, indent: true,  dividerAfter: true },
    { key: "wallets",      label: "Wallets",       icon: <Wallet size={20} />, indent: false, dividerAfter: true },
    { key: "cash",         label: "Cash",          icon: <Receipt size={20} />, indent: false, dividerAfter: false },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", paddingBottom: 90 }}>
      {/* Topbar — matches screenshot: back arrow + large bold title */}
      <header style={{ display: "flex", alignItems: "center", gap: 14,
        padding: "16px 16px 14px", background: "var(--bg-page)" }}>
        <button onClick={onBack} style={{ background: "none", border: "none",
          cursor: "pointer", color: "var(--text-primary)", display: "flex",
          alignItems: "center", padding: 0, flexShrink: 0 }}>
          <ChevronLeft size={26} />
        </button>
        <span style={{ fontSize: 22, fontWeight: 800, color: "var(--text-primary)" }}>
          Manage Dashboard Widgets
        </span>
      </header>

      {/* Items — no card wrapper, full-width rows with bottom borders */}
      <div>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <div key={item.key} style={{
              display: "flex", alignItems: "center",
              padding: `14px 16px 14px ${item.indent ? 48 : 16}px`,
              borderBottom: item.dividerAfter ? "1px solid var(--border)" : "none",
              gap: 14,
            }}>
              <span style={{ color: "var(--text-secondary)", flexShrink: 0, display: "flex" }}>
                {item.icon}
              </span>
              <span style={{ flex: 1, fontSize: 16, fontWeight: 500, color: "var(--text-primary)" }}>
                {item.label}
              </span>
              <label className="toggle">
                <input type="checkbox" checked={widgets[item.key]}
                  onChange={() => setWidgets(p => ({ ...p, [item.key]: !p[item.key] }))} />
                <span className="toggle-slider" />
              </label>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ── Profile page ───────────────────────────────────────────────────────────
export default function Profile({ user, onLogout }) {
  const navigate = useNavigate();
  const [subPage, setSubPage] = useState(null);

  if (subPage === "widgets") return <ManageWidgets onBack={() => setSubPage(null)} />;

  // Derive display name & initials from Firebase auth
  const displayName = auth.currentUser?.displayName
    || auth.currentUser?.email?.split("@")[0]
    || user?.name || "User";
  const initials = displayName.slice(0, 2).toUpperCase();
  const email = auth.currentUser?.email || user?.email || "";

  const menuGroups = [
    {
      label: "General",
      items: [
        { icon: <User size={18} />,        label: "Account Details",          dot: true,  action: () => {} },
        { icon: <Tag size={18} />,         label: "Manage Transaction Tags",              action: () => {} },
        { icon: <LayoutGrid size={18} />,  label: "Manage Dashboard Widgets",             action: () => setSubPage("widgets") },
        { icon: <Wallet size={18} />,      label: "Manage Budget",                        action: () => {} },
        { icon: <MessageSquare size={18}/>,label: "Report Messages",                      action: () => {} },
        { icon: <CreditCard size={18} />,  label: "Bills & Subscriptions",                action: () => {} },
        { icon: <Bell size={18} />,        label: "Manage Notifications",                 action: () => {} },
        { icon: <Palette size={18} />,     label: "Theme",                                action: () => {} },
        { icon: <Download size={18} />,    label: "Export Settings",                      action: () => {} },
        { icon: <Shield size={18} />,      label: "Privacy",                              action: () => {} },
        { icon: <Trash2 size={18} />,      label: "Trash",                                action: () => {} },
      ],
    },
    {
      label: "Contact",
      items: [
        { icon: <MessageSquare size={18} />, label: "Submit feedback", action: () => {} },
      ],
    },
  ];

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-page)", paddingBottom: 90 }}>
      {/* Topbar */}
      <header style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px",
        position: "sticky", top: 0, background: "var(--bg-page)", zIndex: 100 }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none",
          cursor: "pointer", color: "var(--text-primary)", display: "flex", padding: 4 }}>
          <ChevronLeft size={24} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>Profile</span>
      </header>

      <div style={{ padding: "0 16px" }}>
        {/* User card */}
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 24,
          background: "var(--bg-card)", borderRadius: 16, padding: "16px 18px",
          border: "1px solid var(--border)" }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--gold)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 800, fontSize: 20, color: "#000", flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)",
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {displayName}
            </div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 3,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {email}
            </div>
          </div>
          <button onClick={onLogout}
            style={{ background: "var(--bg-muted)", border: "1px solid var(--border)",
              borderRadius: 10, padding: "8px 10px", cursor: "pointer",
              color: "var(--text-secondary)", display: "flex", alignItems: "center",
              flexShrink: 0, transition: "all 0.15s" }}
            title="Sign out">
            <LogOut size={16} />
          </button>
        </div>

        {/* Menu groups */}
        {menuGroups.map(group => (
          <div key={group.label} style={{ marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-secondary)",
              textTransform: "uppercase", letterSpacing: "0.8px",
              padding: "8px 4px 6px" }}>
              {group.label}
            </div>
            <div className="profile-menu-card">
              {group.items.map((item, idx) => (
                <div key={item.label} className="profile-menu-item"
                  onClick={item.action}
                  style={{ borderBottom: idx < group.items.length - 1 ? "1px solid var(--border)" : "none" }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10,
                    background: "var(--bg-muted)", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    flexShrink: 0, color: "var(--text-secondary)" }}>
                    {item.icon}
                  </div>
                  <span style={{ flex: 1, fontSize: 15, fontWeight: 600,
                    color: "var(--text-primary)" }}>
                    {item.label}
                  </span>
                  {item.dot && (
                    <div style={{ width: 8, height: 8, borderRadius: "50%",
                      background: "#E74C3C", flexShrink: 0 }} />
                  )}
                  <ChevronRight size={16} color="var(--text-muted)" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
