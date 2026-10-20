import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { submitConsent } from "../api/client";

const HEALTH_Q = [
  ["allergies", "Any allergies?", "allergiesDetail", "If yes, please list"],
  ["skinProblems", "Do you have skin problems (like acne or eczema)?"],
  ["recentTreatments", "Had any face surgery or treatments lately?"],
  ["pregnantOrBreastfeeding", "Are you pregnant or breastfeed?"],
  ["medications", "Taking any medications?", "medicationsDetail", "If yes, what"],
  ["keloid", "Do you have a history of keloid scarring?"],
];
const SKIN_TYPES = ["Oily", "Dry", "Combination", "Sensitive", "Normal"];
const CONDITIONS = ["Redness", "Breakouts", "Flaky", "Sunburn", "Itchy", "Tight", "Dark spots", "Other"];
const AGREEMENTS = [
  ["understand", "I understand the facial and possible side effects."],
  ["tellDiscomfort", "I agree to tell my esthetician if I feel any discomfort."],
  ["honest", "I have answered everything honestly."],
  ["consent", "I give my consent for this facial treatment and will hold her harmless from any liability that may result from this treatment. I understand that my Esthetician will take every precaution to minimize or eliminate negative reaction as much as possible."],
];

const CSS = `
.cs-wrap{min-height:100vh;background:#faf7f2;padding:110px 18px 70px;font-family:'DM Sans',sans-serif;color:#2b2016}
.cs-card{max-width:760px;margin:0 auto;background:#fff;border:1.5px solid #e6ddd0;border-radius:22px;padding:38px;box-shadow:0 10px 30px rgba(36,26,19,.05)}
.cs-card h1{font-family:'Fraunces',Georgia,serif;font-weight:400;font-size:2rem;margin:0 0 4px}
.cs-sub{color:#8a7d6e;margin:0 0 6px}
.cs-card h2{font-family:'Fraunces',Georgia,serif;font-weight:400;font-size:1.25rem;margin:30px 0 14px;padding-bottom:8px;border-bottom:1px solid #efe6d8;color:#7c5c38}
.cs-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}
@media(max-width:640px){.cs-grid{grid-template-columns:1fr}.cs-card{padding:24px 18px}}
.cs-f{display:flex;flex-direction:column;gap:5px;font-size:.85rem;font-weight:600;color:#5d5043}
.cs-f.full{grid-column:1/-1}
.cs-in{border:1.5px solid #e2d8c8;border-radius:10px;padding:11px 13px;font:inherit;font-weight:400;color:#2b2016;background:#fff}
.cs-in:focus{outline:none;border-color:#a67c52}
.cs-q{padding:12px 0;border-bottom:1px solid #f3ece1}
.cs-q p{margin:0 0 8px;font-size:.95rem}
.cs-pills{display:flex;flex-wrap:wrap;gap:8px}
.cs-pill{border:1.5px solid #e2d8c8;background:#fff;border-radius:99px;padding:7px 18px;font:inherit;font-size:.88rem;cursor:pointer;color:#5d5043}
.cs-pill.on{background:#a67c52;border-color:#a67c52;color:#fff}
.cs-chk{display:flex;gap:10px;align-items:flex-start;font-size:.92rem;line-height:1.55;margin:12px 0;cursor:pointer}
.cs-chk input{margin-top:4px;accent-color:#a67c52;width:17px;height:17px;flex-shrink:0}
.cs-sig{font-family:'Fraunces',Georgia,serif;font-style:italic;font-size:1.3rem}
.cs-err{background:#fdecea;color:#a1342c;border-radius:10px;padding:11px 14px;margin-top:16px;font-size:.9rem}
.cs-btn{margin-top:22px;width:100%;background:#a67c52;color:#fff;border:0;border-radius:99px;padding:15px;font:inherit;font-weight:600;font-size:1rem;cursor:pointer}
.cs-btn:hover{background:#7c5c38}.cs-btn:disabled{opacity:.6;cursor:wait}
.cs-thanks{text-align:center;padding:30px 10px}
.cs-check{width:64px;height:64px;border-radius:50%;background:#a67c52;color:#fff;font-size:2rem;display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
`;

const empty = {
  name: "", address: "", dob: "", phone: "", email: "",
  health: {},
  skin: { concern: "", type: "", conditions: [], conditionOther: "", products: "", area: "" },
  agreements: {}, signature: "",
};

export default function ConsentForm() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [f, setF] = useState(empty);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  const setHealth = (k, v) => setF({ ...f, health: { ...f.health, [k]: v } });
  const setSkin = (k, v) => setF({ ...f, skin: { ...f.skin, [k]: v } });
  const toggleCond = (c) => {
    const cur = f.skin.conditions;
    setSkin("conditions", cur.includes(c) ? cur.filter((x) => x !== c) : [...cur, c]);
  };
  const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  const submit = async () => {
    setErr("");
    if (!f.name.trim() || !f.phone.trim() || !f.dob || !f.email.trim()) return setErr("Please fill in your name, date of birth, phone and email.");
    if (HEALTH_Q.some(([k]) => !f.health[k])) return setErr("Please answer all the Yes / No health questions.");
    if (!AGREEMENTS.every(([k]) => f.agreements[k])) return setErr("Please tick all the consent statements.");
    if (!f.signature.trim()) return setErr("Please type your full name as your signature.");
    setBusy(true);
    try {
      await submitConsent({ ...f, bookingId: params.get("booking") || undefined });
      setDone(true);
      window.scrollTo(0, 0);
    } catch (e) {
      setErr(e?.response?.data?.message || "We could not submit the form. Please check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="cs-wrap"><style>{CSS}</style>
        <div className="cs-card cs-thanks">
          <div className="cs-check">✓</div>
          <h1>Thank you, {f.name.split(" ")[0]}!</h1>
          <p className="cs-sub">Your consent form has been received. If you have questions at any time, please ask us.</p>
          <button className="cs-btn" style={{ maxWidth: 260 }} onClick={() => navigate("/")}>Back to home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="cs-wrap"><style>{CSS}</style>
      <div className="cs-card">
        <h1>Facial Consent Form</h1>
        <p className="cs-sub">Kaya Holistic Spa</p>

        <h2>Your Information</h2>
        <div className="cs-grid">
          <label className="cs-f full">Name<input className="cs-in" value={f.name} onChange={set("name")} /></label>
          <label className="cs-f full">Address<input className="cs-in" value={f.address} onChange={set("address")} /></label>
          <label className="cs-f">Date of Birth<input className="cs-in" type="date" value={f.dob} onChange={set("dob")} /></label>
          <label className="cs-f">Phone<input className="cs-in" type="tel" value={f.phone} onChange={set("phone")} /></label>
          <label className="cs-f full">Email<input className="cs-in" type="email" value={f.email} onChange={set("email")} /></label>
        </div>

        <h2>Health Questions</h2>
        {HEALTH_Q.map(([k, q, dk, dl]) => (
          <div className="cs-q" key={k}>
            <p>{q}</p>
            <div className="cs-pills">
              {["Yes", "No"].map((v) => (
                <button key={v} type="button" className={"cs-pill" + (f.health[k] === v ? " on" : "")} onClick={() => setHealth(k, v)}>{v}</button>
              ))}
            </div>
            {dk && f.health[k] === "Yes" && (
              <input className="cs-in" style={{ marginTop: 10, width: "100%", boxSizing: "border-box" }} placeholder={dl} value={f.health[dk] || ""} onChange={(e) => setHealth(dk, e.target.value)} />
            )}
          </div>
        ))}

        <h2>Your Skin</h2>
        <div className="cs-grid">
          <label className="cs-f full">What is your main skin concern?<input className="cs-in" value={f.skin.concern} onChange={(e) => setSkin("concern", e.target.value)} /></label>
        </div>
        <div className="cs-q">
          <p>How would you describe your skin?</p>
          <div className="cs-pills">
            {SKIN_TYPES.map((t) => (
              <button key={t} type="button" className={"cs-pill" + (f.skin.type === t ? " on" : "")} onClick={() => setSkin("type", t)}>{t}</button>
            ))}
          </div>
        </div>
        <div className="cs-q">
          <p>Any of these now? (select all that apply)</p>
          <div className="cs-pills">
            {CONDITIONS.map((c) => (
              <button key={c} type="button" className={"cs-pill" + (f.skin.conditions.includes(c) ? " on" : "")} onClick={() => toggleCond(c)}>{c}</button>
            ))}
          </div>
          {f.skin.conditions.includes("Other") && (
            <input className="cs-in" style={{ marginTop: 10, width: "100%", boxSizing: "border-box" }} placeholder="Other" value={f.skin.conditionOther} onChange={(e) => setSkin("conditionOther", e.target.value)} />
          )}
        </div>
        <div className="cs-grid" style={{ marginTop: 14 }}>
          <label className="cs-f full">What skin care products do you use?<input className="cs-in" value={f.skin.products} onChange={(e) => setSkin("products", e.target.value)} /></label>
          <label className="cs-f full">Which body area / areas or condition would you like treated?<input className="cs-in" value={f.skin.area} onChange={(e) => setSkin("area", e.target.value)} /></label>
        </div>

        <h2>Consent & Agreement</h2>
        {AGREEMENTS.map(([k, t]) => (
          <label className="cs-chk" key={k}>
            <input type="checkbox" checked={!!f.agreements[k]} onChange={(e) => setF({ ...f, agreements: { ...f.agreements, [k]: e.target.checked } })} />
            <span>{t}</span>
          </label>
        ))}

        <h2>Signatures</h2>
        <div className="cs-grid">
          <label className="cs-f">Client Signature (type your full name)
            <input className="cs-in cs-sig" value={f.signature} onChange={set("signature")} />
          </label>
          <label className="cs-f">Date<input className="cs-in" value={today} readOnly /></label>
        </div>
        <p className="cs-sub" style={{ fontSize: ".82rem", marginTop: 12 }}>Esthetician signature is added by our team at your visit.</p>

        {err && <div className="cs-err" role="alert">{err}</div>}
        <button className="cs-btn" disabled={busy} onClick={submit}>{busy ? "Submitting…" : "Sign & Submit"}</button>
        <p className="cs-sub" style={{ textAlign: "center", marginTop: 16, fontSize: ".9rem" }}>Thank you for choosing Kaya Holistic Spa! If you have questions at any time, please ask us.</p>
      </div>
    </div>
  );
}