import React, { useState } from 'react'
import { useData } from '../App'
import { exportSheetToExcel } from '../utils/exportExcel'
import { Plus, Pencil, Trash2, Download, AlertTriangle } from 'lucide-react'
import { fmt, RUPEE } from '../utils/format'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const ROWS = [
  { key: 'emi',       label: 'EMI',         group: 'fixed' },
  { key: 'invest',    label: 'INVEST',      group: 'fixed' },
  { key: 'rent',      label: 'RENT',        group: 'fixed' },
  { key: 'insurance', label: 'INSURANCE',   group: 'fixed' },
  { key: 'medicine',  label: 'MEDICINE',    group: 'fixed' },
  { key: 'personal',  label: 'PERSONAL',    group: 'other' },
  { key: 'credit',    label: 'CREDIT',      group: 'other' },
  { key: 'family',    label: 'FAMILY/Cash', group: 'other' },
]

const emptyForm = { year: 2026, month: 1, paycheck: '', emi: '', invest: '', rent: '', insurance: '', medicine: '', personal: '', credit: '', family: '' }

function totalSpend(e) { return ROWS.reduce((s, r) => s + Number(e[r.key] || 0), 0) }
function saving(e) { return Number(e.paycheck || 0) - totalSpend(e) }
function avg(arr) { return arr.length ? Math.round(arr.reduce((s, v) => s + v, 0) / arr.length) : 0 }

function SpendChart({ monthsData }) {
  if (!monthsData.length) return null
  const BAR_W = 48, GAP = 24, H = 120, PAD_L = 10, PAD_B = 28
  const maxVal = Math.max(...monthsData.map(e => Math.max(totalSpend(e), Number(e.paycheck || 0)))) * 1.1
  const totalW = PAD_L + monthsData.length * (BAR_W + GAP)
  const scaleY = v => H - PAD_B - (v / maxVal) * (H - PAD_B - 8)
  const paycheckPoints = monthsData.map((e, i) => `${PAD_L + i * (BAR_W + GAP) + BAR_W / 2},${scaleY(Number(e.paycheck || 0))}`).join(' ')

  return (
    <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '16px 20px', marginBottom: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 12 }}>Monthly Spend vs Paycheck</div>
      <svg width="100%" viewBox={`0 0 ${totalW} ${H}`} style={{ overflow: 'visible' }}>
        {monthsData.map((e, i) => {
          const spend = totalSpend(e)
          const barH = (spend / maxVal) * (H - PAD_B - 8)
          const x = PAD_L + i * (BAR_W + GAP)
          const isOver = spend > Number(e.paycheck || 0)
          return (
            <g key={e.id}>
              <rect x={x} y={H - PAD_B - barH} width={BAR_W} height={barH}
                fill={isOver ? '#fca5a5' : '#bfdbfe'} rx={4} />
              <text x={x + BAR_W / 2} y={H - 6} textAnchor="middle" fontSize={10} fill="#94a3b8">
                {MONTHS[e.month - 1]}
              </text>
              <text x={x + BAR_W / 2} y={H - PAD_B - barH - 4} textAnchor="middle" fontSize={9} fill={isOver ? '#dc2626' : '#64748b'}>
                {RUPEE}{(spend / 1000).toFixed(0)}k
              </text>
            </g>
          )
        })}
        <polyline points={paycheckPoints} fill="none" stroke="#0ea5e9" strokeWidth={2} strokeDasharray="4 2" />
        {monthsData.map((e, i) => {
          const x = PAD_L + i * (BAR_W + GAP) + BAR_W / 2
          const y = scaleY(Number(e.paycheck || 0))
          return <circle key={e.id} cx={x} cy={y} r={3} fill="#0ea5e9" />
        })}
      </svg>
      <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b' }}>
          <div style={{ width: 12, height: 10, background: '#bfdbfe', borderRadius: 2 }} /> Total Spend
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#64748b' }}>
          <svg width={20} height={10}><line x1={0} y1={5} x2={20} y2={5} stroke="#0ea5e9" strokeWidth={2} strokeDasharray="4 2" /></svg> Paycheck
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: '#dc2626' }}>
          <div style={{ width: 12, height: 10, background: '#fca5a5', borderRadius: 2 }} /> Overspent
        </div>
      </div>
    </div>
  )
}

export default function Expenses() {
  const { data, updateData } = useData()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [editId, setEditId] = useState(null)
  const [hoveredYear, setHoveredYear] = useState(null)

  const years = [...new Set(data.expenses.map(e => e.year))].sort()
  const [selectedYear, setSelectedYear] = useState(2026)

  const monthsData = data.expenses.filter(e => e.year === selectedYear).sort((a, b) => a.month - b.month)
  const yearTotal = {
    paycheck: monthsData.reduce((s, e) => s + Number(e.paycheck || 0), 0),
    spend:    monthsData.reduce((s, e) => s + totalSpend(e), 0),
    saving:   monthsData.reduce((s, e) => s + saving(e), 0),
  }
  const isOverspent = yearTotal.saving < 0
  const avgPaycheck = avg(monthsData.map(e => Number(e.paycheck || 0)))

  function openAdd() { setForm({ ...emptyForm, year: selectedYear }); setEditId(null); setShowModal(true) }
  function openEdit(e) { setForm({ ...e }); setEditId(e.id); setShowModal(true) }
  function handleSave() {
    if (!form.paycheck) return
    const item = { ...form, year: +form.year, month: +form.month, paycheck: Number(form.paycheck) }
    ROWS.forEach(r => { item[r.key] = Number(item[r.key] || 0) })
    if (editId) {
      updateData({ ...data, expenses: data.expenses.map(e => e.id === editId ? { ...item, id: editId } : e) })
    } else {
      updateData({ ...data, expenses: [...data.expenses, { ...item, id: Date.now() }] })
    }
    setShowModal(false)
  }
  function handleDelete(id) { updateData({ ...data, expenses: data.expenses.filter(e => e.id !== id) }) }
  function handleExport() {
    const rows = monthsData.map(e => ({
      Month: MONTHS[e.month - 1] + '-' + e.year,
      Paycheck: e.paycheck,
      ...Object.fromEntries(ROWS.map(r => [r.label, e[r.key] || 0])),
      'Total Spend': totalSpend(e),
      Saving: saving(e)
    }))
    exportSheetToExcel(rows, 'Expenses_' + selectedYear)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Expenses</h1>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button className="btn btn-outline" onClick={handleExport}><Download size={14} /> Export</button>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={14} /> Add Month</button>
        </div>
      </div>

      {/* Year tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, borderBottom: '1px solid #e2e8f0' }}>
        {years.map(y => (
          <button key={y} onClick={() => setSelectedYear(y)}
            onMouseEnter={() => setHoveredYear(y)}
            onMouseLeave={() => setHoveredYear(null)}
            style={{
              padding: '8px 24px', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: 600,
              background: 'transparent',
              color: selectedYear === y ? '#0ea5e9' : hoveredYear === y ? '#334155' : '#94a3b8',
              borderBottom: selectedYear === y ? '2px solid #0ea5e9' : hoveredYear === y ? '2px solid #cbd5e1' : '2px solid transparent',
              textDecoration: hoveredYear === y && selectedYear !== y ? 'underline' : 'none',
              transition: 'all 0.15s'
            }}>{y}</button>
        ))}
      </div>

      {/* Summary cards */}
      <div className="card-grid" style={{ gridTemplateColumns: 'repeat(3,1fr)', marginBottom: 20 }}>
        <div className="stat-card" style={{ borderLeft: '3px solid #0ea5e9' }}>
          <div className="label">Total Paycheck {selectedYear}</div>
          <div className="value text-blue">{fmt(yearTotal.paycheck)}</div>
          <div className="sub">{monthsData.length} months</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid #dc2626' }}>
          <div className="label">Total Spend {selectedYear}</div>
          <div className="value text-red">{fmt(yearTotal.spend)}</div>
          {isOverspent && (
            <div style={{ fontSize: 11, color: '#dc2626', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
              <AlertTriangle size={11} /> Exceeds total paycheck
            </div>
          )}
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid ' + (isOverspent ? '#dc2626' : '#16a34a') }}>
          <div className="label">Total Saving {selectedYear}</div>
          <div className="value" style={{ color: isOverspent ? '#dc2626' : '#16a34a', fontSize: 22, fontWeight: 700 }}>
            {fmt(yearTotal.saving)}
          </div>
          {isOverspent && (
            <div style={{ marginTop: 6, padding: '6px 10px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 7, display: 'flex', alignItems: 'flex-start', gap: 6 }}>
              <AlertTriangle size={12} color="#dc2626" style={{ marginTop: 1, flexShrink: 0 }} />
              <span style={{ fontSize: 11, color: '#dc2626', lineHeight: 1.4 }}>
                ⚠️ Spent {fmt(Math.abs(yearTotal.saving))} more than earned in {selectedYear}
              </span>
            </div>
          )}
        </div>
      </div>

      <SpendChart monthsData={monthsData} />

      {monthsData.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 48, color: '#94a3b8' }}>
          No data for {selectedYear}. Click "Add Month" to get started.
        </div>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 14, border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 600 }}>
            <thead>
              <tr style={{ background: '#f8fafc' }}>
                <td style={S.labelHead}>MONTH</td>
                {monthsData.map(e => (
                  <td key={e.id} style={S.monthHead}>
                    <div style={{ color: '#0ea5e9', fontWeight: 700 }}>{MONTHS[e.month - 1]}-{e.year}</div>
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 6 }}>
                      <button style={S.iconBtn} onClick={() => openEdit(e)}><Pencil size={10} /></button>
                      <button style={{ ...S.iconBtn, background: '#fee2e2', color: '#dc2626', borderColor: '#fca5a5' }} onClick={() => handleDelete(e.id)}><Trash2 size={10} /></button>
                    </div>
                  </td>
                ))}
                <td style={{ ...S.monthHead, background: '#f1f5f9' }}>
                  <div style={{ color: '#64748b', fontWeight: 700, fontSize: 11 }}>AVG</div>
                </td>
              </tr>
            </thead>
            <tbody>
              <tr style={{ background: '#eff6ff' }}>
                <td style={{ ...S.rowLabel, color: '#0ea5e9', fontWeight: 700 }}>PAYCHECK</td>
                {monthsData.map(e => (
                  <td key={e.id} style={{ ...S.cell, color: '#0ea5e9', fontWeight: 700 }}>{fmt(e.paycheck)}</td>
                ))}
                <td style={{ ...S.cell, color: '#0ea5e9', fontWeight: 700, background: '#e0f2fe' }}>
                  {fmt(avg(monthsData.map(e => Number(e.paycheck || 0))))}
                </td>
              </tr>
              <tr style={{ background: '#f8fafc' }}>
                <td colSpan={monthsData.length + 2} style={S.sectionHead}>FIXED EXPENSES</td>
              </tr>
              {ROWS.filter(r => r.group === 'fixed').map((r, i) => {
                const vals = monthsData.map(e => Number(e[r.key] || 0))
                const rowAvg = avg(vals)
                const pct = avgPaycheck > 0 ? Math.round((rowAvg / avgPaycheck) * 100) : 0
                return (
                  <tr key={r.key} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ ...S.rowLabel, color: '#334155' }}>
                      {r.label}
                      {pct > 0 && <span style={{ marginLeft: 6, fontSize: 10, color: '#94a3b8', fontWeight: 400 }}>{pct}% of income</span>}
                    </td>
                    {monthsData.map(e => (
                      <td key={e.id} style={S.cell}>
                        {Number(e[r.key] || 0) > 0 ? fmt(e[r.key]) : <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                    ))}
                    <td style={{ ...S.cell, background: '#f8fafc', color: '#475569', fontWeight: 600 }}>{rowAvg > 0 ? fmt(rowAvg) : <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  </tr>
                )
              })}
              <tr style={{ background: '#f8fafc' }}>
                <td colSpan={monthsData.length + 2} style={S.sectionHead}>OTHER EXPENSES</td>
              </tr>
              {ROWS.filter(r => r.group === 'other').map((r, i) => {
                const vals = monthsData.map(e => Number(e[r.key] || 0))
                const rowAvg = avg(vals)
                const pct = avgPaycheck > 0 ? Math.round((rowAvg / avgPaycheck) * 100) : 0
                return (
                  <tr key={r.key} style={{ background: i % 2 === 0 ? '#fff' : '#fafafa' }}>
                    <td style={{ ...S.rowLabel, color: '#334155' }}>
                      {r.label}
                      {pct > 0 && <span style={{ marginLeft: 6, fontSize: 10, color: '#94a3b8', fontWeight: 400 }}>{pct}% of income</span>}
                    </td>
                    {monthsData.map(e => (
                      <td key={e.id} style={S.cell}>
                        {Number(e[r.key] || 0) > 0 ? fmt(e[r.key]) : <span style={{ color: '#cbd5e1' }}>—</span>}
                      </td>
                    ))}
                    <td style={{ ...S.cell, background: '#f8fafc', color: '#475569', fontWeight: 600 }}>{rowAvg > 0 ? fmt(rowAvg) : <span style={{ color: '#cbd5e1' }}>—</span>}</td>
                  </tr>
                )
              })}
              <tr style={{ background: '#fff7ed' }}>
                <td style={{ ...S.rowLabel, color: '#ea580c', fontWeight: 700 }}>TOTAL SPEND</td>
                {monthsData.map(e => (
                  <td key={e.id} style={{ ...S.cell, color: '#ea580c', fontWeight: 700 }}>{fmt(totalSpend(e))}</td>
                ))}
                <td style={{ ...S.cell, color: '#ea580c', fontWeight: 700, background: '#ffedd5' }}>
                  {fmt(avg(monthsData.map(e => totalSpend(e))))}
                </td>
              </tr>
              <tr style={{ background: '#f0fdf4' }}>
                <td style={{ ...S.rowLabel, color: '#16a34a', fontWeight: 700 }}>NET SAVING</td>
                {monthsData.map(e => {
                  const s = saving(e)
                  return (
                    <td key={e.id} style={{ ...S.cell, color: s >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700, background: s >= 0 ? '#f0fdf4' : '#fef2f2' }}>
                      {fmt(s)}
                    </td>
                  )
                })}
                <td style={{ ...S.cell, color: yearTotal.saving >= 0 ? '#16a34a' : '#dc2626', fontWeight: 700, background: yearTotal.saving >= 0 ? '#dcfce7' : '#fee2e2' }}>
                  {fmt(avg(monthsData.map(e => saving(e))))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ width: 560, maxHeight: '90vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editId ? 'Edit Month' : 'Add Month'}</div>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="form-row" style={{ gridTemplateColumns: '1fr 1fr' }}>
              <div className="form-group">
                <label>Year</label>
                <input type="number" value={form.year} onChange={e => setForm({ ...form, year: e.target.value })} />
              </div>
              <div className="form-group">
                <label>Month</label>
                <select value={form.month} onChange={e => setForm({ ...form, month: e.target.value })}>
                  {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                </select>
              </div>
            </div>
            <div style={S.modalSection}>INCOME</div>
            <div className="form-row" style={{ gridTemplateColumns: '1fr' }}>
              <div className="form-group">
                <label>Paycheck</label>
                <input type="number" value={form.paycheck} onChange={e => setForm({ ...form, paycheck: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div style={{ ...S.modalSection, color: '#ca8a04' }}>FIXED EXPENSES</div>
            <div className="form-row">
              {ROWS.filter(r => r.group === 'fixed').map(r => (
                <div key={r.key} className="form-group">
                  <label>{r.label}</label>
                  <input type="number" value={form[r.key]} onChange={e => setForm({ ...form, [r.key]: e.target.value })} placeholder="0" />
                </div>
              ))}
            </div>
            <div style={{ ...S.modalSection, color: '#dc2626' }}>OTHER EXPENSES</div>
            <div className="form-row">
              {ROWS.filter(r => r.group === 'other').map(r => (
                <div key={r.key} className="form-group">
                  <label>{r.label}</label>
                  <input type="number" value={form[r.key]} onChange={e => setForm({ ...form, [r.key]: e.target.value })} placeholder="0" />
                </div>
              ))}
            </div>
            <div className="flex-end" style={{ marginTop: 8 }}>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>{editId ? 'Save Changes' : 'Add Month'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const S = {
  labelHead: { padding: '14px 16px', color: '#94a3b8', fontWeight: 700, fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, width: 160, borderBottom: '2px solid #e2e8f0' },
  monthHead: { padding: '10px 12px', textAlign: 'center', borderBottom: '2px solid #e2e8f0', borderLeft: '1px solid #f1f5f9', minWidth: 110 },
  iconBtn: { padding: '3px 7px', border: '1px solid #e2e8f0', borderRadius: 6, background: '#f8fafc', color: '#64748b', cursor: 'pointer', display: 'inline-flex', alignItems: 'center' },
  rowLabel: { padding: '11px 16px', fontWeight: 500, fontSize: 13, borderBottom: '1px solid #f1f5f9', whiteSpace: 'nowrap' },
  cell: { padding: '11px 14px', textAlign: 'right', color: '#64748b', borderBottom: '1px solid #f1f5f9', borderLeft: '1px solid #f1f5f9', whiteSpace: 'nowrap' },
  sectionHead: { padding: '6px 16px', color: '#94a3b8', fontSize: 11, letterSpacing: 1.5, textTransform: 'uppercase', fontWeight: 700 },
  modalSection: { fontSize: 11, color: '#0ea5e9', marginBottom: 10, marginTop: 4, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }
}
