import React, { useState, useEffect } from "react";

/**
 * Amount input that shows Indian comma formatting while typing.
 * value    – raw number
 * onChange – called with raw number
 * placeholder – string
 * autoFocus – bool
 */
export default function AmountInput({ value, onChange, placeholder = "0", autoFocus = false }) {
  const [display, setDisplay] = useState(
    value ? Number(value).toLocaleString("en-IN") : ""
  );

  useEffect(() => {
    setDisplay(value ? Number(value).toLocaleString("en-IN") : "");
  }, [value]);

  function handleChange(e) {
    const digits = e.target.value.replace(/[^0-9]/g, "");
    setDisplay(digits ? Number(digits).toLocaleString("en-IN") : "");
    onChange(digits ? Number(digits) : 0);
  }

  return (
    <div style={{
      background: "var(--bg-muted)",
      borderRadius: 14,
      padding: "14px 16px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      border: "1px solid var(--border)",
    }}>
      <span style={{ fontSize: 22, color: "var(--text-primary)", fontWeight: 700, marginRight: 10 }}>₹</span>
      <input
        type="text"
        inputMode="numeric"
        value={display}
        onChange={handleChange}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{
          background: "none", border: "none", outline: "none",
          fontSize: 22, fontWeight: 700, color: "var(--text-primary)",
          textAlign: "left", minWidth: 80, maxWidth: 200,
        }}
      />
    </div>
  );
}
