import { useState } from "react";

const KIND = { booking: "Booking", consultation: "Skin intake", consent: "Consent form" };
const when = (iso) => new Date(iso).toLocaleString();

export default function Trash({ items = [], onRestore, onPurge }) {
  const [kind, setKind] = useState("all");
  const list = items.filter((t) => kind === "all" || t.kind === kind);

  return (
    <>
      <p className="adm-muted" style={{ marginBottom: 12 }}>
        Deleted items stay here for 30 days. You can restore them, or delete them permanently. After 30 days they are removed automatically.
      </p>
      <div className="adm-toolbar">
        <select className="adm-in" value={kind} onChange={(e) => setKind(e.target.value)} aria-label="Filter by type">
          <option value="all">All types ({items.length})</option>
          <option value="booking">Bookings</option>
          <option value="consultation">Skin intakes</option>
          <option value="consent">Consent forms</option>
        </select>
      </div>

      <div className="adm-tablewrap">
        {list.length === 0 ? (
          <p className="adm-muted" style={{ padding: 24 }}>Trash is empty.</p>
        ) : (
          <table className="adm-table">
            <thead>
              <tr><th>Type</th><th>Item</th><th>Deleted</th><th>Time left</th><th style={{ textAlign: "right" }}>Actions</th></tr>
            </thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id}>
                  <td><span className="adm-pill">{KIND[t.kind] || t.kind}</span></td>
                  <td>
                    <b>{t.label}</b>
                    {t.extra > 0 && <><br /><span className="adm-muted">+ {t.extra} linked intake form{t.extra === 1 ? "" : "s"}</span></>}
                  </td>
                  <td>{when(t.deletedAt)}<br /><span className="adm-muted">by {t.deletedBy}</span></td>
                  <td>{t.daysLeft} day{t.daysLeft === 1 ? "" : "s"}</td>
                  <td style={{ textAlign: "right" }}>
                    <div className="adm-row" style={{ justifyContent: "flex-end", gap: 6 }}>
                      <button className="adm-btn sm" onClick={() => onRestore(t.id)}>Restore</button>
                      <button
                        className="adm-btn danger sm"
                        onClick={() => confirm("Delete this permanently? It cannot be restored after this.") && onPurge(t.id)}
                      >
                        Delete forever
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}