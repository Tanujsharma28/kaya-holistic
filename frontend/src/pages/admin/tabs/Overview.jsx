import { money, fmtDate, fmtRange } from "../util";

export default function Overview({ stats: s, go, open }) {
  const max = Math.max(1, ...(s?.daily ?? []).map((d) => d.count));
  const topMax = Math.max(1, ...(s?.topServices ?? []).map((t) => t.count));
  const cards = [
    ["Today", s.today, "appointments"],
    ["Next 7 days", s.thisWeek, "appointments"],
    ["Upcoming", s.upcoming, "confirmed in total"],
    ["Earned", money(s.revenueEarned), "from completed visits"],
    ["Expected", money(s.revenueExpected), "from upcoming bookings"],
    ["Intakes", s.consultations, "skin intake forms"],
  ];

  return (
    <>
      {s.needsUpdate > 0 && (
        <div className="adm-alert">
          <span><b>{s.needsUpdate}</b> past appointment{s.needsUpdate === 1 ? " is" : "s are"} still marked confirmed. Mark them completed or no-show so revenue stays correct.</span>
          <button className="adm-btn sm" onClick={() => go("bookings", "needs-update")}>Review now</button>
        </div>
      )}

      <div className="adm-cards">
        {cards.map(([label, value, sub]) => (
          <div className="adm-stat" key={label}>
            <span>{label}</span>
            <b>{value}</b>
            <small>{sub}</small>
          </div>
        ))}
      </div>

      <div className="adm-grid2">
        <div className="adm-panel">
          <h3>Next appointments</h3>
          {(s?.nextUp?.length ?? 0) === 0 ? (
            <p className="adm-muted">Nothing upcoming. New bookings will show up here.</p>
          ) : (
            <div className="adm-list">
              {(s?.nextUp ?? []).map((b) => (
                <button className="adm-item" key={b.id} onClick={() => open(b.id)}>
                  <span>
                    <b>{b.name}</b>
                    <br />
                    <span className="adm-muted">{b.serviceName}</span>
                  </span>
                  <span style={{ textAlign: "right" }}>
                    {fmtDate(b.date)}
                    <br />
                    <span className="adm-muted">{fmtRange(b.slot, b.duration)}</span>
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="adm-panel">
          <h3>Most booked</h3>
          {(s?.topServices?.length ?? 0) === 0 ? (
            <p className="adm-muted">No data yet.</p>
          ) : (
            (s?.topServices ?? []).map((t) => (
              <div key={t.name} style={{ marginBottom: 12 }}>
                <div className="adm-kv" style={{ padding: 0 }}><span style={{ color: "inherit" }}>{t.name}</span><b>{t.count}</b></div>
                <div className="adm-hbar"><i style={{ width: `${(t.count / topMax) * 100}%` }} /></div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="adm-panel" style={{ marginTop: 18 }}>
        <h3>Appointments, next 14 days</h3>
        <div className="adm-bars">
          {(s?.daily ?? []).map((d) => (
            <div key={d.date} className={`adm-bar ${d.count === 0 ? "zero" : ""}`} title={`${fmtDate(d.date)}: ${d.count}`}>
              <span>{d.count || ""}</span>
              <i style={{ height: `${(d.count / max) * 80}%` }} />
              <span>{fmtDate(d.date, { day: "numeric" })}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}