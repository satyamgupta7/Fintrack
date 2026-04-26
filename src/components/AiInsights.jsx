import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useData } from '../App'
import { getNetWorthSummary } from '../utils/netWorth'
import { Sparkles, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, Target, Zap, Clock, X, RotateCcw, CalendarDays } from 'lucide-react'
import { fmt, EXPENSE_KEYS as EXPENSE_ROWS } from '../utils/format'
const MONTHS_FULL = ['January','February','March','April','May','June','July','August','September','October','November','December']
const MONTHS_SHORT = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function loanInterestLeft(l) {
  const remaining = Number(l.remaining), emi = Number(l.emi), rate = Number(l.rate)
  const mr = rate / 100 / 12
  let months
  if (mr > 0 && emi > mr * remaining) {
    months = Math.ceil(-Math.log(1 - (mr * remaining) / emi) / Math.log(1 + mr))
  } else { months = emi > 0 ? Math.ceil(remaining / emi) : 0 }
  return Math.max(0, Math.round(emi * months - remaining))
}

function generateInsights(data) {
  const insights = []
  const { netWorth } = getNetWorthSummary(data)
  const sorted = [...data.expenses].sort((a, b) => b.year - a.year || b.month - a.month)
  const latestExpense = sorted[0]
  const prevExpense = sorted[1]
  const monthlyExpense = latestExpense ? EXPENSE_ROWS.reduce((s, k) => s + Number(latestExpense[k] || 0), 0) : 0
  const monthlyIncome = latestExpense ? Number(latestExpense.paycheck || 0) : 0
  const monthlySaving = monthlyIncome - monthlyExpense
  const savingsRate = monthlyIncome > 0 ? (monthlySaving / monthlyIncome) * 100 : 0
  const emergency = data.savings.find(s => s.name.toLowerCase().includes('emergency'))
  const emergencyMonths = emergency && monthlyExpense > 0 ? (emergency.amount / monthlyExpense) : 0
  const emergencyTarget = 6
  const emergencyGap = Math.max(0, emergencyTarget * monthlyExpense - (emergency?.amount || 0))
  const totalEmi = Number(latestExpense?.emi || 0)
  const emiRatio = monthlyIncome > 0 ? (totalEmi / monthlyIncome) * 100 : 0
  const totalInvest = Number(latestExpense?.invest || 0)
  const investRatio = monthlyIncome > 0 ? (totalInvest / monthlyIncome) * 100 : 0

  // Emergency fund
  if (emergencyMonths >= 6) {
    insights.push({ id: 'ef-ok', type: 'success', icon: CheckCircle, priority: 'low', title: 'Emergency Fund — Fully Covered', text: 'Your emergency fund covers ' + emergencyMonths.toFixed(1) + ' months of expenses (target: 6 months). You are well protected.', action: null, route: null })
  } else {
    const monthsToTarget = monthlySaving > 0 ? Math.ceil(emergencyGap / (monthlySaving * 0.3)) : null
    insights.push({ id: 'ef-low', type: 'warning', icon: AlertTriangle, priority: 'high', title: 'Emergency Fund — ' + emergencyMonths.toFixed(1) + ' of 6 months covered', text: 'You need ' + fmt(emergencyGap) + ' more to reach 6 months of coverage.', action: monthsToTarget ? 'Allocating 30% of monthly savings gets you there in ~' + monthsToTarget + ' months.' : 'Start by setting aside a fixed amount each month.', route: '/savings', routeLabel: 'Go to Savings →', progress: { value: Math.min(100, (emergencyMonths / emergencyTarget) * 100), color: '#f59e0b' } })
  }

  // Savings rate
  if (savingsRate < 20) {
    insights.push({ id: 'sr-low', type: 'danger', icon: TrendingDown, priority: 'high', title: 'Savings Rate — ' + savingsRate.toFixed(0) + '% (Target: 20%+)', text: 'You are saving ' + fmt(monthlySaving) + '/month (' + savingsRate.toFixed(0) + '% of income). The 50/30/20 rule recommends at least 20%.', action: 'To reach 20%, save ' + fmt(monthlyIncome * 0.2) + '/month. Gap: ' + fmt(Math.max(0, monthlyIncome * 0.2 - monthlySaving)) + '.', route: '/expenses', routeLabel: 'Review Expenses →' })
  } else {
    insights.push({ id: 'sr-ok', type: 'success', icon: TrendingUp, priority: 'low', title: 'Savings Rate — ' + savingsRate.toFixed(0) + '% — On Track', text: 'You are saving ' + fmt(monthlySaving) + '/month. Consider increasing SIP contributions.', action: null, route: null })
  }

  // EMI burden
  if (emiRatio > 40) {
    insights.push({ id: 'emi-high', type: 'danger', icon: AlertTriangle, priority: 'high', title: 'EMI Burden — ' + emiRatio.toFixed(0) + '% of Income (Danger Zone)', text: 'Your EMIs consume ' + fmt(totalEmi) + '/month (' + emiRatio.toFixed(0) + '% of income). Above 40% is financially risky.', action: 'Prepay the highest-interest loan first. Even ' + fmt(5000) + ' extra/month significantly reduces tenure.', route: '/loans', routeLabel: 'Go to Loans →' })
  } else if (emiRatio > 25) {
    insights.push({ id: 'emi-med', type: 'warning', icon: AlertTriangle, priority: 'medium', title: 'EMI Burden — ' + emiRatio.toFixed(0) + '% of Income', text: 'EMIs are manageable but avoid new debt until this drops below 25%.', action: null, route: '/loans', routeLabel: 'View Loans →' })
  }

  // Under-investing
  if (investRatio < 10) {
    insights.push({ id: 'inv-low', type: 'warning', icon: Target, priority: 'high', title: 'Under-Investing — Only ' + investRatio.toFixed(0) + '% of Income', text: 'You are investing ' + fmt(totalInvest) + '/month. Experts recommend 15–20% of income in long-term investments.', action: 'Increasing SIP by ' + fmt(2000) + '/month at 12% CAGR adds ~' + fmt(Math.round(2000 * 12 * 10 * 1.8)) + ' over 10 years.', route: '/savings', routeLabel: 'Go to Savings →' })
  }

  // Loans closing soon — rephrased
  data.loans.forEach(l => {
    const mr = Number(l.rate) / 100 / 12
    const emi = Number(l.emi), rem = Number(l.remaining)
    let months
    if (mr > 0 && emi > mr * rem) {
      months = Math.ceil(-Math.log(1 - (mr * rem) / emi) / Math.log(1 + mr))
    } else { months = emi > 0 ? Math.ceil(rem / emi) : null }
    if (months && months <= 24) {
      const interestLeft = loanInterestLeft(l)
      const fastMonths = Math.ceil(rem / (emi + 5000))
      const interestSaved = Math.max(0, Math.round(emi * months - (emi + 5000) * fastMonths))
      insights.push({ id: 'loan-' + l.id, type: 'info', icon: Zap, priority: 'medium', title: 'Pay off "' + l.name + '" early — save ' + fmt(interestSaved) + ' in interest', text: fmt(rem) + ' remaining · closes in ' + months + ' months at current EMI.', action: 'Adding ' + fmt(5000) + '/month extra closes it in ~' + fastMonths + ' months, freeing up ' + fmt(emi) + '/month permanently.', route: '/loans', routeLabel: 'Go to Loans →' })
    }
  })

  // Net worth
  if (netWorth > 0) {
    const nwToIncomeRatio = monthlyIncome > 0 ? (netWorth / (monthlyIncome * 12)).toFixed(1) : 0
    insights.push({ id: 'nw-ok', type: 'success', icon: TrendingUp, priority: 'low', title: 'Net Worth — ' + nwToIncomeRatio + 'x Annual Income', text: 'Your net worth is ' + fmt(netWorth) + '. At age 30, target is 1x annual income. At 40, target is 3x.', action: null, route: null })
  }

  // Goals
  data.savings.filter(s => s.type === 'Goal' || !s.type).forEach(s => {
    const remaining = Number(s.goal) - Number(s.amount)
    if (remaining > 0 && monthlySaving > 0) {
      const months = Math.ceil(remaining / (monthlySaving * 0.2))
      insights.push({ id: 'goal-' + s.id, type: 'info', icon: Clock, priority: 'low', title: 'Goal: "' + s.name + '" — ' + Math.round((s.amount / s.goal) * 100) + '% done', text: fmt(remaining) + ' remaining to reach your target of ' + fmt(s.goal) + '.', action: 'At 20% of monthly savings allocated, you reach this goal in ~' + months + ' months.', route: '/savings', routeLabel: 'Go to Savings →', progress: { value: Math.min(100, (s.amount / s.goal) * 100), color: '#0ea5e9' } })
    }
  })

  return insights.sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]))
}

function calcHealthScore(data) {
  let score = 0
  const sorted = [...data.expenses].sort((a, b) => b.year - a.year || b.month - a.month)
  const latest = sorted[0]
  if (!latest) return 5
  const spend = EXPENSE_ROWS.reduce((s, k) => s + Number(latest[k] || 0), 0)
  const income = Number(latest.paycheck || 0)
  const savingsRate = income > 0 ? (income - spend) / income : 0
  const emiRatio = income > 0 ? Number(latest.emi || 0) / income : 0
  const emergency = data.savings.find(s => s.name.toLowerCase().includes('emergency'))
  const efMonths = emergency && spend > 0 ? emergency.amount / spend : 0
  if (savingsRate >= 0.2) score += 2; else if (savingsRate >= 0.1) score += 1
  if (emiRatio <= 0.25) score += 2; else if (emiRatio <= 0.4) score += 1
  if (efMonths >= 6) score += 2; else if (efMonths >= 3) score += 1
  const totalInvest = Number(latest.invest || 0)
  if (income > 0 && totalInvest / income >= 0.15) score += 2; else if (income > 0 && totalInvest / income >= 0.08) score += 1
  if (data.loans.length === 0) score += 2; else if (data.loans.length <= 2) score += 1
  return Math.min(10, Math.max(0, score))
}

function generateDigest(data) {
  const sorted = [...data.expenses].sort((a, b) => b.year - a.year || b.month - a.month)
  const latest = sorted[0]
  const prev = sorted[1]
  if (!latest) return null

  const latestSpend = EXPENSE_ROWS.reduce((s, k) => s + Number(latest[k] || 0), 0)
  const latestSaving = Number(latest.paycheck || 0) - latestSpend
  const prevEmi = prev ? Number(prev.emi || 0) : null
  const emiChange = prevEmi !== null ? Number(latest.emi || 0) - prevEmi : null

  const emergency = data.savings.find(s => s.name.toLowerCase().includes('emergency'))
  const emergencyGap = Math.max(0, 6 * latestSpend - (emergency?.amount || 0))

  const monthLabel = MONTHS_SHORT[latest.month - 1] + ' ' + latest.year

  const lines = []
  if (latestSaving > 0) lines.push('You saved ' + fmt(latestSaving))
  if (emiChange !== null && emiChange !== 0) lines.push('EMI ' + (emiChange < 0 ? 'reduced by ' + fmt(Math.abs(emiChange)) : 'increased by ' + fmt(emiChange)))

  const focus = emergencyGap > 0
    ? 'Emergency Fund needs ' + fmt(Math.min(emergencyGap, Math.round(latestSaving * 0.3))) + ' more this month'
    : 'Keep up the savings momentum'

  // Health score delta
  const currentScore = calcHealthScore(data)
  const prevData = prev ? { ...data, expenses: data.expenses.filter(e => !(e.year === latest.year && e.month === latest.month)) } : null
  const prevScore = prevData ? calcHealthScore(prevData) : null
  const scoreDelta = prevScore !== null ? +(currentScore - prevScore).toFixed(1) : null

  return { monthLabel, lines, focus, currentScore, scoreDelta }
}

const typeStyles = {
  success: { border: '#16a34a', icon: '#16a34a', bg: '#f0fdf4' },
  warning: { border: '#f59e0b', icon: '#f59e0b', bg: '#fffbeb' },
  danger:  { border: '#dc2626', icon: '#dc2626', bg: '#fef2f2' },
  info:    { border: '#0ea5e9', icon: '#0ea5e9', bg: '#f0f9ff' },
}

const priorityBadge = {
  high:   { label: 'High Priority', color: '#dc2626', bg: '#fee2e2' },
  medium: { label: 'Medium',        color: '#ca8a04', bg: '#fef9c3' },
  low:    { label: 'Info',          color: '#0ea5e9', bg: '#dbeafe' },
}

const DISMISS_KEY = 'fintrack_dismissed_insights'
function getDismissed() { try { return JSON.parse(localStorage.getItem(DISMISS_KEY) || '[]') } catch { return [] } }
function saveDismissed(ids) { localStorage.setItem(DISMISS_KEY, JSON.stringify(ids)) }

export default function AiInsights() {
  const { data } = useData()
  const navigate = useNavigate()
  const insights = useMemo(() => generateInsights(data), [data])
  const digest = useMemo(() => generateDigest(data), [data])

  const [filter, setFilter] = useState(null) // null | 'high' | 'medium'
  const [dismissed, setDismissed] = useState(getDismissed)
  const [done, setDone] = useState([])

  const high = insights.filter(i => i.priority === 'high').length
  const medium = insights.filter(i => i.priority === 'medium').length

  const actionable = insights.filter(i => i.priority !== 'low')
  const infoInsights = insights.filter(i => i.priority === 'low')

  const visible = actionable.filter(i => {
    if (dismissed.includes(i.id) || done.includes(i.id)) return false
    if (filter === 'high') return i.priority === 'high'
    if (filter === 'medium') return i.priority === 'medium'
    return true
  })

  function dismiss(id) {
    const next = [...dismissed, id]
    setDismissed(next)
    saveDismissed(next)
  }
  function markDone(id) { setDone(d => [...d, id]) }
  function resetDismissed() {
    setDismissed([])
    setDone([])
    saveDismissed([])
  }

  const hiddenCount = dismissed.length + done.length

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">AI Insights</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: '#64748b', fontSize: 12 }}>
          <Sparkles size={14} color="#0ea5e9" />
          {insights.length} insights · {high} high priority
        </div>
      </div>

      {/* Monthly digest */}
      {digest && (
        <div style={{ background: 'linear-gradient(135deg, #0f172a, #1e3a5f)', borderRadius: 12, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          <CalendarDays size={18} color="#7dd3fc" style={{ marginTop: 2, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#7dd3fc', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>
              {digest.monthLabel} Summary
            </div>
            <div style={{ fontSize: 13, color: '#e2e8f0', lineHeight: 1.6 }}>
              {digest.lines.join(' · ')}
            </div>
            {digest.currentScore !== null && (
              <div style={{ marginTop: 5, fontSize: 13, color: '#e2e8f0' }}>
                Health Score:{' '}
                <span style={{ fontWeight: 700, color: digest.currentScore >= 7 ? '#4ade80' : digest.currentScore >= 4 ? '#fbbf24' : '#f87171' }}>
                  {digest.currentScore.toFixed(1)}
                </span>
                {digest.scoreDelta !== null && digest.scoreDelta !== 0 && (
                  <span style={{ marginLeft: 6, fontSize: 12, color: digest.scoreDelta > 0 ? '#4ade80' : '#f87171', fontWeight: 600 }}>
                    {digest.scoreDelta > 0 ? '↑ +' : '↓ '}{digest.scoreDelta} from last month
                  </span>
                )}
              </div>
            )}
            <div style={{ marginTop: 5, fontSize: 12, color: '#94a3b8' }}>
              Next focus: <span style={{ color: '#fbbf24', fontWeight: 600 }}>{digest.focus}</span>
            </div>
          </div>
        </div>
      )}

      {/* Filter chips */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center' }}>
        <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.6, marginRight: 2 }}>Filter:</span>
        <button onClick={() => setFilter(filter === 'high' ? null : 'high')} style={{
          background: filter === 'high' ? '#dc2626' : '#fee2e2',
          border: '2px solid ' + (filter === 'high' ? '#dc2626' : '#fca5a5'),
          borderRadius: 8, padding: '6px 13px', fontSize: 12, fontWeight: 700,
          color: filter === 'high' ? '#fff' : '#dc2626', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
          boxShadow: filter === 'high' ? '0 2px 8px rgba(220,38,38,0.3)' : 'none'
        }}>
          <AlertTriangle size={13} /> {high} actions needed {filter === 'high' ? '✕' : ''}
        </button>
        <button onClick={() => setFilter(filter === 'medium' ? null : 'medium')} style={{
          background: filter === 'medium' ? '#ca8a04' : '#fef9c3',
          border: '2px solid ' + (filter === 'medium' ? '#ca8a04' : '#fde047'),
          borderRadius: 8, padding: '6px 13px', fontSize: 12, fontWeight: 700,
          color: filter === 'medium' ? '#fff' : '#ca8a04', cursor: 'pointer',
          display: 'flex', alignItems: 'center', gap: 6, transition: 'all 0.15s',
          boxShadow: filter === 'medium' ? '0 2px 8px rgba(202,138,4,0.3)' : 'none'
        }}>
          <AlertTriangle size={13} /> {medium} to watch {filter === 'medium' ? '✕' : ''}
        </button>
        <div style={{ background: '#dbeafe', border: '1px solid #93c5fd', borderRadius: 8, padding: '7px 14px', fontSize: 12, color: '#2563eb', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Sparkles size={13} /> Auto-updated from your data
        </div>
        {hiddenCount > 0 && (
          <button onClick={resetDismissed} style={{ marginLeft: 'auto', background: 'transparent', border: '1px solid #e2e8f0', borderRadius: 8, padding: '7px 12px', fontSize: 11, color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
            <RotateCcw size={11} /> Reset {hiddenCount} dismissed
          </button>
        )}
      </div>

      {/* Actionable insight cards */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
        {visible.length === 0 && (
          <div style={{ textAlign: 'center', padding: '32px 20px', color: '#94a3b8', background: '#f8fafc', borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }}>
            {filter ? 'No ' + filter + ' priority insights right now.' : 'All insights dismissed. Click "Reset dismissed" to restore.'}
          </div>
        )}
        {visible.map((insight) => {
          const style = typeStyles[insight.type]
          const Icon = insight.icon
          const pb = priorityBadge[insight.priority]
          return (
            <div key={insight.id} style={{ background: style.bg, border: '1px solid ' + style.border + '40', borderLeft: '3px solid ' + style.border, borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon size={15} color={style.icon} />
                  <span style={{ fontWeight: 700, fontSize: 13.5, color: '#0f172a' }}>{insight.title}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 8, flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 99, background: pb.bg, color: pb.color, whiteSpace: 'nowrap' }}>
                    {pb.label}
                  </span>
                  <button onClick={() => dismiss(insight.id)} title="Dismiss" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', display: 'flex', padding: 2 }}>
                    <X size={13} />
                  </button>
                </div>
              </div>
              <p style={{ fontSize: 13, color: '#64748b', lineHeight: 1.6, marginBottom: insight.action || insight.progress ? 10 : 0 }}>
                {insight.text}
              </p>
              {insight.progress && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ background: '#e2e8f0', borderRadius: 99, height: 6, overflow: 'hidden' }}>
                    <div style={{ width: insight.progress.value + '%', background: insight.progress.color, height: '100%', borderRadius: 99 }} />
                  </div>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 3 }}>{insight.progress.value.toFixed(0)}% complete</div>
                </div>
              )}
              {insight.action && (
                <div style={{ background: '#fff', borderRadius: 7, padding: '8px 12px', fontSize: 12, color: '#0ea5e9', borderLeft: '2px solid ' + style.border, border: '1px solid ' + style.border + '30', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, flexWrap: 'wrap' }}>
                  <span><Zap size={11} style={{ display: 'inline', marginRight: 5 }} />{insight.action}</span>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    {insight.route && (
                      <button onClick={() => navigate(insight.route)} style={{ background: style.border, border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {insight.routeLabel}
                      </button>
                    )}
                    <button onClick={() => markDone(insight.id)} style={{ background: '#16a34a', border: 'none', borderRadius: 6, padding: '4px 10px', fontSize: 11, fontWeight: 700, color: '#fff', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                      ✓ Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Info strip — collapsed "on track" items */}
      {infoInsights.length > 0 && (
        <div style={{ background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 10, padding: '12px 16px' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#16a34a', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8 }}>
            ✅ {infoInsights.length} things on track
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px' }}>
            {infoInsights.map(i => (
              <span key={i.id} style={{ fontSize: 12, color: '#334155', display: 'flex', alignItems: 'center', gap: 5 }}>
                <i.icon size={11} color="#16a34a" />
                {i.title}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
