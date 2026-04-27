import React from "react";
import { Link } from "react-router-dom";
import { useData } from "../App";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { exportToExcel } from "../utils/exportExcel";
import { getNetWorthSummary } from "../utils/netWorth";
import { fmt, EXPENSE_KEYS as EXPENSE_ROWS } from "../utils/format";
import { Download, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";

const COLORS = ["#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const TT = { background: "#fff", border: "1px solid #e2e8f0", borderRadius: 8, fontSize: 12, color: "#0f172a" };

function calcHealthScore(data) {
  let score = 0;
  const details = [];
  const latestExpense = [...data.expenses].sort((a, b) => b.year - a.year || b.month - a.month)[0];
  const monthlyExpense = latestExpense ? EXPENSE_ROWS.reduce((s, k) => s + Number(latestExpense[k] || 0), 0) : 0;
  const monthlyIncome = latestExpense ? Number(latestExpense.paycheck || 0) : 0;
  const monthlySaving = monthlyIncome - monthlyExpense;
  const savingsRate = monthlyIncome > 0 ? (monthlySaving / monthlyIncome) * 100 : 0;

  if (savingsRate >= 30) { score += 2.5; details.push({ type: "success", text: "Savings rate " + savingsRate.toFixed(0) + "% — excellent" }); }
  else if (savingsRate >= 20) { score += 1.8; details.push({ type: "info", text: "Savings rate " + savingsRate.toFixed(0) + "% — good" }); }
  else if (savingsRate >= 10) { score += 1; details.push({ type: "warning", text: "Savings rate " + savingsRate.toFixed(0) + "% — needs improvement" }); }
  else { details.push({ type: "danger", text: "Savings rate " + savingsRate.toFixed(0) + "% — critical" }); }

  const emergency = data.savings.find((s) => s.name.toLowerCase().includes("emergency"));
  const emergencyMonths = emergency && monthlyExpense > 0 ? emergency.amount / monthlyExpense : 0;
  if (emergencyMonths >= 6) { score += 2.5; details.push({ type: "success", text: "Emergency fund: " + emergencyMonths.toFixed(1) + " months — great" }); }
  else if (emergencyMonths >= 3) { score += 1.5; details.push({ type: "info", text: "Emergency fund: " + emergencyMonths.toFixed(1) + " months — target 6" }); }
  else { score += 0.5; details.push({ type: "warning", text: "Emergency fund: " + emergencyMonths.toFixed(1) + " months — build urgently" }); }

  const emiRatio = monthlyIncome > 0 ? (Number(latestExpense?.emi || 0) / monthlyIncome) * 100 : 0;
  if (emiRatio <= 20) { score += 2.5; details.push({ type: "success", text: "EMI " + emiRatio.toFixed(0) + "% of income — healthy" }); }
  else if (emiRatio <= 35) { score += 1.5; details.push({ type: "info", text: "EMI " + emiRatio.toFixed(0) + "% of income — manageable" }); }
  else { details.push({ type: "danger", text: "EMI " + emiRatio.toFixed(0) + "% of income — too high" }); }

  const investRatio = monthlyIncome > 0 ? (Number(latestExpense?.invest || 0) / monthlyIncome) * 100 : 0;
  if (investRatio >= 20) { score += 2.5; details.push({ type: "success", text: "Investing " + investRatio.toFixed(0) + "% — excellent" }); }
  else if (investRatio >= 10) { score += 1.5; details.push({ type: "info", text: "Investing " + investRatio.toFixed(0) + "% — target 20%" }); }
  else { score += 0.5; details.push({ type: "warning", text: "Investing only " + investRatio.toFixed(0) + "% — increase SIP" }); }

  return { score: Math.min(10, score), details };
}

export default function Dashboard() {
  const { data } = useData();
  const { totalSavings, netWorth } = getNetWorthSummary(data);
  const totalSavingsGoal = data.savings.reduce((sum, item) => sum + Number(item.goal || 0), 0);
  const savingsProgress = totalSavingsGoal > 0 ? Math.round((totalSavings / totalSavingsGoal) * 100) : 0;
  const latestExpense = [...data.expenses].sort((a, b) => b.year - a.year || b.month - a.month)[0];
  const totalExpenses = latestExpense ? EXPENSE_ROWS.reduce((s, k) => s + Number(latestExpense[k] || 0), 0) : 0;
  const previousExpense = [...data.expenses].filter((e) => e !== latestExpense).sort((a, b) => b.year - a.year || b.month - a.month)[0];
  const previousSpend = previousExpense ? EXPENSE_ROWS.reduce((s, k) => s + Number(previousExpense[k] || 0), 0) : 0;
  const monthlyIncome = latestExpense ? Number(latestExpense.paycheck || 0) : 0;
  const spendRatio = monthlyIncome > 0 ? Math.round((totalExpenses / monthlyIncome) * 100) : 0;
  const spendDelta = previousExpense ? totalExpenses - previousSpend : 0;
  const totalEmi = data.loans.reduce((s, i) => s + Number(i.emi || 0), 0);
  const netWorthImprovement = data.loans.reduce((sum, loan) => sum + Math.min(Number(loan.emi || 0), Number(loan.remaining || 0)), 0);
  const expenseByCategory = EXPENSE_ROWS.reduce((acc, k) => { acc[k.toUpperCase()] = data.expenses.reduce((s, e) => s + Number(e[k] || 0), 0); return acc; }, {});
  const pieData = Object.entries(expenseByCategory).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  const savingsChart = data.savings.map((s) => ({ name: s.name, saved: Number(s.amount), goal: Number(s.goal) }));
  const health = calcHealthScore(data);
  const previousHealth = previousExpense ? calcHealthScore({ ...data, expenses: data.expenses.filter((e) => e !== latestExpense) }) : null;
  const score = health.score;
  const scoreTrend = previousHealth ? score - previousHealth.score : 0;
  const healthDetails = health.details.map((detail) => {
    const lower = detail.text.toLowerCase();
    const isEmergency = lower.includes("emergency");
    const isEmi = lower.includes("emi");
    const isSavings = lower.includes("savings rate");
    const emergencyMonths = detail.text.match(/([0-9.]+) months/)?.[1];
    return {
      ...detail,
      type: isEmergency && detail.type === "warning" ? "danger" : detail.type,
      text: isEmergency && detail.type === "warning" ? `Emergency fund ${emergencyMonths || "0.0"} months - urgent` : detail.text,
      priority: isEmi ? 0 : isEmergency ? 1 : isSavings ? 2 : 3,
      actionPath: isEmi ? "/loans" : isEmergency ? "/savings" : isSavings ? "/expenses" : "/simulator",
    };
  }).sort((a, b) => a.priority - b.priority);

  const scoreColor = score >= 9 ? "#16a34a" : score >= 7 ? "#0ea5e9" : score >= 5 ? "#ca8a04" : score >= 3 ? "#f59e0b" : "#dc2626";
  const scoreLabel = score >= 9 ? "Excellent" : score >= 7 ? "Great" : score >= 5 ? "Good" : score >= 3 ? "Fair" : "Critical";
  const scoreBg = score >= 9 ? "#f0fdf4" : score >= 7 ? "#f0f9ff" : score >= 5 ? "#fefce8" : score >= 3 ? "#fffbeb" : "#fef2f2";

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
        <button className="btn btn-outline" onClick={() => exportToExcel(data, "fintrack_full")}>
          <Download size={14} /> Export All
        </button>
      </div>

      <div className="card section-gap" style={{ background: scoreBg, borderColor: scoreColor + "40", borderLeft: "4px solid " + scoreColor }}>
        <div style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 22 }} className="health-inner">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <div className="score-ring" style={{ borderColor: scoreColor, color: scoreColor, flexDirection: "column", gap: 0 }}>
              <span>{score.toFixed(1)}</span>
              <span style={{ fontSize: 11, fontWeight: 600, color: "#64748b" }}>/10</span>
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, color: scoreColor }}>{scoreLabel}</div>
          </div>

          <div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 14 }}>
              <div style={{ fontSize: 16, fontWeight: 700, color: "#0f172a" }}>Financial Health Score</div>
              {previousHealth && (
                <div style={{ fontSize: 12, fontWeight: 700, color: scoreTrend >= 0 ? "#16a34a" : "#dc2626", whiteSpace: "nowrap" }}>
                  {scoreTrend >= 0 ? "+" : "-"}{Math.abs(scoreTrend).toFixed(1)} from last month
                </div>
              )}
            </div>

            <div style={{ position: "relative", paddingTop: 13, marginBottom: 18 }}>
              <div style={{ height: 10, borderRadius: 99, background: "linear-gradient(90deg, #dc2626 0%, #f59e0b 35%, #0ea5e9 65%, #16a34a 100%)" }} />
              <div style={{ position: "absolute", top: 8, left: `calc(${Math.min(100, Math.max(0, score * 10))}% - 6px)`, width: 12, height: 12, borderRadius: "50%", background: "#fff", border: "3px solid " + scoreColor, boxShadow: "0 1px 4px rgba(15, 23, 42, 0.2)" }} />
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, fontSize: 10, color: "#64748b", fontWeight: 700 }}>
                <span>Critical</span><span>Fair</span><span>Good</span><span>Great</span><span>Excellent</span>
              </div>
            </div>

            <div style={{ display: "grid", gap: 8 }}>
              {healthDetails.map((d, i) => {
                const c = d.type === "success" ? "#16a34a" : d.type === "warning" ? "#ca8a04" : d.type === "danger" ? "#dc2626" : "#0ea5e9";
                return (
                  <div key={i} style={{ display: "grid", gridTemplateColumns: "16px 1fr auto", alignItems: "center", gap: 8, padding: "7px 9px", borderRadius: 8, background: d.type === "danger" ? "rgba(254,226,226,0.7)" : d.type === "warning" ? "rgba(254,249,195,0.75)" : "rgba(255,255,255,0.55)", color: d.type === "danger" ? "#991b1b" : "#475569", fontSize: 12, fontWeight: d.type === "danger" ? 700 : 600 }}>
                    <span style={{ width: 9, height: 9, borderRadius: "50%", background: c }} />
                    <span>{d.text}</span>
                    <Link to={d.actionPath} style={{ color: c, fontSize: 11, fontWeight: 800, textDecoration: "none", whiteSpace: "nowrap" }}>
                      {d.type === "danger" || d.type === "warning" ? "Fix >" : "View >"}
                    </Link>
                  </div>
                );
              })}
            </div>

            <div style={{ display: "flex", justifyContent: "center", marginTop: 14 }}>
              <Link to="/ai-insights" className="btn btn-outline" style={{ fontSize: 12, padding: "7px 12px", textDecoration: "none" }}>
                See Full Improvement Plan
              </Link>
            </div>
          </div>
        </div>
      </div>

      <div className="card-grid">
        <div className="stat-card" style={{ borderLeft: "3px solid #0ea5e9" }}>
          <div className="label">Total Savings</div>
          <div className="value text-blue">{fmt(totalSavings)}</div>
          <div className="sub">{totalSavingsGoal > 0 ? `${fmt(totalSavings)} of ${fmt(totalSavingsGoal)} goal | ${savingsProgress}%` : `${data.savings.length} goals/investments`}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: "3px solid " + (netWorth >= 0 ? "#16a34a" : "#dc2626") }}>
          <div className="label">Net Worth</div>
          <div className={"value " + (netWorth >= 0 ? "text-green" : "text-red")}>{fmt(netWorth)}</div>
          <div className="sub">{netWorthImprovement > 0 ? `Improving ~${fmt(netWorthImprovement)}/mo as loans reduce` : "Assets - Liabilities"}</div>
        </div>
        <div className="stat-card" style={{ borderLeft: "3px solid #ca8a04" }}>
          <div className="label">Monthly Spend</div>
          <div className="value text-yellow">{fmt(totalExpenses)}</div>
          <div className="sub">
            {spendRatio}% of income
            {previousExpense && <span> | {spendDelta >= 0 ? "up " : "down "}{fmt(Math.abs(spendDelta))} vs last month</span>}
          </div>
        </div>
        <div className="stat-card" style={{ borderLeft: "3px solid #dc2626" }}>
          <div className="label">Monthly EMI</div>
          <div className="value text-red">{fmt(totalEmi)}</div>
          <div className="sub">{data.loans.length} active loans</div>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }} className="dash-charts">
        <div className="card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, marginBottom: 14 }}>
            <div style={{ fontWeight: 700, color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Savings vs Goals</div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 11, color: "#64748b" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 18, height: 0, borderTop: "2px solid #0ea5e9" }} />Saved</span>
              <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 18, height: 0, borderTop: "2px dashed #94a3b8" }} />Target</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={savingsChart}>
              <XAxis dataKey="name" tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 10 }} />
              <Tooltip contentStyle={TT} />
              <Area type="monotone" dataKey="goal" stroke="#e2e8f0" fill="#f8fafc" strokeDasharray="4 4" name="Target (dashed)" />
              <Area type="monotone" dataKey="saved" stroke="#0ea5e9" fill="#e0f2fe" name="Saved" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="card">
          <div style={{ marginBottom: 14, fontWeight: 700, color: "#94a3b8", fontSize: 11, textTransform: "uppercase", letterSpacing: 1 }}>Expense Breakdown</div>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
              </Pie>
              <Tooltip contentStyle={TT} />
              <Legend wrapperStyle={{ fontSize: 11, color: "#64748b" }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
