import React, { useState, useMemo } from "react";
import { useData } from "../App";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { fmt } from "../utils/format";

const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
const ROWS = [
  { key: "emi",       label: "EMI",          group: "fixed" },
  { key: "invest",    label: "Invest",        group: "fixed" },
  { key: "rent",      label: "Rent",          group: "fixed" },
  { key: "insurance", label: "Insurance",     group: "fixed" },
  { key: "medicine",  label: "Medicine",      group: "fixed" },
  { key: "personal",  label: "Personal",      group: "other" },
  { key: "credit",    label: "Credit",        group: "other" },
  { key: "family",    label: "Family/Cash",   group: "other" },
];

const emptyForm = { year: 2026, month: 1, paycheck: "", emi: "", invest: "", rent: "",
  insurance: "", medicine: "", personal: "", credit: "", family: "" };

function totalSpend(e) { return ROWS.reduce((s, r) => s + Number(e[r.key] || 0), 0); }
function saving(e) { return Number(e.paycheck || 0) - totalSpend(e); }

export default function Expenses() {
  const { data, updateData } = useData();
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState(null);

  const years = [...new Set(data.expenses.map(e => e.year))].sort();
  const [selectedYear, setSelectedYear] = useState(years[years.length - 1] || 2026);

  const monthsData = useMemo(
    () => data.expenses.filter(e => e.year === selectedYear).sort((a, b) => a.month - b.month),
    [data.expenses, selectedYear]
  );

  const yearTotal = useMemo(() => ({
    paycheck: monthsData.reduce((s, e) => s + Number(e.paycheck || 0), 0),
    spend: monthsData.reduce((s, e) => s + totalSpend(e), 0),
    saving: monthsData.reduce((s, e) => s + saving(e), 0),
  }), [monthsData]);

  function openAdd() { setForm({ ...emptyForm, year: selectedYear }); setEditId(null); setShowModal(true); }
  function openEdit(e) { setForm({ ...e }); setEditId(e.id); setShowModal(true); }
  function handleSave() {
    if (!form.paycheck) return;
    const item = { ...form, year: +form.year, month: +form.month, paycheck: Number(form.paycheck) };
    ROWS.forEach(r => { item[r.key] = Number(item[r.key] || 0); });
    if (editId) {
      updateData({ ...data, expenses: data.expenses.map(e => e.id === editId ? { ...item, id: editId } : e) });
    } else {
      updateData({ ...data, expenses: [...data.expenses, { ...item, id: Date.now() }] });
    }
    setShowModal(false);
  }
  function handleDelete(id) { updateData({ ...data, expenses: data.expenses.filter(e => e.id !== id) }); }

  return (
    <div>
      {/* Header card */}
      <div className="expense-header-card">
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.7)", marginBottom: 4 }}>Total Expenses {selectedYear}</div>
        <div style={{ fontSize: 34, fontWeight: 700, color: "#fff", letterSpacing: "-1px", marginBottom: 12 }}>
          {fmt(yearTotal.spend)}
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Income</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: "#2ECC71" }}>{fmt(yearTotal.paycheck)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)" }}>Saved</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: yearTotal.saving >= 0 ? "#2ECC71" : "#E74C3C" }}>
              {fmt(yearTotal.saving)}
            </div>
          </div>
        </div>
      </div>

      {/* Year tabs */}
      <div style={{ display: "flex", gap: 6, marginBottom: 16, overflowX: "auto" }}>
        {years.map(y => (
          <button key={y} onClick={() => setSelectedYear(y)}
            style={{ padding: "7px 18px", borderRadius: 20, border: "1px solid var(--border)",
              cursor: "pointer", fontSize: 13, fontWeight: 600, flexShrink: 0,
              background: selectedYear === y ? "var(--gold)" : "var(--bg-card)",
              color: selectedYear === y ? "#000" : "var(--text-secondary)" }}>
            {y}
          </button>
        ))}
      </div>

      {/* List header */}
      <div className="page-header">
        <span className="section-title-sm" style={{ margin: 0 }}>Monthly Records</span>
        <button className="btn btn-gold" onClick={openAdd} style={{ padding: "8px 14px", fontSize: 12 }}>
          <Plus size={14} /> Add Month
        </button>
      </div>

      {monthsData.length === 0 ? (
        <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--text-secondary)" }}>
          No data for {selectedYear}. Add a month to get started.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
          {monthsData.map(e => {
            const spend = totalSpend(e);
            const saved = saving(e);
            const spendPct = e.paycheck > 0 ? Math.min(100, Math.round((spend / e.paycheck) * 100)) : 0;
            return (
              <div key={e.id} style={{ background: "var(--bg-card)", borderRadius: 14,
                border: "1px solid var(--border)", padding: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text-primary)" }}>
                      {MONTHS[e.month - 1]} {e.year}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                      Income: <span style={{ color: "#2ECC71", fontWeight: 600 }}>{fmt(e.paycheck)}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 15, fontWeight: 700, color: "#E74C3C" }}>{fmt(spend)}</div>
                      <div style={{ fontSize: 11, color: saved >= 0 ? "#2ECC71" : "#E74C3C" }}>
                        {saved >= 0 ? "+" : ""}{fmt(saved)} saved
                      </div>
                    </div>
                    <button className="btn-icon" onClick={() => openEdit(e)}><Pencil size={13} /></button>
                    <button className="btn-icon-danger" onClick={() => handleDelete(e.id)}><Trash2 size={13} /></button>
                  </div>
                </div>
                {/* Spend progress */}
                <div className="progress-bg" style={{ height: 5 }}>
                  <div className="progress-fill" style={{ width: spendPct + "%",
                    background: spendPct > 90 ? "#E74C3C" : spendPct > 70 ? "#F39C12" : "#2ECC71" }} />
                </div>
                <div style={{ fontSize: 11, color: "var(--text-secondary)", marginTop: 5 }}>
                  {spendPct}% of income spent
                </div>
                {/* Breakdown */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10 }}>
                  {ROWS.filter(r => Number(e[r.key] || 0) > 0).map(r => (
                    <div key={r.key} style={{ background: "var(--bg-muted)", borderRadius: 8,
                      padding: "4px 10px", fontSize: 11, color: "var(--text-secondary)" }}>
                      {r.label}: <span style={{ color: "var(--text-primary)", fontWeight: 600 }}>{fmt(e[r.key])}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={ev => ev.stopPropagation()}>
            <div className="modal-handle" />
            <div className="modal-title">{editId ? "Edit Month" : "Add Month"}</div>
            <div className="form-row-2">
              <div className="form-group">
                <label>Year</label>
                <input type="number" value={form.year} onChange={e => setForm(p => ({ ...p, year: e.target.value }))} />
              </div>
              <div className="form-group">
                <label>Month</label>
                <select value={form.month} onChange={e => setForm(p => ({ ...p, month: e.target.value }))}>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
            </div>
            <div className="form-group">
              <label>Paycheck / Income (₹)</label>
              <input type="number" value={form.paycheck} onChange={e => setForm(p => ({ ...p, paycheck: e.target.value }))} placeholder="0" />
            </div>
            <div style={{ fontSize: 11, color: "var(--gold)", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: 1, marginBottom: 10, marginTop: 4 }}>Fixed Expenses</div>
            <div className="form-row-2">
              {ROWS.filter(r => r.group === "fixed").map(r => (
                <div key={r.key} className="form-group">
                  <label>{r.label}</label>
                  <input type="number" value={form[r.key]} onChange={e => setForm(p => ({ ...p, [r.key]: e.target.value }))} placeholder="0" />
                </div>
              ))}
            </div>
            <div style={{ fontSize: 11, color: "#E74C3C", fontWeight: 700, textTransform: "uppercase",
              letterSpacing: 1, marginBottom: 10, marginTop: 4 }}>Other Expenses</div>
            <div className="form-row-2">
              {ROWS.filter(r => r.group === "other").map(r => (
                <div key={r.key} className="form-group">
                  <label>{r.label}</label>
                  <input type="number" value={form[r.key]} onChange={e => setForm(p => ({ ...p, [r.key]: e.target.value }))} placeholder="0" />
                </div>
              ))}
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
