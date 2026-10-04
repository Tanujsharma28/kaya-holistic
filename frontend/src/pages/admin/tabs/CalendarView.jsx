import { useState } from "react";
import { money, fmtDate, fmtRange, todayChicago, addDays, whenKey } from "../util";

const mondayOf = (iso) => {
  const day = new Date(iso + "T12:00:00").getDay();
  return day === 0 ? addDays(iso, 1) : addDays(iso, 1 - day);
};

export default function CalendarView({ bookings, open }) {
  const today = todayChicago();
  const [start, setStart] = useState(mondayOf(today));
  const [showCancelled, setShowCancelled] = useState(false);

  const week = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const sundayBusy = (bookings || []).some((b) => b.date === week[6] && b.status !== "cancelled");
  const days = sundayBusy ? week : week.slice(0, 6);

  const forDay = (d) =>
    (bookings || [])
      .filter((b) => b.date === d && (showCancelled || b.status !== "cancelled"))
      .sort((a, b) => whenKey(a).localeCompare(whenKey(b)));

  return (
    <>
      <div className="adm-toolbar">
        <button className="adm-btn ghost" onClick={() => setStart(addDays(start, -7))}>Previous week</button>
        <button className="adm-btn ghost" onClick={() => setStart(mondayOf(today))}>This week</button>
        <button className="adm-btn ghost" onClick={() => setStart(addDays(start, 7))}>Next week</button>
        <input className="adm-in" type="date" value={start} onChange={(e) => e.target.value && setStart(mondayOf(e.target.value))} aria-label="Jump to date" />
        <strong style={{ marginLeft: 6 }}>{fmtDate(days[0])} to {fmtDate(days[days.length - 1])}</strong>
        <label className="adm-check" style={{ marginLeft: "auto" }}>
          <input type="checkbox" checked={showCancelled} onChange={(e) => setShowCancelled(e.target.checked)} /> Show cancelled
        </label>
      </div>

      <div className="adm-cal" style={{ gridTemplateColumns: `repeat(${days.length}, minmax(150px, 1fr))` }}>
        {days.map((d) => {
          const list = forDay(d);
          const revenue = list.filter((b) => b.status !== "cancelled").reduce((s, b) => s + (b.price || 0), 0);
          return (
            <div key={d} className={`adm-day ${d === today ? "today" : ""}`}>
              <h4><span>{fmtDate(d, { weekday: "short" })}</span><span>{fmtDate(d, { month: "short", day: "numeric" })}</span></h4>
              <small>{list.length} appt{list.length === 1 ? "" : "s"} · {money(revenue)}</small>
              {list.length === 0 && <p className="adm-muted">Free day</p>}
              {list.map((b) => (
                <button key={b.id} className={`adm-appt s-${b.status}`} onClick={() => open(b.id)}>
                  <b>{fmtRange(b.slot, b.duration)}</b>
                  {b.name}
                  <br />
                  <span className="adm-muted">{b.serviceName}</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </>
  );
}