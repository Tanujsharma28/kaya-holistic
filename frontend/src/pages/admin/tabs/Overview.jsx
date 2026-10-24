import { useMemo, useState } from "react";
import { money, fmtDate, fmtRange, todayChicago, addDays, to24 } from "../util";

const norm = (s = "") => String(s).toLowerCase();
const stat = (s) => (norm(s) === "approved" ? "confirmed" : norm(s));
const KNOWN = ["confirmed", "completed", "no-show", "cancelled"];
const emailKey = (e = "") => String(e).trim().toLowerCase();
const usd = (n) => `$${Number.isInteger(Number(n)) ? Number(n) : Number(n).toFixed(2)}`;
const pct = (x) => (x === null ? "–" : `${Math.round(x * 100)}%`);

const RANGES = [
  [7, "Last 7 days"],
  [30, "Last 30 days"],
  [90, "Last 90 days"],
  [365, "Last 12 months"],
  [0, "All time"],
];
const GOOD = "#2f6b34";
const BAD = "#a1342c";
const FLAT = "var(--adm-mut)";
const DAY = 86400000;
const WEEKDAYS = [[1, "Mon"], [2, "Tue"], [3, "Wed"], [4, "Thu"], [5, "Fri"], [6, "Sat"], [0, "Sun"]];

// Ek period ke saare numbers
function calc(bookings, s, e) {
  const done = {};
  for (const b of bookings) {
    if (stat(b.status) === "completed" && b.date <= e && emailKey(b.email)) {
      const k = emailKey(b.email);
      done[k] = (done[k] || 0) + 1;
    }
  }
  let revenue = 0, visits = 0, noShow = 0, cancelled = 0, total = 0;
  const clients = new Set();
  for (const b of bookings) {
    if (b.date < s || b.date > e) continue;
    const st = stat(b.status);
    if (!KNOWN.includes(st)) continue;
    total += 1;
    if (st === "completed") {
      revenue += b.price || 0;
      visits += 1;
      if (emailKey(b.email)) clients.add(emailKey(b.email));
    } else if (st === "no-show") noShow += 1;
    else if (st === "cancelled") cancelled += 1;
  }
  const repeat = [...clients].filter((k) => (done[k] || 0) >= 2).length;
  return {
    revenue, visits,
    avg: visits ? revenue / visits : null,
    noShowRate: visits + noShow ? noShow / (visits + noShow) : null,
    cancelRate: total ? cancelled / total : null,
    repeatRate: clients.size ? repeat / clients.size : null,
    clients: clients.size, repeat,
  };
}

// Pichhle period se tulna
const delta = (cur, prev, mode, good) => {
  if (prev === null || prev === undefined || cur === null || cur === undefined) return null;
  let diff;
  let text;
  if (mode === "pts") {
    diff = Math.round((cur - prev) * 100);
    text = diff === 0 ? "No change" : `${diff > 0 ? "▲" : "▼"} ${Math.abs(diff)} pts`;
  } else {
    if (prev === 0) return cur === 0 ? { text: "No change", color: FLAT } : { text: "▲ New", color: GOOD };
    diff = Math.round(((cur - prev) / prev) * 100);
    text = diff === 0 ? "No change" : `${diff > 0 ? "▲" : "▼"} ${Math.abs(diff)}%`;
  }
  const color = diff === 0 ? FLAT : (diff > 0) === (good === "up") ? GOOD : BAD;
  return { text, color };
};

// Chart ke dabbe: din / hafta / mahina
function makeBuckets(bookings, start, end, days) {
  const list = [];
  const push = (from, to, label, title) => list.push({ key: from, from, to, label, title, value: 0 });

  if (days > 0 && days <= 31) {
    for (let d = start; d <= end; d = addDays(d, 1)) {
      push(d, d, fmtDate(d, { day: "numeric" }), fmtDate(d, { weekday: "short", month: "short", day: "numeric" }));
    }
  } else if (days === 90) {
    for (let d = start; d <= end; d = addDays(d, 7)) {
      const to = addDays(d, 6) > end ? end : addDays(d, 6);
      const a = fmtDate(d, { month: "short", day: "numeric" });
      push(d, to, a, `${a} to ${fmtDate(to, { month: "short", day: "numeric" })}`);
    }
  } else {
    let y = Number(start.slice(0, 4));
    let m = Number(start.slice(5, 7));
    const ey = Number(end.slice(0, 4));
    const em = Number(end.slice(5, 7));
    while (y < ey || (y === ey && m <= em)) {
      const mm = String(m).padStart(2, "0");
      const first = `${y}-${mm}-01`;
      const last = `${y}-${mm}-${String(new Date(y, m, 0).getDate()).padStart(2, "0")}`;
      push(first < start ? start : first, last > end ? end : last,
        fmtDate(first, { month: "short" }), fmtDate(first, { month: "long", year: "numeric" }));
      m += 1;
      if (m > 12) { m = 1; y += 1; }
    }
  }

  const out = list.slice(-24);
  for (const b of bookings) {
    if (stat(b.status) !== "completed" || b.date < start || b.date > end) continue;
    const bucket = out.find((x) => b.date >= x.from && b.date <= x.to);
    if (bucket) bucket.value += b.price || 0;
  }
  return out;
}

const niceMax = (v) => {
  if (v <= 0) return 100;
  const p = Math.pow(10, Math.floor(Math.log10(v)));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
};

function RevenueChart({ buckets }) {
  const W = 640, H = 200, padL = 52, padR = 8, padT = 12, padB = 26;
  const max = niceMax(Math.max(0, ...buckets.map((b) => b.value)));
  const iw = W - padL - padR;
  const ih = H - padT - padB;
  const bw = iw / Math.max(1, buckets.length);
  const barW = Math.max(2, bw * 0.68);
  const every = Math.ceil(buckets.length / 8);

  return (
    <svg viewBox={`0 0 ${W} ${H}`} style={{ width: "100%", height: "auto", display: "block" }} role="img" aria-label="Revenue over time">
      {[0, 0.5, 1].map((t) => {
        const y = padT + ih - ih * t;
        return (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={y} y2={y} stroke="var(--adm-line)" />
            <text x={padL - 6} y={y + 4} textAnchor="end" fontSize="11" fill="var(--adm-mut)">{money(Math.round(max * t))}</text>
          </g>
        );
      })}
      {buckets.map((b, i) => {
        const h = max ? (b.value / max) * ih : 0;
        const x = padL + i * bw + (bw - barW) / 2;
        return (
          <g key={b.key}>
            <rect x={x} y={padT + ih - h} width={barW} height={Math.max(h, b.value > 0 ? 2 : 0)} rx="3" fill="var(--adm-brand)">
              <title>{`${b.title}: ${money(b.value)}`}</title>
            </rect>
            {i % every === 0 && (
              <text x={x + barW / 2} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--adm-mut)">{b.label}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

function BarRow({ label, value, shown, max }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div className="adm-kv" style={{ padding: 0 }}>
        <span style={{ color: "inherit" }}>{label}</span><b>{shown}</b>
      </div>
      <div className="adm-hbar"><i style={{ width: `${max ? (value / max) * 100 : 0}%` }} /></div>
    </div>
  );
}

export default function Overview({ stats: s, bookings = [], giftCards = [], go, open }) {
  const [days, setDays] = useState(30);
  const today = todayChicago();

  const view = useMemo(() => {
    const first = bookings.reduce((m, b) => (b.date < m ? b.date : m), today);
    const start = days > 0 ? addDays(today, -(days - 1)) : first;
    const prev = days > 0 ? calc(bookings, addDays(start, -days), addDays(start, -1)) : null;

    const svc = {};
    const wd = {};
    const hr = {};
    for (const b of bookings) {
      if (b.date < start || b.date > today) continue;
      const st = stat(b.status);
      if (!KNOWN.includes(st)) continue;
      if (st === "completed") {
        const k = b.serviceName || "Other";
        svc[k] = svc[k] || { name: k, rev: 0, n: 0 };
        svc[k].rev += b.price || 0;
        svc[k].n += 1;
      }
      if (st !== "cancelled") {
        const d = new Date(b.date + "T12:00:00").getDay();
        wd[d] = (wd[d] || 0) + 1;
        const t = to24(b.slot);
        if (t) {
          const h = Number(t.slice(0, 2));
          if (!Number.isNaN(h)) hr[h] = (hr[h] || 0) + 1;
        }
      }
    }
    return {
      cur: calc(bookings, start, today),
      prev,
      buckets: makeBuckets(bookings, start, today, days),
      services: Object.values(svc).sort((a, b) => b.rev - a.rev).slice(0, 6),
      wd,
      hours: Object.entries(hr).map(([h, n]) => [Number(h), n]).sort((a, b) => a[0] - b[0]),
    };
  }, [bookings, days, today]);

  const gift = useMemo(() => {
    let owed = 0, n = 0, soon = 0, expired = 0;
    const now = Date.now();
    for (const g of giftCards) {
      if (g.voided || !(g.balance > 0)) continue;
      const exp = new Date(g.expiresAt).getTime();
      if (exp < now) expired += g.balance;
      else {
        owed += g.balance;
        n += 1;
        if (exp - now <= 30 * DAY) soon += 1;
      }
    }
    return { owed, n, soon, expired };
  }, [giftCards]);

  const c = view.cur;
  const p = view.prev;
  const vs = days === 0 ? "" : `vs previous ${days === 365 ? "12 months" : `${days} days`}`;

  const right = [
    ["Today", s.today, "appointments"],
    ["Next 7 days", s.thisWeek, "appointments"],
    ["Upcoming", s.upcoming, "confirmed in total"],
    ["Expected", money(s.revenueExpected), "from upcoming bookings"],
    ["Intakes", s.consultations, "skin intake forms"],
  ];

  const kpis = [
    ["Revenue", money(c.revenue), `${c.visits} completed visit${c.visits === 1 ? "" : "s"}`, delta(c.revenue, p?.revenue, "pct", "up")],
    ["Completed visits", c.visits, "appointments finished", delta(c.visits, p?.visits, "pct", "up")],
    ["Average per visit", c.avg === null ? "–" : money(Math.round(c.avg)), "per completed visit", delta(c.avg, p?.avg, "pct", "up")],
    ["No-show rate", pct(c.noShowRate), "of visits that were due", delta(c.noShowRate, p?.noShowRate, "pts", "down")],
    ["Cancellation rate", pct(c.cancelRate), "of all appointments", delta(c.cancelRate, p?.cancelRate, "pts", "down")],
    ["Repeat clients", pct(c.repeatRate), c.clients ? `${c.repeat} of ${c.clients} came back` : "no completed visits", delta(c.repeatRate, p?.repeatRate, "pts", "up")],
  ];

  const svcMax = Math.max(1, ...view.services.map((x) => x.rev));
  const wdMax = Math.max(1, ...Object.values(view.wd));
  const hrMax = Math.max(1, ...view.hours.map(([, n]) => n));
  const max14 = Math.max(1, ...(s?.daily ?? []).map((d) => d.count));
  const hourLabel = (h) => `${h % 12 || 12} ${h >= 12 ? "PM" : "AM"}`;

  return (
    <>
      {s.needsUpdate > 0 && (
        <div className="adm-alert">
          <span><b>{s.needsUpdate}</b> past appointment{s.needsUpdate === 1 ? " is" : "s are"} still marked confirmed. Mark them completed or no-show so revenue stays correct.</span>
          <button className="adm-btn sm" onClick={() => go("bookings", "needs-update")}>Review now</button>
        </div>
      )}

      <div className="adm-cards">
        {right.map(([label, value, sub]) => (
          <div className="adm-stat" key={label}>
            <span>{label}</span>
            <b>{value}</b>
            <small>{sub}</small>
          </div>
        ))}
      </div>

      <div className="adm-row" style={{ justifyContent: "space-between", margin: "28px 0 12px" }}>
        <h3 style={{ fontSize: "1.25rem" }}>Performance</h3>
        <select className="adm-in" style={{ maxWidth: 190 }} value={days} onChange={(e) => setDays(Number(e.target.value))} aria-label="Date range">
          {RANGES.map(([v, label]) => <option key={v} value={v}>{label}</option>)}
        </select>
      </div>

      <div className="adm-cards">
        {kpis.map(([label, value, sub, d]) => (
          <div className="adm-stat" key={label}>
            <span>{label}</span>
            <b>{value}</b>
            <small style={{ display: "block" }}>{sub}</small>
            {d && (
              <small style={{ display: "block", color: d.color, fontWeight: 600 }}>
                {d.text} <span style={{ color: "var(--adm-mut)", fontWeight: 400 }}>{vs}</span>
              </small>
            )}
          </div>
        ))}
      </div>
      <p className="adm-muted" style={{ fontSize: ".8rem", marginTop: 8 }}>
        Counts appointments dated up to today, by appointment date. Revenue is completed visits only; gift card sales are not included.
      </p>

      <div className="adm-panel" style={{ marginTop: 18 }}>
        <h3>Revenue over time</h3>
        <RevenueChart buckets={view.buckets} />
        {days === 0 && <p className="adm-muted" style={{ fontSize: ".8rem", marginTop: 6 }}>Chart shows up to the last 24 months.</p>}
      </div>

      <div className="adm-grid2">
        <div className="adm-panel">
          <h3>Revenue by service</h3>
          {view.services.length === 0 ? (
            <p className="adm-muted">No completed visits in this period.</p>
          ) : (
            view.services.map((t) => (
              <BarRow key={t.name} label={t.name} value={t.rev} max={svcMax}
                shown={`${money(t.rev)} · ${t.n} visit${t.n === 1 ? "" : "s"}`} />
            ))
          )}
        </div>

        <div className="adm-panel">
          <h3>Busiest times</h3>
          {Object.keys(view.wd).length === 0 ? (
            <p className="adm-muted">No appointments in this period.</p>
          ) : (
            <>
              <p className="adm-muted" style={{ fontSize: ".8rem", marginBottom: 8 }}>By day of week</p>
              {WEEKDAYS.map(([d, name]) => (
                <BarRow key={d} label={name} value={view.wd[d] || 0} max={wdMax} shown={view.wd[d] || 0} />
              ))}
              <p className="adm-muted" style={{ fontSize: ".8rem", margin: "14px 0 8px" }}>By start time</p>
              {view.hours.map(([h, n]) => (
                <BarRow key={h} label={hourLabel(h)} value={n} max={hrMax} shown={n} />
              ))}
            </>
          )}
        </div>
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
          <h3>Gift cards</h3>
          <div className="adm-kv"><span>Balance still owed</span><b>{usd(gift.owed)}</b></div>
          <div className="adm-kv"><span>Active cards</span><b>{gift.n}</b></div>
          <div className="adm-kv"><span>Expiring in 30 days</span><b>{gift.soon}</b></div>
          <div className="adm-kv"><span>Expired with balance</span><b>{usd(gift.expired)}</b></div>
          <button className="adm-btn ghost sm" style={{ marginTop: 12 }} onClick={() => go("giftcards")}>Open gift cards</button>
        </div>
      </div>

      <div className="adm-panel" style={{ marginTop: 18 }}>
        <h3>Appointments, next 14 days</h3>
        <div className="adm-bars">
          {(s?.daily ?? []).map((d) => (
            <div key={d.date} className={`adm-bar ${d.count === 0 ? "zero" : ""}`} title={`${fmtDate(d.date)}: ${d.count}`}>
              <span>{d.count || ""}</span>
              <i style={{ height: `${(d.count / max14) * 80}%` }} />
              <span>{fmtDate(d.date, { day: "numeric" })}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}