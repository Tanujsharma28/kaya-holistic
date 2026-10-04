import { useMemo, useState } from "react";
import { money, fmtDate, fmtRange, todayChicago, addDays, whenKey, downloadCsv } from "../util";
import { StatusBadge, TypePill } from "../ui";

const PAGE = 20;

export default function Bookings({ bookings, initialStatus = "all", open, onPatch, onDelete }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [type, setType] = useState("all");
  const [range, setRange] = useState("all");
  const [sort, setSort] = useState("created");
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState(new Set());

  const today = todayChicago();
  const weekEnd = addDays(today, 6);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = bookings.filter((b) => {
      if (q && !`${b.name} ${b.email} ${b.phone} ${b.serviceName} ${b.ref}`.toLowerCase().includes(q)) return false;
      if (status === "needs-update") { if (!(b.status === "confirmed" && b.date < today)) return false; }
      else if (status !== "all" && b.status !== status) return false;
      if (type !== "all" && b.type !== type) return false;
      if (range === "today" && b.date !== today) return false;
      if (range === "week" && !(b.date >= today && b.date <= weekEnd)) return false;
      if (range === "upcoming" && b.date < today) return false;
      if (range === "past" && b.date >= today) return false;
      return true;
    });
    if (sort === "soonest") list.sort((a, b) => whenKey(a).localeCompare(whenKey(b)));
    if (sort === "latest") list.sort((a, b) => whenKey(b).localeCompare(whenKey(a)));
    return list;
  }, [bookings, search, status, type, range, sort, today, weekEnd]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const cur = Math.min(page, pages - 1);
  const rows = filtered.slice(cur * PAGE, cur * PAGE + PAGE);
  const f = (fn) => (e) => { fn(e.target.value); setPage(0); };

  const toggle = (id) => setSel((s) => { const n = new Set(s); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allOnPage = rows.length > 0 && rows.every((b) => sel.has(b.id));
  const togglePage = () => setSel((s) => { const n = new Set(s); rows.forEach((b) => (allOnPage ? n.delete(b.id) : n.add(b.id))); return n; });

  const del = async () => {
    if (!confirm(`Delete ${sel.size} booking(s) permanently? This cannot be undone.`)) return;
    await onDelete([...sel]);
    setSel(new Set());
  };

  const exportCsv = () =>
    downloadCsv("kaya-bookings.csv", [
      ["Ref", "Name", "Email", "Phone", "Service", "Type", "Date", "Time", "Mode", "Price", "Status", "Notes"],
      ...filtered.map((b) => [b.ref, b.name, b.email, b.phone, b.serviceName, b.type, b.date, b.slot, b.mode, b.price, b.status, b.note]),
    ]);

  return (
    <>
      <div className="adm-toolbar">
        <input className="adm-in grow" placeholder="Search name, email, phone, service or ref" value={search} onChange={f(setSearch)} />
        <select className="adm-in" value={status} onChange={f(setStatus)}>
          <option value="all">All statuses</option>
          <option value="confirmed">Confirmed</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="no-show">No-show</option>
          <option value="needs-update">Past but still confirmed</option>
        </select>
        <select className="adm-in" value={type} onChange={f(setType)}>
          <option value="all">Visits and consultations</option>
          <option value="visit">Visits only</option>
          <option value="consultation">Consultations only</option>
        </select>
        <select className="adm-in" value={range} onChange={f(setRange)}>
          <option value="all">Any date</option>
          <option value="today">Today</option>
          <option value="week">Next 7 days</option>
          <option value="upcoming">Upcoming</option>
          <option value="past">Past</option>
        </select>
        <select className="adm-in" value={sort} onChange={f(setSort)}>
          <option value="created">Recently booked</option>
          <option value="soonest">Appointment: earliest first</option>
          <option value="latest">Appointment: latest first</option>
        </select>
        <button className="adm-btn ghost" onClick={exportCsv} disabled={!filtered.length}>Export CSV</button>
      </div>

      {sel.size > 0 && (
        <div className="adm-alert">
          <span>{sel.size} selected</span>
          <span className="adm-row">
            <button className="adm-btn ghost sm" onClick={() => setSel(new Set())}>Clear</button>
            <button className="adm-btn danger sm" onClick={del}>Delete selected</button>
          </span>
        </div>
      )}

      <div className="adm-tablewrap">
        {filtered.length === 0 ? (
          <p className="adm-muted" style={{ padding: 24 }}>No bookings match these filters.</p>
        ) : (
          <table className="adm-table">
            <thead>
              <tr>
                <th style={{ width: 34 }}><input type="checkbox" checked={allOnPage} onChange={togglePage} aria-label="Select all on page" /></th>
                <th>Client</th><th>Service</th><th>When</th><th>Price</th><th>Status</th><th />
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => (
                <tr className="row" key={b.id} onClick={() => open(b.id)}>
                  <td onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={sel.has(b.id)} onChange={() => toggle(b.id)} aria-label={`Select ${b.name}`} />
                  </td>
                  <td><b>{b.name}</b><br /><span className="adm-muted">{b.email}</span></td>
                  <td>{b.serviceName}<br /><TypePill type={b.type} /></td>
                  <td>{fmtDate(b.date)}<br /><span className="adm-muted">{fmtRange(b.slot, b.duration)}</span></td>
                  <td>{money(b.price)}</td>
                  <td><StatusBadge status={b.status} /></td>
                  <td onClick={(e) => e.stopPropagation()}>
                    {b.status === "confirmed" && (
                      <button className="adm-btn ghost sm" onClick={() => onPatch(b.id, { status: "completed" })}>Done</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="adm-pager">
        <span className="adm-muted">Showing {rows.length} of {filtered.length} (total {bookings.length})</span>
        <span className="adm-row">
          <button className="adm-btn ghost sm" disabled={cur === 0} onClick={() => setPage(cur - 1)}>Previous</button>
          <span className="adm-muted">Page {cur + 1} of {pages}</span>
          <button className="adm-btn ghost sm" disabled={cur >= pages - 1} onClick={() => setPage(cur + 1)}>Next</button>
        </span>
      </div>
    </>
  );
}