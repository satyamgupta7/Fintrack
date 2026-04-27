import React, { useState } from 'react'
import { useData } from '../App'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { Zap, Save, Trash2, Lightbulb } from 'lucide-react'
import { fmt, RUPEE, EXPENSE_KEYS as EXPENSE_ROWS } from '../utils/format'

const fmtL = (v) => RUPEE + (v / 100000).toFixed(1) + 'L'
const TT = { background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 11, color: '#0f172a' }
const SCENARIOS_KEY = 'fintrack_saved_scenarios'

function getSaved() { try { return JSON.parse(localStorage.getItem(SCENARIOS_KEY) || '[]') } catch { return [] } }
function setSaved(s) { localStorage.setItem(SCENARIOS_KEY, JSON.stringify(s)) }

function sipCorpusCalc(amount, ratePercent, years) {
  const mr = ratePercent / 100 / 12
  let corpus = 0
  for (let m = 0; m < years * 12; m++) corpus = (corpus + amount) * (1 + mr)
  return Math.round(corpus)
}

const RATE_PRESETS = [
  { label: 'Conservative', rate: 8,  color: '#0ea5e9' },
  { label: 'Moderate',     rate: 12, color: '#7c3aed' },
  { label: 'Aggressive',   rate: 15, color: '#dc2626' },
]

function Field({ label, children }) {
  return (
    <div className="sim-field">
      <label className="sim-field-label">{label}</label>
      {children}
    </div>
  )
}

function ResultCard({ bg, label, value, sub, color }) {
  return (
    <div style={{ background: bg, borderRadius: 8, padding: '10px 12px', flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: 10, color: '#94a3b8', marginBottom: 3 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color, lineHeight: 1.2 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

export default function Simulator() {
  const { data } = useData()
  const latestExpense  = [...data.expenses].sort((a, b) => b.year - a.year || b.month - a.month)[0]
  const monthlyIncome  = latestExpense ? Number(latestExpense.paycheck || 0) : 50000
  const monthlyExpense = latestExpense ? EXPENSE_ROWS.reduce((s, k) => s + Number(latestExpense[k] || 0), 0) : 30000
  const currentSaving  = monthlyIncome - monthlyExpense

  const [sipAmount,     setSipAmount]     = useState(5000)
  const [sipAlt,        setSipAlt]        = useState(8000)
  const [sipRate,       setSipRate]       = useState(12)
  const [sipYears,      setSipYears]      = useState(10)
  const [loanRemaining, setLoanRemaining] = useState(data.loans[0]?.remaining || 200000)
  const [loanEmi,       setLoanEmi]       = useState(data.loans[0]?.emi || 5000)
  const [loanRate,      setLoanRate]      = useState(data.loans[0]?.rate || 10)
  const [extraPayment,  setExtraPayment]  = useState(5000)
  const [savedScenarios, setSavedScenarios] = useState(getSaved)

  // SIP chart data
  const sipData = []
  let corpus = 0, altCorpus = 0
  for (let y = 1; y <= sipYears; y++) {
    for (let m = 0; m < 12; m++) {
      corpus    = (corpus    + sipAmount) * (1 + sipRate / 100 / 12)
      altCorpus = (altCorpus + sipAlt)    * (1 + sipRate / 100 / 12)
    }
    sipData.push({ year: 'Yr ' + y, corpus: Math.round(corpus), altCorpus: Math.round(altCorpus), invested: sipAmount * 12 * y })
  }
  const finalCorpus    = sipData[sipData.length - 1]?.corpus    || 0
  const finalAltCorpus = sipData[sipData.length - 1]?.altCorpus || 0
  const totalInvested  = sipAmount * 12 * sipYears
  const altDiff        = finalAltCorpus - finalCorpus

  // Loan prepayment
  const mr = loanRate / 100 / 12
  function calcMonths(bal, emi) {
    if (emi <= 0) return 0
    if (mr > 0 && emi > mr * bal) return Math.ceil(-Math.log(1 - (mr * bal) / emi) / Math.log(1 + mr))
    return Math.ceil(bal / emi)
  }
  const normalMonths   = calcMonths(loanRemaining, loanEmi)
  const fastMonths     = calcMonths(loanRemaining, loanEmi + extraPayment)
  const monthsSaved    = normalMonths - fastMonths
  const interestNormal = Math.max(0, Math.round(loanEmi * normalMonths - loanRemaining))
  const interestFast   = Math.max(0, Math.round((loanEmi + extraPayment) * fastMonths - loanRemaining))
  const interestSaved  = Math.max(0, interestNormal - interestFast)

  const loanData = []
  let normalBal = loanRemaining, fastBal = loanRemaining
  for (let m = 1; m <= Math.min(Math.max(normalMonths, fastMonths), 60); m++) {
    if (mr > 0) {
      const intN = normalBal * mr; normalBal = Math.max(0, normalBal + intN - loanEmi)
      const intF = fastBal   * mr; fastBal   = Math.max(0, fastBal   + intF - loanEmi - extraPayment)
    } else {
      normalBal = Math.max(0, normalBal - loanEmi)
      fastBal   = Math.max(0, fastBal   - loanEmi - extraPayment)
    }
    if (m % 3 === 0 || m === 1) loanData.push({ month: 'M' + m, normal: normalBal, accelerated: fastBal })
  }

  const savingsCorpus10 = sipCorpusCalc(currentSaving, sipRate, 10)

  function saveScenario(type, label) {
    const next = [{ id: Date.now(), type, label, ts: new Date().toLocaleDateString('en-IN') }, ...savedScenarios].slice(0, 10)
    setSavedScenarios(next); setSaved(next)
  }
  function deleteScenario(id) {
    const next = savedScenarios.filter(s => s.id !== id)
    setSavedScenarios(next); setSaved(next)
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">What-If Simulator</h1>
        <div style={{ fontSize: 12, color: '#64748b' }}>Explore how small changes today create big outcomes</div>
      </div>

      {/* Snapshot */}
      <div className="card section-gap" style={{ borderLeft: '3px solid #0ea5e9', background: '#f0f9ff', marginBottom: 20 }}>
        <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, fontWeight: 700 }}>Your Current Snapshot</div>
        <div className="sim-snapshot-grid">
          <div><div style={{ fontSize: 11, color: '#94a3b8' }}>Monthly Income</div><div style={{ fontSize: 18, fontWeight: 700, color: '#0ea5e9' }}>{fmt(monthlyIncome)}</div></div>
          <div><div style={{ fontSize: 11, color: '#94a3b8' }}>Monthly Spend</div><div style={{ fontSize: 18, fontWeight: 700, color: '#dc2626' }}>{fmt(monthlyExpense)}</div></div>
          <div><div style={{ fontSize: 11, color: '#94a3b8' }}>Monthly Saving</div><div style={{ fontSize: 18, fontWeight: 700, color: currentSaving >= 0 ? '#16a34a' : '#dc2626' }}>{fmt(currentSaving)}</div></div>
        </div>
        {currentSaving > 0 && (
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, background: '#fff', borderRadius: 8, padding: '8px 12px', border: '1px solid #bae6fd', marginTop: 12 }}>
            <Lightbulb size={13} color="#0ea5e9" style={{ flexShrink: 0, marginTop: 1 }} />
            <span style={{ fontSize: 12, color: '#0369a1' }}>
              Your {fmt(currentSaving)}/month saving could grow to <strong>{fmtL(savingsCorpus10)}</strong> in 10 years at {sipRate}% CAGR.
            </span>
          </div>
        )}
      </div>

      {/* Two panels */}
      <div className="sim-panels">

        {/* SIP Simulator */}
        <div className="card" style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, fontWeight: 700 }}>SIP Growth Simulator</div>

          {/* CAGR presets */}
          <div style={{ display: 'flex', gap: 6, marginBottom: 12, flexWrap: 'wrap' }}>
            {RATE_PRESETS.map(p => (
              <button key={p.rate} onClick={() => setSipRate(p.rate)} style={{
                padding: '5px 10px', borderRadius: 6, border: '1px solid', cursor: 'pointer', fontSize: 11, fontWeight: 600,
                background: sipRate === p.rate ? p.color : '#f8fafc',
                color: sipRate === p.rate ? '#fff' : '#64748b',
                borderColor: sipRate === p.rate ? p.color : '#e2e8f0',
              }}>{p.label} {p.rate}%</button>
            ))}
          </div>

          <div className="sim-inputs-3">
            <Field label="Monthly SIP"><input className="sim-input" type="number" value={sipAmount} onChange={e => setSipAmount(+e.target.value)} /></Field>
            <Field label="Rate % (CAGR)"><input className="sim-input" type="number" value={sipRate} onChange={e => setSipRate(+e.target.value)} /></Field>
            <Field label="Years"><input className="sim-input" type="number" value={sipYears} min={1} max={30} onChange={e => setSipYears(+e.target.value)} /></Field>
          </div>

          {/* What-if row */}
          <div style={{ background: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 8, padding: '8px 12px', marginBottom: 12 }}>
            <div style={{ fontSize: 11, color: '#7c3aed', fontWeight: 600, marginBottom: 6 }}>What if instead?</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 11, color: '#7c3aed', whiteSpace: 'nowrap' }}>₹</span>
              <input type="number" value={sipAlt} onChange={e => setSipAlt(+e.target.value)}
                style={{ width: 100, background: '#fff', border: '1px solid #e9d5ff', borderRadius: 6, padding: '6px 8px', fontSize: 13, color: '#4c1d95', fontWeight: 700, outline: 'none' }} />
              <span style={{ fontSize: 11, color: '#7c3aed', whiteSpace: 'nowrap' }}>/month</span>
              {altDiff > 0 && <span style={{ fontSize: 11, color: '#16a34a', fontWeight: 700, marginLeft: 'auto' }}>+{fmtL(altDiff)} extra</span>}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <ResultCard bg="#ede9fe" label="Total Invested"          value={fmt(totalInvested)}              color="#4c1d95" />
            <ResultCard bg="#dcfce7" label={'Corpus at ' + sipYears + 'yr'} value={fmtL(finalCorpus)} sub={fmt(finalCorpus)} color="#16a34a" />
            <ResultCard bg="#dbeafe" label="Wealth Gain"             value={fmtL(finalCorpus - totalInvested)} color="#0ea5e9" />
          </div>

          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={sipData}>
              <XAxis dataKey="year" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => RUPEE + (v/100000).toFixed(0) + 'L'} width={40} />
              <Tooltip contentStyle={TT} formatter={(v) => [fmt(v)]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="corpus"    stroke="#7c3aed" strokeWidth={2} dot={false} name={'₹' + sipAmount.toLocaleString('en-IN') + '/mo'} />
              <Line type="monotone" dataKey="altCorpus" stroke="#a78bfa" strokeWidth={1.5} dot={false} strokeDasharray="5 3" name={'₹' + sipAlt.toLocaleString('en-IN') + '/mo (alt)'} />
              <Line type="monotone" dataKey="invested"  stroke="#cbd5e1" strokeWidth={1.5} dot={false} strokeDasharray="4 4" name="Invested" />
            </LineChart>
          </ResponsiveContainer>

          <button onClick={() => saveScenario('SIP', 'SIP ' + fmt(sipAmount) + ' × ' + sipYears + 'yr @ ' + sipRate + '% = ' + fmtL(finalCorpus))}
            style={{ marginTop: 10, width: '100%', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 7, padding: '8px 0', fontSize: 12, fontWeight: 600, color: '#7c3aed', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Save size={12} /> Save this scenario
          </button>
        </div>

        {/* Loan Prepayment Simulator */}
        <div className="card" style={{ minWidth: 0 }}>
          <div style={{ fontSize: 11, color: '#ea580c', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, fontWeight: 700 }}>Loan Prepayment Simulator</div>

          <div className="sim-inputs-2">
            <Field label="Remaining Balance"><input className="sim-input" type="number" value={loanRemaining} onChange={e => setLoanRemaining(+e.target.value)} /></Field>
            <Field label="Current EMI"><input className="sim-input" type="number" value={loanEmi} onChange={e => setLoanEmi(+e.target.value)} /></Field>
            <Field label="Interest Rate %"><input className="sim-input" type="number" value={loanRate} onChange={e => setLoanRate(+e.target.value)} /></Field>
            <Field label="Extra/Month"><input className="sim-input" type="number" value={extraPayment} onChange={e => setExtraPayment(+e.target.value)} /></Field>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
            <ResultCard bg="#fef2f2" label="Normal Payoff"  value={normalMonths + ' months'} sub={fmt(interestNormal) + ' interest'} color="#dc2626" />
            <ResultCard bg="#dcfce7" label="With Extra EMI" value={fastMonths + ' months'}   sub={fmt(interestFast) + ' interest'}   color="#16a34a" />
            <ResultCard bg="#dbeafe" label="Months Saved"   value={monthsSaved + ' months'}  color="#0ea5e9" />
            <ResultCard bg="#fef9c3" label="Interest Saved" value={fmt(interestSaved)}        color="#ca8a04" />
          </div>

          <ResponsiveContainer width="100%" height={150}>
            <LineChart data={loanData}>
              <XAxis dataKey="month" tick={{ fill: '#94a3b8', fontSize: 10 }} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickFormatter={v => RUPEE + (v/1000).toFixed(0) + 'k'} width={40} />
              <Tooltip contentStyle={TT} formatter={(v) => [fmt(v)]} />
              <Legend wrapperStyle={{ fontSize: 10 }} />
              <Line type="monotone" dataKey="normal"      stroke="#dc2626" strokeWidth={2} dot={false} name="Normal" />
              <Line type="monotone" dataKey="accelerated" stroke="#16a34a" strokeWidth={2} dot={false} name="Accelerated" />
            </LineChart>
          </ResponsiveContainer>

          <button onClick={() => saveScenario('Loan', 'Loan ' + fmt(loanRemaining) + ' + ' + fmt(extraPayment) + '/mo extra → saves ' + fmt(interestSaved) + ' · ' + monthsSaved + ' months faster')}
            style={{ marginTop: 10, width: '100%', background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 7, padding: '8px 0', fontSize: 12, fontWeight: 600, color: '#ea580c', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
            <Save size={12} /> Save this scenario
          </button>
        </div>
      </div>

      {/* Savings Rate Impact */}
      <div className="card" style={{ marginBottom: savedScenarios.length ? 20 : 0, marginTop: 20 }}>
        <div style={{ fontSize: 11, color: '#ca8a04', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 14, fontWeight: 700 }}>Savings Rate Impact</div>
        <div className="sim-savings-rate">
          {[
            { label: 'Current Rate',      saving: currentSaving,       color: currentSaving >= 0 ? '#16a34a' : '#dc2626', bg: currentSaving >= 0 ? '#f0fdf4' : '#fef2f2' },
            { label: '20% Rate (Target)', saving: monthlyIncome * 0.2, color: '#0ea5e9', bg: '#f0f9ff' },
            { label: '30% Rate (Ideal)',  saving: monthlyIncome * 0.3, color: '#7c3aed', bg: '#faf5ff' },
          ].map((s, i) => (
            <div key={i} style={{ background: s.bg, borderRadius: 10, padding: 16, border: '1px solid ' + s.color + '30' }}>
              <div style={{ fontSize: 11, color: '#94a3b8', marginBottom: 6 }}>{s.label}</div>
              <div style={{ fontSize: 20, fontWeight: 700, color: s.color, marginBottom: 8 }}>{fmt(s.saving)}/mo</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>1 year: {fmt(s.saving * 12)}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>5 years: {fmt(s.saving * 60)}</div>
              <div style={{ fontSize: 12, color: '#64748b' }}>10 years: ~{fmt(s.saving * 12 * 10 * 1.5)}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Saved Scenarios */}
      {savedScenarios.length > 0 && (
        <div className="card">
          <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12, fontWeight: 700 }}>💾 Saved Scenarios</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {savedScenarios.map(s => (
              <div key={s.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: s.type === 'SIP' ? '#faf5ff' : '#fff7ed', borderRadius: 8, padding: '8px 12px', border: '1px solid ' + (s.type === 'SIP' ? '#e9d5ff' : '#fed7aa'), gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: '2px 7px', borderRadius: 99, background: s.type === 'SIP' ? '#ede9fe' : '#ffedd5', color: s.type === 'SIP' ? '#7c3aed' : '#ea580c', flexShrink: 0 }}>{s.type}</span>
                  <span style={{ fontSize: 12, color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.label}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, color: '#94a3b8' }}>{s.ts}</span>
                  <button onClick={() => deleteScenario(s.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 2 }}><Trash2 size={12} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
