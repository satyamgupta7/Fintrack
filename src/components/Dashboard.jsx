import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useData } from "../App";
import { fmt } from "../utils/format";
import { Eye, EyeOff, PiggyBank, TrendingUp, Banknote, Landmark } from "lucide-react";

import { auth } from "../firebase";

export default function Dashboard() {
  const { data, updateData } = useData();
  const navigate = useNavigate();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [showSavingModal, setShowSavingModal] = useState(false);
  const [savingInput, setSavingInput] = useState("");

  const userName = (() => {
    const raw = auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "User";
    // from email local part: "satyamgupta.tech07" → "satyamgupta" → "Satyamgupta"
    const first = raw.split(".")[0];
    return (first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()).slice(0, 6);
  })();

  const inv = data.investments || { savingAccount: 200000, fixedDeposit: 0, mutualFund: 0, cash: 0 };

  const totalInvestments = inv.fixedDeposit + inv.mutualFund + inv.cash;

  const totalLoanDue = useMemo(
    () => data.loans.reduce((s, l) => s + Number(l.remaining || 0), 0),
    [data.loans]
  );

  const netWorth = totalInvestments - totalLoanDue;

  const latestExp = useMemo(
    () => [...data.expenses].sort((a, b) => b.year - a.year || b.month - a.month)[0],
    [data.expenses]
  );

  const totalExpenses = useMemo(() => {
    const KEYS = ["emi","invest","rent","insurance","medicine","personal","credit","family"];
    return latestExp ? KEYS.reduce((s, k) => s + Number(latestExp[k] || 0), 0) : 0;
  }, [latestExp]);

  function openSavingModal() {
    setSavingInput(String(inv.savingAccount));
    setShowSavingModal(true);
  }
  function saveSavingAccount() {
    const val = Number(savingInput) || 0;
    updateData({ ...data, investments: { ...inv, savingAccount: val } });
    setShowSavingModal(false);
  }

  const widgets = [
    {
      label: "Saving Account",
      icon: <PiggyBank size={22} color="rgba(255,255,255,0.7)" />,
      value: fmt(inv.savingAccount),
      bg: "#1A2FA5",
      onClick: openSavingModal,
    },
    {
      label: "Investments",
      icon: <TrendingUp size={22} color="rgba(255,255,255,0.7)" />,
      value: fmt(totalInvestments),
      bg: "#1A5A2A",
      onClick: () => navigate("/investments"),
    },
    {
      label: "Loans",
      icon: <Landmark size={22} color="rgba(255,255,255,0.7)" />,
      value: `- ${fmt(totalLoanDue)}`,
      bg: "#8B1A1A",
      onClick: () => navigate("/loans"),
    },
    {
      label: "Expenses",
      icon: <Banknote size={22} color="rgba(255,255,255,0.7)" />,
      value: fmt(totalExpenses),
      bg: "#3A3A3A",
      onClick: () => navigate("/expenses"),
    },
  ];

  return (
    <div>
      {/* Hero card */}
      <div className="hero-card">
        <div className="hero-welcome">Welcome <strong>{userName}</strong></div>
        <div className="hero-balance-label">Net worth</div>
        <div className="hero-balance-row">
          <div className="hero-balance">
            {balanceVisible ? fmt(netWorth) : "₹••••••"}
          </div>
          <button className="hero-eye-btn" onClick={() => setBalanceVisible(v => !v)}>
            {balanceVisible ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {/* 2×2 widget grid */}
      <div className="widget-grid" style={{ marginBottom: 20 }}>
        {widgets.map(w => (
          <div key={w.label} className="widget-card"
            style={{ background: w.bg, cursor: "pointer" }}
            onClick={w.onClick}>
            <div className="widget-icon">{w.icon}</div>
            <div className="widget-amount">{balanceVisible ? w.value : "₹••••"}</div>
            <div className="widget-label">{w.label}</div>
          </div>
        ))}
      </div>

      {/* Saving Account edit modal */}
      {showSavingModal && (
        <div className="modal-overlay" onClick={() => setShowSavingModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">Edit Saving Account</div>
            <div className="form-group">
              <label>Current Balance (₹)</label>
              <input
                type="number"
                value={savingInput}
                onChange={e => setSavingInput(e.target.value)}
                placeholder="200000"
                autoFocus
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button className="btn btn-outline-dark" style={{ flex: 1 }} onClick={() => setShowSavingModal(false)}>Cancel</button>
              <button className="btn btn-gold" style={{ flex: 1 }} onClick={saveSavingAccount}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
