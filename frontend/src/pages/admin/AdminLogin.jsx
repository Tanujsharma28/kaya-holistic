import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { adminLogin } from "../../api/adminClient";
import { useAdminAuth } from "../../context/AdminAuthContext";

export default function AdminLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login, isAuthenticated } = useAdminAuth();
  const navigate = useNavigate();

  if (isAuthenticated) return <Navigate to="/admin/dashboard" replace />;

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await adminLogin(email.trim(), password);
      localStorage.setItem('adminToken', data.token);
      login(data.token, data.email);
      navigate("/admin/dashboard");
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Cannot reach the server. Make sure the backend is running on port 5000."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="kl-page">
      <style>{`
        .kl-page{--esp:#241a13;--esp2:#3a2b1d;--gold:#c89b5c;--brand:#a67c52;--brand2:#7c5c38;--cream:#faf7f2;--blush:#fbf3e7;--line:#e6ddd0;--ink:#2b2016;--mut:#8a7d6e;
          min-height:100vh;display:grid;grid-template-columns:1.15fr 1fr;background:var(--cream);color:var(--ink);font-family:"DM Sans",system-ui,sans-serif}
        .kl-page *{box-sizing:border-box}
        .kl-page p,.kl-page h1,.kl-page h2{margin:0;max-width:none}

        .kl-art{position:relative;display:flex;flex-direction:column;justify-content:space-between;padding:52px 56px;color:#f3ead9;overflow:hidden;
          background:linear-gradient(155deg,rgba(36,26,19,.85) 0%,rgba(58,43,29,.72) 55%,rgba(36,26,19,.88) 100%),url(/hero-bg.jpg) center/cover,var(--esp)}
        .kl-art::after{content:"";position:absolute;right:-120px;bottom:-120px;width:420px;height:420px;border-radius:50%;
          background:radial-gradient(circle,rgba(200,155,92,.26),transparent 68%);pointer-events:none}
        .kl-brand{display:flex;align-items:center;gap:14px;position:relative;z-index:1}
        .kl-mark{width:46px;height:46px;border-radius:50%;display:grid;place-items:center;font-size:1.3rem;
          color:var(--esp);background:linear-gradient(145deg,#fff,#f7efe2);border:1px solid var(--gold);box-shadow:0 4px 14px rgba(200,155,92,.3)}
        .kl-brand b{display:block;font:500 1.25rem Fraunces,Georgia,serif;color:#fff}
        .kl-brand span{font-size:.78rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--gold)}
        .kl-pitch{position:relative;z-index:1;max-width:460px}
        .kl-pitch h1{font:400 clamp(2.2rem,3.6vw,3.1rem)/1.15 Fraunces,Georgia,serif;color:#fff;margin-bottom:16px}
        .kl-pitch h1 em{color:var(--gold);font-style:italic}
        .kl-pitch p{color:rgba(243,234,217,.85);line-height:1.75;font-size:1.02rem}
        .kl-list{position:relative;z-index:1;display:flex;gap:28px;flex-wrap:wrap;font-size:.85rem;color:rgba(243,234,217,.75)}
        .kl-list b{display:block;color:#fff;font-weight:600;margin-bottom:2px;font-size:.9rem}

        .kl-form-side{display:grid;place-items:center;padding:40px 28px;background:var(--cream)}
        .kl-card{width:min(420px,100%);background:#ffffff;padding:40px 36px;border-radius:24px;border:1px solid var(--line);box-shadow:0 12px 36px rgba(43,32,22,.06)}
        .kl-card h2{font:500 2.1rem Fraunces,Georgia,serif;margin-bottom:6px;color:var(--ink)}
        .kl-sub{color:var(--mut);margin-bottom:28px;font-size:.92rem}
        .kl-field{margin-bottom:20px}
        .kl-field label{display:block;font-size:.82rem;font-weight:600;color:#5c4f41;margin-bottom:7px;text-transform:uppercase;letter-spacing:.04em}
        .kl-input{position:relative}
        .kl-input input{width:100%;padding:14px 16px;border:1.5px solid var(--line);border-radius:14px;background:#fff;font:inherit;font-size:.95rem;color:var(--ink);outline:none;transition:border-color .2s,box-shadow .2s}
        .kl-input input:focus{border-color:var(--brand);box-shadow:0 0 0 4px rgba(166,124,82,.14)}
        .kl-input input.pw{padding-right:78px}
        .kl-eye{position:absolute;right:8px;top:50%;transform:translateY(-50%);background:none;border:0;color:var(--brand2);font:600 .8rem inherit;font-family:inherit;cursor:pointer;padding:8px 10px;border-radius:8px}
        .kl-eye:hover{background:#f6efe3}
        .kl-hint{font-size:.78rem;color:#b9822b;margin-top:6px}
        .kl-error{background:#fbeeea;border:1px solid #efc5bb;color:#8f2f20;border-radius:12px;padding:12px 14px;font-size:.88rem;margin-bottom:18px}
        .kl-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:10px;border:0;border-radius:99px;padding:15px;background:linear-gradient(135deg,var(--brand) 0%,var(--brand2) 100%);color:#fff;font:600 .98rem inherit;font-family:inherit;cursor:pointer;transition:all .2s;box-shadow:0 6px 18px rgba(166,124,82,.28)}
        .kl-btn:hover:not(:disabled){background:linear-gradient(135deg,var(--brand2) 0%,#5e4326 100%);transform:translateY(-1px);box-shadow:0 8px 22px rgba(124,92,56,.35)}
        .kl-btn:disabled{opacity:.65;cursor:not-allowed;box-shadow:none}
        .kl-btn:focus-visible,.kl-eye:focus-visible,.kl-back:focus-visible{outline:2px solid var(--gold);outline-offset:2px}
        .kl-spin{width:16px;height:16px;border-radius:50%;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;animation:klspin .7s linear infinite}
        @keyframes klspin{to{transform:rotate(360deg)}}
        .kl-foot{margin-top:26px;padding-top:18px;border-top:1px solid var(--line);display:flex;justify-content:space-between;gap:10px;flex-wrap:wrap;font-size:.82rem;color:var(--mut)}
        .kl-back{color:var(--brand2);font-weight:600;text-decoration:none}
        .kl-back:hover{text-decoration:underline}

        @media (max-width:900px){
          .kl-page{grid-template-columns:1fr}
          .kl-art{padding:32px 24px;min-height:0;gap:22px}
          .kl-pitch h1{font-size:1.9rem}
          .kl-list{display:none}
          .kl-card{padding:28px 22px}
        }
        @media (prefers-reduced-motion:reduce){.kl-spin{animation-duration:2s}.kl-btn{transition:none}}
      `}</style>

      <section className="kl-art">
        <div className="kl-brand">
          <div className="kl-mark">🌿</div>
          <div>
            <b>Kaya Holistic Spa</b>
            <span>Evanston, Illinois</span>
          </div>
        </div>

        <div className="kl-pitch">
          <h1>
            Your day at a glance, <em>before the first client arrives.</em>
          </h1>
          <p>
            See today's appointments, confirm or move a booking, and read each client's skin
            intake in one place.
          </p>
        </div>

        <div className="kl-list">
          <div><b>Bookings and calendar</b>Visits and consultations</div>
          <div><b>Client emails</b>Sent on cancel or reschedule</div>
          <div><b>Services</b>Prices and durations</div>
        </div>
      </section>

      <section className="kl-form-side">
        <form className="kl-card" onSubmit={submit} noValidate={false}>
          <h2>Welcome back</h2>
          <p className="kl-sub">Sign in with your admin email to continue.</p>

          <div aria-live="polite">
            {error && <div className="kl-error" role="alert">{error}</div>}
          </div>

          <div className="kl-field">
            <label htmlFor="kl-email">Email</label>
            <div className="kl-input">
              <input
                id="kl-email"
                type="email"
                autoComplete="username"
                placeholder="you@kayaholisticspa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoFocus
              />
            </div>
          </div>

          <div className="kl-field">
            <label htmlFor="kl-pw">Password</label>
            <div className="kl-input">
              <input
                id="kl-pw"
                className="pw"
                type={show ? "text" : "password"}
                autoComplete="current-password"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyUp={(e) => setCaps(e.getModifierState && e.getModifierState("CapsLock"))}
                required
              />
              <button
                type="button"
                className="kl-eye"
                onClick={() => setShow((s) => !s)}
                aria-label={show ? "Hide password" : "Show password"}
              >
                {show ? "Hide" : "Show"}
              </button>
            </div>
            {caps && <p className="kl-hint">Caps Lock is on.</p>}
          </div>

          <button className="kl-btn" type="submit" disabled={loading || !email || !password}>
            {loading && <span className="kl-spin" aria-hidden="true" />}
            {loading ? "Signing in" : "Sign in"}
          </button>

          <div className="kl-foot">
            <Link className="kl-back" to="/">Back to website</Link>
            <span>Authorized staff only</span>
          </div>
        </form>
      </section>
    </div>
  );
}