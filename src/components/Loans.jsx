import React, { useState } from "react";
import { useData } from "../App";
import { exportSheetToExcel } from "../utils/exportExcel";
import {
  Plus,
  Trash2,
  Download,
  Pencil,
  AlertTriangle,
  Zap,
  Bell,
  LayoutGrid,
  Table2,
} from "lucide-react";
import { fmt } from "../utils/format";

const empty = {
  name: "",
  principal: "",
  remaining: "",
  rate: "",
  emi: "",
  dueDate: "",
  loanType: "Personal",
};
const LOAN_TYPES = [
  "Home",
  "Car",
  "Personal",
  "Credit Card",
  "Education",
  "Other",
];
const LOAN_ICONS = {
  Home: "🏠",
  Car: "🚗",
  "Credit Card": "💳",
  Education: "🎓",
  Personal: "💰",
  Other: "📋",
};

function loanIntel(l) {
  const remaining = Number(l.remaining),
    emi = Number(l.emi),
    rate = Number(l.rate);
  const monthlyRate = rate / 100 / 12;
  let months;
  if (monthlyRate > 0 && emi > monthlyRate * remaining) {
    months = Math.ceil(
      -Math.log(1 - (monthlyRate * remaining) / emi) /
        Math.log(1 + monthlyRate),
    );
  } else if (emi > 0) {
    months = Math.ceil(remaining / emi);
  } else {
    months = 0;
  }
  const interestLeft = Math.max(0, Math.round(emi * months - remaining));
  const now = new Date(2026, 3);
  const closure = new Date(now);
  closure.setMonth(closure.getMonth() + months);
  const closureStr = closure.toLocaleString("en-IN", {
    month: "short",
    year: "numeric",
  });
  const extra = 5000,
    newEmi = emi + extra;
  let fastMonths;
  if (monthlyRate > 0 && newEmi > monthlyRate * remaining) {
    fastMonths = Math.ceil(
      -Math.log(1 - (monthlyRate * remaining) / newEmi) /
        Math.log(1 + monthlyRate),
    );
  } else {
    fastMonths = newEmi > 0 ? Math.ceil(remaining / newEmi) : 0;
  }
  const monthsSaved = months - fastMonths;
  const interestSaved = Math.max(
    0,
    Math.round(emi * months - newEmi * fastMonths),
  );
  const trend = [];
  let bal = remaining;
  const MONTHS = [
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
  for (let m = 0; m < Math.min(months, 24); m++) {
    const d = new Date(now);
    d.setMonth(d.getMonth() + m);
    trend.push({
      month: MONTHS[d.getMonth()] + " " + String(d.getFullYear()).slice(2),
      balance: Math.max(0, Math.round(bal)),
    });
    bal -= emi;
  }
  return {
    months,
    interestLeft,
    closureStr,
    fastMonths,
    monthsSaved,
    interestSaved,
    trend,
  };
}

export default function Loans() {
  const { data, updateData } = useData();
  const [form, setForm] = useState(empty);
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [prepayAmt, setPrepay] = useState({});
  const [viewMode, setViewMode] = useState("card");

  const totalRemaining = data.loans.reduce(
    (s, l) => s + Number(l.remaining),
    0,
  );
  const totalEmi = data.loans.reduce((s, l) => s + Number(l.emi), 0);
  const totalInterest = data.loans.reduce(
    (s, l) => s + loanIntel(l).interestLeft,
    0,
  );
  const latestExp = [...data.expenses].sort(
    (a, b) => b.year - a.year || b.month - a.month,
  )[0];
  const monthlyInc = latestExp ? Number(latestExp.paycheck || 0) : 0;
  const dtiRatio =
    monthlyInc > 0 ? Math.round((totalEmi / monthlyInc) * 100) : 0;
  const dtiColor =
    dtiRatio <= 20 ? "#16a34a" : dtiRatio <= 35 ? "#ca8a04" : "#dc2626";
  const dtiLabel =
    dtiRatio <= 20 ? "Healthy" : dtiRatio <= 35 ? "Moderate ⚠" : "High Risk 🔴";
  const loanFund = data.savings.find((s) =>
    s.name.toLowerCase().includes("loan"),
  );
  const prioritized = [...data.loans].sort(
    (a, b) => Number(b.rate) - Number(a.rate),
  );
  const highestRate = prioritized[0];

  function openAdd() {
    setForm(empty);
    setEditId(null);
    setShowModal(true);
  }
  function openEdit(l) {
    setForm({
      name: l.name,
      principal: l.principal,
      remaining: l.remaining,
      rate: l.rate,
      emi: l.emi,
      dueDate: l.dueDate,
      loanType: l.loanType || "Personal",
    });
    setEditId(l.id);
    setShowModal(true);
  }
  function handleSave() {
    if (!form.name || !form.principal) return;
    const parsed = {
      ...form,
      principal: +form.principal,
      remaining: +form.remaining,
      rate: +form.rate,
      emi: +form.emi,
    };
    if (editId) {
      updateData({
        ...data,
        loans: data.loans.map((l) =>
          l.id === editId ? { ...l, ...parsed } : l,
        ),
      });
    } else {
      updateData({
        ...data,
        loans: [...data.loans, { ...parsed, id: Date.now() }],
      });
    }
    setShowModal(false);
  }
  function handleDelete(id) {
    updateData({ ...data, loans: data.loans.filter((l) => l.id !== id) });
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Loans</h1>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            className="btn btn-outline"
            onClick={() => exportSheetToExcel(data.loans, "Loans")}
          >
            <Download size={13} /> Export
          </button>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={13} /> Add Loan
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3,1fr)",
          gap: 14,
          marginBottom: 20,
          alignItems: "stretch",
        }}
        className="loans-stat-grid"
      >
        <div
          className="stat-card"
          style={{
            borderLeft: "3px solid #dc2626",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div className="label">Total Outstanding</div>
          <div className="value text-red" style={{ fontSize: 18 }}>
            {fmt(totalRemaining)}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
            {data.loans.length} active loans
          </div>
        </div>
        <div
          className="stat-card"
          style={{
            borderLeft: "3px solid #ca8a04",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div className="label">Monthly EMI</div>
          <div className="value text-yellow" style={{ fontSize: 18 }}>
            {fmt(totalEmi)}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
            Total outflow
          </div>
          <div
            style={{
              marginTop: 8,
              padding: "5px 8px",
              background: "#f8fafc",
              borderRadius: 6,
              border: "1px solid #f1f5f9",
            }}
          >
            <div style={{ fontSize: 11, color: dtiColor, fontWeight: 600 }}>
              Debt-to-Income: {dtiRatio}%
            </div>
          </div>
        </div>
        <div
          className="stat-card"
          style={{
            borderLeft: "3px solid #6366f1",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div className="label">Interest to Pay</div>
          <div className="value" style={{ fontSize: 18, color: "#6366f1" }}>
            {fmt(totalInterest)}
          </div>
          <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 3 }}>
            total remaining interest
          </div>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: 12,
          gap: 6,
        }}
      >
        <button
          onClick={() => setViewMode("card")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 12px",
            borderRadius: 7,
            border: "1px solid",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            background: viewMode === "card" ? "#0ea5e9" : "#f8fafc",
            color: viewMode === "card" ? "#fff" : "#64748b",
            borderColor: viewMode === "card" ? "#0ea5e9" : "#e2e8f0",
          }}
        >
          <LayoutGrid size={13} /> Cards
        </button>
        <button
          onClick={() => setViewMode("table")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            padding: "5px 12px",
            borderRadius: 7,
            border: "1px solid",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            background: viewMode === "table" ? "#0ea5e9" : "#f8fafc",
            color: viewMode === "table" ? "#fff" : "#64748b",
            borderColor: viewMode === "table" ? "#0ea5e9" : "#e2e8f0",
          }}
        >
          <Table2 size={13} /> Table
        </button>
      </div>

      {viewMode === "card" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: 20,
            marginBottom: 24,
          }}
          className="loans-card-grid"
        >
          {data.loans.map((l) => {
            const pct = Math.min(
              100,
              Math.round(
                ((Number(l.principal) - Number(l.remaining)) /
                  Number(l.principal)) *
                  100,
              ),
            );
            const intel = loanIntel(l);
            const isHighRate =
              highestRate && l.id === highestRate.id && data.loans.length > 1;
            const rateColor =
              Number(l.rate) <= 6
                ? "#16a34a"
                : Number(l.rate) <= 12
                  ? "#ca8a04"
                  : "#dc2626";
            const extra = Number(prepayAmt[l.id] || 5000);
            const newEmi = Number(l.emi) + extra;
            const mr = Number(l.rate) / 100 / 12;
            let fastM;
            if (mr > 0 && newEmi > mr * Number(l.remaining)) {
              fastM = Math.ceil(
                -Math.log(1 - (mr * Number(l.remaining)) / newEmi) /
                  Math.log(1 + mr),
              );
            } else {
              fastM = newEmi > 0 ? Math.ceil(Number(l.remaining) / newEmi) : 0;
            }
            const mSaved = intel.months - fastM;
            const iSaved = Math.max(
              0,
              Math.round(Number(l.emi) * intel.months - newEmi * fastM),
            );
            const loanIcon = LOAN_ICONS[l.loanType] || "💰";

            return (
              <div
                key={l.id}
                style={{
                  background: "#fff",
                  border: "1px solid " + (isHighRate ? "#fde047" : "#e2e8f0"),
                  borderLeft: "3px solid " + rateColor,
                  borderRadius: 12,
                  padding: 20,
                  boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: 16,
                  }}
                >
                  <div>
                    <div
                      style={{ display: "flex", alignItems: "center", gap: 8 }}
                    >
                      <span style={{ fontSize: 20 }}>{loanIcon}</span>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: 17,
                          color: "#0f172a",
                        }}
                      >
                        {l.name}
                      </div>
                      {isHighRate && (
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: 99,
                            background: "#fef9c3",
                            color: "#ca8a04",
                          }}
                        >
                          ⚡ PRIORITY
                        </span>
                      )}
                    </div>
                    {(() => {
                      const today = new Date();
                      const due = l.dueDate ? new Date(l.dueDate) : null;
                      const diffDays = due
                        ? Math.round((due - today) / (1000 * 60 * 60 * 24))
                        : null;
                      const dueLabel = due
                        ? due.toLocaleDateString("en-IN", {
                            month: "short",
                            day: "numeric",
                          })
                        : "—";
                      const isOverdue = diffDays !== null && diffDays < 0;
                      return (
                        <div
                          style={{
                            fontSize: 12,
                            color: "#94a3b8",
                            marginTop: 3,
                          }}
                        >
                          {l.rate}% p.a. ·{" "}
                          <span
                            style={{
                              color: isOverdue ? "#dc2626" : "#94a3b8",
                              fontWeight: isOverdue ? 700 : 400,
                            }}
                          >
                            {isOverdue ? "🔴 Overdue · " : "Next EMI: "}
                            {dueLabel}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <div style={{ display: "flex", gap: 4 }}>
                    <button
                      onClick={() => openEdit(l)}
                      style={{
                        background: "#f8fafc",
                        border: "1px solid #e2e8f0",
                        borderRadius: 6,
                        padding: "4px 8px",
                        cursor: "pointer",
                        color: "#64748b",
                        display: "flex",
                      }}
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={() => handleDelete(l.id)}
                      style={{
                        background: "#fef2f2",
                        border: "1px solid #fca5a5",
                        borderRadius: 6,
                        padding: "4px 8px",
                        cursor: "pointer",
                        color: "#dc2626",
                        display: "flex",
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr",
                    gap: 16,
                  }}
                >
                  <div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: "repeat(3,1fr)",
                        gap: 10,
                        marginBottom: 14,
                      }}
                    >
                      {[
                        {
                          label: "Principal",
                          value: fmt(l.principal),
                          color: "#64748b",
                        },
                        {
                          label: "Remaining",
                          value: fmt(l.remaining),
                          color: "#dc2626",
                        },
                        {
                          label: "Monthly EMI",
                          value: fmt(l.emi),
                          color: "#ca8a04",
                        },
                      ].map((s) => (
                        <div
                          key={s.label}
                          style={{
                            background: "#f8fafc",
                            borderRadius: 8,
                            padding: "8px 10px",
                            border: "1px solid #f1f5f9",
                          }}
                        >
                          <div
                            style={{
                              fontSize: 10,
                              color: "#94a3b8",
                              marginBottom: 3,
                            }}
                          >
                            {s.label}
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              fontWeight: 700,
                              color: s.color,
                            }}
                          >
                            {s.value}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div style={{ marginBottom: 12 }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: 11,
                          color: "#94a3b8",
                          marginBottom: 5,
                        }}
                      >
                        <span
                          style={{
                            color: isHighRate ? "#ca8a04" : "#16a34a",
                            fontWeight: 600,
                          }}
                        >
                          {pct}% paid off
                        </span>
                      </div>
                      <div
                        style={{
                          background: "#e2e8f0",
                          borderRadius: 99,
                          height: 7,
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: pct + "%",
                            background: isHighRate
                              ? "linear-gradient(90deg, #f59e0b, #ca8a04)"
                              : "linear-gradient(90deg, #10b981, #16a34a)",
                            height: "100%",
                            borderRadius: 99,
                          }}
                        />
                      </div>
                    </div>
                    <div
                      style={{
                        background: "#f8fafc",
                        borderRadius: 10,
                        padding: "12px 14px",
                        border: "1px solid #f1f5f9",
                      }}
                    >
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr",
                          gap: "6px 12px",
                        }}
                      >
                        {[
                          {
                            label: "Remaining Tenure",
                            value: intel.months + " months",
                            color: "#0ea5e9",
                          },
                          {
                            label: "Interest Left",
                            value: fmt(intel.interestLeft),
                            color: "#dc2626",
                          },
                          {
                            label: "Loan Closure",
                            value: intel.closureStr,
                            color: "#16a34a",
                          },
                          {
                            label: "Rate",
                            value: l.rate + "% p.a.",
                            color: "#ca8a04",
                          },
                        ].map((item) => (
                          <div key={item.label}>
                            <div style={{ fontSize: 10, color: "#94a3b8" }}>
                              {item.label}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 700,
                                color: item.color,
                              }}
                            >
                              {item.value}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {viewMode === "table" && (
        <div
          style={{
            background: "#fff",
            border: "1px solid #e2e8f0",
            borderRadius: 12,
            overflow: "hidden",
            boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
            marginBottom: 24,
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                fontSize: 13,
              }}
            >
              <thead>
                <tr style={{ background: "#f8fafc" }}>
                  {[
                    "Loan",
                    "Principal",
                    "Remaining",
                    "Rate",
                    "EMI",
                    "Tenure",
                    "Closure",
                    "",
                  ].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: "9px 12px",
                        color: "#94a3b8",
                        fontSize: 11,
                        textTransform: "uppercase",
                        letterSpacing: 0.5,
                        textAlign: "left",
                        borderBottom: "1px solid #e2e8f0",
                        whiteSpace: "nowrap",
                        fontWeight: 700,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data.loans.map((l) => {
                  const intel = loanIntel(l);
                  const isHP =
                    highestRate &&
                    l.id === highestRate.id &&
                    data.loans.length > 1;
                  return (
                    <tr
                      key={l.id}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        background: isHP ? "#fffbeb" : "transparent",
                      }}
                    >
                      <td
                        style={{
                          padding: "11px 12px",
                          color: "#0f172a",
                          fontWeight: isHP ? 700 : 400,
                        }}
                      >
                        {l.name}
                        {isHP && (
                          <span
                            style={{
                              fontSize: 9,
                              color: "#ca8a04",
                              marginLeft: 5,
                            }}
                          >
                            ⚡
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "11px 12px", color: "#64748b" }}>
                        {fmt(l.principal)}
                      </td>
                      <td
                        style={{
                          padding: "11px 12px",
                          color: "#dc2626",
                          fontWeight: 600,
                        }}
                      >
                        {fmt(l.remaining)}
                      </td>
                      <td style={{ padding: "11px 12px", color: "#ca8a04" }}>
                        {l.rate}%
                      </td>
                      <td style={{ padding: "11px 12px", color: "#ca8a04" }}>
                        {fmt(l.emi)}
                      </td>
                      <td style={{ padding: "11px 12px", color: "#0ea5e9" }}>
                        {intel.months} mo
                      </td>
                      <td style={{ padding: "11px 12px", color: "#16a34a" }}>
                        {intel.closureStr}
                      </td>
                      <td style={{ padding: "11px 12px" }}>
                        <div style={{ display: "flex", gap: 4 }}>
                          <button
                            onClick={() => openEdit(l)}
                            style={{
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              borderRadius: 5,
                              padding: "3px 7px",
                              cursor: "pointer",
                              color: "#64748b",
                              display: "flex",
                            }}
                          >
                            <Pencil size={11} />
                          </button>
                          <button
                            onClick={() => handleDelete(l.id)}
                            style={{
                              background: "#fef2f2",
                              border: "1px solid #fca5a5",
                              borderRadius: 5,
                              padding: "3px 7px",
                              cursor: "pointer",
                              color: "#dc2626",
                              display: "flex",
                            }}
                          >
                            <Trash2 size={11} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {loanFund && Number(loanFund.amount) > 0 && (
        <div
          style={{
            background: "#f0fdf4",
            border: "1px solid #86efac",
            borderLeft: "3px solid #16a34a",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Zap size={15} color="#16a34a" />
          <div style={{ fontSize: 13, color: "#0f172a" }}>
            <span style={{ fontWeight: 700, color: "#16a34a" }}>
              Savings Sync:{" "}
            </span>
            You have{" "}
            <span style={{ color: "#16a34a", fontWeight: 700 }}>
              {fmt(loanFund.amount)}
            </span>{" "}
            in "{loanFund.name}".
            {highestRate && (
              <span>
                {" "}
                Using it to prepay "{highestRate.name}" could save ~
                {fmt(
                  Math.round(
                    (Number(loanFund.amount) * Number(highestRate.rate)) / 100,
                  ),
                )}{" "}
                in annual interest.
              </span>
            )}
          </div>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="modal"
            style={{ width: 520 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header" style={{ marginBottom: 20 }}>
              <div className="modal-title">
                {editId ? "Edit Loan" : "Add Loan"}
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  background: "#f1f5f9",
                  border: "none",
                  borderRadius: 8,
                  width: 32,
                  height: 32,
                  cursor: "pointer",
                  color: "#64748b",
                  fontSize: 16,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                ✕
              </button>
            </div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "14px 20px",
              }}
              className="loan-form-grid"
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 6,
                  gridColumn: "1 / -1",
                }}
              >
                <label
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: 0.8,
                  }}
                >
                  Loan Type
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  {LOAN_TYPES.map((t) => (
                    <button
                      key={t}
                      onClick={() => setForm({ ...form, loanType: t })}
                      style={{
                        padding: "6px 12px",
                        borderRadius: 7,
                        border: "1px solid",
                        cursor: "pointer",
                        fontSize: 12,
                        fontWeight: 600,
                        background: form.loanType === t ? "#0ea5e9" : "#f8fafc",
                        color: form.loanType === t ? "#fff" : "#64748b",
                        borderColor:
                          form.loanType === t ? "#0ea5e9" : "#e2e8f0",
                      }}
                    >
                      {LOAN_ICONS[t]} {t}
                    </button>
                  ))}
                </div>
              </div>
              {[
                {
                  key: "name",
                  label: "Loan Name",
                  type: "text",
                  placeholder: "e.g. Home Loan",
                },
                {
                  key: "principal",
                  label: "Principal",
                  type: "number",
                  placeholder: "0",
                },
                {
                  key: "remaining",
                  label: "Remaining",
                  type: "number",
                  placeholder: "0",
                },
                {
                  key: "rate",
                  label: "Interest Rate (%)",
                  type: "number",
                  placeholder: "0",
                },
                {
                  key: "emi",
                  label: "Monthly EMI",
                  type: "number",
                  placeholder: "0",
                },
                {
                  key: "dueDate",
                  label: "Due Date",
                  type: "date",
                  placeholder: "",
                },
              ].map((f) => (
                <div
                  key={f.key}
                  style={{ display: "flex", flexDirection: "column", gap: 6 }}
                >
                  <label
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: "#64748b",
                      textTransform: "uppercase",
                      letterSpacing: 0.8,
                    }}
                  >
                    {f.label}
                  </label>
                  <input
                    type={f.type}
                    value={form[f.key]}
                    placeholder={f.placeholder}
                    onChange={(e) =>
                      setForm({ ...form, [f.key]: e.target.value })
                    }
                    style={{
                      background: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      borderRadius: 8,
                      padding: "10px 12px",
                      color: "#0f172a",
                      fontSize: 14,
                      outline: "none",
                      width: "100%",
                      boxSizing: "border-box",
                    }}
                  />
                </div>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 24,
              }}
            >
              <button
                onClick={() => setShowModal(false)}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  color: "#64748b",
                  cursor: "pointer",
                  fontWeight: 600,
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                style={{
                  padding: "10px 20px",
                  borderRadius: 8,
                  border: "none",
                  background: "linear-gradient(135deg,#0ea5e9,#6366f1)",
                  color: "#fff",
                  cursor: "pointer",
                  fontWeight: 700,
                }}
              >
                {editId ? "Save Changes" : "Add Loan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
