import React, { useState, useMemo } from "react"
import { useData } from "../App"
import { exportSheetToExcel } from "../utils/exportExcel"
import { Plus, Trash2, Download, Pencil, ShieldCheck, Clock, PlusCircle, Zap, ArrowUpDown } from "lucide-react"
import { fmt, EXPENSE_KEYS } from "../utils/format"

// For display: SIP has its own style, Goal/Emergency share Goal style
const TYPE_STYLE = {
  SIP:  { color: "#7c3aed", badge: "#ede9fe", text: "#7c3aed", emoji: "📈" },
  Goal: { color: "#0ea5e9", badge: "#dbeafe", text: "#0ea5e9", emoji: "🎯" },
}
function getStyle(s) {
  if (s.type === "SIP") return TYPE_STYLE.SIP
  if (s.name.toLowerCase().includes("emergency")) {
    const pct = Number(s.goal) > 0 ? Math.round((Number(s.amount) / Number(s.goal)) * 100) : 0
    const color = progressColor(pct)
    return { color, badge: pct < 30 ? "#fee2e2" : pct >= 100 ? "#dcfce7" : "#fef3c7", text: color, emoji: "🛡️" }
  }
  return TYPE_STYLE.Goal
}

function progressColor(pct) {
  if (pct >= 100) return "#16a34a"
  if (pct < 30) return "#dc2626"
  return "#ca8a04"
}

function monthDiff(start, end) {
  if (!start || !end) return 0
  const s = new Date(start)
  const e = new Date(end)
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return 0
  return Math.max(1, (e.getFullYear() - s.getFullYear()) * 12 + e.getMonth() - s.getMonth() + 1)
}

function sipReturn(item, contribution) {
  if (!contribution?.monthly || !contribution?.instalments) return null
  const invested = contribution.monthly * contribution.instalments
  const returns = Number(item.amount || 0) - invested
  const pct = invested > 0 ? (returns / invested) * 100 : 0
  return { returns, pct, invested }
}

function sipContribution(item, fallbackMonthly = 0) {
  const monthly = Number(item.monthlyAmount || 0) || Number(fallbackMonthly || 0)
  const instalments = monthly > 0 ? Math.max(1, Math.round(Number(item.amount || 0) / monthly)) : 0
  return { monthly, instalments }
}

const EMPTY_GOAL = { type: "Goal", name: "", amount: "", goal: "", date: "" }
const EMPTY_SIP  = { type: "SIP",  name: "", amount: "", goal: "", date: "", monthlyAmount: "", startDate: "" }
const EMPTY_EMG  = { type: "Goal", name: "Emergency Fund", amount: "", goal: "", date: "" }

function health(savingsRate, emiRatio) {
  const s = Number(savingsRate), e = Number(emiRatio)
  if (s >= 20 && e <= 35) return { label: "Healthy",         color: "#16a34a", bg: "#dcfce7", dot: "🟢" }
  if (s >= 10 || e <= 50) return { label: "Moderate",        color: "#ca8a04", bg: "#fef9c3", dot: "🟡" }
  return                          { label: "Needs Attention", color: "#dc2626", bg: "#fee2e2", dot: "🔴" }
}

function SummaryCard({ title, value, valueColor, sub, children, borderColor }) {
  return (
    <div style={{ background: "#fff", border: "1px solid #e2e8f0", borderLeft: "3px solid " + borderColor, borderRadius: 12, padding: "14px 16px", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
      <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 6, fontWeight: 700 }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: valueColor, marginBottom: 2 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "#94a3b8" }}>{sub}</div>}
      {children}
    </div>
  )
}

function ProgressBar({ pct, color = "#0ea5e9" }) {
  return (
    <div style={{ background: "#e2e8f0", borderRadius: 99, height: 5, overflow: "hidden", marginTop: 6 }}>
      <div style={{ width: Math.min(100, pct) + "%", background: color, height: "100%", borderRadius: 99, transition: "width 0.4s" }} />
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: 0.8 }}>{label}</label>
      {React.cloneElement(children, {
        style: { background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, padding: "11px 14px", color: "#0f172a", fontSize: 14, outline: "none", width: "100%", ...(children.props.style || {}) }
      })}
    </div>
  )
}
export default function Savings() {
  const { data, updateData } = useData()
  const [form, setForm]         = useState({ ...EMPTY_GOAL })
  const [formKind, setFormKind] = useState("Goal")
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId]     = useState(null)
  const [tab, setTab]           = useState("All")
  const [sortBy, setSortBy]     = useState("amount")
  const [sortDir, setSortDir]   = useState("desc")
  const [actionModal, setAction] = useState(null)
  const [actionVal, setActionVal] = useState("")

  const latest     = [...data.expenses].sort((a, b) => b.year - a.year || b.month - a.month)[0]
  const monthlyExp = latest ? EXPENSE_KEYS.reduce((s, k) => s + Number(latest[k] || 0), 0) : 0
  const monthlyInc = latest ? Number(latest.paycheck || 0) : 0
  const monthlySave = monthlyInc - monthlyExp
  const saveRate   = monthlyInc > 0 ? ((monthlySave / monthlyInc) * 100).toFixed(0) : 0
  const emiRate    = monthlyInc > 0 ? ((Number(latest?.emi || 0) / monthlyInc) * 100).toFixed(0) : 0
  const h          = health(saveRate, emiRate)

  const emergency  = data.savings.find(s => s.name.toLowerCase().includes("emergency"))
  const emonths    = emergency && monthlyExp > 0 ? Number(emergency.amount) / monthlyExp : 0
  const epct       = emergency ? Math.min(100, Math.round((Number(emergency.amount) / Number(emergency.goal || 1)) * 100)) : 0

  const totalAll = data.savings.reduce((s, i) => s + Number(i.amount), 0)
  const sipItems = data.savings.filter(x => x.type === "SIP")
  const totalSIP = sipItems.reduce((s, i) => s + Number(i.amount), 0)
  const fallbackSipMonthly = sipItems.length === 1 ? Number(latest?.invest || 0) : 0
  const sipMonthly = sipItems.reduce((s, i) => s + (Number(i.monthlyAmount || 0) || fallbackSipMonthly), 0)
  const savingsTrend = [...data.expenses]
    .sort((a, b) => a.year - b.year || a.month - b.month)
    .slice(-6)
    .map(e => {
      const spend = EXPENSE_KEYS.reduce((s, k) => s + Number(e[k] || 0), 0)
      return Math.max(0, Number(e.paycheck || 0) - spend)
    })
  const trendMax = Math.max(...savingsTrend, 1)

  // Dynamic goal tabs: unique names of Goal-type entries (excluding emergency)
  const goalTabs = useMemo(() => {
    const names = data.savings
      .filter(s => s.type === "Goal" && !s.name.toLowerCase().includes("emergency"))
      .map(s => s.name)
    return [...new Set(names)]
  }, [data.savings])

  // Build tab list: All, Emergency, SIP, then each unique goal name
  const tabList = useMemo(() => {
    return ["All", "Emergency", "SIP", ...goalTabs]
  }, [goalTabs])

  const filtered = useMemo(() => {
    let list
    if (tab === "All") list = [...data.savings]
    else if (tab === "Emergency") list = data.savings.filter(s => s.name.toLowerCase().includes("emergency"))
    else if (tab === "SIP") list = data.savings.filter(s => s.type === "SIP")
    else list = data.savings.filter(s => s.name === tab) // custom goal tab
    return list.sort((a, b) => {
      const va = sortBy === "amount" ? Number(a.amount) : new Date(a.date)
      const vb = sortBy === "amount" ? Number(b.amount) : new Date(b.date)
      return sortDir === "desc" ? vb - va : va - vb
    })
  }, [data.savings, tab, sortBy, sortDir])

  function tabCount(t) {
    if (t === "All") return data.savings.length
    if (t === "Emergency") return data.savings.filter(s => s.name.toLowerCase().includes("emergency")).length
    if (t === "SIP") return data.savings.filter(s => s.type === "SIP").length
    return data.savings.filter(s => s.name === t).length
  }

  function tabEmoji(t) {
    if (t === "Emergency") return "🛡️ "
    if (t === "SIP") return "📈 "
    if (t === "All") return ""
    return "🎯 "
  }

  function toggleSort(col) {
    if (sortBy === col) setSortDir(d => d === "desc" ? "asc" : "desc")
    else { setSortBy(col); setSortDir("desc") }
  }

  function openAdd() {
    let kind = "Goal"
    if (tab === "Emergency") kind = "Emergency"
    else if (tab === "SIP") kind = "SIP"
    else if (goalTabs.includes(tab)) {
      // pre-fill name from the tab
      setFormKind("Goal")
      setForm({ ...EMPTY_GOAL, name: tab })
      setEditId(null); setShowModal(true)
      return
    }
    setFormKind(kind)
    setForm(kind === "Emergency" ? { ...EMPTY_EMG } : kind === "SIP" ? { ...EMPTY_SIP } : { ...EMPTY_GOAL })
    setEditId(null); setShowModal(true)
  }

  function openEdit(s) {
    const kind = s.type === "SIP" ? "SIP" : s.name.toLowerCase().includes("emergency") ? "Emergency" : "Goal"
    setFormKind(kind)
    setForm({ type: s.type, name: s.name, amount: s.amount, goal: s.goal, date: s.date, monthlyAmount: s.monthlyAmount || "", startDate: s.startDate || "" })
    setEditId(s.id); setShowModal(true)
  }

  function save() {
    if (!form.name || !form.amount) return
    const item = {
      ...form,
      amount: +form.amount,
      goal: form.type === "SIP" ? undefined : +(form.goal || form.amount),
      monthlyAmount: form.type === "SIP" ? Number(form.monthlyAmount || 0) : undefined,
      startDate: form.type === "SIP" ? (form.startDate || form.date) : undefined,
    }
    updateData({ ...data, savings: editId ? data.savings.map(s => s.id === editId ? { ...s, ...item } : s) : [...data.savings, { ...item, id: Date.now() }] })
    setShowModal(false)
  }

  function del(id) { updateData({ ...data, savings: data.savings.filter(s => s.id !== id) }) }

  function doAction() {
    const val = Number(actionVal)
    if (!val || !actionModal) return
    updateData({
      ...data,
      savings: data.savings.map(s => {
        if (s.id !== actionModal.item.id) return s
        return actionModal.type === "target"
          ? { ...s, goal: Number(s.goal || 0) + val }
          : { ...s, amount: Number(s.amount) + val }
      })
    })
    setAction(null); setActionVal("")
  }

  return (
    <div>
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <h1 className="page-title">Savings</h1>
          <span style={{ padding: "3px 10px", borderRadius: 99, background: h.bg, border: "1px solid " + h.color + "50", fontSize: 12, color: h.color, fontWeight: 600 }}>
            {h.dot} {h.label}
          </span>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn btn-outline" onClick={() => exportSheetToExcel(data.savings, "Savings")}><Download size={13} /> Export</button>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={13} /> Add</button>
        </div>
      </div>

      {/* Summary cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 14, marginBottom: 20 }}>
        <SummaryCard title="Total Savings" value={fmt(totalAll)} valueColor="#0ea5e9" sub={`${fmt(Math.max(0, monthlySave))} this month · ${saveRate}% savings rate ${Number(saveRate) >= 20 ? "✓" : ""}`} borderColor="#0ea5e9">
          {monthlyInc > 0 && (
            <div style={{ marginTop: 8, padding: "5px 8px", background: "#f8fafc", borderRadius: 6, border: "1px solid #f1f5f9" }}>
              <div style={{ display: "flex", alignItems: "end", gap: 3, height: 28 }}>
                {savingsTrend.map((v, i) => (
                  <span key={i} title={fmt(v)} style={{
                    width: 12,
                    height: Math.max(4, Math.round((v / trendMax) * 24)),
                    borderRadius: 3,
                    background: i === savingsTrend.length - 1 ? "#0ea5e9" : "#94a3b8",
                  }} />
                ))}
              </div>
              <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 3 }}>Last 6 months trend</div>
            </div>
          )}
        </SummaryCard>

        <SummaryCard title="Emergency Fund" value={emergency ? fmt(emergency.amount) : "—"}
          valueColor={progressColor(epct)}
          borderColor={progressColor(epct)}>
          {emergency ? (
            <>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 2 }}>of {fmt(emergency.goal)} target</div>
              <ProgressBar pct={epct} color={progressColor(epct)} />
              <div style={{ fontSize: 11, marginTop: 5, color: progressColor(epct), fontWeight: 600 }}>
                <ShieldCheck size={10} style={{ display: "inline", marginRight: 3 }} />
                {emonths.toFixed(1)} / 6 months covered
              </div>
            </>
          ) : <div style={{ fontSize: 11, color: "#dc2626", marginTop: 8 }}>⚠ Not set up yet</div>}
        </SummaryCard>

        <SummaryCard title="SIP Invested" value={fmt(totalSIP)} valueColor="#7c3aed" sub={data.savings.filter(x => x.type === "SIP").length + " active SIPs"} borderColor="#8b5cf6">
          {sipMonthly > 0 && (
            <div style={{ marginTop: 8, padding: "5px 8px", background: "#f8fafc", borderRadius: 6, border: "1px solid #f1f5f9" }}>
              <div style={{ fontSize: 11, color: "#7c3aed", fontWeight: 600 }}>{fmt(sipMonthly)}/month</div>
            </div>
          )}
        </SummaryCard>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 16, flexWrap: "wrap" }}>
        {tabList.map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            padding: "5px 14px", border: "1px solid", borderRadius: 8, cursor: "pointer", fontSize: 13, fontWeight: 600, transition: "all 0.15s",
            background: tab === t ? "#0ea5e9" : "#fff", color: tab === t ? "#fff" : "#94a3b8", borderColor: tab === t ? "#0ea5e9" : "#e2e8f0",
          }}>
            {tabEmoji(t)}{t}
            <span style={{ marginLeft: 5, fontSize: 10, padding: "1px 5px", borderRadius: 99, background: tab === t ? "rgba(255,255,255,0.25)" : "#f1f5f9", color: tab === t ? "#fff" : "#94a3b8" }}>{tabCount(t)}</span>
          </button>
        ))}
        <div style={{ display: "flex", gap: 6 }}>
          {["amount","date"].map(col => (
            <button key={col} onClick={() => toggleSort(col)} style={{ padding: "5px 10px", border: "1px solid #e2e8f0", borderRadius: 7, cursor: "pointer", background: sortBy === col ? "#f1f5f9" : "#fff", color: "#94a3b8", fontSize: 11, display: "flex", alignItems: "center", gap: 4 }}>
              <ArrowUpDown size={10} />{col.charAt(0).toUpperCase() + col.slice(1)} {sortBy === col ? (sortDir === "desc" ? "↓" : "↑") : ""}
            </button>
          ))}
        </div>
      </div>

      {/* Cards grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14, marginBottom: 20 }}>
        {filtered.map(s => {
          const st = getStyle(s)
          const amt = Number(s.amount), goal = Number(s.goal)
          const isSip = s.type === "SIP"
          const pct = !isSip && goal > 0 ? Math.min(100, Math.round((amt / goal) * 100)) : 0
          const rem = !isSip ? Math.max(0, goal - amt) : 0
          const mToGoal = !isSip && monthlySave > 0 && rem > 0 ? Math.ceil(rem / (monthlySave * 0.3)) : null
          const isEmg = s.name.toLowerCase().includes("emergency")
          const emgM = isEmg && monthlyExp > 0 ? amt / monthlyExp : null
          const cardColor = isSip ? st.color : progressColor(pct)
          const contribution = isSip ? sipContribution(s, fallbackSipMonthly) : null
          const returns = isSip ? sipReturn(s, contribution) : null

          return (
            <div key={s.id} style={{ background: "#fff", border: "1px solid #e2e8f0", borderLeft: "3px solid " + cardColor, borderRadius: 12, padding: 14, boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 14 }}>{st.emoji}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 99, background: st.badge, color: st.text }}>{s.type}</span>
                </div>
                <div style={{ display: "flex", gap: 4 }}>
                  <button onClick={() => openEdit(s)} style={{ background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 5, padding: "3px 6px", cursor: "pointer", color: "#64748b", display: "flex" }}><Pencil size={10} /></button>
                  <button onClick={() => del(s.id)} style={{ background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: 5, padding: "3px 6px", cursor: "pointer", color: "#dc2626", display: "flex" }}><Trash2 size={10} /></button>
                </div>
              </div>
              <div style={{ fontWeight: 700, color: "#0f172a", fontSize: 13, marginBottom: 2 }}>{s.name}</div>
              <div style={{ fontSize: 21, fontWeight: 800, color: cardColor, marginBottom: 6 }}>{fmt(amt)}</div>
              {!isSip && (
                <>
                  <div style={{ fontSize: 11, color: "#94a3b8", marginBottom: 5 }}>
                    {goal > 0 ? fmt(goal) + " target · " + pct + "%" + (rem > 0 ? " · " + fmt(rem) + " left" : " ✓") : "No target set"}
                  </div>
                  {goal > 0 && <ProgressBar pct={pct} color={progressColor(pct)} />}
                </>
              )}
              <div style={{ marginTop: 6, fontSize: 11 }}>
                {emgM !== null && (
                  <div style={{ color: progressColor(pct), display: "flex", alignItems: "center", gap: 3 }}>
                    <ShieldCheck size={9} />{emgM.toFixed(1)} / 6 months covered
                  </div>
                )}
                {s.type === "SIP" && contribution?.monthly > 0 && (
                  <>
                    <div style={{ color: st.color }}>{fmt(contribution.monthly)}/month · {contribution.instalments} instalments</div>
                    {returns && (
                      <div style={{ color: returns.returns >= 0 ? "#16a34a" : "#dc2626", marginTop: 3 }}>
                        Returns: {returns.returns >= 0 ? "+" : "-"}{fmt(Math.abs(returns.returns))} ({returns.pct.toFixed(1)}%)
                      </div>
                    )}
                  </>
                )}
              </div>
              {mToGoal && rem > 0 && (
                <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4, display: "flex", alignItems: "center", gap: 3 }}>
                  <Clock size={9} />~{mToGoal} months at current pace
                </div>
              )}
              <div style={{ display: "flex", gap: 5, marginTop: 10 }}>
                <button onClick={() => { setAction({ type: !isSip && pct >= 100 ? "target" : "contribute", item: s }); setActionVal("") }}
                  style={{ fontSize: 10, padding: "3px 8px", border: "1px solid #bfdbfe", borderRadius: 5, background: "#eff6ff", color: "#0ea5e9", cursor: "pointer", display: "flex", alignItems: "center", gap: 3 }}>
                  <PlusCircle size={9} /> {!isSip && pct >= 100 ? "Increase Target" : "Add Contribution"}
                </button>
              </div>
            </div>
          )
        })}
        <button onClick={openAdd} style={{ minHeight: 190, background: "#f8fafc", border: "1px dashed #cbd5e1", borderRadius: 12, padding: 14, cursor: "pointer", color: "#64748b", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <PlusCircle size={22} color="#0ea5e9" />
          <span style={{ fontWeight: 700, color: "#0f172a" }}>Add New Goal</span>
          <span style={{ fontSize: 11 }}>Emergency, SIP, or custom target</span>
        </button>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ width: 560, maxWidth: "95vw" }} onClick={e => e.stopPropagation()}>
            <div className="modal-header" style={{ marginBottom: 24 }}>
              <div className="modal-title" style={{ fontSize: 20 }}>{editId ? "Edit Entry" : "Add Saving"}</div>
              <button onClick={() => setShowModal(false)} style={{ background: "#f1f5f9", border: "none", borderRadius: 8, width: 32, height: 32, cursor: "pointer", color: "#64748b", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
            </div>
            {!editId && (
              <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
                {[
                  { key: "Emergency", emoji: "🛡️", label: "Emergency" },
                  { key: "SIP",       emoji: "📈", label: "SIP" },
                  { key: "Goal",      emoji: "🎯", label: "Goal" },
                ].map(({ key, emoji, label }) => (
                  <button key={key} onClick={() => {
                    setFormKind(key)
                    setForm(key === "Emergency" ? { ...EMPTY_EMG } : key === "SIP" ? { ...EMPTY_SIP } : { ...EMPTY_GOAL })
                  }} style={{ flex: 1, padding: "9px", border: "1px solid", borderRadius: 8, cursor: "pointer", fontWeight: 600, fontSize: 13,
                    background: formKind === key ? "#0ea5e9" : "#f8fafc",
                    color: formKind === key ? "#fff" : "#64748b",
                    borderColor: formKind === key ? "#0ea5e9" : "#e2e8f0"
                  }}>{emoji} {label}</button>
                ))}
              </div>
            )}
            {/* Hint for Goal type */}
            {!editId && formKind === "Goal" && (
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12, padding: "8px 12px", background: "#f8fafc", borderRadius: 8, border: "1px solid #e2e8f0" }}>
                💡 Give it any name — e.g. "Vacation", "New Car", "House Down Payment". It will appear as its own tab.
              </div>
            )}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px 20px" }}>
              <Field label="Name">
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder={formKind === "SIP" ? "e.g. Axis Bluechip" : formKind === "Emergency" ? "Emergency Fund" : "e.g. Vacation Fund"}
                  readOnly={formKind === "Emergency"} />
              </Field>
              <Field label="Current Amount"><input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0" /></Field>
              {formKind !== "SIP" && (
                <Field label="Target Amount"><input type="number" value={form.goal} onChange={e => setForm({ ...form, goal: e.target.value })} placeholder="0" /></Field>
              )}
              <Field label="Date"><input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} /></Field>
              {formKind === "SIP" && (
                <>
                  <Field label="Monthly SIP"><input type="number" value={form.monthlyAmount || ""} onChange={e => setForm({ ...form, monthlyAmount: e.target.value })} placeholder="0" /></Field>
                  <Field label="Start Date"><input type="date" value={form.startDate || ""} onChange={e => setForm({ ...form, startDate: e.target.value })} /></Field>
                </>
              )}
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 28 }}>
              <button onClick={() => setShowModal(false)} style={{ padding: "10px 22px", borderRadius: 8, border: "1px solid #e2e8f0", background: "#f8fafc", color: "#64748b", cursor: "pointer", fontWeight: 600, fontSize: 14 }}>Cancel</button>
              <button onClick={save} style={{ padding: "10px 22px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#0ea5e9,#6366f1)", color: "#fff", cursor: "pointer", fontWeight: 700, fontSize: 14 }}>{editId ? "Save Changes" : "Add"}</button>
            </div>
          </div>
        </div>
      )}

      {/* Contribution Modal */}
      {actionModal && (
        <div className="modal-overlay" onClick={() => setAction(null)}>
          <div className="modal" style={{ width: 340 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title" style={{ display: "flex", alignItems: "center", gap: 8 }}><PlusCircle size={15} color="#0ea5e9" /> {actionModal.type === "target" ? "Increase Target" : "Add Contribution"}</div>
              <button className="btn btn-outline" onClick={() => setAction(null)}>✕</button>
            </div>
            <div style={{ fontSize: 13, color: "#64748b", marginBottom: 14 }}>"{actionModal.item.name}" · current: {fmt(actionModal.item.amount)} · target: {fmt(actionModal.item.goal)}</div>
            <div className="form-group" style={{ marginBottom: 16 }}>
              <label>{actionModal.type === "target" ? "Target Increase" : "Amount to Add"}</label>
              <input type="number" value={actionVal} onChange={e => setActionVal(e.target.value)} placeholder="0" autoFocus />
            </div>
            <div className="flex-end">
              <button className="btn btn-outline" onClick={() => setAction(null)}>Cancel</button>
              <button className="btn btn-primary" onClick={doAction}><Zap size={12} /> Confirm</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
