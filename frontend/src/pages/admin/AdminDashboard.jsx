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
import Consents from "./tabs/Consents";
import Customers from "./tabs/Customers";
import GiftCards from "./tabs/GiftCards";
import Settings from "./tabs/Settings";
import Trash from "./tabs/Trash";
import ActivityLog from "./tabs/ActivityLog";
import BookingDrawer from "./BookingDrawer";

const TABS = [
  ["overview", "Overview"],
  ["bookings", "Bookings"],
  ["calendar", "Calendar"],
  ["consultations", "Consultations"],
  ["customers", "Customers"],
  ["consents", "Consent Forms"],
  ["giftcards", "Gift Cards"],
  ["services", "Services"],
  ["settings", "Settings"],
  ["activity", "Activity Log"],
  ["trash", "Trash"],
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
      const [stats, bookings, consultations, services, quizMap, consents, customers, giftCards, trash, audit, settings, customerMeta] = await Promise.all([
        api.getStats(), api.getAllBookings(), api.getAllConsultations(), api.getServicesAdmin(), api.getQuizMapAdmin(),
        api.getAllConsents(), api.getCustomers(), api.getGiftCards(), api.getTrash(), api.getAuditLog(), api.getSettings(),
        api.getCustomerMeta(),
      ]);
      setData({ stats, bookings, consultations, services, quizMap, consents, customers, giftCards, trash, audit, settings, customerMeta });
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
    run(() => api.deleteBookings(ids), (r) => `${r.deleted} booking${r.deleted === 1 ? "" : "s"} moved to Trash`);

  // Add booking: error modal ke andar dikhana hai, isliye alag se handle
  const onCreateBooking = async (body) => {
    try {
      const r = await api.createBookingAdmin(body);
      await load(true);
      say(r?.emailed === true ? "Booking added. Client emailed." : r?.emailed === false ? "Booking added. Email could not be sent." : "Booking added");
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e.response?.data?.message || "Could not add the booking. Please try again." };
    }
  };

  const onBulkStatus = (ids, status) =>
    run(() => api.bulkBookingStatus(ids, status), (r) =>
      `${r.updated} marked ${status === "no-show" ? "no-show" : "completed"}${r.skipped ? `, ${r.skipped} skipped (not confirmed, or still in the future)` : ""}`);

  // Gift cards
  const onCreateGift = async (body) => {
    try {
      const r = await api.createGiftCard(body);
      await load(true);
      say(r?.emailed === true ? "Gift card created and emailed" : r?.emailed === false ? "Gift card created. Email could not be sent." : "Gift card created");
      return { ok: true };
    } catch (e) {
      return { ok: false, message: e.response?.data?.message || "Could not create the gift card. Please try again." };
    }
  };
  const usd = (n) => `$${Number.isInteger(Number(n)) ? Number(n) : Number(n).toFixed(2)}`;
  const onSpendGift = (id, body) =>
    run(() => api.spendGiftCard(id, body), (r) => (r?.data?.balance > 0 ? `Done. ${usd(r.data.balance)} left on this card` : "Gift card fully used"));
  const onUndoGift = (id, rid) => run(() => api.undoGiftUse(id, rid), "Redemption undone");
  const onExtendGift = (id, date) => run(() => api.extendGiftCard(id, date), "Validity updated");
  const onResendGift = (id, to) =>
    run(() => api.resendGiftCard(id, to), (r) => (r?.emailed ? "Gift card emailed" : "Email could not be sent"));
  const onVoidGift = (id, makeVoid) => run(() => api.voidGiftCard(id, makeVoid), makeVoid ? "Gift card voided" : "Gift card restored");

  const onSaveCustomer = (email, body) => run(() => api.saveCustomerMeta(email, body), "Customer saved");
  const onSaveSettings = (body) => run(() => api.saveSettings(body), "Settings saved");
    const onTestNotify = (type) =>
    run(() => api.testNotification(type), (r) => (r?.emailed ? `Test email sent to ${r.sentTo}` : "Could not send the test email"));
  const onDeleteConsult = (id) => run(() => api.deleteConsultation(id), "Intake moved to Trash");
  const onSaveService = (id, body) => run(() => api.updateService(id, body), "Service saved");
  const onCreateService = (body) => run(() => api.createService(body), "Service added");
  const onDeleteService = (id) => run(() => api.deleteService(id), "Service deleted");
  const onSaveQuizMap = (map) => run(() => api.saveQuizMap(map), "Skin Quiz results saved");
  const onDeleteConsent = (id) => run(() => api.deleteConsent(id), "Consent form moved to Trash");
  const onRestore = (id) => run(() => api.restoreTrash(id), "Restored");
  const onPurge = (id) => run(() => api.deleteTrashItem(id), "Deleted permanently");

  const go = (t, p = "all") => { setPreset(p); setTab(t); setOpenId(null); window.scrollTo(0, 0); };

  const doBackup = async () => {
    try {
      const r = await api.downloadBackup();
      const url = URL.createObjectURL(r.data);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kaya-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      say("Backup downloaded");
    } catch {
      say("Backup failed. Please try again.", "bad");
    }
  };

  const doLogout = () => { logout(); navigate("/admin/login"); };

  const openBooking = data?.bookings.find((b) => b.id === openId);
  const titles = {
    overview: `Welcome back, ${data?.settings?.ownerName || "Puja"}`,
    bookings: "Bookings", calendar: "Calendar", consultations: "Consultation intakes",
    customers: "Customers", consents: "Facial consent forms", giftcards: "Gift cards", services: "Services",
    settings: "Settings", activity: "Activity log", trash: "Trash",
  };

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
              <div className="adm-row" style={{ gap: 8 }}>
                <button className="adm-btn ghost" onClick={doBackup}>Download backup</button>
                <button className="adm-btn ghost" onClick={() => load(true).then(() => say("Refreshed"))}>Refresh</button>
              </div>
            </div>

                       {tab === "overview" && <Overview stats={data.stats} bookings={data.bookings} giftCards={data.giftCards} go={go} open={setOpenId} />}
            {tab === "bookings" && (
              <Bookings
                key={preset}
                initialStatus={preset}
                bookings={data.bookings}
                services={data.services}
                customers={data.customers}
                open={setOpenId}
                onPatch={onPatch}
                onDelete={onDelete}
                onCreate={onCreateBooking}
                onBulkStatus={onBulkStatus}
              />
            )}
            {tab === "calendar" && <CalendarView bookings={data.bookings} open={setOpenId} />}
            {tab === "consultations" && (
              <Consultations consultations={data.consultations} bookings={data.bookings} onDelete={onDeleteConsult} />
            )}
            {tab === "customers" && (
              <Customers
                customers={data.customers}
                bookings={data.bookings}
                consents={data.consents}
                meta={data.customerMeta}
                onSaveMeta={onSaveCustomer}
              />
            )}
            {tab === "consents" && <Consents consents={data.consents} onDelete={onDeleteConsent} />}
            {tab === "giftcards" && (
              <GiftCards
                cards={data.giftCards}
                onCreate={onCreateGift}
                onSpend={onSpendGift}
                onUndo={onUndoGift}
                onExtend={onExtendGift}
                onResend={onResendGift}
                onVoid={onVoidGift}
              />
            )}
            {tab === "services" && (
              <Services services={data.services} bookings={data.bookings} quizMap={data.quizMap} onSave={onSaveService} onCreate={onCreateService} onDelete={onDeleteService} onSaveQuizMap={onSaveQuizMap} />
            )}
            {tab === "settings" && (
              <Settings
                key={JSON.stringify(data.settings)}
                settings={data.settings}
                bookings={data.bookings}
                onSave={onSaveSettings}
                onTest={onTestNotify}
              />
            )}
            {tab === "activity" && <ActivityLog entries={data.audit} />}
            {tab === "trash" && <Trash items={data.trash} onRestore={onRestore} onPurge={onPurge} />}
          </>
        )}
      </main>

      {openBooking && (
        <BookingDrawer
          key={openBooking.id}
          booking={openBooking}
          consultations={data.consultations}
          consents={data.consents}
          onClose={() => setOpenId(null)}
          onPatch={onPatch}
          onDelete={onDelete}
        />
      )}
      {toast && <div className={`adm-toast ${toast.kind === "bad" ? "bad" : ""}`} role="status">{toast.msg}</div>}
    </div>
  );
}