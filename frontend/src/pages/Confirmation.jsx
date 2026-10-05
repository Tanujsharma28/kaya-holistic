import { useLocation, useNavigate } from "react-router-dom";

export default function Confirmation() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state?.booking) {
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

  const { booking, service } = state;
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