
import { useMemo, useState } from "react";

const when = (iso) => (iso ? new Date(iso).toLocaleString() : "-");

export default function Customers({ customers }) {
  const [q, setQ] = useState("");
  const [only, setOnly] = useState("all"); // all | registered | guests

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (customers || []).filter((c) => {
      if (only === "registered" && !c.registered) return false;
      if (only === "guests" && c.registered) return false;
      return !s || `${c.name} ${c.email} ${c.phone}`.toLowerCase().includes(s);
    });
  }, [customers, q, only]);

  const registered = (customers || []).filter((c) => c.registered).length;

  return (
    <>
      <div className="adm-toolbar">
        <input className="adm-in grow" placeholder="Search name, email or phone" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="adm-in" value={only} onChange={(e) => setOnly(e.target.value)} aria-label="Filter">
          <option value="all">All ({(customers || []).length})</option>
          <option value="registered">Signed in with Google ({registered})</option>
          <option value="guests">Guests ({(customers || []).length - registered})</option>
        </select>
      </div>
      {list.length === 0 && <p className="adm-muted">No customers yet. They appear here when someone signs in with Google or books.</p>}
      {list.map((c) => (
        <details className="adm-intake" key={c.email}>
          <summary>
            <b>{c.name}</b>
            <span className="adm-muted">{c.email}</span>
            <span className="adm-pill">{c.registered ? "Account" : "Guest"}</span>
            <span className="adm-pill">{c.stats.bookings} booking{c.stats.bookings === 1 ? "" : "s"}</span>
            {c.stats.upcoming > 0 && <span className="adm-pill" style={{ background: "#e4f2e4", color: "#2f6b34" }}>Next: {c.next?.date}</span>}
            <span className="adm-muted" style={{ marginLeft: "auto" }}>{when(c.lastActivity)}</span>
          </summary>
          <div className="body">
            {[
              ["Phone", c.phone || "-"],
              ["Signed up", c.registered ? when(c.createdAt) : "No account (booked as guest)"],
              ["Last sign-in", c.registered ? `${when(c.lastLoginAt)} (${c.loginCount} times)` : "-"],
              ["Bookings", `${c.stats.bookings} total · ${c.stats.completed} completed · ${c.stats.upcoming} upcoming · ${c.stats.cancelled} cancelled`],
              ["Next appointment", c.next ? `${c.next.serviceName} on ${c.next.date} at ${c.next.slot}` : "None"],
              ["Spent (completed visits)", `$${c.stats.spent}`],
              ["Forms", `${c.stats.consents} consent form(s) · ${c.stats.intakes} skin intake(s)`],
            ].map(([k, v]) => (
              <div className="adm-qa" key={k}><span>{k}</span><b>{v}</b></div>
            ))}
            <div className="adm-qa"><span>What this customer did</span></div>
            {c.events.map((e, i) => (
              <div key={i} style={{ padding: "5px 0", fontSize: ".9rem" }}>
                <span className="adm-muted" style={{ marginRight: 10 }}>{when(e.at)}</span>{e.text}
              </div>
            ))}
            <div className="adm-row" style={{ marginTop: 12 }}>
              <a className="adm-btn ghost sm" href={`mailto:${c.email}`} style={{ textDecoration: "none" }}>Email customer</a>
            </div>
          </div>
        </details>
      ))}
    </>
  );
}
