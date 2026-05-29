import React from "react";

/**
 * Shared centered modal used across the whole app.
 *
 * Props:
 *   open       – boolean
 *   onClose    – fn
 *   icon       – JSX element (lucide icon or emoji)
 *   iconBg     – background color string for icon circle (default gold tint)
 *   title      – string
 *   subtitle   – string (optional)
 *   onSave     – fn
 *   saveLabel  – string (default "Save")
 *   children   – form content
 */
export default function AppModal({
  open, onClose, icon, iconBg, title, subtitle,
  onSave, saveLabel = "Save", children,
}) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.72)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 400, backdropFilter: "blur(4px)",
        padding: "0 16px",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "var(--bg-card)",
          borderRadius: 20,
          padding: "32px 24px 28px",
          width: "100%",
          maxWidth: 360,
          border: "1px solid var(--border)",
          textAlign: "center",
        }}
      >
        {/* Icon */}
        {icon && (
          <div style={{
            width: 56, height: 56, borderRadius: "50%",
            background: iconBg || "rgba(201,162,39,0.15)",
            display: "flex", alignItems: "center", justifyContent: "center",
            margin: "0 auto 16px",
          }}>
            {icon}
          </div>
        )}

        {/* Title */}
        <div style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", marginBottom: 4 }}>
          {title}
        </div>
        {subtitle && (
          <div style={{ fontSize: 13, color: "var(--text-secondary)", marginBottom: 20 }}>
            {subtitle}
          </div>
        )}

        {/* Content */}
        <div style={{ textAlign: "left", marginTop: subtitle ? 0 : 20 }}>
          {children}
        </div>

        {/* Buttons */}
        <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
          <button onClick={onClose} style={{
            flex: 1, padding: "12px", borderRadius: 12,
            background: "var(--bg-muted)", border: "1px solid var(--border)",
            color: "var(--text-secondary)", fontSize: 14, fontWeight: 600, cursor: "pointer",
          }}>
            Cancel
          </button>
          <button onClick={onSave} style={{
            flex: 1, padding: "12px", borderRadius: 12,
            background: "var(--gold)", border: "none",
            color: "#000", fontSize: 14, fontWeight: 700, cursor: "pointer",
          }}>
            {saveLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
