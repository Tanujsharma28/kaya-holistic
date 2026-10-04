const LABEL = { confirmed: "Confirmed", completed: "Completed", cancelled: "Cancelled", "no-show": "No-show" };

export const StatusBadge = ({ status }) => (
  <span className={`adm-badge s-${status}`}>{LABEL[status] || status}</span>
);

export const TypePill = ({ type }) => (
  <span className="adm-pill">{type === "consultation" ? "Consultation" : "Visit"}</span>
);