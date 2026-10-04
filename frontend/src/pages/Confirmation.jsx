import { useLocation, useNavigate } from "react-router-dom";

export default function Confirmation() {
  const { state } = useLocation();
  const navigate = useNavigate();

  if (!state?.booking) {
    return (
      <div className="view">
        <p>No booking found.</p>
        <button className="btn" onClick={() => navigate("/booking")}>Go to booking</button>
      </div>
    );
  }

  const { booking, service } = state;

  return (
    <div className="view" style={{ textAlign: "center" }}>
      <div className="confirm-check">✓</div>
      <h2>You're booked, {booking.name}!</h2>
      <p className="muted">A confirmation email is on its way to {booking.email}.</p>

      <div className="summary-card" style={{ maxWidth: 420, margin: "24px auto", textAlign: "left" }}>
        <div className="row"><span>Service</span><b>{service?.name || booking.serviceName}</b></div>
        <div className="row"><span>Date</span><b>{booking.date}</b></div>
        <div className="row"><span>Time</span><b>{booking.slot}</b></div>
        <div className="row"><span>Location</span><b>1567 Sherman Ave, Evanston</b></div>
      </div>

      <button className="btn ghost" onClick={() => navigate("/")}>Back to home</button>
    </div>
  );
}