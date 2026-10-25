import { STAFF_PROFILES } from "../data/staff";
import useStaffSchedule from "../hooks/useStaffSchedule";

export default function StaffCards({ title = "", sub = "" }) {
  const sched = useStaffSchedule();

  return (
    <section>
      {(title || sub) && (
        <div style={{ textAlign: "center", marginBottom: 6 }}>
          {title && <h2 style={{ fontFamily: "Fraunces, Georgia, serif", fontWeight: 400, margin: "0 0 4px" }}>{title}</h2>}
          {sub && <p style={{ color: "#7a6a58", margin: 0 }}>{sub}</p>}
        </div>
      )}

      {Object.entries(STAFF_PROFILES).map(([name, p]) => {
        const lines = sched?.[name] || [];
        return (
          <div className="about-strip" key={name} style={{ margin: "18px 0" }}>
            <div className="about-avatar">{name[0]}</div>
            <div style={{ position: "relative", zIndex: 1 }}>
              <h3>{p.fullName || name}, {p.role}</h3>
              <p>{p.bio}</p>
              <div className="about-badges">
                {p.experience && <span className="badge">{p.experience}</span>}
                {p.specialties.map((x) => <span className="badge" key={x}>{x}</span>)}
                <span className="badge">1567 Sherman Ave, Evanston</span>
              </div>
              <div className="about-badges">
                {sched === null
                  ? <span className="badge">Loading availability…</span>
                  : lines.length
                    ? lines.map((l) => <span className="badge" key={l}>🕒 In the studio {l}</span>)
                    : <span className="badge">🕒 Check the booking calendar for times</span>}
              </div>
            </div>
          </div>
        );
      })}
    </section>
  );
}