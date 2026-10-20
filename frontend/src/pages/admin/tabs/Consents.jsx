import { useMemo, useState } from "react";

const yes = (v) => v === "Yes";

function printConsent(c) {
  const w = window.open("", "_blank");
  if (!w) return;
  const esc = (s = "") => String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));
  const h = c.health || {}, s = c.skin || {};
  const row = (q, a) => `<tr><td>${esc(q)}</td><td><b>${esc(a || "-")}</b></td></tr>`;
  w.document.write(`<html><head><title>Consent - ${esc(c.name)}</title>
  <style>body{font-family:Arial,sans-serif;max-width:720px;margin:30px auto;color:#222}h1{font-family:Georgia,serif;margin:0}h2{margin:22px 0 6px;font-size:15px;border-bottom:1px solid #ccc;padding-bottom:4px}td{padding:5px 8px;font-size:13px;vertical-align:top;border-bottom:1px solid #eee}td:first-child{width:55%}</style></head><body>
  <h1>Kaya Holistic Spa</h1><div>Facial Consent Form</div>
  <h2>Client</h2><table>${row("Name", c.name)}${row("Address", c.address)}${row("Date of Birth", c.dob)}${row("Phone", c.phone)}${row("Email", c.email)}</table>
  <h2>Health</h2><table>
  ${row("Allergies", h.allergies + (h.allergiesDetail ? ` (${h.allergiesDetail})` : ""))}
  ${row("Skin problems (acne, eczema)", h.skinProblems)}${row("Recent face surgery / treatments", h.recentTreatments)}
  ${row("Pregnant or breastfeeding", h.pregnantOrBreastfeeding)}
  ${row("Medications", h.medications + (h.medicationsDetail ? ` (${h.medicationsDetail})` : ""))}
  ${row("History of keloid scarring", h.keloid)}</table>
  <h2>Skin</h2><table>${row("Main concern", s.concern)}${row("Skin type", s.type)}
  ${row("Currently", [...(s.conditions || []), s.conditionOther].filter(Boolean).join(", "))}
  ${row("Products used", s.products)}${row("Area / condition to treat", s.area)}</table>
  <h2>Consent</h2><p style="font-size:13px">Client accepted all four consent statements.</p>
  <p style="margin-top:30px">Client signature: <i style="font-size:20px;font-family:Georgia,serif">${esc(c.signature)}</i> &nbsp; Date: ${esc(c.signedDate)}</p>
  <p style="margin-top:30px">Esthetician: ______________________ &nbsp; Date: ____________</p>
  <script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}

export default function Consents({ consents, onDelete }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (consents || []).filter((c) => !s || `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(s));
  }, [consents, q]);

  return (
    <>
      <div className="adm-toolbar">
        <input className="adm-in grow" placeholder="Search name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {list.length === 0 && <p className="adm-muted">No consent forms yet.</p>}
      {list.map((c) => {
        const h = c.health || {}, s = c.skin || {};
        const flags = [yes(h.allergies) && "Allergies", yes(h.pregnantOrBreastfeeding) && "Pregnant/Breastfeeding", yes(h.keloid) && "Keloid", yes(h.medications) && "Medications", yes(h.recentTreatments) && "Recent treatment"].filter(Boolean);
        return (
          <details className="adm-intake" key={c.id}>
            <summary>
              <b>{c.name}</b>
              <span className="adm-muted">{c.email}</span>
              {flags.map((f) => <span key={f} className="adm-pill" style={{ background: "#fdecea", color: "#a1342c" }}>⚠ {f}</span>)}
              <span className="adm-muted" style={{ marginLeft: "auto" }}>{new Date(c.createdAt).toLocaleString()}</span>
            </summary>
            <div className="body">
              {[
                ["Phone", c.phone], ["Address", c.address], ["Date of birth", c.dob],
                ["Allergies", h.allergies + (h.allergiesDetail ? ` — ${h.allergiesDetail}` : "")],
                ["Skin problems", h.skinProblems], ["Recent face surgery / treatments", h.recentTreatments],
                ["Pregnant or breastfeeding", h.pregnantOrBreastfeeding],
                ["Medications", h.medications + (h.medicationsDetail ? ` — ${h.medicationsDetail}` : "")],
                ["History of keloid scarring", h.keloid],
                ["Main concern", s.concern], ["Skin type", s.type],
                ["Currently", [...(s.conditions || []), s.conditionOther].filter(Boolean).join(", ")],
                ["Products used", s.products], ["Area to treat", s.area],
                ["Signed by", `${c.signature} on ${c.signedDate}`],
              ].map(([k, v]) => (
                <div className="adm-qa" key={k}><span>{k}</span><b>{v || "-"}</b></div>
              ))}
              <div className="adm-row" style={{ marginTop: 12 }}>
                <button className="adm-btn ghost sm" onClick={() => printConsent(c)}>Print / Save PDF</button>
                <a className="adm-btn ghost sm" href={`mailto:${c.email}`} style={{ textDecoration: "none" }}>Email client</a>
                <button className="adm-btn danger sm" onClick={() => confirm("Delete this consent form permanently?") && onDelete(c.id)}>Delete</button>
              </div>
            </div>
          </details>
        );
      })}
    </>
  );
}