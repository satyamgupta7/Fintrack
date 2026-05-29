import React, { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "../firebase";

export default function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function set(field) { return e => setForm(f => ({ ...f, [field]: e.target.value })); }
  function switchMode(next) { setMode(next); setError(""); setForm({ name: "", email: "", password: "", confirm: "" }); }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (mode === "login") {
        if (!form.email || !form.password) { setError("Please enter email and password."); setLoading(false); return; }
        const cred = await signInWithEmailAndPassword(auth, form.email, form.password);
        onLogin({ uid: cred.user.uid, name: cred.user.displayName || form.email.split("@")[0], email: cred.user.email });
      } else {
        if (!form.name || !form.email || !form.password) { setError("Please fill in all fields."); setLoading(false); return; }
        if (form.password !== form.confirm) { setError("Passwords do not match."); setLoading(false); return; }
        if (form.password.length < 6) { setError("Password must be at least 6 characters."); setLoading(false); return; }
        const cred = await createUserWithEmailAndPassword(auth, form.email, form.password);
        await updateProfile(cred.user, { displayName: form.name.trim() });
        onLogin({ uid: cred.user.uid, name: form.name.trim(), email: cred.user.email });
      }
    } catch (err) {
      const msgs = {
        "auth/user-not-found": "No account found with this email.",
        "auth/wrong-password": "Incorrect password.",
        "auth/email-already-in-use": "An account with this email already exists.",
        "auth/invalid-email": "Invalid email address.",
        "auth/invalid-credential": "Incorrect email or password.",
      };
      setError(msgs[err.code] || err.message);
    }
    setLoading(false);
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">FT</div>
          <div className="auth-logo-text">FinTrack</div>
        </div>
        <div className="auth-title">{mode === "login" ? "Welcome back" : "Create account"}</div>
        <div className="auth-subtitle">
          {mode === "login" ? "Sign in to your FinTrack dashboard" : "Start managing your finances today"}
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit}>
          {mode === "signup" && (
            <div className="auth-input-group">
              <label>Full Name</label>
              <input type="text" placeholder="Your name" value={form.name} onChange={set("name")} />
            </div>
          )}
          <div className="auth-input-group">
            <label>Email</label>
            <input type="email" placeholder="you@example.com" value={form.email} onChange={set("email")} />
          </div>
          <div className="auth-input-group">
            <label>Password</label>
            <input type="password" placeholder="••••••••" value={form.password} onChange={set("password")} />
          </div>
          {mode === "signup" && (
            <div className="auth-input-group">
              <label>Confirm Password</label>
              <input type="password" placeholder="••••••••" value={form.confirm} onChange={set("confirm")} />
            </div>
          )}
          <button type="submit" className="auth-btn" disabled={loading}>
            {loading ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="auth-switch">
          {mode === "login" ? (
            <>Don't have an account? <a onClick={() => switchMode("signup")}>Sign up</a></>
          ) : (
            <>Already have an account? <a onClick={() => switchMode("login")}>Sign in</a></>
          )}
        </div>
      </div>
    </div>
  );
}
