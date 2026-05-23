import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useData } from "../App";
import { exportToExcel } from "../utils/exportExcel";
import { getNetWorthSummary } from "../utils/netWorth";
import { fmt, EXPENSE_KEYS as EXPENSE_ROWS } from "../utils/format";
import {
  Download,
  CreditCard,
  PiggyBank,
  Wallet,
  TrendingUp,
  Sparkles,
} from "lucide-react";

const CATEGORY_META = {
  emi: { label: "EMI", color: "#E65100" },
  invest: { label: "Invest", color: "#1565C0" },
  rent: { label: "Rent", color: "#6A1B9A" },
  medicine: { label: "Medicine", color: "#B71C1C" },
  personal: { label: "Personal", color: "#37474F" },
  credit: { label: "Credit", color: "#F57F17" },
  family: { label: "Family", color: "#4E342E" },
  insurance: { label: "Insurance", color: "#2E7D32" },
};

function getGreeting(name) {
  const hour = new Date().getHours();
  return hour < 12
    ? `Good morning, ${name}`
    : hour < 17
      ? `Good afternoon, ${name}`
      : `Good evening, ${name}`;
}

export default function Dashboard() {
  const { data } = useData();
  const userName = (() => {
    const stored = sessionStorage.getItem("ft_user");
    if (!stored) return "User";
    try {
      return JSON.parse(stored)?.name?.split(" ")[0] || "User";
    } catch {
      return "User";
    }
  })();

  const recentExpenses = useMemo(
    () =>
      [...data.expenses].sort((a, b) => b.year - a.year || b.month - a.month),
    [data.expenses],
  );
  const latest = recentExpenses[0];
  const last3 = recentExpenses.slice(0, 3);
  const totalSavings = data.savings.reduce(
    (sum, g) => sum + Number(g.amount || 0),
    0,
  );
  const totalSavingsTarget = data.savings.reduce(
    (sum, g) => sum + Number(g.goal || 0),
    0,
  );
  const totalLoanDue = data.loans.reduce(
    (sum, l) => sum + Number(l.remaining || 0),
    0,
  );
  const totalEMI = data.loans.reduce((sum, l) => sum + Number(l.emi || 0), 0);
  const totalLoanOriginal = data.loans.reduce(
    (sum, l) => sum + Number(l.principal || 0),
    0,
  );
  const avgIncome = last3.length
    ? Math.round(
        last3.reduce((s, m) => s + Number(m.paycheck || 0), 0) / last3.length,
      )
    : 0;
  const avgSpend = last3.length
    ? Math.round(
        last3.reduce(
          (s, m) => s + EXPENSE_ROWS.reduce((p, k) => p + Number(m[k] || 0), 0),
          0,
        ) / last3.length,
      )
    : 0;
  const savingRate =
    avgIncome > 0 ? Math.round(((avgIncome - avgSpend) / avgIncome) * 100) : 0;
  const loanPaidPct =
    totalLoanOriginal > 0
      ? Math.round(
          ((totalLoanOriginal - totalLoanDue) / totalLoanOriginal) * 100,
        )
      : 0;
  const savingsPct =
    totalSavingsTarget > 0
      ? Math.round((totalSavings / totalSavingsTarget) * 100)
      : 0;
  const breakdown = latest
    ? EXPENSE_ROWS.map((key) => ({
        key,
        label: CATEGORY_META[key]?.label || key,
        color: CATEGORY_META[key]?.color || "#0ea5e9",
        value: Number(latest[key] || 0),
      })).filter((item) => item.value > 0)
    : [];
  const totalBreakdown = breakdown.reduce((s, item) => s + item.value, 0);
  const netWorth = totalSavings - totalLoanDue;
  const savingRateColor =
    savingRate >= 20 ? "#16a34a" : savingRate >= 0 ? "#F57F17" : "#dc2626";

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Dashboard</h1>
      </div>

      <div className="dashboard-row">
        <div
          className="summary-card"
          style={{ borderLeft: "4px solid #0ea5e9" }}
        >
          <div className="label">Net Worth</div>
          <div className="stat-amount">{fmt(netWorth)}</div>
          <div className="stat-note">
            {netWorth >= 0 ? "Positive net worth" : "Liabilities exceed assets"}
          </div>
        </div>
        <div
          className="summary-card"
          style={{ borderLeft: "4px solid #10b981" }}
        >
          <div className="label">Total Savings</div>
          <div className="stat-amount text-blue">{fmt(totalSavings)}</div>
          <div className="stat-note">
            {totalSavingsTarget > 0
              ? `${savingsPct}% of goal`
              : `${data.savings.length} goals`}
          </div>
        </div>
      </div>

      <div className="dashboard-row">
        <div
          className="summary-card"
          style={{ borderLeft: "4px solid #ef4444" }}
        >
          <div className="label">Loan Due</div>
          <div className="stat-amount text-red">{fmt(totalLoanDue)}</div>
          <div className="stat-note">{data.loans.length} active loan(s)</div>
        </div>
        <div
          className="summary-card"
          style={{ borderLeft: "4px solid #7c3aed" }}
        >
          <div className="label">Monthly EMI</div>
          <div className="stat-amount text-yellow">{fmt(totalEMI)}</div>
          <div className="stat-note">{loanPaidPct}% paid down</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <div className="section-title-sm">Saving Rate</div>
          <div className="card-badge" style={{ color: savingRateColor }}>
            {savingRate}%
          </div>
        </div>
        <div className="progress-bg">
          <div
            className="progress-fill"
            style={{
              width: `${Math.min(100, Math.max(0, savingRate))}%`,
              backgroundColor: savingRateColor,
            }}
          />
        </div>
        <div className="card-row">
          <div className="meta-text">
            Avg Income:{" "}
            <span style={{ color: "#16a34a", fontWeight: 700 }}>
              {fmt(avgIncome)}
            </span>
          </div>
          <div className="meta-text">
            Avg Spend:{" "}
            <span style={{ color: "#ef4444", fontWeight: 700 }}>
              {fmt(avgSpend)}
            </span>
          </div>
        </div>
        <div
          className="meta-text"
          style={{ color: savingRateColor, fontWeight: 600, marginTop: 8 }}
        >
          {savingRate >= 20
            ? "✓ Great! You are saving well."
            : savingRate >= 0
              ? "⚠ Try to save at least 20% of income."
              : "✗ Spending exceeds income."}
        </div>
      </div>

      <div className="dashboard-row">
        <div className="health-card">
          <div className="health-header">
            <CreditCard size={18} color="#dc2626" />
            <div className="row-title">Loan Health</div>
          </div>
          <div className="health-pct" style={{ color: "#dc2626" }}>
            {loanPaidPct}% paid
          </div>
          <div className="progress-bg">
            <div
              className="progress-fill"
              style={{ width: `${loanPaidPct}%`, backgroundColor: "#dc2626" }}
            />
          </div>
          <div className="meta-text" style={{ marginTop: 6, fontSize: 12 }}>
            {fmt(totalLoanDue)} remaining
          </div>
        </div>
        <div className="health-card">
          <div className="health-header">
            <PiggyBank size={18} color="#10b981" />
            <div className="row-title">Savings Goal</div>
          </div>
          <div className="health-pct" style={{ color: "#10b981" }}>
            {savingsPct}% reached
          </div>
          <div className="progress-bg">
            <div
              className="progress-fill"
              style={{
                width: `${Math.min(100, savingsPct)}%`,
                backgroundColor: "#10b981",
              }}
            />
          </div>
          <div className="meta-text" style={{ marginTop: 6, fontSize: 12 }}>
            {fmt(totalSavings)} of {fmt(totalSavingsTarget)}
          </div>
        </div>
      </div>

      <div className="page-header" style={{ marginTop: 18, marginBottom: 12 }}>
        <h2 className="page-title">Quick Actions</h2>
      </div>
      <div className="actions-row">
        <Link to="/savings" className="action-btn">
          <div className="action-icon" style={{ backgroundColor: "#10b98122" }}>
            <Wallet size={22} color="#10b981" />
          </div>
          <div style={{ fontWeight: 600, fontSize: 12 }}>View Savings</div>
        </Link>
        <Link to="/loans" className="action-btn">
          <div className="action-icon" style={{ backgroundColor: "#ef444422" }}>
            <CreditCard size={22} color="#ef4444" />
          </div>
          <div style={{ fontWeight: 600, fontSize: 12 }}>Manage Loans</div>
        </Link>
        <Link to="/expenses" className="action-btn">
          <div className="action-icon" style={{ backgroundColor: "#6A1B9A22" }}>
            <TrendingUp size={22} color="#6A1B9A" />
          </div>
          <div style={{ fontWeight: 600, fontSize: 12 }}>Expenses</div>
        </Link>
        <Link to="/ai-insights" className="action-btn">
          <div className="action-icon" style={{ backgroundColor: "#1565C022" }}>
            <Sparkles size={22} color="#1565C0" />
          </div>
          <div style={{ fontWeight: 600, fontSize: 12 }}>Insights</div>
        </Link>
      </div>
    </div>
  );
}
