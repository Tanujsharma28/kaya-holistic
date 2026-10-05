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
  const [success, setSuccess] = useState(null); // { msg, icon }

  const intake = useMemo(
    () =>
      consultations
        .filter((c) => c.email?.trim().toLowerCase() === b.email?.trim().toLowerCase())
        .sort((x, y) => new Date(y.createdAt) - new Date(x.createdAt))[0],
    [consultations, b.email]
  );

  const normStatus = (b.status || "").toLowerCase();
  const isLive = normStatus === "confirmed" || normStatus === "approved";
  const moved = date !== b.date || (time && from24(time) !== b.slot);

  const run = async (fn) => { setBusy(true); try { return await fn(); } finally { setBusy(false); } };
  const isVideo = b.mode === "virtual" || b.mode === "online" || (b.type || "").includes("consult");

  // Show a professional success overlay, then close
  const showSuccess = (msg, icon = "✅") => {
    setSuccess({ msg, icon });
    setTimeout(() => {
      setSuccess(null);
      onClose();
    }, 2200);
  };

  const setStatus = (status) => {
    if (status === "cancelled") {
      const extra = notify && b.email ? " The client will be emailed." : "";
      if (!confirm(`Cancel this appointment?${extra}`)) return;
    }
    run(async () => {
      const r = await onPatch(b.id, { status, notify });
      if (r === null) return r; // error handled by dashboard toast
      if (status === "cancelled") {
        showSuccess("Appointment cancelled." + (notify && b.email ? " Client notified by email." : ""), "❌");
      } else if (status === "completed") {
        showSuccess("Appointment marked as completed!", "🎉");
      } else if (status === "no-show") {
        showSuccess("Marked as no-show.", "⚠️");
      } else {
        showSuccess("Status updated successfully.", "✅");
      }
      return r;
    });
  };

  const handleReschedule = () => {
    run(async () => {
      const r = await onPatch(b.id, { date, slot: from24(time), notify });
      if (r === null) return r; // error handled by dashboard toast
      const newDateFmt = new Date(date + "T12:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
      const newTime = from24(time);
      showSuccess(
        `Appointment moved to ${newDateFmt} at ${newTime}.${notify && b.email ? " Client notified by email." : ""}`,
        "📅"
      );
      return r;
    });
  };

  const handleSaveMeetLink = () => {
    run(async () => {
      const r = await onPatch(b.id, { meetLink: meet.trim(), notify });
      if (r === null) return r; // error handled by dashboard toast
      showSuccess("Meet link saved and emailed to client.", "🎥");
      return r;
    });
  };

  // ── Success Overlay ─────────────────────────────────────────
  if (success) {
    return (
      <>
        <div className="adm-back" onClick={() => { setSuccess(null); onClose(); }} />
        <aside className="adm-drawer" role="dialog" aria-label="Success">
          <div style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            height: "100%",
            gap: 20,
            padding: "60px 32px",
            textAlign: "center",
          }}>
            <div style={{
              fontSize: 56,
              lineHeight: 1,
              animation: "adm-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
            }}>
              {success.icon}
            </div>
            <div style={{
              fontFamily: "Georgia, serif",
              fontSize: 20,
              color: "var(--adm-text)",
              fontWeight: 500,
              lineHeight: 1.5,
              maxWidth: 280,
              animation: "adm-fadein 0.5s 0.2s both",
            }}>
              {success.msg}
            </div>
            <div style={{
              width: 48,
              height: 3,
              background: "var(--adm-brand)",
              borderRadius: 99,
              animation: "adm-fadein 0.5s 0.3s both",
            }} />
            <p style={{
              fontSize: 12,
              color: "var(--adm-muted)",
              animation: "adm-fadein 0.5s 0.5s both",
            }}>
              Closing automatically…
            </p>
          </div>
        </aside>
      </>
    );
  }

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
          {b.meetLink && <div className="adm-kv"><span>Meet link</span><b><a href={b.meetLink} target="_blank" rel="noreferrer">Open link</a></b></div>}
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
              Saving a Meet link automatically emails it to the client.
            </p>
            <button
              className="adm-btn"
              style={{ marginTop: 10 }}
              disabled={busy || !meet.trim()}
              onClick={handleSaveMeetLink}
            >
              {busy ? "Saving…" : "Save and email link"}
            </button>
          </div>
        )}

        <div className="adm-sec">
          <h4>Client</h4>
          <div className="adm-kv"><span>Email</span><b><a href={`mailto:${b.email}`}>{b.email}</a></b></div>
          <div className="adm-kv"><span>Phone</span><b>{b.phone ? <a href={`tel:${b.phone}`}>{b.phone}</a> : "Not given"}</b></div>
          {b.note && <p style={{ marginTop: 8, background: "#fbf3e7", padding: 10, borderRadius: 8 }}>"{b.note}"</p>}
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
            {isLive ? (
              <>
                <button className="adm-btn" disabled={busy} onClick={() => setStatus("completed")}>Mark completed</button>
                <button className="adm-btn ghost" disabled={busy} onClick={() => setStatus("no-show")}>No-show</button>
                <button className="adm-btn danger" disabled={busy} onClick={() => setStatus("cancelled")}>Cancel</button>
              </>
            ) : (
              <button className="adm-btn ghost" disabled={busy} onClick={() => setStatus("confirmed")}>
                {normStatus === "cancelled" ? "Restore appointment" : "Reopen as confirmed"}
              </button>
            )}
          </div>
          <label className="adm-check" style={{ marginTop: 10 }}>
            <input type="checkbox" checked={notify} onChange={(e) => setNotify(e.target.checked)} />
            Email client automatically about updates, cancellations, and reschedules
          </label>
        </div>

        {normStatus !== "cancelled" && (
          <div className="adm-sec">
            <h4>Reschedule Appointment</h4>
            <div className="adm-row">
              <input className="adm-in" style={{ flex: 1 }} type="date" value={date} onChange={(e) => setDate(e.target.value)} />
              <input className="adm-in" style={{ flex: 1 }} type="time" step="300" value={time} onChange={(e) => setTime(e.target.value)} />
            </div>
            {moved && (
              <p className="adm-muted" style={{ marginTop: 6, color: "#7c5c38" }}>
                📅 Moving from <b>{fmtDate(b.date)}</b> {b.slot} → <b>{fmtDate(date)}</b> {from24(time)}
                {notify && b.email ? " · Client will be emailed." : ""}
              </p>
            )}
            <button
              className="adm-btn"
              style={{ marginTop: 10, background: moved ? "var(--adm-brand)" : undefined }}
              disabled={busy || !date || !time || !moved}
              onClick={handleReschedule}
            >
              {busy ? "Moving appointment…" : "Move appointment & email client"}
            </button>
            {!moved && (
              <p className="adm-muted" style={{ marginTop: 6, fontSize: 11 }}>
                Change the date or time above to enable reschedule.
              </p>
            )}
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