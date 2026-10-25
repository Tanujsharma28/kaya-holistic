import { useState } from "react";
import { changeAdminPassword } from "../../api/adminClient";
import { useAdminAuth } from "../../context/AdminAuthContext";

// Settings ke neeche: logged-in admin apni password khud badal sake
export default function ChangePassword() {
  const { email, login } = useAdminAuth();
  const [cur, setCur] = useState("");
  const [next, setNext] = useState("");
  const [again, setAgain] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState(null);

  const label = { display: "block", fontSize: ".78rem", fontWeight: 600, marginBottom: 5 };
  const weak = next && (next.length < 8 || !/[A-Za-z]/.test(next) || !/\d/.test(next));
  const mismatch = again && next !== again;
  const canSave = cur && next && again && !weak && !mismatch && !busy;

  const submit = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const d = await changeAdminPassword(cur, next);
      login(d.token, d.email || email); // naya token, purane devices logout ho jaate hain
      setCur(""); setNext(""); setAgain("");
      setMsg({ ok: true, text: "Password changed. Other devices have been signed out." });
    } catch (err) {
      setMsg({ ok: false, text: err.response?.data?.message || "Could not change the password. Please try again." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="adm-panel" style={{ marginTop: 18 }}>
      <h3>Change password</h3>
      <p className="adm-muted" style={{ marginBottom: 12, fontSize: ".85rem" }}>
        Use at least 8 characters with a letter and a number. Forgot it? Use "Forgot password?" on the sign-in page and a code
        will be sent to {email || "your admin email"}.
      </p>
      <div className="adm-row" style={{ alignItems: "flex-end", gap: 12 }}>
        <div style={{ flex: 1, minWidth: 180 }}>
          <label style={label}>Current password</label>
          <input className="adm-in" type="password" autoComplete="current-password" value={cur} onChange={(e) => setCur(e.target.value)} />
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <label style={label}>New password</label>
          <input className="adm-in" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} />
        </div>
        <div style={{ flex: 1, minWidth: 180 }}>
          <label style={label}>Confirm new password</label>
          <input className="adm-in" type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} />
        </div>
        <button className="adm-btn" disabled={!canSave} onClick={submit}>{busy ? "Saving…" : "Change password"}</button>
      </div>
      {weak && <p style={{ color: "#8f2f20", marginTop: 10, fontSize: ".85rem" }}>At least 8 characters, with a letter and a number.</p>}
      {mismatch && <p style={{ color: "#8f2f20", marginTop: 10, fontSize: ".85rem" }}>The two new passwords do not match.</p>}
      {msg && (
        <p style={{ marginTop: 10, fontSize: ".88rem", color: msg.ok ? "#2f6b3a" : "#8f2f20" }} role="status">{msg.text}</p>
      )}
    </div>
  );
}