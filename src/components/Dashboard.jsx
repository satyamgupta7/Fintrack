import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../App";
import { fmt } from "../utils/format";
import { Eye, EyeOff, Building2, TrendingUp, Banknote, Landmark } from "lucide-react";

export default function Dashboard() {
  const { data } = useData();
  const navigate = useNavigate();
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

  const investTotal = useMemo(
    () => data.savings.reduce((s, g) => s + Number(g.amount || 0), 0),
    [data.savings]
  );

  const latestExp = useMemo(
    () => [...data.expenses].sort((a, b) => b.year - a.year || b.month - a.month)[0],
    [data.expenses]
  );

  const totalExpenses = useMemo(() => {
    const KEYS = ["emi","invest","rent","insurance","medicine","personal","credit","family"];
    return latestExp ? KEYS.reduce((s, k) => s + Number(latestExp[k] || 0), 0) : 0;
  }, [latestExp]);

  const widgets = [
    {
      label: "Bank Accounts",
      icon: <Building2 size={22} color="rgba(255,255,255,0.7)" />,
      value: fmt(latestExp?.paycheck || 0),
      bg: "#1A2FA5",
      route: "/expenses",
    },
    {
      label: "Investments",
      icon: <TrendingUp size={22} color="rgba(255,255,255,0.7)" />,
      value: fmt(investTotal),
      bg: "#1A5A2A",
      route: "/investments",
    },
    {
      label: "Loans",
      icon: <Landmark size={22} color="rgba(255,255,255,0.7)" />,
      value: `- ${fmt(totalLoanDue)}`,
      bg: "#8B1A1A",
      route: "/loans",
    },
    {
      label: "Expenses",
      icon: <Banknote size={22} color="rgba(255,255,255,0.7)" />,
      value: fmt(totalExpenses),
      bg: "#3A3A3A",
      route: "/expenses",
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

      {/* 2×2 widget grid — each card navigates to its section */}
      <div className="widget-grid" style={{ marginBottom: 20 }}>
        {widgets.map(w => (
          <div
            key={w.label}
            className="widget-card"
            style={{ background: w.bg, cursor: "pointer" }}
            onClick={() => navigate(w.route)}
          >
            <div className="widget-icon">{w.icon}</div>
            <div className="widget-amount">{balanceVisible ? w.value : "₹••••"}</div>
            <div className="widget-label">{w.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
