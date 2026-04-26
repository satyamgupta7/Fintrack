import React, { useState } from 'react'
import { useData } from '../App'
import { exportSheetToExcel } from '../utils/exportExcel'
import { getNetWorthSummary } from '../utils/netWorth'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { Plus, Trash2, Download, Pencil } from 'lucide-react'

const empty = { category: 'Assets', name: '', value: '', date: '' }
const fmt = (n) => '\u20B9' + Number(n || 0).toLocaleString('en-IN')
const TT = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 12, color: '#0f172a' }

export default function Networth() {
  const { data, updateData } = useData()
  const [form, setForm] = useState(empty)
  const [showModal, setShowModal] = useState(false)
  const [editId, setEditId] = useState(null)

  const { assets, liabilities, loanLiabilities, totalAssets, totalLiabilities, netWorth } = getNetWorthSummary(data)

  const chartData = [
    { name: 'Assets', value: totalAssets },
    { name: 'Liabilities', value: totalLiabilities },
    { name: 'Net Worth', value: netWorth },
  ]

  function openAdd() { setForm(empty); setEditId(null); setShowModal(true) }
  function openEdit(n) { setForm({ category: n.category, name: n.name, value: n.value, date: n.date }); setEditId(n.id); setShowModal(true) }
  function handleSave() {
    if (!form.name || !form.value) return
    if (editId) {
      updateData({ ...data, networth: data.networth.map(n => n.id === editId ? { ...n, ...form, value: +form.value } : n) })
    } else {
      updateData({ ...data, networth: [...data.networth, { ...form, id: Date.now(), value: +form.value }] })
    }
    setShowModal(false)
  }
  function handleDelete(id) { updateData({ ...data, networth: data.networth.filter(n => n.id !== id) }) }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Net Worth</h1>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline" onClick={() => exportSheetToExcel(data.networth, 'Networth')}><Download size={14} /> Export</button>
          <button className="btn btn-primary" onClick={openAdd}><Plus size={14} /> Add Entry</button>
        </div>
      </div>

      <div className="card-grid" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
        <div className="stat-card" style={{ borderLeft: '3px solid #16a34a' }}>
          <div className="label">Total Assets</div>
          <div className="value text-green">{fmt(totalAssets)}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid #dc2626' }}>
          <div className="label">Total Liabilities</div>
          <div className="value text-red">{fmt(totalLiabilities)}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: '3px solid ' + (netWorth >= 0 ? '#16a34a' : '#dc2626') }}>
          <div className="label">Net Worth</div>
          <div className={'value ' + (netWorth >= 0 ? 'text-green' : 'text-red')}>{fmt(netWorth)}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
        <div className="card">
          <div style={{ marginBottom: 16, fontWeight: 700, color: '#94a3b8', fontSize: 13 }}>OVERVIEW</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} />
              <Tooltip contentStyle={TT} />
              <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.value >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card">
          <div style={{ marginBottom: 12, fontWeight: 700, color: '#94a3b8', fontSize: 13 }}>ASSETS</div>
          {assets.map(a => (
            <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#334155' }}>{a.name}</span>
              <span className="text-green">{fmt(a.value)}</span>
            </div>
          ))}
          {data.savings.map(s => (
            <div key={'s-' + s.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#334155' }}>{s.name} <span style={{ fontSize: 11, color: '#94a3b8' }}>(Savings)</span></span>
              <span className="text-green">{fmt(s.amount)}</span>
            </div>
          ))}
          <div style={{ marginTop: 16, marginBottom: 12, fontWeight: 700, color: '#94a3b8', fontSize: 13 }}>LIABILITIES</div>
          {liabilities.map(l => (
            <div key={l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#334155' }}>{l.name}</span>
              <span className="text-red">{fmt(l.value)}</span>
            </div>
          ))}
          {loanLiabilities.map(l => (
            <div key={'loan-' + l.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
              <span style={{ color: '#334155' }}>{l.name} <span style={{ fontSize: 11, color: '#94a3b8' }}>(Loan)</span></span>
              <span className="text-red">{fmt(l.value)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Category</th><th>Name</th><th>Value</th><th>Date</th><th></th></tr>
            </thead>
            <tbody>
              {data.networth.map(n => (
                <tr key={n.id}>
                  <td><span className={'badge ' + (n.category === 'Assets' ? 'badge-green' : 'badge-red')}>{n.category}</span></td>
                  <td>{n.name}</td>
                  <td className={n.category === 'Assets' ? 'text-green' : 'text-red'}>{fmt(n.value)}</td>
                  <td>{n.date}</td>
                  <td style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-outline" style={{ padding: '4px 8px' }} onClick={() => openEdit(n)}><Pencil size={12} /></button>
                    <button className="btn btn-danger" style={{ padding: '4px 8px' }} onClick={() => handleDelete(n.id)}><Trash2 size={12} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="modal-title">{editId ? 'Edit Entry' : 'Add Net Worth Entry'}</div>
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>x</button>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label>Category</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                  <option>Assets</option><option>Liabilities</option>
                </select>
              </div>
              <div className="form-group">
                <label>Name</label>
                <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Savings Account" />
              </div>
              <div className="form-group">
                <label>Value</label>
                <input type="number" value={form.value} onChange={e => setForm({ ...form, value: e.target.value })} placeholder="0" />
              </div>
              <div className="form-group">
                <label>Date</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
              </div>
            </div>
            <div className="flex-end">
              <button className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="btn btn-primary" onClick={handleSave}>{editId ? 'Save Changes' : 'Add Entry'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
