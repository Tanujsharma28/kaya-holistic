import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createCheckoutSession, getAvailabilityInfo, getServices, checkGiftCode } from "../api/client";
// Testing: VITE_PAYMENTS_PAUSED=true ho to sirf button ka text badalta hai (asli pause backend ke PAYMENTS_PAUSED se hota hai)
const PAUSED = import.meta.env.VITE_PAYMENTS_PAUSED === "true";

const DEFAULT_SERVICE = {
  id: "virt",
  name: "Virtual Skin Consultation",
  duration: "30 mins",
  price: "$45",
  desc: "1-on-1 video skin assessment with Puja, over Google Meet.",
};

const FALLBACK_SLOTS = ["10:00 AM", "10:45 AM", "11:30 AM", "12:15 PM", "1:00 PM", "1:45 PM", "2:30 PM", "3:15 PM", "4:00 PM", "4:45 PM", "5:30 PM"];

export default function OnlineConsultation() {
  const navigate = useNavigate();
  const [SERVICE, setService] = useState({ ...DEFAULT_SERVICE, active: true });
  useEffect(() => {
    getServices()
      .then((list) => {
        const s = list.find((x) => x.id === "virt");
        if (s) setService({ ...DEFAULT_SERVICE, name: s.name, duration: `${s.duration} mins`, price: `$${s.price}`, active: s.active !== false });
      })
      .catch(() => {});
  }, []);

  const today = new Date().toLocaleDateString("en-CA", { timeZone: "America/Chicago" });

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [slots, setSlots] = useState(FALLBACK_SLOTS.map((t) => ({ time: t, available: true })));
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [details, setDetails] = useState({ name: "", phone: "", email: "", notes: "" });
  const [isBooked, setIsBooked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
    // Gift card code
  const [giftInput, setGiftInput] = useState("");
  const [gift, setGift] = useState(null);
  const [giftMsg, setGiftMsg] = useState("");
  const [giftBusy, setGiftBusy] = useState(false);
  const money = (n) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;
  const priceNum = Number(String(SERVICE.price).replace(/[^0-9.]/g, "")) || 0;
  const giftUse = gift ? Math.min(gift.balance, priceNum) : 0;
  let toPay = Math.round((priceNum - giftUse) * 100) / 100;
  if (toPay > 0 && toPay < 0.5) toPay = 0.5; // Stripe ka minimum 50 cents
  const applyGift = async () => {
    setGiftMsg("");
    setGiftBusy(true);
    try {
      setGift(await checkGiftCode(giftInput, selectedDate || undefined));
    } catch (err) {
      setGift(null);
      setGiftMsg(err?.response?.data?.message || "Could not check the code. Please try again.");
    } finally {
      setGiftBusy(false);
    }
  };
  const removeGift = () => { setGift(null); setGiftInput(""); setGiftMsg(""); };

  const [closedMsg, setClosedMsg] = useState("");
  const [staff, setStaff] = useState("");

  useEffect(() => {
    if (!selectedDate) return;
    setSlotsLoading(true);
    setSelectedTime("");
    setClosedMsg("");
    getAvailabilityInfo(selectedDate, "virt")
      .then(({ slots: list, closed, staff: who }) => {
        setClosedMsg(closed);
        setStaff(who || "");
        setSlots(list);
      })
      .catch(() => setSlots(FALLBACK_SLOTS.map((t) => ({ time: t, available: true }))))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate]);

  const handleInputChange = (e) => setDetails({ ...details, [e.target.name]: e.target.value });

  const handleConfirm = async (e) => {
    e.preventDefault();
    setBookingError("");

    if (!selectedDate) return setBookingError("Please select a date.");
    if (closedMsg) return setBookingError(`${closedMsg}. Please select another date.`);
    if (!selectedTime) return setBookingError("Please select a time slot.");
    if (!details.name || !details.phone) return setBookingError("Please fill in your name and phone number.");
    if (!details.email) return setBookingError("Please enter your email address.");

    setIsLoading(true);
    try {
      // Yahan booking turant confirm nahi hoti — pehle Stripe pe $45 pay karna
      // hota hai, payment safal hone ke baad hi (webhook ke zariye) booking
      // confirm hoti hai aur email/Meet link jaate hain.
      const res = await createCheckoutSession({
        serviceId: SERVICE.id,
        date: selectedDate,
        slot: selectedTime,
        name: details.name,
        email: details.email,
        phone: details.phone,
        note: details.notes,
        giftCode: gift?.code,
      });
      if ((res?.paused || res?.free) && res.booking) {
        // Payment pause mode: booking seedha confirm ho gayi, Confirmation page pe bhej do
        navigate("/confirmation", { state: { booking: res.booking, service: res.service } });
        return;
      }
      if (res?.url) {
        window.location.href = res.url; // Stripe ke secure payment page par
      } else {
        setBookingError("Could not start payment. Please try again.");
        setIsLoading(false);
      }
    } catch (err) {
      setBookingError(err?.response?.data?.message || "Something went wrong. Please try again.");
      setIsLoading(false);
    }
  };

  if (isBooked) {
    return (
      <div className="view oc-wrap">
        <style>{OC_CSS}</style>
        <div className="oc-success-card">
          <div className="oc-success-icon">✓</div>
          <h2>Online Consultation Booked</h2>
          <p>
            Thanks, <b>{details.name}</b>! Your {SERVICE.duration} video consultation is set for <b>{selectedDate}</b> at{" "}
            <b>{selectedTime}</b>. We've emailed your Google Meet link and details to <b>{details.email}</b> — check
            your inbox (and spam folder, just in case).
          </p>
          <button className="oc-btn" onClick={() => navigate("/")}>Return to Home</button>
        </div>
      </div>
    );
  }

  if (SERVICE.active === false) {
    return (
      <div className="view oc-wrap">
        <style>{OC_CSS}</style>
        <div className="oc-success-card">
          <h2>Online consultations are paused</h2>
          <p>We're not taking online bookings right now. Please call <b>847-571-1910</b> and we'll be happy to help.</p>
          <button className="oc-btn" onClick={() => navigate("/")}>Back to home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="view oc-wrap">
      <style>{OC_CSS}</style>
      <div className="oc-container">
        <div className="oc-header">
          <div className="oc-eyebrow">🎥 Online Video Consultation</div>
          <h1>Book Your Virtual Session</h1>
          <p className="oc-sub">30 minutes, 1-on-1 with Puja over Google Meet — {SERVICE.price}. A Meet link and confirmation go straight to your email.</p>
        </div>

        <form className="oc-card" onSubmit={handleConfirm}>
          <div className="oc-field">
            <label>Date</label>
            <input type="date" min={today} value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} required />
          </div>

          {closedMsg ? (
            <div className="oc-warning">{closedMsg}. Please pick another date.</div>
          ) : selectedDate ? (
            <div className="oc-field">
              <label>Time {slotsLoading && <span className="oc-loading-label">loading…</span>}</label>
              {staff && <p className="oc-sub" style={{ margin: "0 0 8px" }}>Your session on this day is with <b>{staff}</b>.</p>}
              <div className="oc-slots-grid">
                {slots.map((s) => (
                  <button
                    type="button"
                    key={s.time}
                    disabled={!s.available}
                    className={`oc-slot ${selectedTime === s.time ? "active" : ""} ${!s.available ? "taken" : ""}`}
                    onClick={() => setSelectedTime(s.time)}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
              {!slotsLoading && slots.length === 0 && (
                <div className="oc-warning" style={{ marginTop: 10 }}>No times available on this date. Please pick another day.</div>
              )}
            </div>
          ) : null}

          <div className="oc-grid-2">
            <div className="oc-field">
              <label>Full Name</label>
              <input type="text" name="name" placeholder="Sarah Jenkins" value={details.name} onChange={handleInputChange} required />
            </div>
            <div className="oc-field">
              <label>Phone Number</label>
              <input type="tel" name="phone" placeholder="847-571-1910" value={details.phone} onChange={handleInputChange} required />
            </div>
          </div>
          <div className="oc-field">
            <label>Email Address</label>
            <input type="email" name="email" placeholder="sarah@example.com" value={details.email} onChange={handleInputChange} required />
          </div>
          <div className="oc-field">
            <label>Anything Puja should know? (optional)</label>
            <textarea rows="3" name="notes" placeholder="Skin concerns, allergies, etc." value={details.notes} onChange={handleInputChange} />
          </div>
          <div className="oc-field">
            <label>Gift card code (optional)</label>
            {gift ? (
              <div className="oc-gift-ok">
                <span>✓ {gift.code} applied · balance {money(gift.balance)}</span>
                <button type="button" className="oc-link" onClick={removeGift}>Remove</button>
              </div>
            ) : (
              <div className="oc-gift-row">
                <input
                  type="text"
                  placeholder="KAYA-XXXX-XXXX"
                  value={giftInput}
                  onChange={(e) => setGiftInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (giftInput.trim() && !giftBusy) applyGift(); } }}
                />
                <button type="button" className="oc-btn-sm" onClick={applyGift} disabled={giftBusy || !giftInput.trim()}>
                  {giftBusy ? "Checking…" : "Apply"}
                </button>
              </div>
            )}
            {giftMsg && <div className="oc-error">{giftMsg}</div>}
            {gift && <div className="oc-gift-sum">Gift card: −{money(giftUse)} · To pay: {money(toPay)}</div>}
          </div>
          {bookingError && <div className="oc-error">{bookingError}</div>}

          <button className="oc-btn" type="submit" disabled={isLoading || !!closedMsg}>
            {PAUSED
              ? (isLoading ? "Booking…" : "Book Now (test mode, no payment)")
                           : gift && toPay <= 0
                ? (isLoading ? "Booking…" : "Book with Gift Card")
                : (isLoading ? "Redirecting to secure payment…" : `Pay & Book — ${gift ? money(toPay) : SERVICE.price}`)}
          </button>
          <p className="oc-secure-note">
            {PAUSED ? "Test mode: no payment is taken right now." : "🔒 Secure payment via Stripe. Your slot is held while you pay."}
          </p>
        </form>
      </div>
    </div>
  );
}

const OC_CSS = `
.oc-wrap { min-height: 100vh; background: #FAF7F2; padding: 120px 20px 80px; display: flex; justify-content: center; font-family: "DM Sans", system-ui, sans-serif; color: #2B2016; }
.oc-container { width: 100%; max-width: 560px; }
.oc-header { text-align: center; margin-bottom: 28px; }
.oc-eyebrow { font-size: 0.8rem; font-weight: 700; letter-spacing: 1px; color: #7C5C38; text-transform: uppercase; margin-bottom: 10px; }
.oc-header h1 { font-family: Fraunces, Georgia, serif; font-size: 2.1rem; margin: 0 0 10px; color: #241A13; }
.oc-sub { color: #6A5E52; font-size: 0.95rem; line-height: 1.6; margin: 0; }
.oc-card { background: #fff; border: 1px solid #E6DDD0; border-radius: 20px; padding: 28px; box-shadow: 0 20px 48px -20px rgba(36,26,19,0.1); display: flex; flex-direction: column; gap: 18px; }
.oc-field { display: flex; flex-direction: column; gap: 6px; }
.oc-field label { font-size: 0.82rem; font-weight: 600; color: #4a3b2c; }
.oc-loading-label { font-weight: 400; color: #9c8a73; font-size: 0.78rem; }
.oc-field input, .oc-field textarea { padding: 12px 14px; border: 1px solid #E6DDD0; border-radius: 10px; font-family: inherit; font-size: 0.95rem; outline: none; }
.oc-field input:focus, .oc-field textarea:focus { border-color: #A67C52; }
.oc-grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
.oc-slots-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr)); gap: 8px; }
.oc-slot { padding: 10px 6px; border-radius: 10px; border: 1px solid #E6DDD0; background: #fff; font-size: 0.85rem; cursor: pointer; }
.oc-slot.active { background: #241A13; color: #fff; border-color: #241A13; }
.oc-slot.taken { opacity: 0.4; text-decoration: line-through; cursor: not-allowed; }
.oc-warning { background: #FFF4E5; border: 1px solid #F0D9A8; border-radius: 10px; padding: 12px 14px; font-size: 0.88rem; color: #7c5c38; }
.oc-error { background: #fff0f0; border: 1px solid #ffd4d4; border-radius: 10px; padding: 12px 14px; color: #c0392b; font-size: 0.88rem; }
.oc-btn { background: #241A13; color: #fff; border: none; padding: 15px; border-radius: 99px; font-weight: 600; font-size: 0.95rem; cursor: pointer; }
.oc-btn:disabled { background: #D9D2CB; cursor: not-allowed; }
.oc-secure-note { text-align: center; font-size: 0.78rem; color: #9c8a73; margin: -6px 0 0; }
.oc-success-card { max-width: 480px; margin: 0 auto; background: #fff; border: 1px solid #E6DDD0; border-radius: 20px; padding: 48px 32px; text-align: center; }
.oc-success-icon { font-size: 2.2rem; color: #2D3A31; margin-bottom: 16px; }
.oc-success-card h2 { font-family: Fraunces, Georgia, serif; margin: 0 0 12px; }
.oc-success-card p { color: #5C554F; line-height: 1.6; margin-bottom: 24px; }
.oc-gift-row { display: flex; gap: 8px; }
.oc-gift-row input { flex: 1; text-transform: uppercase; }
.oc-btn-sm { background: #241A13; color: #fff; border: none; padding: 0 18px; border-radius: 10px; font-weight: 600; cursor: pointer; }
.oc-btn-sm:disabled { background: #D9D2CB; cursor: not-allowed; }
.oc-gift-ok { display: flex; justify-content: space-between; align-items: center; gap: 10px; background: #F1F8F2; border: 1px solid #CFE6D3; border-radius: 10px; padding: 12px 14px; font-size: 0.88rem; color: #2D5A3A; }
.oc-link { background: none; border: none; color: #7C5C38; text-decoration: underline; cursor: pointer; font-size: 0.85rem; }
.oc-gift-sum { font-size: 0.85rem; color: #4a3b2c; }
@media (max-width: 600px) { .oc-grid-2 { grid-template-columns: 1fr; } }
`;