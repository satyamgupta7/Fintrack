import React, { useState, useMemo } from "react";
import { useData } from "../App";
import { fmt } from "../utils/format";
import {
  Plus, Trash2, Pencil, Eye, EyeOff,
  PiggyBank, BarChart3, Lock, TrendingUp
} from "lucide-react";

const INVEST_TYPES = ["Fixed Deposit", "Mutual Fund", "Holdings", "EPF", "SIP", "Goal", "Other"];

const TYPE_META = {
  "Fixed Deposit": { icon: <PiggyBank size={20} />, bg: "#1A5A2A", color: "#2ECC71" },
  "Mutual Fund":   { icon: <BarChart3 size={20} />, bg: "#3A3A2A", color: "#C9A227" },
  "Holdings":      { icon: <BarChart3 size={20} />, bg: "#1A2A4A", color: "#5DADE2" },
  "EPF":           { icon: <Lock size={20} />,      bg: "#1A4A3A", color: "#1ABC9C" },
  "SIP":           { icon: <TrendingUp size={20} />, bg: "#1A5A2A", color: "#2ECC71" },
  "Goal":          { icon: <PiggyBank size={20} />, bg: "#1A5A2A", color: "#2ECC71" },
  "Other":         { icon: <BarChart3 size={20} />, bg: "#2A2A2A", color: "#A0A0A0" },
};

const empty = { name: "", type: "Fixed Deposit", amount: "", goal: "", monthlyAmount: "", startDate: "", date: "" };

export default function Investments() {
  const { data, updateData } = useData();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  const totalInvest = useMemo(
    () => data.savings.reduce((s, g) => s + Number(g.amount || 0), 0),
    [data.savings]
  );

  // Group by type for display
  const grouped = useMemo(() => {
    const map = {};
    data.savings.forEach(item => {
      const t = item.type || "Other";
      if (!map[t]) map[t] = [];
      map[t].push(item);
    });
    return map;
  }, [data.savings]);

  // Summary cards matching screenshot
  const summaryCards = [
    {
      label: "Fixed Deposit",
      key: "Fixed Deposit",
      icon: <PiggyBank size={22} color="rgba(255,255,255,0.8)" />,
      bg: "#1A5A2A",
    },
    {
      label: "Mutual funds",
      key: "Mutual Fund",
      icon: <BarChart3 size={22} color="rgba(255,255,255,0.6)" />,
      bg: "#3A3A2A",
    },
    {
      label: "Holdings",
      key: "Holdings",
      icon: <BarChart3 size={22} color="rgba(255,255,255,0.7)" />,
      bg: "#1A2A4A",
    },
    {
      label: "EPF",
      key: "EPF",
      icon: <Lock size={22} color="rgba(255,255,255,0.8)" />,
      bg: "#1A4A3A",
    },
  ];

  function getTypeTotal(key) {
    return data.savings
      .filter(s => s.type === key || (key === "Fixed Deposit" && s.type === "Goal") || (key === "Mutual Fund" && s.type === "SIP"))
      .reduce((s, g) => s + Number(g.amount || 0), 0);
  }

  function openAdd() { setForm(empty); setEditId(null); setShowModal(true); }
  function openEdit(item) {
    setForm({ name: item.name, type: item.type || "Goal", amount: item.amount,
      goal: item.goal || "", monthlyAmount: item.monthlyAmount || "", startDate: item.startDate || "", date: item.date || "" });
    setEditId(item.id);
    setShowModal(true);
  }
  function handleSave() {
    if (!form.name || !form.amount) return;
    const parsed = { ...form, amount: +form.amount, goal: +form.goal || 0, monthlyAmount: +form.monthlyAmount || 0 };
    if (editId) {
      updateData({ ...data, savings: data.savings.map(s => s.id === editId ? { ...s, ...parsed } : s) });
    } else {
      updateData({ ...data, savings: [...data.savings, { ...parsed, id: Date.now() }] });
    }
    setShowModal(false);
  }
  function handleDelete(id) {
    updateData({ ...data, savings: data.savings.filter(s => s.id !== id) });
  }

  return (
    <div>
      {/* Header card */}
      <div className="invest-header">
        <div className="invest-header-label">Total Investments</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div className="invest-header-amount">
            {balanceVisible ? fmt(totalInvest) : "₹••••••"}
          </div>
          <button className="hero-eye-btn" onClick={() => setBalanceVisible(v => !v)}>
            {balanceVisible ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
      </div>

      {/* 2x2 summary cards */}
      <div className="widget-grid" style={{ marginBottom: 20 }}>
        {summaryCards.map(card => (
          <div key={card.label} className="widget-card" style={{ background: card.bg }}>
            <div className="widget-icon">{card.icon}</div>
            <div className="widget-amount">
              {balanceVisible ? fmt(getTypeTotal(card.key)) : "₹••••"}
            </div>
            <div className="widget-label">{card.label}</div>
          </div>
        ))}
      </div>

      {/* All investments list */}
      <div className="page-header">
        <span className="section-title-sm" style={{ margin: 0 }}>All Investments</span>
        <button className="btn btn-gold" onClick={openAdd} style={{ padding: "8px 14px", fontSize: 12 }}>
          <Plus size={14} /> Add
        </button>
      </div>

      {data.savings.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-secondary)" }}>
          <PiggyBank size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div>No investments yet. Add your first one.</div>
        </div>
      ) : (
        <div className="list-card">
          {data.savings.map((item, idx) => {
            const meta = TYPE_META[item.type] || TYPE_META["Other"];
            const pct = item.goal > 0 ? Math.min(100, Math.round((item.amount / item.goal) * 100)) : 0;
            return (
              <div key={item.id} className="list-row">
                <div className="list-icon" style={{ background: meta.bg }}>
                  {React.cloneElement(meta.icon, { color: meta.color })}
                </div>
                <div className="list-info">
                  <div className="list-name">{item.name}</div>
                  <div className="list-sub">
                    {item.type}
                    {item.goal > 0 && ` · ${pct}% of ${fmt(item.goal)}`}
                    {item.monthlyAmount > 0 && ` · ₹${Number(item.monthlyAmount).toLocaleString("en-IN")}/mo`}
                  </div>
                  {item.goal > 0 && (
                    <div className="progress-bg">
                      <div className="progress-fill" style={{ width: pct + "%", background: meta.color }} />
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                  <div className="list-amount" style={{ color: meta.color }}>
                    {balanceVisible ? fmt(item.amount) : "₹••••"}
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button className="btn-icon" onClick={() => openEdit(item)}><Pencil size={12} /></button>
                    <button className="btn-icon-danger" onClick={() => handleDelete(item.id)}><Trash2 size={12} /></button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">{editId ? "Edit Investment" : "Add Investment"}</div>
            <div className="form-group">
              <label>Name</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. SBI Fixed Deposit" />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                {INVEST_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label>Current Amount (₹)</label>
                <input type="number" value={form.amount} onChange={e => setForm(p => ({ ...p, amount: e.target.value }))} placeholder="0" />
              </div>
              <div className="form-group">
                <label>Target / Goal (₹)</label>
                <input type="number" value={form.goal} onChange={e => setForm(p => ({ ...p, goal: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label>Monthly SIP (₹)</label>
                <input type="number" value={form.monthlyAmount} onChange={e => setForm(p => ({ ...p, monthlyAmount: e.target.value }))} placeholder="0" />
              </div>
              <div className="form-group">
                <label>Start Date</label>
                <input type="date" value={form.startDate} onChange={e => setForm(p => ({ ...p, startDate: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button className="btn btn-outline-dark" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-gold" style={{ flex: 1 }} onClick={handleSave}>
                {editId ? "Save" : "Add"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
