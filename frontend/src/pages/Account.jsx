import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext";
import { updateMe, cancelBooking } from "../api/userClient";

const CSS = `
.ac-wrap{min-height:100vh;background:#faf7f2;padding:110px 18px 70px;font-family:'DM Sans',sans-serif;color:#2b2016}
.ac-in{max-width:820px;margin:0 auto}
.ac-top{display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:24px}
.ac-av{width:62px;height:62px;border-radius:50%;background:#a67c52;color:#fff;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:600;overflow:hidden;flex-shrink:0}
.ac-av img{width:100%;height:100%;object-fit:cover}
.ac-top h1{font-family:'Fraunces',Georgia,serif;font-weight:400;font-size:1.8rem;margin:0}
.ac-mut{color:#8a7d6e;font-size:.9rem}
.ac-grow{flex:1;min-width:200px}
.ac-btn{border:1.5px solid #a67c52;color:#7c5c38;background:#fff;border-radius:99px;padding:10px 22px;font:inherit;font-weight:600;font-size:.9rem;cursor:pointer}
.ac-btn:hover{background:#fbf3e7}
.ac-btn.fill{background:#a67c52;color:#fff}.ac-btn.fill:hover{background:#7c5c38}.ac-btn:disabled{opacity:.5;cursor:default}
.ac-btn.danger{border-color:#c0564b;color:#a1342c}.ac-btn.danger:hover{background:#fbebe8}
.ac-btn.sm{padding:7px 16px;font-size:.82rem}
.ac-stats{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-bottom:22px}
@media(max-width:640px){.ac-stats{grid-template-columns:1fr 1fr}}
.ac-stat{background:#fff;border:1.5px solid #e6ddd0;border-radius:16px;padding:16px;text-align:center}
.ac-stat b{display:block;font-family:'Fraunces',Georgia,serif;font-size:1.7rem;font-weight:400;color:#7c5c38}
.ac-stat span{color:#8a7d6e;font-size:.82rem}
.ac-card{background:#fff;border:1.5px solid #e6ddd0;border-radius:22px;padding:24px;margin-bottom:22px}
.ac-card h3{font-family:'Fraunces',Georgia,serif;font-weight:400;font-size:1.25rem;margin:0 0 6px}
.ac-tl{list-style:none;margin:16px 0 0;padding:0}
.ac-ev{display:flex;gap:14px;padding:12px 0;border-top:1px solid #f3ece1;align-items:flex-start}
.ac-ic{width:38px;height:38px;border-radius:50%;background:#fbf3e7;display:flex;align-items:center;justify-content:center;font-size:1.05rem;flex-shrink:0}
.ac-ev b{display:block;font-weight:500;line-height:1.4}
.ac-more{margin-top:12px;text-align:center}
.ac-form{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:640px){.ac-form{grid-template-columns:1fr}}
.ac-f{display:flex;flex-direction:column;gap:5px;font-size:.82rem;font-weight:600;color:#5d5043}
.ac-i{border:1.5px solid #e2d8c8;border-radius:10px;padding:10px 12px;font:inherit;font-weight:400}
.ac-i:disabled{background:#f6f1e9;color:#8a7d6e}
.ac-ok{color:#2f6b34;font-size:.85rem;margin-left:12px}
.ac-bk{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;padding:14px 0;border-top:1px solid #f3ece1}
.ac-bk:first-of-type{border-top:none}
.ac-bk-name{font-weight:600;margin:0 0 4px}
.ac-bdg{display:inline-block;font-size:.74rem;font-weight:700;letter-spacing:.02em;text-transform:uppercase;padding:3px 10px;border-radius:99px;margin-left:8px;vertical-align:middle}
.ac-bdg.confirmed{background:#e9f3e5;color:#2f6b34}
.ac-bdg.completed{background:#e7eef6;color:#2c5a8a}
.ac-bdg.cancelled{background:#f3ece1;color:#8a7d6e}
.ac-bdg.no-show{background:#fbe9e7;color:#a1342c}
.ac-empty{color:#8a7d6e;font-size:.9rem;margin-top:10px}
`;

const ICON = { signup: "🎉", login: "🔑", quiz: "✨", booking_page: "📅", book_click: "👆", cancel: "🚫", consent: "📝", intake: "🌿" };
const fmt = (iso) => new Date(iso).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
const fmtDate = (d) => new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });

function BookingCard({ b, onCancel, cancelling }) {
  return (
    <div className="ac-bk">
      <div>
        <p className="ac-bk-name">{b.serviceName}<span className={`ac-bdg ${b.status}`}>{b.status.replace("-", " ")}</span></p>
        <span className="ac-mut">{fmtDate(b.date)} · {b.slot}</span>
      </div>
      {b.status === "confirmed" && (
        <button className="ac-btn danger sm" disabled={cancelling} onClick={() => onCancel(b.id)}>
          {cancelling ? "Cancelling…" : "Cancel"}
        </button>
      )}
    </div>
  );
}

export default function Account() {
  const { user, data, ready, logout, refresh } = useUserAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", phone: "" });
  const [saved, setSaved] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [shown, setShown] = useState(20);
  const [showPast, setShowPast] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);
  const [cancelErr, setCancelErr] = useState("");

  useEffect(() => { if (ready && !user) navigate("/login?next=/account", { replace: true }); }, [ready, user, navigate]);
  useEffect(() => { if (user) setForm({ name: user.name || "", phone: user.phone || "" }); }, [user]);

  if (!ready || !user || !data) {
    return <div className="ac-wrap"><style>{CSS}</style><div className="ac-in"><p className="ac-mut">Loading your account…</p></div></div>;
  }

  const first = (user.name || "there").split(" ")[0];
  const dirty = form.name !== user.name || form.phone !== (user.phone || "");
  const c = data.counts;
  const upcoming = data.upcoming || [];
  const past = data.past || [];

  const save = async () => {
    setSaveErr(""); setSaved(false);
    try { await updateMe(form); await refresh(); setSaved(true); }
    catch (e) { setSaveErr(e?.response?.data?.message || "Could not save. Please try again."); }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;
    setCancelErr(""); setCancellingId(id);
    try { await cancelBooking(id); await refresh(); }
    catch (e) { setCancelErr(e?.response?.data?.message || "Could not cancel. Please try again."); }
    finally { setCancellingId(null); }
  };

  return (
    <div className="ac-wrap"><style>{CSS}</style>
      <div className="ac-in">
        <div className="ac-top">
          <div className="ac-av">{user.picture ? <img src={user.picture} alt="" referrerPolicy="no-referrer" /> : first[0]?.toUpperCase()}</div>
          <div className="ac-grow">
            <h1>Hi, {first}</h1>
            <div className="ac-mut">{user.email}</div>
          </div>
          <button className="ac-btn" onClick={() => { logout(); navigate("/"); }}>Sign out</button>
        </div>

        <div className="ac-stats">
          <div className="ac-stat"><b>{c.quizzes}</b><span>Skin quizzes</span></div>
          <div className="ac-stat"><b>{c.bookings}</b><span>Bookings</span></div>
          <div className="ac-stat"><b>{c.forms}</b><span>Forms filled</span></div>
          <div className="ac-stat"><b>{c.signins}</b><span>Sign-ins</span></div>
        </div>

        <div className="ac-card">
          <h3>Upcoming appointments</h3>
          {cancelErr && <p className="ac-mut" style={{ color: "#a1342c" }}>{cancelErr}</p>}
          {upcoming.length === 0 ? (
            <p className="ac-empty">No upcoming appointments. <a href="/#services">Book one</a>.</p>
          ) : (
            upcoming.map((b) => (
              <BookingCard key={b.id} b={b} onCancel={handleCancel} cancelling={cancellingId === b.id} />
            ))
          )}
        </div>

        <div className="ac-card">
          <h3>Past appointments</h3>
          {past.length === 0 ? (
            <p className="ac-empty">Nothing here yet.</p>
          ) : (
            <>
              {(showPast ? past : past.slice(0, 3)).map((b) => (
                <BookingCard key={b.id} b={b} onCancel={handleCancel} cancelling={false} />
              ))}
              {past.length > 3 && (
                <div className="ac-more"><button className="ac-btn sm" onClick={() => setShowPast(!showPast)}>{showPast ? "Show less" : `Show all (${past.length})`}</button></div>
              )}
            </>
          )}
        </div>

        <div className="ac-card">
          <h3>Your activity</h3>
          <div className="ac-mut">Everything else you have done on our website, newest first.</div>
          {data.timeline.length === 0 ? (
            <p className="ac-mut" style={{ marginTop: 14 }}>Nothing yet. Take the skin quiz to get started.</p>
          ) : (
            <ul className="ac-tl">
              {data.timeline.slice(0, shown).map((e) => (
                <li className="ac-ev" key={e.id}>
                  <div className="ac-ic">{ICON[e.type] || "•"}</div>
                  <div>
                    <b>{e.text}</b>
                    <span className="ac-mut">{fmt(e.at)}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {data.timeline.length > shown && (
            <div className="ac-more"><button className="ac-btn" onClick={() => setShown(shown + 20)}>Show more</button></div>
          )}
        </div>

        <div className="ac-card">
          <h3>Your details</h3>
          <div className="ac-form" style={{ marginTop: 14 }}>
            <label className="ac-f">Name<input className="ac-i" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></label>
            <label className="ac-f">Phone<input className="ac-i" type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></label>
            <label className="ac-f">Email (from Google)<input className="ac-i" value={user.email} disabled /></label>
          </div>
          <div style={{ marginTop: 14 }}>
            <button className="ac-btn fill" disabled={!dirty} onClick={save}>Save</button>
            {saved && <span className="ac-ok">Saved ✓</span>}
            {saveErr && <span className="ac-ok" style={{ color: "#a1342c" }}>{saveErr}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
