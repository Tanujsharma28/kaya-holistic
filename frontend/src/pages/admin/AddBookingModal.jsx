import { useMemo, useState } from "react";
import { from24, todayChicago, money } from "./util";

export default function AddBookingModal({ services = [], customers = [], onCreate, onClose }) {
  const bookable = useMemo(() => services.filter((s) => s.active !== false), [services]);
  const [f, setF] = useState({
    serviceId: "", date: todayChicago(), time: "", name: "", email: "", phone: "",
    note: "", status: "confirmed", notify: true, meetLink: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const online = f.serviceId === "virt";
  const valid = f.serviceId && f.date && f.time && f.name.trim() && f.email.trim();

  // Purane customer ka email chunte hi naam aur phone bhar do
  const pickEmail = (e) => {
    const email = e.target.value;
    const c = customers.find((x) => x.email === email.trim().toLowerCase());
    setF((p) => ({
      ...p,
      email,
      name: c && !p.name ? c.name : p.name,
      phone: c && !p.phone ? c.phone || "" : p.phone,
    }));
  };

  const submit = async () => {
    setBusy(true);
    setError("");
    const r = await onCreate({
      serviceId: f.serviceId,
      date: f.date,
      slot: from24(f.time),
      name: f.name.trim(),
      email: f.email.trim(),
      phone: f.phone.trim(),
      note: f.note.trim(),
      status: f.status,
      notify: f.status === "confirmed" ? f.notify : false,
      mode: online ? "online" : "in-person",
      meetLink: online ? f.meetLink.trim() : "",
    });
    setBusy(false);
    if (r.ok) onClose();
    else setError(r.message);
  };

  const label = { display: "block", fontSize: ".78rem", fontWeight: 600, marginBottom: 5 };

  return (
    <>
      <div className="adm-back" onClick={onClose} />
      <aside className="adm-drawer" role="dialog" aria-label="Add booking">
        <div className="adm-row" style={{ justifyContent: "space-between" }}>
          <h3>Add booking</h3>
          <button className="adm-btn ghost sm" onClick={onClose}>Close</button>
        </div>
        <p className="adm-muted" style={{ marginTop: 6 }}>For phone calls and walk-in clients.</p>

        {error && (
          <div className="adm-alert" role="alert" style={{ marginTop: 14, background: "#fbeeea", color: "#8f2f20" }}>
            <span>{error}</span>
          </div>
        )}

        <div className="adm-sec">
          <h4>Appointment</h4>
          <label style={label}>Service</label>
          <select className="adm-in" value={f.serviceId} onChange={set("serviceId")}>
            <option value="">Choose a service…</option>
            {bookable.map((s) => (
              <option key={s.id} value={s.id}>{s.name} · {money(s.price)} · {s.duration} min</option>
            ))}
          </select>
          <div className="adm-row" style={{ marginTop: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={label}>Date</label>
              <input className="adm-in" type="date" value={f.date} onChange={set("date")} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={label}>Time</label>
              <input className="adm-in" type="time" step="300" value={f.time} onChange={set("time")} />
            </div>
          </div>
          {online && (
            <div style={{ marginTop: 12 }}>
              <label style={label}>Google Meet link (optional, auto-created if empty)</label>
              <input className="adm-in" placeholder="https://meet.google.com/abc-defg-hij" value={f.meetLink} onChange={set("meetLink")} />
            </div>
          )}
          <div style={{ marginTop: 12 }}>
            <label style={label}>Status</label>
            <select className="adm-in" value={f.status} onChange={set("status")}>
              <option value="confirmed">Confirmed (upcoming)</option>
              <option value="completed">Already completed (visit happened)</option>
            </select>
          </div>
        </div>

        <div className="adm-sec">
          <h4>Client</h4>
          <datalist id="adm-cust-emails">
            {customers.slice(0, 500).map((c) => <option key={c.email} value={c.email}>{c.name}</option>)}
          </datalist>
          <label style={label}>Email</label>
          <input className="adm-in" type="email" list="adm-cust-emails" placeholder="client@email.com" value={f.email} onChange={pickEmail} />
          <label style={{ ...label, marginTop: 12 }}>Name</label>
          <input className="adm-in" value={f.name} onChange={set("name")} placeholder="Full name" />
          <label style={{ ...label, marginTop: 12 }}>Phone</label>
          <input className="adm-in" value={f.phone} onChange={set("phone")} placeholder="Optional" />
          <label style={{ ...label, marginTop: 12 }}>Note</label>
          <textarea className="adm-in" value={f.note} onChange={set("note")} placeholder="Allergies, preferences, how they booked…" />
        </div>

        <div className="adm-sec">
          <label className="adm-check">
            <input
              type="checkbox"
              checked={f.status === "confirmed" && f.notify}
              disabled={f.status !== "confirmed"}
              onChange={(e) => setF((p) => ({ ...p, notify: e.target.checked }))}
            />
            Email the client a confirmation
          </label>
          <button className="adm-btn" style={{ marginTop: 14 }} disabled={busy || !valid} onClick={submit}>
            {busy ? "Adding…" : "Add booking"}
          </button>
          <p className="adm-muted" style={{ marginTop: 8, fontSize: 12 }}>
            Overlapping times and Sundays are blocked, same as online booking.
          </p>
        </div>
      </aside>
    </>
  );
}