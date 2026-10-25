import { useMemo, useState } from "react";
import { money, fmtDate, fmtRange, todayChicago, addDays, whenKey, downloadCsv } from "../util";
import { StatusBadge, TypePill } from "../ui";
import AddBookingModal from "../AddBookingModal";

const PAGE = 20;
const esc = (s = "") => String(s).replace(/[&<>"']/g, (m) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m]));

// Kisi ek din ki schedule print / PDF
function printSchedule(bookings, date) {
  const list = bookings
    .filter((b) => b.date === date && String(b.status).toLowerCase() !== "cancelled")
    .sort((a, b) => whenKey(a).localeCompare(whenKey(b)));
  if (!list.length) { alert("No appointments on this date."); return; }
  const w = window.open("", "_blank");
  if (!w) { alert("Please allow pop-ups to print the schedule."); return; }

  const isVideo = (b) => ["online", "virtual"].includes(String(b.mode).toLowerCase()) || b.type === "consultation";
  const total = list.reduce((s, b) => s + (b.price || 0), 0);
  const rows = list.map((b) => `<tr>
    <td class="t">${esc(fmtRange(b.slot, b.duration))}</td>
    <td><b>${esc(b.name)}</b><br>${esc(b.phone || "")}</td>
    <td>${esc(b.serviceName)}<br><span class="m">${isVideo(b) ? "Video call" : "In-person"}</span></td>
    <td>${esc([b.note, b.adminNote].filter(Boolean).join(" | "))}</td>
    <td>${esc(b.status)}</td>
  </tr>`).join("");

  w.document.write(`<html><head><title>Schedule ${esc(date)}</title>
  <style>body{font-family:Arial,sans-serif;max-width:900px;margin:28px auto;color:#222}h1{font-family:Georgia,serif;margin:0 0 4px}
  .sub{color:#666;margin-bottom:18px}table{width:100%;border-collapse:collapse}th{text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.05em;color:#666;border-bottom:2px solid #333;padding:6px 8px}
  td{padding:9px 8px;font-size:13px;vertical-align:top;border-bottom:1px solid #ddd}td.t{white-space:nowrap;font-weight:600}.m{color:#777;font-size:12px}
  .foot{margin-top:16px;font-size:13px;color:#444}@media print{body{margin:10mm}}</style></head><body>
  <h1>Kaya Holistic Spa</h1>
  <div class="sub">Schedule for ${esc(fmtDate(date, { weekday: "long", month: "long", day: "numeric", year: "numeric" }))}</div>
  <table><thead><tr><th>Time</th><th>Client</th><th>Service</th><th>Notes</th><th>Status</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="foot">${list.length} appointment${list.length === 1 ? "" : "s"} · Total ${esc(money(total))}</div>
  <script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}

export default function Bookings({
  bookings = [], services = [], customers = [], initialStatus = "all",
  open, onPatch, onDelete, onCreate, onBulkStatus,
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState(initialStatus);
  const [type, setType] = useState("all");
  const [range, setRange] = useState("all");
  const [sort, setSort] = useState("created");
  const [page, setPage] = useState(0);
  const [sel, setSel] = useState(new Set());
  const [adding, setAdding] = useState(false);
  const [printDate, setPrintDate] = useState(todayChicago());

  const today = todayChicago();
  const weekEnd = addDays(today, 6);

  const norm = (st = "") => st.toLowerCase();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = bookings.filter((b) => {
      if (q && !`${b.name} ${b.email} ${b.phone} ${b.serviceName} ${b.ref}`.toLowerCase().includes(q)) return false;
      if (status === "needs-update") {
        if (!((norm(b.status) === "confirmed" || norm(b.status) === "approved") && b.date < today)) return false;
      }
      else if (status === "confirmed") {
        if (norm(b.status) !== "confirmed" && norm(b.status) !== "approved") return false;
      }
      else if (status !== "all" && norm(b.status) !== norm(status)) {
        return false;
      }

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
    if (!confirm(`Move ${sel.size} booking(s) to Trash? You can restore them within 30 days.`)) return;
    await onDelete([...sel]);
    setSel(new Set());
  };

  const bulk = async (st) => {
    const word = st === "no-show" ? "no-show" : "completed";
    if (!confirm(`Mark ${sel.size} selected booking(s) as ${word}? Only confirmed bookings whose date has arrived will change.`)) return;
    await onBulkStatus([...sel], st);
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
          <option value="confirmed">Confirmed / Approved</option>
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

      <div className="adm-toolbar">
        <button className="adm-btn" onClick={() => setAdding(true)}>+ Add booking</button>
        <span className="adm-row" style={{ gap: 8, marginLeft: "auto" }}>
          <input className="adm-in" type="date" value={printDate} onChange={(e) => e.target.value && setPrintDate(e.target.value)} aria-label="Schedule date" />
          <button className="adm-btn ghost" onClick={() => printSchedule(bookings, printDate)}>Print schedule</button>
        </span>
      </div>

      {sel.size > 0 && (
        <div className="adm-alert">
          <span>{sel.size} selected</span>
          <span className="adm-row">
            <button className="adm-btn ghost sm" onClick={() => setSel(new Set())}>Clear</button>
            <button className="adm-btn sm" onClick={() => bulk("completed")}>Mark completed</button>
            <button className="adm-btn ghost sm" onClick={() => bulk("no-show")}>Mark no-show</button>
            <button className="adm-btn danger sm" onClick={del}>Move to Trash</button>
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
                <th>Client</th><th>Service</th><th>When</th><th>Price</th><th>Status</th><th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => {
                const bStatus = norm(b.status);
                const isLive = bStatus === "confirmed" || bStatus === "approved";
                return (
                  <tr className="adm-tr" key={b.id} onClick={() => open(b.id)}>
                    <td onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={sel.has(b.id)} onChange={() => toggle(b.id)} aria-label={`Select ${b.name}`} />
                    </td>
                    <td><b>{b.name}</b><br /><span className="adm-muted">{b.email}</span></td>
                    <td>{b.serviceName}<br /><TypePill type={b.type} />{b.staff && <span className="adm-muted"> · {b.staff}</span>}</td>
                    <td>{fmtDate(b.date)}<br /><span className="adm-muted">{fmtRange(b.slot, b.duration)}</span></td>
                    <td>{money(b.price)}</td>
                    <td><StatusBadge status={b.status} /></td>
                    <td onClick={(e) => e.stopPropagation()} style={{ textAlign: "right" }}>
                      {isLive && (
                        <div className="adm-row" style={{ justifyContent: "flex-end", gap: 6 }}>
                          <button className="adm-btn sm" onClick={() => onPatch(b.id, { status: "completed" })}>Done</button>
                          <button className="adm-btn danger sm" onClick={() => confirm(`Cancel booking for ${b.name}?`) && onPatch(b.id, { status: "cancelled", notify: true })}>Cancel</button>
                        </div>
                      )}
                      {bStatus === "cancelled" && (
                        <button className="adm-btn ghost sm" onClick={() => onPatch(b.id, { status: "confirmed", notify: true })}>Restore</button>
                      )}
                    </td>
                  </tr>
                );
              })}
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

      {adding && (
        <AddBookingModal services={services} customers={customers} onCreate={onCreate} onClose={() => setAdding(false)} />
      )}
    </>
  );
}