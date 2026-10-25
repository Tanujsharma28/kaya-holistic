import { STAFF_PROFILES } from "../data/staff";
import useStaffSchedule from "../hooks/useStaffSchedule";

export default function StaffProfileCard({ name, eyebrow = "", compact = false }) {
  const sched = useStaffSchedule();
  const p = STAFF_PROFILES[name];
  if (!p) return null;
  const lines = sched?.[name] || [];

  return (
    <div className="spc">
      <style>{SPC_CSS}</style>
      {eyebrow && <div className="spc-eyebrow">{eyebrow}</div>}
      <div className="spc-head">
        <div className="spc-avatar">{name[0]}</div>
        <div>
          <div className="spc-name">{p.fullName || name}</div>
          <div className="spc-role">{p.role}</div>
        </div>
      </div>

      {!compact && p.bio && <p className="spc-bio">{p.bio}</p>}

      <div className="spc-chips">
        {p.experience && <span className="spc-chip strong">{p.experience}</span>}
        {p.specialties.map((x) => <span className="spc-chip" key={x}>{x}</span>)}
      </div>

      <div className="spc-when">
        {sched === null
          ? <span>Loading availability…</span>
          : lines.length
            ? lines.map((l) => <span key={l}>🕒 In the studio {l}</span>)
            : <span>🕒 Check the booking calendar for times</span>}
      </div>
    </div>
  );
}

const SPC_CSS = `
.spc { background: #fff; border: 1px solid #E6DDD0; border-radius: 18px; padding: 18px 20px; margin: 16px 0 0; text-align: left; box-shadow: 0 16px 40px -22px rgba(36,26,19,0.18); }
.spc-eyebrow { font-size: .7rem; letter-spacing: 2px; text-transform: uppercase; color: #7C5C38; font-weight: 700; margin-bottom: 10px; }
.spc-head { display: flex; align-items: center; gap: 12px; }
.spc-avatar { width: 44px; height: 44px; min-width: 44px; border-radius: 50%; display: grid; place-items: center; background: linear-gradient(145deg, #C89B5C, #A67C52); color: #fff; font: 600 1.15rem Fraunces, Georgia, serif; }
.spc-name { font-family: Fraunces, Georgia, serif; font-size: 1.12rem; color: #241A13; line-height: 1.2; }
.spc-role { font-size: .82rem; color: #8A7D6E; margin-top: 2px; }
.spc-bio { margin: 12px 0 0; font-size: .88rem; line-height: 1.65; color: #5C4F41; }
.spc-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 12px; }
.spc-chip { padding: 4px 11px; border-radius: 99px; background: #F1E8DA; color: #7C5C38; font-size: .76rem; font-weight: 600; }
.spc-chip.strong { background: #A67C52; color: #fff; }
.spc-when { display: flex; flex-direction: column; gap: 4px; margin-top: 12px; padding-top: 12px; border-top: 1px dashed #E6DDD0; font-size: .82rem; color: #5C4F41; }
`;