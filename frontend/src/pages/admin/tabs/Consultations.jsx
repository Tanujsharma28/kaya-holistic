import { useMemo, useState } from "react";
import { StatusBadge } from "../ui";

export default function Consultations({ consultations, bookings, onDelete }) {
  const [q, setQ] = useState("");

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (consultations || []).filter((c) => !s || `${c.name} ${c.email} ${Object.values(c.answers || {}).join(" ")}`.toLowerCase().includes(s));
  }, [consultations, q]);

  const bookingFor = (c) =>
    c.bookingId
      ? (bookings || []).find((b) => b.id === c.bookingId)
      : (bookings || [])
          .filter((b) => b.type === "consultation" && b.email?.trim().toLowerCase() === c.email?.trim().toLowerCase())
          .sort((a, b) => b.date.localeCompare(a.date))[0];

  return (
    <>
      <div className="adm-toolbar">
        <input className="adm-in grow" placeholder="Search name, email or answers" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      {list.length === 0 && <p className="adm-muted">No intake forms yet. They appear here when a client finishes the chat on the Consultation page.</p>}
      {list.map((c) => {
        const booked = bookingFor(c);
        const concern = Object.values(c.answers || {})[0];
        return (
          <details className="adm-intake" key={c.id}>
            <summary>
              <b>{c.name}</b>
              <span className="adm-muted">{c.email}</span>
              {concern && <span className="adm-pill">{String(concern).slice(0, 40)}</span>}
              {booked ? <StatusBadge status={booked.status} /> : <span className="adm-pill">Not booked yet</span>}
              <span className="adm-muted" style={{ marginLeft: "auto" }}>{new Date(c.createdAt).toLocaleString()}</span>
            </summary>
            <div className="body">
              {Object.entries(c.answers || {}).map(([question, answer]) => (
                <div className="adm-qa" key={question}><span>{question}</span><b>{String(answer)}</b></div>
              ))}
              <div className="adm-row" style={{ marginTop: 12 }}>
                <a className="adm-btn ghost sm" href={`mailto:${c.email}`} style={{ textDecoration: "none" }}>Email client</a>
                <button className="adm-btn danger sm" onClick={() => confirm("Delete this intake permanently?") && onDelete(c.id)}>Delete</button>
              </div>
            </div>
          </details>
        );
      })}
    </>
  );
}