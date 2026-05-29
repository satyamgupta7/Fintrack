import React, { useMemo, useState } from "react";
import { useData } from "../App";
import { fmt } from "../utils/format";
import {
  Eye, EyeOff, Building2, CreditCard, TrendingUp,
  Wallet, Banknote, ChevronDown
} from "lucide-react";

export default function Dashboard() {
  const { data } = useData();
  const [balanceVisible, setBalanceVisible] = useState(true);

  const userName = (() => {
    try { return JSON.parse(sessionStorage.getItem("ft_user"))?.name?.split(" ")[0] || "User"; }
    catch { return "User"; }
  })();

  const totalSavings = useMemo(
    () => data.savings.reduce((s, g) => s + Number(g.amount || 0), 0),
    [data.savings]
  );
  const totalLoanDue = useMemo(
    () => data.loans.reduce((s, l) => s + Number(l.remaining || 0), 0),
    [data.loans]
  );
  const estimatedBalance = totalSavings - totalLoanDue;

  // Investment sub-totals (from savings data)
  const investTotal = useMemo(
    () => data.savings.filter(s => s.type === "SIP" || s.type === "Investment")
      .reduce((s, g) => s + Number(g.amount || 0), 0),
    [data.savings]
  );

  // Latest expense month
  const latestExp = useMemo(
    () => [...data.expenses].sort((a, b) => b.year - a.year || b.month - a.month)[0],
    [data.expenses]
  );

  const widgets = [
    {
      label: "Bank Accounts",
      icon: <Building2 size={22} color="rgba(255,255,255,0.7)" />,
      value: fmt(latestExp?.paycheck || 0),
      bg: "#1A2FA5",
    },
    {
      label: "Credit Cards",
      icon: <CreditCard size={22} color="rgba(255,255,255,0.7)" />,
      value: `- ${fmt(latestExp?.credit || 0)}`,
      bg: "#8B1A1A",
    },
    {
      label: "Investments",
      icon: <TrendingUp size={22} color="rgba(255,255,255,0.7)" />,
      value: fmt(investTotal),
      bg: "#1A5A2A",
    },
    {
      label: "Wallets",
      icon: <Wallet size={22} color="rgba(255,255,255,0.7)" />,
      value: fmt(0),
      bg: "#1A4A7A",
    },
    {
      label: "Cash",
      icon: <Banknote size={22} color="rgba(255,255,255,0.7)" />,
      value: fmt(0),
      bg: "#3A3A3A",
    },
  ];

  return (
    <div>
      {/* Hero balance card */}
      <div className="hero-card">
        <div className="hero-welcome">
          Welcome <strong>{userName}</strong>
        </div>
        <div className="hero-balance-label">Estimated balance</div>
        <div className="hero-balance-row">
          <div className="hero-balance">
            {balanceVisible ? fmt(estimatedBalance) : "₹••••••"}
          </div>
          <button className="hero-eye-btn" onClick={() => setBalanceVisible(v => !v)}>
            {balanceVisible ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {/* Widget grid — 2 columns */}
      <div className="widget-grid">
        {widgets.slice(0, 4).map(w => (
          <div key={w.label} className="widget-card" style={{ background: w.bg }}>
            <div className="widget-icon">{w.icon}</div>
            <div className="widget-amount">{balanceVisible ? w.value : "₹••••"}</div>
            <div className="widget-label">{w.label}</div>
          </div>
        ))}
      </div>
      {/* 5th widget — half width */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
        <div className="widget-card" style={{ background: widgets[4].bg }}>
          <div className="widget-icon">{widgets[4].icon}</div>
          <div className="widget-amount">{balanceVisible ? widgets[4].value : "₹••••"}</div>
          <div className="widget-label">{widgets[4].label}</div>
        </div>
        <div />
      </div>

      {/* Blog / quick info section */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "14px 0 8px", borderTop: "1px solid var(--border)" }}>
        <span style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>Blog</span>
        <ChevronDown size={18} color="var(--text-secondary)" />
      </div>
    </div>
  );
}
