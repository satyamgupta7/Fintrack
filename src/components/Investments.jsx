import React, { useState } from "react";
import { useData } from "../App";
import { fmt } from "../utils/format";
import { Eye, EyeOff, PiggyBank, BarChart3, Banknote } from "lucide-react";

const CARDS = [
  { key: "fixedDeposit",  label: "Fixed Deposit",  icon: PiggyBank,  bg: "#1A5A2A", color: "#2ECC71" },
  { key: "mutualFund",    label: "Mutual Fund",    icon: BarChart3,  bg: "#3A3A2A", color: "#C9A227" },
  { key: "cash",          label: "Cash",           icon: Banknote,   bg: "#3A3A3A", color: "#A0A0A0" },
];

export default function Investments() {
  const { data, updateData } = useData();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [editKey, setEditKey] = useState(null);   // which card is being edited
  const [inputVal, setInputVal] = useState("");

  const inv = data.investments || { savingAccount: 200000, fixedDeposit: 0, mutualFund: 0, cash: 0 };

  const total = CARDS.reduce((s, c) => s + Number(inv[c.key] || 0), 0);

  function openEdit(key) {
    setEditKey(key);
    setInputVal(String(inv[key] || 0));
  }
  function handleSave() {
    const val = Number(inputVal) || 0;
    updateData({ ...data, investments: { ...inv, [editKey]: val } });
    setEditKey(null);
  }

  const editCard = CARDS.find(c => c.key === editKey);

  return (
    <div>
      {/* Header */}
      <div className="invest-header">
        <div className="invest-header-label">Total Investments</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="invest-header-amount">
            {balanceVisible ? fmt(total) : "₹••••••"}
          </div>
          <button className="hero-eye-btn" onClick={() => setBalanceVisible(v => !v)}>
            {balanceVisible ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {/* 2×2 cards — tap to edit */}
      <div className="widget-grid" style={{ marginBottom: 20 }}>
        {CARDS.map(card => {
          const Icon = card.icon;
          return (
            <div key={card.key} className="widget-card"
              style={{ background: card.bg, cursor: "pointer" }}
              onClick={() => openEdit(card.key)}>
              <div className="widget-icon">
                <Icon size={22} color="rgba(255,255,255,0.7)" />
              </div>
              <div className="widget-amount">
                {balanceVisible ? fmt(inv[card.key] || 0) : "₹••••"}
              </div>
              <div className="widget-label">{card.label}</div>
            </div>
          );
        })}
      </div>

      {/* Edit modal */}
      {editKey && (
        <div className="modal-overlay" onClick={() => setEditKey(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">Edit {editCard?.label}</div>
            <div className="form-group">
              <label>Amount (₹)</label>
              <input
                type="number"
                value={inputVal}
                onChange={e => setInputVal(e.target.value)}
                placeholder="0"
                autoFocus
              />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button className="btn btn-outline-dark" style={{ flex: 1 }} onClick={() => setEditKey(null)}>Cancel</button>
              <button className="btn btn-gold" style={{ flex: 1 }} onClick={handleSave}>Save</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
