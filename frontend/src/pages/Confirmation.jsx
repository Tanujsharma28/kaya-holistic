import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { getBookingBySession } from "../api/client";

export default function Confirmation() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");

  // Stripe se wapas aane par sirf session_id milta hai — asli booking
  // confirmation webhook se thodi der baad hoti hai, isliye thoda poll karna
  // padta hai jab tak status 'confirmed' na ho jaaye.
  const [fetched, setFetched] = useState(null);
  const [status, setStatus] = useState(state?.booking ? "ready" : sessionId ? "polling" : "none");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (!sessionId || state?.booking) return;
    let cancelled = false;
    let attempts = 0;
    const MAX_ATTEMPTS = 10; // ~20 seconds total

    const poll = async () => {
      attempts += 1;
      try {
        const res = await getBookingBySession(sessionId);
        if (cancelled) return;
        if (res.data.status === "confirmed") {
          setFetched({ booking: res.data, service: res.service });
          setStatus("ready");
          return;
        }
        if (res.data.status === "cancelled") {
          setErrorMsg("This payment could not be completed, so the slot was released. Please try booking again.");
          setStatus("error");
          return;
        }
        if (attempts < MAX_ATTEMPTS) setTimeout(poll, 2000);
        else {
          setErrorMsg("Your payment is taking longer than usual to confirm. If money was deducted, check your email in a few minutes or call us.");
          setStatus("error");
        }
      } catch (err) {
        if (cancelled) return;
        if (attempts < MAX_ATTEMPTS) setTimeout(poll, 2000);
        else {
          setErrorMsg(err?.response?.data?.message || "Could not confirm your booking. If money was deducted, please call us.");
          setStatus("error");
        }
      }
    };
    poll();
    return () => { cancelled = true; };
  }, [sessionId, state]);

  if (status === "polling") {
    return (
      <div className="view cf-wrap">
        <style>{CF_CSS}</style>
        <div className="cf-container">
          <div className="cf-spinner" />
          <h1>Confirming your payment…</h1>
          <p className="cf-sub">This takes just a few seconds — please don't close this page.</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="view cf-wrap">
        <style>{CF_CSS}</style>
        <div className="cf-container">
          <h1>We hit a snag</h1>
          <p className="cf-sub">{errorMsg}</p>
          <div className="cf-actions">
            <button className="cf-btn" onClick={() => navigate("/online-consultation")}>Back to booking</button>
          </div>
        </div>
      </div>
    );
  }

  const bookingData = state?.booking || fetched?.booking;
  const serviceData = state?.service || fetched?.service;

  if (!bookingData) {
    return (
      <div className="view cf-wrap">
        <style>{CF_CSS}</style>
        <div className="cf-container">
          <h1>No booking found</h1>
          <p className="cf-sub">Please make a booking first.</p>
          <div className="cf-actions">
            <button className="cf-btn" onClick={() => navigate("/")}>Back to home</button>
          </div>
        </div>
      </div>
    );
  }

  const booking = bookingData;
  const service = serviceData;
  const isOnline = booking.mode === "online";
  const prettyDate = new Date(booking.date + "T12:00:00").toLocaleDateString("en-US", {
    weekday: "long", year: "numeric", month: "long", day: "numeric",
  });

  return (
    <div className="view cf-wrap">
      <style>{CF_CSS}</style>
      <div className="cf-container">
        <div className="cf-check">✓</div>
        <h1>You're booked, {booking.name}!</h1>
        <p className="cf-sub">A confirmation email is on its way to <b>{booking.email}</b>.</p>

        <div className="cf-card">
          <div className="cf-row"><span>Service</span><b>{service?.name || booking.serviceName}</b></div>
          <div className="cf-row"><span>Date</span><b>{prettyDate}</b></div>
          <div className="cf-row"><span>Time</span><b>{booking.slot} (Central Time)</b></div>
          <div className="cf-row">
            <span>{isOnline ? "Format" : "Location"}</span>
            <b>{isOnline ? "Video call on Google Meet" : "1567 Sherman Ave, Evanston"}</b>
          </div>
        </div>

        {isOnline && (
          <div className="cf-next">
            <h3>One more step</h3>
            <p>Tell Puja about your skin (2 minutes) so she can prepare for your session.</p>
            <button className="cf-btn" onClick={() => navigate(`/consultation?booking=${booking.id}`)}>
              Tell Puja about your skin →
            </button>
          </div>
        )}

        {!isOnline && (
          <div className="cf-next">
            <h3>Before your visit</h3>
            <p>Please complete your Facial Consent Form (takes about 2 minutes).</p>
            <button className="cf-btn" onClick={() => navigate(`/consent?booking=${booking.id}`)}>
              Fill Consent Form →
            </button>
          </div>
        )}

        <div className="cf-actions">
          {isOnline && booking.meetLink && (
            <a className="cf-btn dark" href={booking.meetLink} target="_blank" rel="noreferrer">Open Google Meet link</a>
          )}
          <button className="cf-btn ghost" onClick={() => navigate("/")}>Back to home</button>
        </div>
      </div>
    </div>
  );
}

const CF_CSS = `
.cf-wrap { min-height: 100vh; background: #FAF7F2; padding: 130px 20px 80px; display: flex; justify-content: center; font-family: "DM Sans", system-ui, sans-serif; color: #2B2016; }
.cf-container { width: 100%; max-width: 520px; text-align: center; }
.cf-check { width: 64px; height: 64px; margin: 0 auto 20px; border-radius: 50%; background: #F1E8DA; color: #7C5C38; display: flex; align-items: center; justify-content: center; font-size: 1.9rem; font-weight: 700; }
.cf-spinner { width: 44px; height: 44px; margin: 0 auto 24px; border-radius: 50%; border: 4px solid #E6DDD0; border-top-color: #A67C52; animation: cf-spin 0.8s linear infinite; }
@keyframes cf-spin { to { transform: rotate(360deg); } }
.cf-container h1 { font-family: Fraunces, Georgia, serif; font-size: 2rem; font-weight: 400; color: #241A13; margin: 0 0 10px; line-height: 1.2; }
.cf-sub { color: #6A5E52; font-size: 0.95rem; line-height: 1.6; margin: 0 0 26px; }
.cf-card { background: #fff; border: 1px solid #E6DDD0; border-radius: 20px; padding: 8px 24px; text-align: left; box-shadow: 0 20px 48px -20px rgba(36,26,19,0.1); }
.cf-row { display: flex; justify-content: space-between; align-items: center; gap: 16px; padding: 14px 0; border-bottom: 1px solid #EEE3D3; font-size: 0.92rem; }
.cf-row:last-child { border-bottom: none; }
.cf-row span { color: #8A7D6E; }
.cf-row b { color: #2B2016; text-align: right; }
.cf-next { background: #FBF3E7; border: 1px solid #E6D3B3; border-radius: 18px; padding: 22px 20px; margin: 24px 0 8px; }
.cf-next h3 { font-family: Fraunces, Georgia, serif; font-size: 1.15rem; margin: 0 0 6px; color: #241A13; }
.cf-next p { color: #5C4F41; font-size: 0.9rem; line-height: 1.6; margin: 0 0 16px; }
.cf-actions { display: flex; flex-direction: column; align-items: center; gap: 12px; margin-top: 20px; }
.cf-btn { display: inline-flex; align-items: center; justify-content: center; padding: 13px 28px; border-radius: 99px; background: #A67C52; color: #fff; border: 1.5px solid #A67C52; font-family: inherit; font-weight: 600; font-size: 0.93rem; cursor: pointer; text-decoration: none; }
.cf-btn.dark { background: #241A13; border-color: #241A13; }
.cf-btn.ghost { background: transparent; color: #7C5C38; }
`;