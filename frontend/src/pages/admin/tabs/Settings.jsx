import { useMemo, useState } from "react";
import { testNotification } from "../../../api/adminClient";

const DAYS = [
  ["1", "Monday"], ["2", "Tuesday"], ["3", "Wednesday"], ["4", "Thursday"],
  ["5", "Friday"], ["6", "Saturday"], ["0", "Sunday"],
];
const STEPS = [15, 30, 45, 60];
const DELAYS = [
  [1, "1 hour after the visit"],
  [2, "2 hours after the visit"],
  [3, "3 hours after the visit"],
  [6, "6 hours after the visit"],
  [24, "24 hours after the visit"],
];
const DEFAULT_NOTIF = { reminders: true, reviews: false, reviewUrl: "", reviewDelayHours: 3 };
const todayChicago = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });
const hm = (t) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
const t12 = (t) => { const [h, m] = t.split(":").map(Number); return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`; };
const slotMin = (slot) => {
  const m = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i.exec(slot || "");
  return m ? ((Number(m[1]) % 12) + (m[3].toUpperCase() === "PM" ? 12 : 0)) * 60 + Number(m[2]) : null;
};
const nice = (d) =>
  new Date(d + "T12:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });

export default function Settings({ settings, bookings = [], onSave }) {
  const saved = { ...DEFAULT_NOTIF, ...(settings.notifications || {}) };

  const [owner, setOwner] = useState(settings.ownerName);
  const [step, setStep] = useState(settings.slotMinutes);
  const [hours, setHours] = useState(settings.hours);
  const [closed, setClosed] = useState(settings.closedDates);
  const [remind, setRemind] = useState(saved.reminders);
  const [reviews, setReviews] = useState(saved.reviews);
  const [reviewUrl, setReviewUrl] = useState(saved.reviewUrl);
  const [delay, setDelay] = useState(saved.reviewDelayHours);
  const [timeOff, setTimeOff] = useState(settings.timeOff || []);
  const [to, setTo] = useState({ date: "", from: "10:00", to: "12:00", reason: "" });
  const [newDate, setNewDate] = useState("");
  const [newReason, setNewReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [testing, setTesting] = useState("");
  const [testMsg, setTestMsg] = useState(null);
  const today = todayChicago();

  const setDay = (k, patch) => setHours((h) => ({ ...h, [k]: { ...h[k], ...patch } }));

  const hourErrors = DAYS.filter(([k]) => hours[k].open && hours[k].from >= hours[k].to).map(([, n]) => n);

  const url = reviewUrl.trim();
  const urlBad = url !== "" && !/^https:\/\/\S+$/.test(url);
  const reviewNeedsUrl = reviews && !url;
  const emailErrors = urlBad || reviewNeedsUrl;

  const dirty = useMemo(
    () =>
      owner !== settings.ownerName ||
      Number(step) !== settings.slotMinutes ||
      JSON.stringify(hours) !== JSON.stringify(settings.hours) ||
      JSON.stringify(closed) !== JSON.stringify(settings.closedDates) ||
      JSON.stringify(timeOff) !== JSON.stringify(settings.timeOff || []) ||
      remind !== saved.reminders ||
      reviews !== saved.reviews ||
      url !== saved.reviewUrl ||
      Number(delay) !== saved.reviewDelayHours,
    [owner, step, hours, closed, timeOff, remind, reviews, url, delay, settings] // eslint-disable-line react-hooks/exhaustive-deps
  );

  const discard = () => {
    setOwner(settings.ownerName);
    setStep(settings.slotMinutes);
    setHours(settings.hours);
    setClosed(settings.closedDates);
    setTimeOff(settings.timeOff || []);
    setRemind(saved.reminders);
    setReviews(saved.reviews);
    setReviewUrl(saved.reviewUrl);
    setDelay(saved.reviewDelayHours);
  };

  const save = async () => {
    setBusy(true);
    await onSave({
      ownerName: owner.trim(),
      slotMinutes: Number(step),
      hours,
      closedDates: closed,
      timeOff,
      notifications: { reminders: remind, reviews, reviewUrl: url, reviewDelayHours: Number(delay) },
    });
    setBusy(false);
  };

  const sendTest = async (type) => {
    setTesting(type);
    setTestMsg(null);
    try {
      const r = await testNotification(type);
      setTestMsg(
        r.emailed
          ? { ok: true, text: `Test email sent to ${r.sentTo}. Please check your inbox (and spam).` }
          : { ok: false, text: "Could not send the test email. Check the Gmail settings on the server." }
      );
    } catch (e) {
      setTestMsg({ ok: false, text: e?.response?.data?.message || "Could not send the test email." });
    }
    setTesting("");
  };

  const addClosed = () => {
    if (!newDate || closed.some((c) => c.date === newDate)) return;
    setClosed([...closed, { date: newDate, reason: newReason.trim() }].sort((a, b) => a.date.localeCompare(b.date)));
    setNewDate("");
    setNewReason("");
  };

  const staffOf = (date) => hours[new Date(date + "T12:00:00").getDay()]?.staff || "";
  const toBad = !to.date || !to.from || !to.to || to.from >= to.to;
  const addTimeOff = () => {
    if (toBad) return;
    const entry = { id: `${to.date}-${to.from}-${Date.now()}`, date: to.date, from: to.from, to: to.to, reason: to.reason.trim() };
    setTimeOff([...timeOff, entry].sort((a, b) => (a.date + a.from).localeCompare(b.date + b.from)));
    setTo({ ...to, date: "", reason: "" });
  };

  const label = { display: "block", fontSize: ".78rem", fontWeight: 600, marginBottom: 5 };
  const line = { padding: "10px 0", borderBottom: "1px solid var(--adm-line)", justifyContent: "space-between" };
  const canTestReview = !!saved.reviewUrl && url === saved.reviewUrl;

  return (
    <>
      <p className="adm-muted" style={{ marginBottom: 14 }}>
        All times are Evanston (Central) time. Changes apply to the public booking page right away.
        Existing bookings are not changed.
      </p>

      {dirty && (
        <div className="adm-alert" role="status">
          <span>You have unsaved changes.</span>
          <span className="adm-row">
            <button className="adm-btn ghost sm" onClick={discard}>Discard</button>
            <button
              className="adm-btn sm"
              disabled={busy || hourErrors.length > 0 || !owner.trim() || emailErrors}
              onClick={save}
            >
              {busy ? "Saving…" : "Save changes"}
            </button>
          </span>
        </div>
      )}

      <div className="adm-panel">
        <h3>Business</h3>
        <div className="adm-row" style={{ alignItems: "flex-start" }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={label}>Owner name (shown in "Welcome back")</label>
            <input className="adm-in" value={owner} maxLength={40} onChange={(e) => setOwner(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 220 }}>
            <label style={label}>Time between appointment slots</label>
            <select className="adm-in" value={step} onChange={(e) => setStep(Number(e.target.value))}>
              {STEPS.map((s) => <option key={s} value={s}>Every {s} minutes</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="adm-panel" style={{ marginTop: 18 }}>
        <h3>Opening hours and who is working</h3>
        {DAYS.map(([k, name]) => {
          const h = hours[k];
          return (
            <div key={k} className="adm-row" style={line}>
              <label className="adm-check" style={{ minWidth: 160 }}>
                <input type="checkbox" checked={h.open} onChange={(e) => setDay(k, { open: e.target.checked })} />
                <b>{name}</b>
              </label>
              {h.open && (
                <select className="adm-in" style={{ width: 110 }} value={h.staff} aria-label={`${name} staff`}
                  onChange={(e) => setDay(k, { staff: e.target.value })}>
                  {(settings.staffOptions || ["Puja", "Sia"]).map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              )}
              {h.open ? (
                <span className="adm-row" style={{ gap: 8 }}>
                  <input className="adm-in" type="time" style={{ width: 140 }} value={h.from}
                    onChange={(e) => setDay(k, { from: e.target.value })} aria-label={`${name} opens`} />
                  <span className="adm-muted">to</span>
                  <input className="adm-in" type="time" style={{ width: 140 }} value={h.to}
                    onChange={(e) => setDay(k, { to: e.target.value })} aria-label={`${name} closes`} />
                </span>
              ) : (
                <span className="adm-muted">Closed</span>
              )}
            </div>
          );
        })}
        {hourErrors.length > 0 && (
          <p style={{ color: "#8f2f20", marginTop: 10, fontSize: ".88rem" }}>
            Closing time must be after opening time: {hourErrors.join(", ")}.
          </p>
        )}
        <p className="adm-muted" style={{ marginTop: 10, fontSize: ".82rem" }}>
          The last bookable slot starts before closing time.
        </p>
      </div>

      <div className="adm-panel" style={{ marginTop: 18 }}>
        <h3>Closed dates and holidays</h3>
        <div className="adm-row" style={{ alignItems: "flex-end", marginBottom: 6 }}>
          <div>
            <label style={label}>Date</label>
            <input className="adm-in" type="date" min={today} value={newDate} onChange={(e) => setNewDate(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={label}>Reason (optional, shown to clients)</label>
            <input className="adm-in" maxLength={60} placeholder="Christmas Day, staff training…" value={newReason}
              onChange={(e) => setNewReason(e.target.value)} />
          </div>
          <button className="adm-btn" disabled={!newDate || closed.some((c) => c.date === newDate)} onClick={addClosed}>
            Add
          </button>
        </div>

        {closed.length === 0 ? (
          <p className="adm-muted" style={{ marginTop: 12 }}>No closed dates added.</p>
        ) : (
          closed.map((c) => {
            const n = bookings.filter((b) => b.date === c.date && String(b.status).toLowerCase() !== "cancelled").length;
            const past = c.date < today;
            return (
              <div key={c.date} className="adm-row" style={{ ...line, opacity: past ? 0.55 : 1 }}>
                <span>
                  <b>{nice(c.date)}</b>
                  {c.reason && <span className="adm-muted"> · {c.reason}</span>}
                  {past && <span className="adm-pill" style={{ marginLeft: 8 }}>Past</span>}
                  {!past && n > 0 && (
                    <span className="adm-pill" style={{ marginLeft: 8, color: "#8f2f20" }}>
                      {n} booking{n === 1 ? "" : "s"} to reschedule
                    </span>
                  )}
                </span>
                <button className="adm-btn ghost sm" onClick={() => setClosed(closed.filter((x) => x.date !== c.date))}>
                  Remove
                </button>
              </div>
            );
          })
        )}
      </div>

      <div className="adm-panel" style={{ marginTop: 18 }}>
        <h3>Time off (unavailable for a few hours)</h3>
        <p className="adm-muted" style={{ marginBottom: 12, fontSize: ".85rem" }}>
          Example: Puja is not available on Monday 12:00–2:00 PM. Those times disappear from the booking page and she is
          available again right after. For a whole day, use "Closed dates" above.
        </p>
        <div className="adm-row" style={{ alignItems: "flex-end", marginBottom: 6 }}>
          <div>
            <label style={label}>Date</label>
            <input className="adm-in" type="date" min={today} value={to.date} onChange={(e) => setTo({ ...to, date: e.target.value })} />
          </div>
          <div>
            <label style={label}>From</label>
            <input className="adm-in" type="time" style={{ width: 130 }} value={to.from} onChange={(e) => setTo({ ...to, from: e.target.value })} />
          </div>
          <div>
            <label style={label}>To</label>
            <input className="adm-in" type="time" style={{ width: 130 }} value={to.to} onChange={(e) => setTo({ ...to, to: e.target.value })} />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label style={label}>Reason (optional)</label>
            <input className="adm-in" maxLength={60} placeholder="Doctor, errand…" value={to.reason} onChange={(e) => setTo({ ...to, reason: e.target.value })} />
          </div>
          <button className="adm-btn" disabled={toBad} onClick={addTimeOff}>Add</button>
        </div>
        {to.date && <p className="adm-muted" style={{ fontSize: ".82rem" }}>{nice(to.date)} · {staffOf(to.date) || "-"} is working this day.</p>}
        {to.from >= to.to && <p style={{ color: "#8f2f20", fontSize: ".85rem" }}>"To" time must be after "From" time.</p>}

        {timeOff.length === 0 ? (
          <p className="adm-muted" style={{ marginTop: 12 }}>No time off added.</p>
        ) : (
          timeOff.map((t) => {
            const past = t.date < today;
            const n = bookings.filter((b) => {
              const m = slotMin(b.slot);
              return b.date === t.date && String(b.status).toLowerCase() !== "cancelled" && m !== null &&
                m < hm(t.to) && hm(t.from) < m + (Number(b.duration) || 45);
            }).length;
            return (
              <div key={t.id} className="adm-row" style={{ ...line, opacity: past ? 0.55 : 1 }}>
                <span>
                  <b>{nice(t.date)}</b> · {t12(t.from)} – {t12(t.to)}
                  <span className="adm-muted"> · {staffOf(t.date) || t.staff}{t.reason ? ` · ${t.reason}` : ""}</span>
                  {past && <span className="adm-pill" style={{ marginLeft: 8 }}>Past</span>}
                  {!past && n > 0 && (
                    <span className="adm-pill" style={{ marginLeft: 8, color: "#8f2f20" }}>
                      {n} booking{n === 1 ? "" : "s"} to reschedule
                    </span>
                  )}
                </span>
                <button className="adm-btn ghost sm" onClick={() => setTimeOff(timeOff.filter((x) => x.id !== t.id))}>Remove</button>
              </div>
            );
          })
        )}
      </div>

      <div className="adm-panel" style={{ marginTop: 18 }}>
        <h3>Client emails</h3>
        <p className="adm-muted" style={{ marginBottom: 12, fontSize: ".85rem" }}>
          Automatic emails to clients. Emails are only sent between 9 AM and 8 PM Evanston time.
        </p>

        <label className="adm-check" style={{ marginBottom: 6 }}>
          <input type="checkbox" checked={remind} onChange={(e) => setRemind(e.target.checked)} />
          <b>Reminder email</b>
          <span className="adm-muted"> · sent about 24 hours before a confirmed appointment</span>
        </label>

        <label className="adm-check" style={{ margin: "14px 0 10px" }}>
          <input type="checkbox" checked={reviews} onChange={(e) => setReviews(e.target.checked)} />
          <b>Ask for a Google review</b>
          <span className="adm-muted"> · sent after a visit is marked completed</span>
        </label>

        <div className="adm-row" style={{ alignItems: "flex-start" }}>
          <div style={{ flex: 2, minWidth: 260 }}>
            <label style={label}>Google review link</label>
            <input className="adm-in" value={reviewUrl} maxLength={300} placeholder="https://g.page/r/..."
              onChange={(e) => setReviewUrl(e.target.value)} />
          </div>
          <div style={{ flex: 1, minWidth: 200 }}>
            <label style={label}>Send the request</label>
            <select className="adm-in" value={delay} onChange={(e) => setDelay(Number(e.target.value))}>
              {DELAYS.map(([v, t]) => <option key={v} value={v}>{t}</option>)}
            </select>
          </div>
        </div>

        {urlBad && (
          <p style={{ color: "#8f2f20", marginTop: 10, fontSize: ".88rem" }}>The review link must start with https://</p>
        )}
        {reviewNeedsUrl && !urlBad && (
          <p style={{ color: "#8f2f20", marginTop: 10, fontSize: ".88rem" }}>
            Add your Google review link before turning review requests on.
          </p>
        )}

        <div className="adm-row" style={{ marginTop: 16, gap: 10 }}>
          <button className="adm-btn ghost" disabled={!!testing} onClick={() => sendTest("reminder")}>
            {testing === "reminder" ? "Sending…" : "Send me a test reminder"}
          </button>
          <button className="adm-btn ghost" disabled={!!testing || !canTestReview} onClick={() => sendTest("review")}>
            {testing === "review" ? "Sending…" : "Send me a test review email"}
          </button>
        </div>
        {!canTestReview && (
          <p className="adm-muted" style={{ marginTop: 8, fontSize: ".82rem" }}>
            Save your review link to enable the test review email.
          </p>
        )}
        {testMsg && (
          <p style={{ marginTop: 10, fontSize: ".88rem", color: testMsg.ok ? "#2f6b3a" : "#8f2f20" }} role="status">
            {testMsg.text}
          </p>
        )}
      </div>
    </>
  );
}