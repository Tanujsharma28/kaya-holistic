import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as api from "../../api/adminClient";
import { useAdminAuth } from "../../context/AdminAuthContext";
import "./admin.css";
import Overview from "./tabs/Overview";
import Bookings from "./tabs/Bookings";
import CalendarView from "./tabs/CalendarView";
import Consultations from "./tabs/Consultations";
import Services from "./tabs/Services";
import BookingDrawer from "./BookingDrawer";

const TABS = [
  ["overview", "Overview"],
  ["bookings", "Bookings"],
  ["calendar", "Calendar"],
  ["consultations", "Consultations"],
  ["services", "Services"],
];

export default function AdminDashboard() {
  const { email, logout } = useAdminAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState("overview");
  const [preset, setPreset] = useState("all");
  const [data, setData] = useState(null);
  const [phase, setPhase] = useState("loading");
  const [openId, setOpenId] = useState(null);
  const [toast, setToast] = useState(null);

  const say = (msg, kind = "ok") => setToast({ msg, kind, id: Date.now() });
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const load = useCallback(async (silent) => {
    try {
      const [stats, bookings, consultations, services] = await Promise.all([
        api.getStats(), api.getAllBookings(), api.getAllConsultations(), api.getServicesAdmin(),
      ]);
      setData({ stats, bookings, consultations, services });
      setPhase("ready");
    } catch {
      if (!silent) setPhase("error");
    }
  }, []);

  useEffect(() => {
    load();
    const t = setInterval(() => load(true), 60000);
    const onFocus = () => load(true);
    window.addEventListener("focus", onFocus);
    return () => { clearInterval(t); window.removeEventListener("focus", onFocus); };
  }, [load]);

  const run = async (fn, okMsg) => {
    try {
      const r = await fn();
      await load(true);
      if (okMsg) say(typeof okMsg === "function" ? okMsg(r) : okMsg);
      return r;
    } catch (e) {
      say(e.response?.data?.message || "Something went wrong. Please try again.", "bad");
      return null;
    }
  };

  const onPatch = (id, body) =>
    run(() => api.updateBooking(id, body), (r) =>
      r?.emailed === true ? "Saved. Client emailed." : r?.emailed === false ? "Saved. Email could not be sent." : "Saved");
  const onDelete = (ids) =>
    run(() => api.deleteBookings(ids), (r) => `${r.deleted} booking${r.deleted === 1 ? "" : "s"} deleted`);
  const onDeleteConsult = (id) => run(() => api.deleteConsultation(id), "Intake deleted");
  const onSaveService = (id, body) => run(() => api.updateService(id, body), "Service saved");
  const onCreateService = (body) => run(() => api.createService(body), "Service added");

  const go = (t, p = "all") => { setPreset(p); setTab(t); setOpenId(null); window.scrollTo(0, 0); };
  const doLogout = () => { logout(); navigate("/admin/login"); };

  const openBooking = data?.bookings.find((b) => b.id === openId);
  const titles = { overview: "Welcome back, Puja", bookings: "Bookings", calendar: "Calendar", consultations: "Consultation intakes", services: "Services" };

  return (
    <div className="adm-root">
      <aside className="adm-side">
        <div className="adm-brand-wrap">
          <div className="adm-brand-leaf">🌿</div>
          <div>
            <div className="adm-brand">Kaya Spa</div>
            <div className="adm-brand-sub">Admin Portal</div>
          </div>
        </div>
        <nav className="adm-nav">
          {TABS.map(([k, label]) => (
            <button key={k} className={tab === k ? "on" : ""} onClick={() => go(k)}>
              {label}
              {k === "bookings" && data?.stats.needsUpdate > 0 && <span className="adm-dot">{data.stats.needsUpdate}</span>}
            </button>
          ))}
        </nav>
        <div className="adm-user">
          <span style={{ fontWeight: 600, color: "var(--adm-brand2)", display: "block", marginBottom: 2 }}>Signed in as</span>
          {email}
          <button onClick={doLogout}>Log out</button>
        </div>
      </aside>

      <main className="adm-main">
        {phase === "loading" && <div className="adm-center">Loading dashboard…</div>}
        {phase === "error" && (
          <div className="adm-center">
            <p>Could not load data. Check that the backend is running.</p>
            <button className="adm-btn" style={{ marginTop: 12 }} onClick={() => { setPhase("loading"); load(); }}>Try again</button>
          </div>
        )}
        {phase === "ready" && (
          <>
            <div className="adm-top">
              <div>
                <h2>{titles[tab]}</h2>
                <p className="adm-muted">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "America/Chicago" })} (Evanston time)</p>
              </div>
              <button className="adm-btn ghost" onClick={() => load(true).then(() => say("Refreshed"))}>Refresh</button>
            </div>

            {tab === "overview" && <Overview stats={data.stats} go={go} open={setOpenId} />}
            {tab === "bookings" && (
              <Bookings key={preset} initialStatus={preset} bookings={data.bookings} open={setOpenId} onPatch={onPatch} onDelete={onDelete} />
            )}
            {tab === "calendar" && <CalendarView bookings={data.bookings} open={setOpenId} />}
            {tab === "consultations" && (
              <Consultations consultations={data.consultations} bookings={data.bookings} onDelete={onDeleteConsult} />
            )}
            {tab === "services" && (
              <Services services={data.services} bookings={data.bookings} onSave={onSaveService} onCreate={onCreateService} />
            )}
          </>
        )}
      </main>

      {openBooking && (
        <BookingDrawer
          key={openBooking.id}
          booking={openBooking}
          consultations={data.consultations}
          onClose={() => setOpenId(null)}
          onPatch={onPatch}
          onDelete={onDelete}
        />
      )}
      {toast && <div className={`adm-toast ${toast.kind === "bad" ? "bad" : ""}`} role="status">{toast.msg}</div>}
    </div>
  );
}