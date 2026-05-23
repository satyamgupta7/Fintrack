import React, { useState } from "react";
import { BarChart3, Sparkles } from "lucide-react";
import AiInsights from "./AiInsights";
import Simulator from "./Simulator";

export default function Analytics() {
  const [activeTab, setActiveTab] = useState("insights");

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Planning & Insights</h1>
        <p style={{ fontSize: 12, color: "#64748b", marginTop: 4 }}>
          AI-powered recommendations and scenario planning
        </p>
      </div>

      {/* Tab Navigation */}
      <div
        style={{
          display: "flex",
          gap: 2,
          marginBottom: 24,
          borderBottom: "1px solid #e2e8f0",
        }}
      >
        <button
          onClick={() => setActiveTab("insights")}
          style={{
            background: "transparent",
            border: "none",
            padding: "12px 16px",
            fontSize: 14,
            fontWeight: activeTab === "insights" ? 700 : 500,
            color: activeTab === "insights" ? "#0ea5e9" : "#94a3b8",
            borderBottom:
              activeTab === "insights" ? "2px solid #0ea5e9" : "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.15s",
          }}
        >
          <Sparkles size={16} />
          Smart Insights
        </button>
        <button
          onClick={() => setActiveTab("simulator")}
          style={{
            background: "transparent",
            border: "none",
            padding: "12px 16px",
            fontSize: 14,
            fontWeight: activeTab === "simulator" ? 700 : 500,
            color: activeTab === "simulator" ? "#7c3aed" : "#94a3b8",
            borderBottom:
              activeTab === "simulator" ? "2px solid #7c3aed" : "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: 6,
            transition: "all 0.15s",
          }}
        >
          <BarChart3 size={16} />
          Scenario Planner
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "insights" && (
        <div>
          <AiInsights isTabbed={true} />
        </div>
      )}
      {activeTab === "simulator" && (
        <div>
          <Simulator isTabbed={true} />
        </div>
      )}
    </div>
  );
}
