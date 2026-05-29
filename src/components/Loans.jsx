import React, { useState, useMemo } from "react";
import { useData } from "../App";
import { fmt } from "../utils/format";
import { Plus, Trash2, Pencil, Eye, EyeOff, CreditCard, Home, Car, GraduationCap, Banknote, FileText } from "lucide-react";

const LOAN_TYPES = ["Home", "Car", "Personal", "Credit Card", "Education", "Other"];
const LOAN_ICONS = {
  Home: <Home size={20} />, Car: <Car size={20} />,
  "Credit Card": <CreditCard size={20} />, Education: <GraduationCap size={20} />,
  Personal: <Banknote size={20} />, Other: <FileText size={20} />,
};
const LOAN_COLORS = {
  Home: "#5DADE2", Car: "#F39C12", "Credit Card": "#E74C3C",
  Education: "#9B59B6", Personal: "#E67E22", Other: "#95A5A6",
};

const empty = { name: "", principal: "", remaining: "", rate: "", emi: "", dueDate: "", loanType: "Personal" };

function loanMonths(remaining, emi, rate) {
  const r = Number(rate) / 100 / 12;
  const rem = Number(remaining), e = Number(emi);
  if (r > 0 && e > r * rem) return Math.ceil(-Math.log(1 - (r * rem) / e) / Math.log(1 + r));
  return e > 0 ? Math.ceil(rem / e) : 0;
}

export default function Loans() {
  const { data, updateData } = useData();
  const [balanceVisible, setBalanceVisible] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(empty);
  const [editId, setEditId] = useState(null);

  const totalRemaining = useMemo(() => data.loans.reduce((s, l) => s + Number(l.remaining || 0), 0), [data.loans]);
  const totalEmi = useMemo(() => data.loans.reduce((s, l) => s + Number(l.emi || 0), 0), [data.loans]);

  function openAdd() { setForm(empty); setEditId(null); setShowModal(true); }
  function openEdit(l) {
    setForm({ name: l.name, principal: l.principal, remaining: l.remaining,
      rate: l.rate, emi: l.emi, dueDate: l.dueDate || "", loanType: l.loanType || "Personal" });
    setEditId(l.id); setShowModal(true);
  }
  function handleSave() {
    if (!form.name || !form.principal) return;
    const parsed = { ...form, principal: +form.principal, remaining: +form.remaining, rate: +form.rate, emi: +form.emi };
    if (editId) {
      updateData({ ...data, loans: data.loans.map(l => l.id === editId ? { ...l, ...parsed } : l) });
    } else {
      updateData({ ...data, loans: [...data.loans, { ...parsed, id: Date.now() }] });
    }
    setShowModal(false);
  }
  function handleDelete(id) { updateData({ ...data, loans: data.loans.filter(l => l.id !== id) }); }

  return (
    <div>
      {/* Header card */}
      <div className="loan-header-card">
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>Total Outstanding</div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 34, fontWeight: 700, color: "#fff", letterSpacing: "-1px" }}>
            {balanceVisible ? fmt(totalRemaining) : "₹••••••"}
          </div>
          <button className="hero-eye-btn" onClick={() => setBalanceVisible(v => !v)}>
            {balanceVisible ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        </div>
        <div style={{ display: "flex", gap: 20, marginTop: 12 }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Monthly EMI</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{fmt(totalEmi)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Active Loans</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#fff" }}>{data.loans.length}</div>
          </div>
        </div>
      </div>

      {/* List header */}
      <div className="page-header">
        <span className="section-title-sm" style={{ margin: 0 }}>Active Loans</span>
        <button className="btn btn-gold" onClick={openAdd} style={{ padding: "8px 14px", fontSize: 12 }}>
          <Plus size={14} /> Add Loan
        </button>
      </div>

      {data.loans.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-secondary)" }}>
          <CreditCard size={40} style={{ opacity: 0.3, marginBottom: 12 }} />
          <div>No loans added yet.</div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
          {data.loans.map(loan => {
            const pct = loan.principal > 0
              ? Math.min(100, Math.round(((Number(loan.principal) - Number(loan.remaining)) / Number(loan.principal)) * 100))
              : 0;
            const months = loanMonths(loan.remaining, loan.emi, loan.rate);
            const loanType = loan.loanType || "Personal";
            const color = LOAN_COLORS[loanType] || "#95A5A6";
            const icon = LOAN_ICONS[loanType] || LOAN_ICONS["Other"];
            const dueStr = loan.dueDate
              ? new Date(loan.dueDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })
              : null;

            return (
              <div key={loan.id} style={{ background: "var(--bg-card)", borderRadius: 16,
                border: "1px solid var(--border)", padding: 16 }}>
                {/* Header */}
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: color + "22",
                      display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      {React.cloneElement(icon, { color })}
                    </div>
                    <div>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>{loan.name}</div>
                      <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                        {loanType} · {loan.rate}% p.a.
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button className="btn-icon" onClick={() => openEdit(loan)}><Pencil size={13} /></button>
                    <button className="btn-icon-danger" onClick={() => handleDelete(loan.id)}><Trash2 size={13} /></button>
                  </div>
                </div>

                {/* Stats */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginBottom: 12 }}>
                  {[
                    { label: "Principal", value: fmt(loan.principal), color: "var(--text-secondary)" },
                    { label: "Remaining", value: fmt(loan.remaining), color: "#E74C3C" },
                    { label: "EMI/mo", value: fmt(loan.emi), color: "#F39C12" },
                  ].map(s => (
                    <div key={s.label} style={{ background: "var(--bg-muted)", borderRadius: 10, padding: "10px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: s.color }}>{s.value}</div>
                      <div style={{ fontSize: 10, color: "var(--text-secondary)", marginTop: 2 }}>{s.label}</div>
                    </div>
                  ))}
                </div>

                {/* Progress */}
                <div style={{ marginBottom: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 5 }}>
                    <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{pct}% paid off</span>
                    <span style={{ fontSize: 11, color: "var(--text-secondary)" }}>{months} months left</span>
                  </div>
                  <div className="progress-bg" style={{ height: 6 }}>
                    <div className="progress-fill" style={{ width: pct + "%", background: "#2ECC71" }} />
                  </div>
                </div>

                {dueStr && (
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 8 }}>
                    Next EMI: <span style={{ color: "#F39C12", fontWeight: 600 }}>{dueStr}</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">{editId ? "Edit Loan" : "Add Loan"}</div>
            <div className="form-group">
              <label>Loan Name</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} placeholder="e.g. Home Loan" />
            </div>
            <div className="form-group">
              <label>Loan Type</label>
              <select value={form.loanType} onChange={e => setForm(p => ({ ...p, loanType: e.target.value }))}>
                {LOAN_TYPES.map(t => <option key={t}>{t}</option>)}
              </select>
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label>Principal (₹)</label>
                <input type="number" value={form.principal} onChange={e => setForm(p => ({ ...p, principal: e.target.value }))} placeholder="0" />
              </div>
              <div className="form-group">
                <label>Remaining (₹)</label>
                <input type="number" value={form.remaining} onChange={e => setForm(p => ({ ...p, remaining: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <div className="form-row-2">
              <div className="form-group">
                <label>Interest Rate (%)</label>
                <input type="number" value={form.rate} onChange={e => setForm(p => ({ ...p, rate: e.target.value }))} placeholder="0" />
              </div>
              <div className="form-group">
                <label>Monthly EMI (₹)</label>
                <input type="number" value={form.emi} onChange={e => setForm(p => ({ ...p, emi: e.target.value }))} placeholder="0" />
              </div>
            </div>
            <div className="form-group">
              <label>Next Due Date</label>
              <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} />
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
              <button className="btn btn-outline-dark" style={{ flex: 1 }} onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-gold" style={{ flex: 1 }} onClick={handleSave}>{editId ? "Save" : "Add"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
