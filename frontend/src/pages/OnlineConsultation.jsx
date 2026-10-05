import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createBooking, getAvailability } from "../api/client";

const SERVICE = {
  id: "virt",
  name: "Virtual Skin Consultation",
  duration: "30 mins",
  price: "$45",
  desc: "1-on-1 video skin assessment with Puja, over Google Meet.",
};

const FALLBACK_SLOTS = ["10:00 AM", "11:15 AM", "12:30 PM", "02:00 PM", "03:15 PM", "04:30 PM", "05:15 PM"];

export default function OnlineConsultation() {
  const navigate = useNavigate();

  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [slots, setSlots] = useState(FALLBACK_SLOTS.map((t) => ({ time: t, available: true })));
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [details, setDetails] = useState({ name: "", phone: "", email: "", notes: "" });
  const [isBooked, setIsBooked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");

  const isSunday = selectedDate ? new Date(selectedDate + "T12:00:00").getDay() === 0 : false;

  useEffect(() => {
    if (!selectedDate || isSunday) return;
    setSlotsLoading(true);
    setSelectedTime("");
    getAvailability(selectedDate)
      .then((data) => {
        setSlots(Array.isArray(data) && data.length ? data : FALLBACK_SLOTS.map((t) => ({ time: t, available: true })));
      })
      .catch(() => setSlots(FALLBACK_SLOTS.map((t) => ({ time: t, available: true }))))
      .finally(() => setSlotsLoading(false));
  }, [selectedDate, isSunday]);

  const handleInputChange = (e) => setDetails({ ...details, [e.target.name]: e.target.value });

  const handleConfirm = async (e) => {
    e.preventDefault();
    setBookingError("");

    if (!selectedDate) return setBookingError("Please select a date.");
    if (isSunday) return setBookingError("We are closed on Sundays. Please select another date.");
    if (!selectedTime) return setBookingError("Please select a time slot.");
    if (!details.name || !details.phone) return setBookingError("Please fill in your name and phone number.");
    if (!details.email) return setBookingError("Please enter your email address.");

    setIsLoading(true);
    try {
      const res = await createBooking({
        serviceId: SERVICE.id,
        date: selectedDate,
        slot: selectedTime,
        name: details.name,
        email: details.email,
        phone: details.phone,
        note: details.notes,
        mode: "online",
      });
      navigate("/confirmation", { state: { booking: res?.data || res, service: SERVICE } });
    } catch (err) {
      setBookingError(err?.response?.data?.message || "Booking failed. Please try again.");
    } finally {
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
            Thanks, <b>{details.name}</b>! Your 30-min video consultation is set for <b>{selectedDate}</b> at{" "}
            <b>{selectedTime}</b>. We've emailed your Google Meet link and details to <b>{details.email}</b> — check
            your inbox (and spam folder, just in case).
          </p>
          <button className="oc-btn" onClick={() => navigate("/")}>Return to Home</button>
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
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} required />
          </div>

          {isSunday ? (
            <div className="oc-warning">We're closed on Sundays — please pick Mon–Sat.</div>
          ) : selectedDate ? (
            <div className="oc-field">
              <label>Time {slotsLoading && <span className="oc-loading-label">loading…</span>}</label>
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

          {bookingError && <div className="oc-error">{bookingError}</div>}

          <button className="oc-btn" type="submit" disabled={isLoading || isSunday}>
            {isLoading ? "Confirming…" : `Confirm — ${SERVICE.price}`}
          </button>
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
.oc-success-card { max-width: 480px; margin: 0 auto; background: #fff; border: 1px solid #E6DDD0; border-radius: 20px; padding: 48px 32px; text-align: center; }
.oc-success-icon { font-size: 2.2rem; color: #2D3A31; margin-bottom: 16px; }
.oc-success-card h2 { font-family: Fraunces, Georgia, serif; margin: 0 0 12px; }
.oc-success-card p { color: #5C554F; line-height: 1.6; margin-bottom: 24px; }
@media (max-width: 600px) { .oc-grid-2 { grid-template-columns: 1fr; } }
`;