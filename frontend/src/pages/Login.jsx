import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import GoogleSignIn from "../components/GoogleSignIn";
import { useUserAuth } from "../context/UserAuthContext";

const CSS = `
.lg-wrap{min-height:100vh;background:#faf7f2;display:flex;align-items:center;justify-content:center;padding:110px 18px 60px;font-family:'DM Sans',sans-serif}
.lg-card{width:100%;max-width:440px;background:#fff;border:1.5px solid #e6ddd0;border-radius:24px;padding:42px 34px;text-align:center;box-shadow:0 12px 36px rgba(36,26,19,.06)}
.lg-leaf{font-size:2.2rem;margin-bottom:6px}
.lg-card h1{font-family:'Fraunces',Georgia,serif;font-weight:400;font-size:1.9rem;margin:0 0 8px;color:#2b2016}
.lg-sub{color:#8a7d6e;line-height:1.6;margin:0 0 26px}
.lg-list{text-align:left;margin:0 0 26px;padding:16px 18px;background:#fbf3e7;border-radius:14px;color:#5c4f41;font-size:.9rem;line-height:1.9;list-style:none}
.lg-err{background:#fdecea;color:#a1342c;border-radius:10px;padding:10px 14px;margin-top:16px;font-size:.88rem}
.lg-busy{color:#8a7d6e;margin-top:16px;font-size:.9rem}
.lg-fine{margin-top:22px;color:#a39686;font-size:.78rem;line-height:1.5}
`;

export default function Login() {
  const { user, ready, login } = useUserAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const next = params.get("next") && params.get("next").startsWith("/") ? params.get("next") : "/account";
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { if (ready && user) navigate(next, { replace: true }); }, [ready, user, next, navigate]);

  const onCredential = async (cred) => {
    setErr(""); setBusy(true);
    try {
      await login(cred);
    } catch (e) {
      setErr(e?.response?.data?.message || "Sign-in failed. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="lg-wrap"><style>{CSS}</style>
      <div className="lg-card">
        <div className="lg-leaf">🌿</div>
        <h1>Welcome to Kaya</h1>
        <p className="lg-sub">Sign in to see your appointments, past visits and forms in one place.</p>
        <ul className="lg-list">
          <li>📅 Your upcoming appointments</li>
          <li>🧾 Your visit history</li>
          <li>📝 Your consent and skin forms</li>
        </ul>
        <GoogleSignIn onCredential={onCredential} onError={setErr} />
        {busy && <div className="lg-busy">Signing you in…</div>}
        {err && <div className="lg-err" role="alert">{err}</div>}
        <p className="lg-fine">We only use your Google name and email to find your bookings. We never post anything.</p>
      </div>
    </div>
  );
}
