import { useMemo, useState } from "react";
import { money, fmtDate, fmtRange, to24, from24 } from "./util";
import { StatusBadge, TypePill } from "./ui";

export default function BookingDrawer({ booking: b, consultations, onClose, onPatch, onDelete }) {
  const [note, setNote] = useState(b.adminNote || "");
  const [date, setDate] = useState(b.date);
  const [time, setTime] = useState(to24(b.slot));
  const [notify, setNotify] = useState(true);
  const [meet, setMeet] = useState(b.meetLink || "");
  const [busy, setBusy] = useState(false);

  const intake = useMemo(
    () =>
      consultations
        .filter((c) => c.email?.trim().toLowerCase() === b.email?.trim().toLowerCase())
        .sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt))[0],
    [consultations, b.email]
  );

  const moved = date !== b.date || from24(time) !== from24(to24(b.slot));
  const run = async (fn) => { setBusy(true); try { await fn(); } finally { setBusy(false); } };
  const isVideo = b.mode === "virtual" || b.mode === "online";

  const setStatus = (status) => {
    if (status === "cancelled") {
      const extra = notify && b.email ? " The client will be emailed." : "";
      if (!confirm(`Cancel this appointment?${extra}`)) return;
    }
    run(() => onPatch(b.id, { status, notify }));
  };

  return (
    <>
      <div className="adm-back" onClick={onClose} />
      <aside className="adm-drawer" role="dialog" aria-label="Booking details">
        <div className="adm-row" style={{ justifyContent: "space-between" }}>
          <StatusBadge status={b.status} />
          <button className="adm-btn ghost sm" onClick={onClose}>Close</button>
        </div>
        <h3 style={{ marginTop: 12 }}>{b.name}</h3>
        <p className="adm-muted">Ref {b.ref} · booked {new Date(b.createdAt).toLocaleDateString()}</p>

        <div className="adm-sec">
          <h4>Appointment</h4>
          <div className="adm-kv"><span>Service</span><b>{b.serviceName}</b></div>
          <div className="adm-kv"><span>Type</span><b><TypePill type={b.type} /></b></div>
          <div className="adm-kv"><span>Date</span><b>{fmtDate(b.date, { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</b></div>
          <div className="adm-kv"><span>Time</span><b>{fmtRange(b.slot, b.duration)}</b></div>
          <div className="adm-kv"><span>Format</span><b>{isVideo ? "Video call" : "In-person"}</b></div>
          {b.meetLink && <div className="adm-kv"><span>Meet link</span><b><a href={b.meetLink} target="_blank" rel="noreferrer">Open</a></b></div>}
          <div className="adm-kv"><span>Price</span><b>{money(b.price)}</b></div>
        </div>

        {isVideo && b.status !== "cancelled" && (
          <div className="adm-sec">
            <h4>Google Meet link</h4>
            <input
              className="adm-in"
              placeholder="https://meet.google.com/abc-defg-hij"
              value={meet}
              onChange={(e) => setMeet(e.target.value)}
            />
            <p className="adm-muted" style={{ marginTop: 6 }}>
              Leave empty to use the spa's default link. Saving a new link emails it to the client, and a reminder goes out 30 minutes before the session.
            </p>
            <button
              className="adm-btn"
              style={{ marginTop: 10 }}
              disabled={busy || meet.trim() === (b.meetLink || "")}
              onClick={() => run(() => onPatch(b.id, { meetLink: meet.trim(), notify }))}
            >
              Save and email link
            </button>
          </div>
        )}

        <div className="adm-sec">
          <h4>Client</h4>
          <div className="adm-kv"><span>Email</span><b><a href={`mailto:${b.email}`}>{b.email}</a></b></div>
          <div className="adm-kv"><span>Phone</span><b>{b.phone ? <a href={`tel:${b.phone}`}>{b.phone}</a> : "Not given"}</b></div>
          {b.note && <p style={{ marginTop: 8, background: "#fbf3e7", padding: 10, borderRadius: 8 }}>“{b.note}”</p>}
        </div>

        {intake && (
          <div className="adm-sec">
            <h4>Skin intake (matched by email)</h4>
            {Object.entries(intake.answers || {}).map(([q, a]) => (
              <div className="adm-qa" key={q}><span>{q}</span><b>{String(a)}</b></div>
            ))}
          </div>
        )}

        <div className="adm-sec">
          <h4>Status</h4>
          <div className="adm-row">
            {b.status === "confirmed" && (
              <>
                <button className="adm-btn" disabled={busy} onClick={() => setStatus("completed")}>Mark completed</button>
                <button className="adm-btn ghost" disabled={busy} onClick={() => setStatus("no-show")}>No-show</button>
                <button className="adm-btn danger" disabled={busy} onClick={() => setStatus("cancelled")}>Cancel</button>
              </>
            )}
            {b.status !== "confirmed" && (
              <button className="adm-btn ghost" disabled={busy} onClick={() => setStatus("confirmed")}>
                {b.status === "cancelled" ? "Restore appointment" : "Reopen as confirmed"}
              </button>
            )}
          </div>
          <label className="adm-check" style={{ marginTop: 10 }}>
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
            Email the client about cancellations, time changes and links
          </label>
        </div>

        {b.status !== "cancelled" && (
          <div className="adm-sec">
            <h4>Reschedule</h4>
            <div className="adm-row">
              <input className="adm-in" style={{ flex: 1 }} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <input className="adm-in" style={{ flex: 1 }} type="time" step="300" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            <button
              className="adm-btn"
              style={{ marginTop: 10 }}
              disabled={busy || !moved || !time}
              onClick={() => run(() => onPatch(b.id, { date, slot: from24(time), notify }))}
            >
              Move appointment
            </button>
          </div>
        )}

        <div className="adm-sec">
          <h4>Private notes (client never sees this)</h4>
          <textarea className="adm-in" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Allergies, preferences, follow-ups…" />
          <button className="adm-btn ghost" style={{ marginTop: 8 }} disabled={busy || note === (b.adminNote || "")} onClick={() => run(() => onPatch(b.id, { adminNote: note }))}>
            Save notes
          </button>
        </div>

        <div className="adm-sec">
          <button
            className="adm-btn danger"
            disabled={busy}
            onClick={async () => {
              if (!confirm("Delete this booking permanently? This cannot be undone.")) return;
              await run(() => onDelete([b.id]));
              onClose();
            }}
          >
            Delete booking
          </button>
        </div>
      </aside>
    </>
  );
}