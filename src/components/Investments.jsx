import React, { useState } from "react";
import { useData } from "../App";
import { fmt } from "../utils/format";
import { Eye, EyeOff, PiggyBank, BarChart3, Banknote } from "lucide-react";
import AppModal from "./shared/AppModal";
import AmountInput from "./shared/AmountInput";

const CARDS = [
  { key: "fixedDeposit", label: "Fixed Deposit", icon: PiggyBank, bg: "#1A5A2A", color: "#2ECC71" },
  { key: "mutualFund",   label: "Mutual Fund",   icon: BarChart3, bg: "#3A3A2A", color: "#C9A227" },
  { key: "cash",         label: "Cash",          icon: Banknote,  bg: "#3A3A3A", color: "#A0A0A0" },
];

const ICON_BG = {
  fixedDeposit: "rgba(46,204,113,0.15)",
  mutualFund:   "rgba(201,162,39,0.15)",
  cash:         "rgba(160,160,160,0.15)",
};

export default function Investments() {
  const { data, updateData } = useData();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [editKey, setEditKey] = useState(null);
  const [rawVal, setRawVal] = useState(0);

  const inv = data.investments || { savingAccount: 200000, fixedDeposit: 0, mutualFund: 0, cash: 0 };
  const total = CARDS.reduce((s, c) => s + Number(inv[c.key] || 0), 0);
  const editCard = CARDS.find(c => c.key === editKey);

  function openEdit(key) { setEditKey(key); setRawVal(inv[key] || 0); }
  function handleSave() {
    updateData({ ...data, investments: { ...inv, [editKey]: rawVal } });
    setEditKey(null);
  }

  return (
    <div>
      {/* Header */}
      <div className="invest-header">
        <div className="invest-header-label">Total Investments</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="invest-header-amount">{balanceVisible ? fmt(total) : "₹••••••"}</div>
          <button className="hero-eye-btn" onClick={() => setBalanceVisible(v => !v)}>
            {balanceVisible ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {/* Cards */}
      <div className="widget-grid" style={{ marginBottom: 20 }}>
        {CARDS.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.key} className="widget-card"
              style={{ background: card.bg, cursor: "pointer" }}
              onClick={() => openEdit(card.key)}>
              <div className="widget-icon"><Icon size={22} color="rgba(255,255,255,0.7)" /></div>
              <div className="widget-amount">{balanceVisible ? fmt(inv[card.key] || 0) : "₹••••"}</div>
              <div className="widget-label">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Edit modal */}
      <AppModal
        open={!!editKey}
        onClose={() => setEditKey(null)}
        icon={editCard ? React.createElement(editCard.icon, { size: 26, color: editCard.color }) : null}
        iconBg={editKey ? ICON_BG[editKey] : undefined}
        title={editCard?.label || ""}
        subtitle="Update the current amount"
        onSave={handleSave}
      >
        <AmountInput value={rawVal} onChange={setRawVal} autoFocus />
      </AppModal>
    </div>
  );
}
