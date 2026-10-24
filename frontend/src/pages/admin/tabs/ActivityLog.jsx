import { useMemo, useState } from "react";

const LABEL = {
  login: "Sign-in",
  "booking.create": "Booking added",
  "booking.bulk": "Bulk update",
  "booking.status": "Status change",
  "booking.reschedule": "Rescheduled",
  "booking.trash": "Booking deleted",
  "booking.restore": "Booking restored",
  "booking.purge": "Deleted forever",
  "consultation.trash": "Intake deleted",
  "consultation.restore": "Intake restored",
  "consultation.purge": "Deleted forever",
  "consent.trash": "Consent deleted",
  "consent.restore": "Consent restored",
  "consent.purge": "Deleted forever",
  "settings.update": "Settings changed",
  "notify.reminder": "Reminder sent",
  "notify.review": "Review request sent",
  "customer.update": "Customer updated",
  "giftcard.create": "Gift card created",
  "giftcard.use": "Gift card used",
  "giftcard.undo": "Redemption undone",
  "giftcard.expiry": "Expiry changed",
  "giftcard.resend": "Gift card emailed",
  "giftcard.void": "Gift card void",
};

export default function ActivityLog({ entries = [] }) {
  const [q, setQ] = useState("");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return entries.filter((e) => !s || `${e.text} ${e.by} ${LABEL[e.action] || e.action}`.toLowerCase().includes(s));
  }, [entries, q]);

  return (
    <>
      <p className="adm-muted" style={{ marginBottom: 12 }}>Last 300 admin actions, newest first.</p>
      <div className="adm-toolbar">
        <input className="adm-in grow" placeholder="Search activity" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>
      <div className="adm-tablewrap">
        {list.length === 0 ? (
          <p className="adm-muted" style={{ padding: 24 }}>No activity recorded yet.</p>
        ) : (
          <table className="adm-table">
            <thead><tr><th>When</th><th>Action</th><th>Details</th><th>By</th></tr></thead>
            <tbody>
              {list.map((e) => (
                <tr key={e.id}>
                  <td style={{ whiteSpace: "nowrap" }}>{new Date(e.at).toLocaleString()}</td>
                  <td><span className="adm-pill">{LABEL[e.action] || e.action}</span></td>
                  <td>{e.text}</td>
                  <td className="adm-muted">{e.by}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}