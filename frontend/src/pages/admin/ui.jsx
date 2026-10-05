const LABEL = { confirmed: "Confirmed", Approved: "Confirmed", approved: "Confirmed", completed: "Completed", cancelled: "Cancelled", "no-show": "No-show" };

export const StatusBadge = ({ status = "" }) => {
  const norm = String(status).toLowerCase();
  const cls = norm === "approved" ? "confirmed" : norm;
  return <span className={`adm-badge s-${cls}`}>{LABEL[status] || LABEL[norm] || status}</span>;
};

export const TypePill = ({ type }) => (
  <span className="adm-pill">{type === "consultation" ? "Consultation" : "Visit"}</span>
);