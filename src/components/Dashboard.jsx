import React, { useMemo } from "react";
import { Link } from "react-router-dom";
import { useData } from "../App";
import { fmt, EXPENSE_KEYS as EXPENSE_ROWS } from "../utils/format";
import {
  CreditCard,
  PiggyBank,
  TrendingUp,
  Sparkles,
  Wallet,
  ShieldCheck,
  Clock,
} from "lucide-react";

const CATEGORY_META = {
  emi: { label: "EMI", color: "#A32D2D" },
  invest: { label: "Invest", color: "#185FA5" },
  rent: { label: "Rent", color: "#6A1B9A" },
  medicine: { label: "Medicine", color: "#B71C1C" },
  personal: { label: "Personal", color: "#37474F" },
  credit: { label: "Credit", color: "#E65100" },
  family: { label: "Family", color: "#4E342E" },
  insurance: { label: "Insurance", color: "#2E7D32" },
};

function getGreeting(name) {
  const hour = new Date().getHours();
  const prefix =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  return `${prefix}, ${name}`;
}

function getTodayLabel() {
  return new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

// ── small reusable pieces ──────────────────────────────────────────────────

function ProgressBar({ pct, color, height = 8 }) {
  return (
    <div
      style={{
        background: "var(--color-bg-muted)",
        borderRadius: 99,
        height,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: `${Math.min(100, Math.max(0, pct))}%`,
          height: "100%",
          background: color,
          borderRadius: 99,
          transition: "width .6s ease",
        }}
      />
    </div>
  );
}

function SectionTitle({ children, right }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        margin: "18px 0 10px",
      }}
    >
      <span
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "var(--color-text-muted)",
          textTransform: "uppercase",
          letterSpacing: "0.6px",
        }}
      >
        {children}
      </span>
      {right}
    </div>
  );
}

// ── main component ─────────────────────────────────────────────────────────

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

  // ── derived numbers ──────────────────────────────────────────────────────
  const sortedExpenses = useMemo(
    () =>
      [...data.expenses].sort((a, b) => b.year - a.year || b.month - a.month),
    [data.expenses],
  );

  const latest = sortedExpenses[0];
  const last3 = sortedExpenses.slice(0, 3);

  const totalSavings = data.savings.reduce(
    (s, g) => s + Number(g.amount || 0),
    0,
  );
  const totalSavingsTarget = data.savings.reduce(
    (s, g) => s + Number(g.goal || 0),
    0,
  );
  const totalLoanDue = data.loans.reduce(
    (s, l) => s + Number(l.remaining || 0),
    0,
  );
  const totalEMI = data.loans.reduce((s, l) => s + Number(l.emi || 0), 0);
  const totalLoanOriginal = data.loans.reduce(
    (s, l) => s + Number(l.principal || 0),
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
  const netWorth = totalSavings - totalLoanDue;

  const savingRateColor =
    savingRate >= 20 ? "#639922" : savingRate >= 0 ? "#BA7517" : "#E24B4A";

  // expense breakdown for latest month, sorted desc
  const breakdown = latest
    ? EXPENSE_ROWS.map((key) => ({
        key,
        label: CATEGORY_META[key]?.label || key,
        color: CATEGORY_META[key]?.color || "#888",
        value: Number(latest[key] || 0),
      }))
        .filter((i) => i.value > 0)
        .sort((a, b) => b.value - a.value)
    : [];
  const totalBreakdown = breakdown.reduce((s, i) => s + i.value, 0);

  const MONTH_NAMES = [
    "",
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  // ── styles (CSS-in-JS) ───────────────────────────────────────────────────
  const s = {
    page: {
      maxWidth: 480,
      margin: "0 auto",
      padding: "16px 16px 32px",
      background: "var(--color-bg-page)",
      minHeight: "100vh",
      fontFamily: "var(--font-sans, system-ui, sans-serif)",
    },
    greeting: {
      fontSize: 13,
      color: "var(--color-text-muted)",
      marginBottom: 2,
    },
    greetingName: { color: "var(--color-text-primary)", fontWeight: 500 },
    dateLabel: { fontSize: 11, color: "var(--color-text-muted)" },

    // hero net-worth card
    heroCard: {
      background: "#185FA5",
      borderRadius: 16,
      padding: "20px 20px 16px",
      margin: "14px 0 4px",
      color: "#fff",
    },
    heroLabel: {
      fontSize: 12,
      opacity: 0.75,
      textTransform: "uppercase",
      letterSpacing: "0.5px",
      marginBottom: 6,
    },
    heroAmount: {
      fontSize: 32,
      fontWeight: 500,
      marginBottom: 14,
      letterSpacing: "-0.5px",
    },
    heroPills: { display: "flex", gap: 10 },
    pill: {
      background: "rgba(255,255,255,0.15)",
      borderRadius: 8,
      padding: "6px 12px",
      flex: 1,
    },
    pillLabel: { fontSize: 11, opacity: 0.75, marginBottom: 3 },
    pillVal: { fontSize: 14, fontWeight: 500 },

    // 2-col stat cards
    statsGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 },
    statCard: {
      background: "var(--color-bg-card)",
      border: "0.5px solid var(--color-border)",
      borderRadius: 14,
      padding: "14px 14px 12px",
    },
    statIcon: {
      width: 34,
      height: 34,
      borderRadius: 9,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      marginBottom: 10,
    },
    statLabel: {
      fontSize: 11,
      color: "var(--color-text-muted)",
      marginBottom: 4,
    },
    statVal: { fontSize: 18, fontWeight: 500, marginBottom: 2 },
    statNote: { fontSize: 11, color: "var(--color-text-muted)" },

    // saving rate card
    rateCard: {
      background: "var(--color-bg-card)",
      border: "0.5px solid var(--color-border)",
      borderRadius: 14,
      padding: 14,
      marginTop: 10,
    },
    rateHeader: {
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 10,
    },
    rateMsg: {
      fontSize: 12,
      marginTop: 8,
      padding: "6px 10px",
      borderRadius: 7,
    },
    rateRow: { display: "flex", justifyContent: "space-between", marginTop: 8 },

    // savings list
    listCard: {
      background: "var(--color-bg-card)",
      border: "0.5px solid var(--color-border)",
      borderRadius: 14,
      overflow: "hidden",
    },
    listRow: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "13px 14px",
      borderBottom: "0.5px solid var(--color-border)",
    },
    listRowLast: {
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "13px 14px",
    },
    listIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexShrink: 0,
    },
    listInfo: { flex: 1, minWidth: 0 },
    listName: {
      fontSize: 13,
      fontWeight: 500,
      color: "var(--color-text-primary)",
    },
    listSub: { fontSize: 11, color: "var(--color-text-muted)", marginTop: 2 },

    // loan card
    loanCard: {
      background: "var(--color-bg-card)",
      border: "0.5px solid var(--color-border)",
      borderRadius: 14,
      padding: 14,
    },
    loanHeader: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      marginBottom: 12,
    },
    loanBadge: {
      fontSize: 11,
      background: "var(--color-bg-info)",
      color: "var(--color-text-info)",
      padding: "2px 8px",
      borderRadius: 99,
    },
    loanStats: {
      display: "grid",
      gridTemplateColumns: "repeat(3,1fr)",
      gap: 8,
      marginBottom: 12,
    },
    loanStat: {
      background: "var(--color-bg-muted)",
      borderRadius: 9,
      padding: "8px 10px",
      textAlign: "center",
    },
    loanStatVal: {
      fontSize: 14,
      fontWeight: 500,
      color: "var(--color-text-primary)",
    },
    loanStatLabel: {
      fontSize: 11,
      color: "var(--color-text-muted)",
      marginTop: 2,
    },
    duePill: {
      display: "flex",
      alignItems: "center",
      gap: 6,
      marginTop: 10,
      background: "var(--color-bg-danger)",
      borderRadius: 7,
      padding: "6px 10px",
    },

    // breakdown
    breakdownCard: {
      background: "var(--color-bg-card)",
      border: "0.5px solid var(--color-border)",
      borderRadius: 14,
      padding: 14,
    },
    bdRow: { display: "flex", alignItems: "center", gap: 8, marginBottom: 8 },

    // quick actions
    actionsGrid: {
      display: "grid",
      gridTemplateColumns: "repeat(4,1fr)",
      gap: 8,
    },
    actionBtn: {
      background: "var(--color-bg-card)",
      border: "0.5px solid var(--color-border)",
      borderRadius: 14,
      padding: "12px 6px",
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 6,
      textDecoration: "none",
      cursor: "pointer",
    },
    actionIcon: {
      width: 36,
      height: 36,
      borderRadius: 10,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
    },
    actionLabel: {
      fontSize: 11,
      fontWeight: 500,
      color: "var(--color-text-primary)",
      textAlign: "center",
    },
  };

  // ── render ───────────────────────────────────────────────────────────────
  return (
    <div style={s.page}>
      {/* greeting */}
      <div style={s.greeting}>
        <span style={s.greetingName}>{getGreeting(userName)}</span> 👋
      </div>
      <div style={s.dateLabel}>{getTodayLabel()}</div>

      {/* ── hero: net worth ── */}
      <div style={s.heroCard}>
        <div style={s.heroLabel}>Net worth</div>
        <div style={s.heroAmount}>{fmt(netWorth)}</div>
        <div style={s.heroPills}>
          <div style={s.pill}>
            <div style={s.pillLabel}>Assets</div>
            <div style={s.pillVal}>{fmt(totalSavings)}</div>
          </div>
          <div style={s.pill}>
            <div style={s.pillLabel}>Liabilities</div>
            <div style={s.pillVal}>{fmt(totalLoanDue)}</div>
          </div>
          <div style={s.pill}>
            <div style={s.pillLabel}>Status</div>
            <div style={s.pillVal}>
              {netWorth >= 0 ? "✓ Positive" : "✗ Negative"}
            </div>
          </div>
        </div>
      </div>

      {/* ── overview stat cards ── */}
      <SectionTitle>Overview</SectionTitle>
      <div style={s.statsGrid}>
        <div style={s.statCard}>
          <div style={{ ...s.statIcon, background: "#EAF3DE" }}>
            <PiggyBank size={18} color="#3B6D11" />
          </div>
          <div style={s.statLabel}>Total savings</div>
          <div style={{ ...s.statVal, color: "#3B6D11" }}>
            {fmt(totalSavings)}
          </div>
          <div style={s.statNote}>{savingsPct}% of goal</div>
        </div>

        <div style={s.statCard}>
          <div style={{ ...s.statIcon, background: "#FCEBEB" }}>
            <CreditCard size={18} color="#A32D2D" />
          </div>
          <div style={s.statLabel}>Loan remaining</div>
          <div style={{ ...s.statVal, color: "#A32D2D" }}>
            {fmt(totalLoanDue)}
          </div>
          <div style={s.statNote}>{loanPaidPct}% paid off</div>
        </div>

        <div style={s.statCard}>
          <div style={{ ...s.statIcon, background: "#FAEEDA" }}>
            <Clock size={18} color="#854F0B" />
          </div>
          <div style={s.statLabel}>Monthly EMI</div>
          <div style={{ ...s.statVal, color: "#854F0B" }}>{fmt(totalEMI)}</div>
          <div style={s.statNote}>
            {data.loans[0]?.dueDate
              ? `Due ${new Date(data.loans[0].dueDate).getDate()}th every month`
              : `${data.loans.length} active loan(s)`}
          </div>
        </div>

        <div style={s.statCard}>
          <div style={{ ...s.statIcon, background: "#E6F1FB" }}>
            <TrendingUp size={18} color="#185FA5" />
          </div>
          <div style={s.statLabel}>Monthly invest</div>
          <div style={{ ...s.statVal, color: "#185FA5" }}>
            {fmt(latest?.invest || 0)}
          </div>
          <div style={s.statNote}>This month</div>
        </div>
      </div>

      {/* ── saving rate ── */}
      <div style={s.rateCard}>
        <div style={s.rateHeader}>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "var(--color-text-primary)",
            }}
          >
            Saving rate
          </span>
          <span
            style={{ fontSize: 20, fontWeight: 500, color: savingRateColor }}
          >
            {savingRate}%
          </span>
        </div>
        <ProgressBar pct={savingRate} color={savingRateColor} height={8} />
        <div style={s.rateRow}>
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            Avg income:{" "}
            <span style={{ color: "#3B6D11", fontWeight: 500 }}>
              {fmt(avgIncome)}
            </span>
          </span>
          <span style={{ fontSize: 12, color: "var(--color-text-muted)" }}>
            Avg spend:{" "}
            <span style={{ color: "#E24B4A", fontWeight: 500 }}>
              {fmt(avgSpend)}
            </span>
          </span>
        </div>
        <div
          style={{
            ...s.rateMsg,
            background:
              savingRate >= 20
                ? "#EAF3DE"
                : savingRate >= 0
                  ? "#FAEEDA"
                  : "#FCEBEB",
            color:
              savingRate >= 20
                ? "#3B6D11"
                : savingRate >= 0
                  ? "#854F0B"
                  : "#A32D2D",
          }}
        >
          {savingRate >= 20
            ? "✓ Great! You are saving well above the 20% benchmark."
            : savingRate >= 0
              ? "⚠ Try to save at least 20% of income."
              : "✗ Spending exceeds income this period."}
        </div>
      </div>

      {/* ── savings goals ── */}
      <SectionTitle>Savings goals</SectionTitle>
      <div style={s.listCard}>
        {data.savings.map((goal, idx) => {
          const pct =
            goal.goal > 0 ? Math.round((goal.amount / goal.goal) * 100) : 0;
          const isLast = idx === data.savings.length - 1;
          const isSIP = goal.type === "SIP";
          return (
            <div key={goal.id} style={isLast ? s.listRowLast : s.listRow}>
              <div
                style={{
                  ...s.listIcon,
                  background: isSIP ? "#E6F1FB" : "#EAF3DE",
                }}
              >
                {isSIP ? (
                  <TrendingUp size={17} color="#185FA5" />
                ) : (
                  <ShieldCheck size={17} color="#3B6D11" />
                )}
              </div>
              <div style={s.listInfo}>
                <div style={s.listName}>{goal.name}</div>
                <div style={s.listSub}>
                  {isSIP && goal.monthlyAmount
                    ? `SIP ₹${Number(goal.monthlyAmount).toLocaleString("en-IN")}/mo · `
                    : ""}
                  Goal: {fmt(goal.goal)} · {pct}% reached
                </div>
                <div style={{ marginTop: 6 }}>
                  <ProgressBar
                    pct={pct}
                    color={isSIP ? "#378ADD" : "#639922"}
                    height={4}
                  />
                </div>
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 500,
                  color: isSIP ? "#185FA5" : "#3B6D11",
                  flexShrink: 0,
                }}
              >
                {fmt(goal.amount)}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── active loans ── */}
      <SectionTitle>Active loans</SectionTitle>
      {data.loans.map((loan) => {
        const paid =
          loan.principal > 0
            ? Math.round(
                ((loan.principal - loan.remaining) / loan.principal) * 100,
              )
            : 0;
        const dueDateStr = loan.dueDate
          ? new Date(loan.dueDate).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          : null;
        return (
          <div key={loan.id} style={{ ...s.loanCard, marginBottom: 10 }}>
            <div style={s.loanHeader}>
              <span
                style={{
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--color-text-primary)",
                }}
              >
                {loan.name}
              </span>
              <span style={s.loanBadge}>{loan.loanType || "Loan"}</span>
            </div>
            <div style={s.loanStats}>
              <div style={s.loanStat}>
                <div style={s.loanStatVal}>{fmt(loan.principal)}</div>
                <div style={s.loanStatLabel}>Principal</div>
              </div>
              <div style={s.loanStat}>
                <div style={{ ...s.loanStatVal, color: "#A32D2D" }}>
                  {fmt(loan.remaining)}
                </div>
                <div style={s.loanStatLabel}>Remaining</div>
              </div>
              <div style={s.loanStat}>
                <div style={s.loanStatVal}>{loan.rate}%</div>
                <div style={s.loanStatLabel}>Rate p.a.</div>
              </div>
            </div>
            <ProgressBar pct={paid} color="#639922" height={8} />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 6,
                marginBottom: 2,
              }}
            >
              <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                {fmt(loan.principal - loan.remaining)} paid ({paid}%)
              </span>
              <span style={{ fontSize: 11, color: "var(--color-text-muted)" }}>
                EMI: {fmt(loan.emi)}/mo
              </span>
            </div>
            {dueDateStr && (
              <div style={s.duePill}>
                <Clock size={13} color="var(--color-text-danger)" />
                <span
                  style={{ fontSize: 12, color: "var(--color-text-danger)" }}
                >
                  Next due: <strong>{dueDateStr}</strong> — {fmt(loan.emi)}
                </span>
              </div>
            )}
          </div>
        );
      })}

      {/* ── quick actions ── */}
      <SectionTitle>Quick actions</SectionTitle>
      <div style={s.actionsGrid}>
        {[
          {
            to: "/savings",
            icon: <Wallet size={20} color="#3B6D11" />,
            bg: "#EAF3DE",
            label: "Savings",
          },
          {
            to: "/loans",
            icon: <CreditCard size={20} color="#A32D2D" />,
            bg: "#FCEBEB",
            label: "Loans",
          },
          {
            to: "/expenses",
            icon: <TrendingUp size={20} color="#854F0B" />,
            bg: "#FAEEDA",
            label: "Expenses",
          },
          {
            to: "/ai-insights",
            icon: <Sparkles size={20} color="#534AB7" />,
            bg: "#EEEDFE",
            label: "Insights",
          },
        ].map(({ to, icon, bg, label }) => (
          <Link key={to} to={to} style={s.actionBtn}>
            <div style={{ ...s.actionIcon, background: bg }}>{icon}</div>
            <div style={s.actionLabel}>{label}</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
