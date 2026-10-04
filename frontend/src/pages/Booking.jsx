import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { loadStripe } from "@stripe/stripe-js";
import { Elements } from "@stripe/react-stripe-js";
import { getServices, getAvailability, createBooking } from "../api/client";
import { useApp } from "../context/AppContext";
import CheckoutForm from "../components/CheckoutForm";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const pk = import.meta.env.VITE_STRIPE_PUBLIC_KEY;
const stripePromise = pk ? loadStripe(pk) : null; // Stripe component ke bahar load hota hai
const DEPOSIT = 25; // backend/.env ke DEPOSIT_USD ke barabar rakho

const tomorrow = () => {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export default function Booking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { selectedService } = useApp();

  const [services, setServices] = useState([]);
  const [service, setService] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [slots, setSlots] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [details, setDetails] = useState({ name: "", phone: "", email: "", notes: "" });
  const [isBooked, setIsBooked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [bookingError, setBookingError] = useState("");
  const [pay, setPay] = useState(null); // { clientSecret, amount }
  const [clientSecret, setClientSecret] = useState("");

  useEffect(() => {
    const paymentIntentClientSecret = searchParams.get('payment_intent_client_secret');
    const redirectStatus = searchParams.get('redirect_status');

    if (redirectStatus === 'succeeded' && paymentIntentClientSecret) {
      const intentId = searchParams.get('payment_intent') || paymentIntentClientSecret;
      fetch(`${API_BASE}/bookings/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerDetails: {
            name: details.name || "Valued Customer",
            firstName: details.name?.split(" ")[0] || "Valued",
            lastName: details.name?.split(" ").slice(1).join(" ") || "Customer",
            email: details.email || "customer@example.com",
            phone: details.phone || "N/A"
          },
          serviceDetails: {
            name: service?.name || "Treatment",
            staff: "Puja",
            date: selectedDate || new Date().toISOString(),
            time: selectedTime || "Scheduled",
            price: service?.price || 25,
            deposit: deposit || 25
          },
          paymentIntentId: intentId
        })
      }).catch(err => console.error("Confirm booking error:", err));

      alert("Payment Successful & Booking Confirmed!");
      setIsBooked(true);
    }
  }, [searchParams]);

  const handleInitiatePayment = async () => {
    try {
      console.log("Requesting payment intent from:", `${import.meta.env.VITE_API_URL}/payments/create-payment-intent`);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/payments/create-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          bookingId: "temp_booking_123" 
        }),
      });
      
      const data = await response.json();
      console.log("Backend Response Data:", data); // <--- Ye check karna zaroori hai

      if (data.clientSecret) {
        setClientSecret(data.clientSecret);
      } else {
        console.error("Client secret missing in response:", data);
        alert("Failed to initialize payment. Check backend console.");
      }
    } catch (error) {
      console.error("Payment initialization failed:", error);
    }
  };

  useEffect(() => {
    getServices()
      .then((all) => {
        const list = all.filter((s) => s.id !== "virt"); // consultation ka apna page hai
        setServices(list);
        setService(list.find((s) => s.id === selectedService?.id) || list[0] || null);
      })
      .catch(() => setBookingError("Could not load services. Please refresh the page."));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadSlots = (day) => {
    if (!day) { setSlots([]); return; }
    setSlotsLoading(true);
    getAvailability(day).then(setSlots).catch(() => setSlots([])).finally(() => setSlotsLoading(false));
  };

  useEffect(() => {
    setSelectedTime("");
    loadSlots(selectedDate);
  }, [selectedDate]);

  const isSunday = selectedDate ? new Date(selectedDate + "T12:00:00").getDay() === 0 : false;
  const withPayment = !!stripePromise;
  const deposit = service ? Math.min(DEPOSIT, service.price) : 0;
  const locked = !!pay;

  const handleInputChange = (e) => setDetails({ ...details, [e.target.name]: e.target.value });

  const validate = () => {
    if (!service) return "Please choose a treatment.";
    if (!selectedDate) return "Please select a date.";
    if (isSunday) return "We are closed on Sundays. Please select another date.";
    if (!selectedTime) return "Please select a time.";
    if (!details.name.trim() || !details.phone.trim()) return "Please fill in your name and phone number.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.email.trim())) return "Please enter a valid email address.";
    return "";
  };

  // Booking server par save hoti hai. Deposit ho to server Stripe se verify karta hai.
  const finishBooking = async (paymentIntentId) => {
    try {
      const response = await fetch(`${API_BASE}/bookings/confirm`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerDetails: {
            name: details.name,
            firstName: details.name.split(" ")[0] || details.name,
            lastName: details.name.split(" ").slice(1).join(" ") || "",
            email: details.email,
            phone: details.phone,
          },
          serviceDetails: {
            name: service?.name || "Treatment",
            staff: "Puja",
            date: selectedDate,
            time: selectedTime,
            price: service?.price || 0,
            deposit: deposit,
          },
          paymentIntentId: paymentIntentId || `pi_manual_${Date.now()}`,
        }),
      });

      const resData = await response.json();
      if (response.ok && resData.success) {
        setIsBooked(true);
      } else {
        await createBooking({
          serviceId: service.id,
          date: selectedDate,
          slot: selectedTime,
          name: details.name,
          email: details.email,
          phone: details.phone,
          note: details.notes,
          type: "visit",
          mode: "in-person",
          paymentIntentId,
        });
        setIsBooked(true);
      }
    } catch (err) {
      setBookingError(
        err?.message ||
          "Booking could not be saved. If you were charged, please call 847-571-1910."
      );
      setPay(null);
      setSelectedTime("");
      loadSlots(selectedDate);
    }
  };

  const handleConfirm = async (e) => {
    e.preventDefault();
    const problem = validate();
    if (problem) { setBookingError(problem); return; }
    setBookingError("");
    setIsLoading(true);

    if (!withPayment) {
      await finishBooking(null);
      setIsLoading(false);
      return;
    }

    try {
      const r = await fetch(`${API_BASE}/payments/create-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ serviceId: service.id, date: selectedDate, slot: selectedTime }),
      });
      const data = await r.json();
      console.log("Backend Response Data:", data);
      if (!r.ok || !data.clientSecret) throw new Error(data.message || "Could not start payment.");
      setPay({ clientSecret: data.clientSecret, amount: data.amount });
    } catch (err) {
      setBookingError(err.message);
      loadSlots(selectedDate);
    } finally {
      setIsLoading(false);
    }
  };

  if (isBooked) {
    return (
      <div className="booking-success-wrapper">
        <style>{`
          .booking-success-wrapper{min-height:85vh;display:flex;align-items:center;justify-content:center;background:#FAF7F2;padding:20px;font-family:"DM Sans",system-ui,sans-serif}
          .success-card{background:#fff;border:1px solid #E6DDD0;border-radius:16px;padding:56px 40px;max-width:500px;text-align:center}
          .success-icon{width:60px;height:60px;border-radius:50%;margin:0 auto 22px;display:grid;place-items:center;font-size:1.6rem;color:#241a13;background:linear-gradient(145deg,#c89b5c,#a67c52)}
          .success-title{font-family:Fraunces,Georgia,serif;font-size:2rem;font-weight:400;color:#2A2623;margin:0 0 12px}
          .success-text{color:#5C554F;font-size:.95rem;line-height:1.6;margin:0 0 28px}
          .btn-home{background:#241a13;color:#fff;border:0;padding:16px 32px;font-size:.9rem;border-radius:99px;cursor:pointer;width:100%;transition:background .3s}
          .btn-home:hover{background:#a67c52}
        `}</style>
        <div className="success-card">
          <div className="success-icon">✓</div>
          <h2 className="success-title">Booking Confirmed</h2>
          <p className="success-text">
            Thank you, <b>{details.name}</b>. Your <b>{service.name}</b> is scheduled for <b>{selectedDate}</b> at <b>{selectedTime}</b>.
            We have sent a confirmation email to <b>{details.email}</b>. Please check spam if you do not see it.
          </p>
          <button className="btn-home" onClick={() => navigate("/")}>Return to Home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="booking-page-container">
      <style>{`
        .booking-page-container{min-height:100vh;background:#FAF7F2;padding:110px 20px 100px;font-family:"DM Sans",system-ui,sans-serif;color:#2A2623;display:flex;justify-content:center}
        .booking-max-width{width:100%;max-width:1120px}
        .booking-header{margin-bottom:44px;text-align:center}
        .booking-eyebrow{font-size:.75rem;letter-spacing:2px;text-transform:uppercase;color:#A67C52;font-weight:600;margin-bottom:12px}
        .booking-title{font-family:Fraunces,Georgia,serif;font-size:3rem;font-weight:400;color:#2A2623;margin:0;letter-spacing:-.5px}
        .booking-sub{color:#8a7d6e;margin:12px 0 0}
        .booking-sub a{color:#7c5c38;font-weight:600}

        .booking-grid{display:grid;grid-template-columns:1fr 400px;gap:48px;align-items:start}
        .booking-section-card{margin-bottom:40px}
        .section-step-title{font-size:1.25rem;font-weight:500;color:#2A2623;margin:0 0 24px;display:flex;align-items:center;gap:12px;border-bottom:1px solid #EBE5DF;padding-bottom:16px}
        .step-num{color:#A67C52;font-family:Fraunces,Georgia,serif;font-size:1.1rem;font-style:italic}

        .services-options{display:flex;flex-direction:column;gap:14px}
        .service-option-item{border:1px solid #EBE5DF;border-radius:12px;padding:22px;cursor:pointer;transition:all .2s;display:flex;justify-content:space-between;align-items:flex-start;background:#fff;gap:14px}
        .service-option-item:hover{border-color:#A67C52}
        .service-option-item.active{border:2px solid #A67C52;background:#FCFAF7;padding:21px}
        .service-option-item.locked{pointer-events:none;opacity:.7}
        .srv-name{font-weight:500;font-size:1.05rem;margin-bottom:6px}
        .srv-desc{font-size:.85rem;color:#5C554F;line-height:1.5}
        .srv-meta{text-align:right;white-space:nowrap}
        .srv-price{font-weight:600;font-size:1.1rem;margin-bottom:4px;color:#7c5c38}
        .srv-dur{font-size:.75rem;text-transform:uppercase;letter-spacing:1px;color:#8C847D}

        .date-picker-input{width:100%;padding:16px;border:1px solid #EBE5DF;border-radius:8px;font-size:1rem;font-family:inherit;color:#2A2623;background:#fff;outline:none;box-sizing:border-box;transition:border-color .2s}
        .date-picker-input:focus{border-color:#A67C52}
        .sunday-warning{margin-top:16px;padding:16px;background:#fff;border:1px solid #FFD4D4;border-radius:8px;color:#b3261e;font-size:.9rem}

        .time-slots-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:10px;margin-top:16px}
        .time-slot-btn{border:1px solid #D9D2CB;background:#fff;border-radius:8px;padding:12px 8px;font-size:.9rem;color:#2A2623;cursor:pointer;transition:all .2s;font-family:inherit}
        .time-slot-btn:hover:not(:disabled){border-color:#A67C52}
        .time-slot-btn.active{background:#241a13;color:#fff;border-color:#241a13}
        .time-slot-btn:disabled{cursor:not-allowed}
        .time-slot-btn.booked{background-image:repeating-linear-gradient(45deg,#ede9e4,#ede9e4 8px,#f7f4f1 8px,#f7f4f1 16px);border-color:#E3DCD3;color:#a8a29b;text-decoration:line-through}
        .slots-msg{padding:20px 0;color:#A67C52;font-size:.9rem}

        .form-grid{display:grid;grid-template-columns:1fr 1fr;gap:20px}
        .form-group{display:flex;flex-direction:column;gap:8px}
        .form-group.full{grid-column:1/-1}
        .form-group label{font-size:.75rem;font-weight:600;color:#5C554F;text-transform:uppercase;letter-spacing:1px}
        .form-group input,.form-group textarea{padding:16px;border:1px solid #EBE5DF;border-radius:8px;font-size:.95rem;font-family:inherit;outline:none;background:#fff;transition:border-color .2s}
        .form-group input:focus,.form-group textarea:focus{border-color:#A67C52}
        .form-group input:disabled,.form-group textarea:disabled{background:#f7f4f0}

        .summary-card-sticky{position:sticky;top:96px;background:#fff;border:1px solid #EBE5DF;border-radius:16px;padding:32px;box-shadow:0 10px 30px rgba(42,38,35,.04)}
        .summary-card-title{font-size:1.25rem;font-weight:500;margin:0 0 24px}
        .summary-row{display:flex;justify-content:space-between;margin-bottom:14px;font-size:.95rem;align-items:flex-start}
        .summary-label{color:#5C554F}
        .summary-val{color:#2A2623;font-weight:500;text-align:right;line-height:1.4;max-width:200px}
        .summary-divider{height:1px;background:#EBE5DF;margin:22px 0}
        .summary-total-row{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}
        .total-label{font-size:1rem;text-transform:uppercase;letter-spacing:1px;font-weight:600}
        .total-price{font-family:Fraunces,Georgia,serif;font-size:2rem;color:#7c5c38}
        .deposit-row{display:flex;justify-content:space-between;font-size:.92rem;margin-bottom:22px;color:#5C554F}
        .deposit-row b{color:#2A2623}

        .btn-confirm-booking{width:100%;background:#241a13;color:#fff;border:0;padding:17px;border-radius:99px;font-size:.95rem;font-weight:600;letter-spacing:.4px;cursor:pointer;transition:background .3s,color .3s;font-family:inherit}
        .btn-confirm-booking:hover:not(:disabled){background:#c89b5c;color:#241a13}
        .btn-confirm-booking:disabled{background:#D9D2CB;color:#8C847D;cursor:not-allowed}
        .booking-error{background:#fff0f0;border:1px solid #ffd4d4;border-radius:8px;padding:12px 16px;margin-bottom:16px;color:#b3261e;font-size:.9rem}
        .policy-note{margin-top:14px;font-size:.8rem;color:#8a7d6e;line-height:1.6}
        .spa-info-box{margin-top:26px;padding-top:22px;border-top:1px solid #EBE5DF;font-size:.85rem;color:#5C554F;line-height:1.8;text-align:center}

        @media (max-width:900px){
          .booking-grid{grid-template-columns:1fr}
          .summary-card-sticky{position:static;padding:24px}
          .form-grid{grid-template-columns:1fr}
          .booking-title{font-size:2.2rem}
          .booking-page-container{padding-top:96px}
        }
      `}</style>

      <div className="booking-max-width">
        <div className="booking-header">
          <div className="booking-eyebrow">Book An Appointment</div>
          <h1 className="booking-title">Reserve Your Visit</h1>
          <p className="booking-sub">
            Want a skin analysis instead? <a href="/consultation">Book a 1-on-1 consultation</a>
          </p>
        </div>

        <div className="booking-grid">
          <div className="booking-left">
            <div className="booking-section-card">
              <h3 className="section-step-title"><span className="step-num">Step 01</span> Select Treatment</h3>
              <div className="services-options">
                {services.map((srv) => (
                  <div
                    key={srv.id}
                    className={`service-option-item ${service?.id === srv.id ? "active" : ""} ${locked ? "locked" : ""}`}
                    onClick={() => setService(srv)}
                  >
                    <div>
                      <div className="srv-name">{srv.name}</div>
                      <div className="srv-desc">{srv.desc}</div>
                    </div>
                    <div className="srv-meta">
                      <div className="srv-price">${srv.price}</div>
                      <div className="srv-dur">{srv.duration} mins</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="booking-section-card">
              <h3 className="section-step-title"><span className="step-num">Step 02</span> Date &amp; Time</h3>
              <input
                type="date"
                className="date-picker-input"
                value={selectedDate}
                min={tomorrow()}
                disabled={locked}
                onChange={(e) => setSelectedDate(e.target.value)}
              />

              {isSunday && (
                <div className="sunday-warning">We are closed on Sundays. Please select a date from Monday to Saturday.</div>
              )}

              {selectedDate && !isSunday && (
                slotsLoading ? (
                  <div className="slots-msg">Loading available times…</div>
                ) : slots.length === 0 ? (
                  <div className="slots-msg">No times available on this day.</div>
                ) : (
                  <div className="time-slots-grid">
                    {slots.map((t) => (
                      <button
                        key={t.time}
                        type="button"
                        disabled={!t.available || locked}
                        className={`time-slot-btn ${selectedTime === t.time ? "active" : ""} ${!t.available ? "booked" : ""}`}
                        onClick={() => setSelectedTime(t.time)}
                      >
                        {t.time}
                      </button>
                    ))}
                  </div>
                )
              )}
            </div>

            <div className="booking-section-card">
              <h3 className="section-step-title"><span className="step-num">Step 03</span> Your Details</h3>
              <div className="form-grid">
                <div className="form-group">
                  <label>First &amp; Last Name</label>
                  <input type="text" name="name" placeholder="Sarah Jenkins" value={details.name} onChange={handleInputChange} disabled={locked} />
                </div>
                <div className="form-group">
                  <label>Phone Number</label>
                  <input type="tel" name="phone" placeholder="847-571-1910" value={details.phone} onChange={handleInputChange} disabled={locked} />
                </div>
                <div className="form-group full">
                  <label>Email Address</label>
                  <input type="email" name="email" placeholder="sarah@example.com" value={details.email} onChange={handleInputChange} disabled={locked} />
                </div>
                <div className="form-group full">
                  <label>Additional Notes (Optional)</label>
                  <textarea rows="3" name="notes" placeholder="Allergies or special requests…" value={details.notes} onChange={handleInputChange} disabled={locked} />
                </div>
              </div>
            </div>
          </div>

          <div className="booking-right">
            <div className="summary-card-sticky">
              <h3 className="summary-card-title">Summary</h3>

              <div className="summary-row"><span className="summary-label">Treatment</span><span className="summary-val">{service?.name || "—"}</span></div>
              <div className="summary-row"><span className="summary-label">Duration</span><span className="summary-val">{service ? `${service.duration} mins` : "—"}</span></div>
              <div className="summary-row"><span className="summary-label">Date</span><span className="summary-val">{selectedDate || "—"}</span></div>
              <div className="summary-row"><span className="summary-label">Time</span><span className="summary-val">{isSunday ? "—" : selectedTime || "—"}</span></div>
              <div className="summary-row"><span className="summary-label">Location</span><span className="summary-val">In-person, Evanston</span></div>

              <div className="summary-divider" />

              <div className="summary-total-row">
                <span className="total-label">Total</span>
                <span className="total-price">{service ? `$${service.price}` : "—"}</span>
              </div>
              {withPayment && service && (
                <div className="deposit-row"><span>Deposit due now</span><b>${deposit}</b></div>
              )}

              {bookingError && <div className="booking-error">{bookingError}</div>}

              {!pay ? (
                <button className="btn-confirm-booking" onClick={handleConfirm} disabled={isSunday || isLoading || !service}>
                  {isLoading
                    ? "Please wait…"
                    : isSunday
                    ? "Select Valid Date"
                    : withPayment
                    ? `Proceed to $${deposit} Deposit`
                    : "Complete Booking"}
                </button>
              ) : (
                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret: pay?.clientSecret || clientSecret,
                    appearance: { theme: 'stripe' },
                  }}
                >
                  <CheckoutForm
                    clientSecret={pay?.clientSecret || clientSecret}
                    onPaymentSuccess={finishBooking}
                  />
                </Elements>
              )}

              {withPayment && (
                <p className="policy-note">
                  The deposit holds your time and counts toward your total. Cancel at least 24 hours before to have it refunded.
                </p>
              )}

              <div className="spa-info-box">
                <b>Kaya Holistic Spa</b><br />
                1567 Sherman Avenue<br />
                Evanston, IL 60201<br /><br />
                By Appointment Only<br />
                847-571-1910
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}