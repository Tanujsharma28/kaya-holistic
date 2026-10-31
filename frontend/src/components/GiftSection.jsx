import { useState } from "react";
import { useNavigate } from "react-router-dom";
import GiftCertificate from "./GiftCertificate";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,300;1,9..144,400&family=DM+Sans:wght@300;400;500;600&display=swap');

.gs-wrap {
  position: relative;
  border-radius: 22px;
  overflow: hidden;
  background: #fff;
  margin: 28px 0;
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  box-shadow: 0 10px 40px rgba(30,30,20,0.08);
  border: 1px solid #ece3d6;
}
@media (max-width: 860px) {
  .gs-wrap { grid-template-columns: 1fr; border-radius: 16px; margin: 12px 0; }
  .gs-cert { padding: 14px !important; }
  .gs-body { padding: 18px 16px 22px; }
  .gs-cards { gap: 8px; }
  .gs-card { flex: 1 1 calc(50% - 4px); min-width: 110px; }
  .gs-actions { flex-direction: column; align-items: flex-start; gap: 12px; }
  .gs-cta { width: 100%; justify-content: center; }
}
@media (max-width: 380px) {
  .gs-body { padding: 14px 12px 18px; }
  .gs-card-amount { font-size: 1.4rem; }
}

/* ── Certificate side ── */
.gs-cert {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: clamp(16px, 2.4vw, 30px);
  background: #faf7f2;
}
.gs-cert-inner { width: 100%; max-width: 640px; }
.gs-cert-inner .gc { transition: transform .35s ease; }
.gs-cert-inner:hover .gc { transform: translateY(-3px); }

/* ── Content side ── */
.gs-body {
  padding: clamp(26px, 3.2vw, 44px);
  display: flex;
  flex-direction: column;
  justify-content: center;
}
.gs-eyebrow {
  font-family: 'DM Sans', sans-serif;
  font-size: .82rem;
  font-weight: 500;
  font-style: italic;
  color: #a67c42;
  margin: 0 0 10px;
}
.gs-title {
  font-family: 'Fraunces', Georgia, serif;
  font-size: clamp(1.5rem, 2.4vw, 2rem);
  font-weight: 400;
  color: #1a1a16;
  line-height: 1.2;
  margin: 0 0 10px;
}
.gs-title em { font-style: italic; color: #1f3321; }
.gs-sub {
  font-family: 'DM Sans', sans-serif;
  font-size: .94rem;
  color: #6b6358;
  line-height: 1.6;
  max-width: 440px;
  margin: 0 0 20px;
}
.gs-hint {
  font-family: 'DM Sans', sans-serif;
  font-size: .76rem;
  color: #8a8275;
  margin: 0 0 8px;
}

/* ── Amount cards ── */
.gs-cards { display: flex; gap: 12px; margin-bottom: 24px; flex-wrap: wrap; }
.gs-card {
  flex: 1;
  min-width: 140px;
  background: #f7f4ee;
  border: 1.5px solid transparent;
  border-radius: 14px;
  padding: 16px 18px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  color: inherit;
  transition: all 0.2s ease;
}
.gs-card:hover {
  border-color: #c89b5c;
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(30,30,20,0.12);
}
.gs-card.active { background: #1f3321; border-color: #1f3321; }
.gs-card-amount {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 1.7rem;
  font-weight: 500;
  color: #1a1a16;
  line-height: 1;
  margin-bottom: 4px;
}
.gs-card.active .gs-card-amount { color: #fff; }
.gs-card-label { font-family: 'DM Sans', sans-serif; font-size: .76rem; color: #8a8275; }
.gs-card.active .gs-card-label { color: rgba(255,255,255,0.65); }
.gs-card-tag {
  display: inline-block;
  margin-top: 9px;
  font-size: .64rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  color: #a67c42;
  background: #f0e4cc;
  border-radius: 99px;
  padding: 3px 9px;
}
.gs-card.active .gs-card-tag { color: #1f3321; background: #d9c89a; }

/* ── Actions ── */
.gs-actions { display: flex; align-items: center; gap: 20px; flex-wrap: wrap; }
.gs-cta {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  background: #1f3321;
  color: #fff;
  border: none;
  border-radius: 99px;
  padding: 13px 26px;
  font-family: 'DM Sans', sans-serif;
  font-size: .88rem;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: .2px;
  transition: all .2s ease;
}
.gs-cta:hover { background: #142316; transform: translateY(-1px); }
.gs-cta svg { transition: transform .2s; }
.gs-cta:hover svg { transform: translateX(3px); }
.gs-trust {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 16px;
  font-family: 'DM Sans', sans-serif;
  font-size: .76rem;
  color: #8a8275;
}
.gs-pill { display: flex; align-items: center; gap: 5px; }
.gs-pill::before { content: '✓'; color: #a67c42; font-weight: 700; }
`;

const OPTIONS = [
  { amount: 100, tag: "Classic" },
  { amount: 150, tag: "Most Popular" },
];

export default function GiftSection() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState(150);

  return (
    <section id="gift-cards" aria-label="Gift Cards">
      <style>{CSS}</style>
      <div className="gs-wrap">

        <div className="gs-cert">
          <div className="gs-cert-inner">
            <GiftCertificate amount={amount} />
          </div>
        </div>

        <div className="gs-body">
          <p className="gs-eyebrow">A little something for someone you love ✦</p>
          <h2 className="gs-title">
            Give the gift of <em>radiant skin</em>
          </h2>
          <p className="gs-sub">
            Delivered to any inbox within minutes. Redeemable on any facial,
            treatment, or consultation — valid for 6 months.
          </p>

          <p className="gs-hint">Tap an amount to preview</p>
          <div className="gs-cards">
            {OPTIONS.map((o) => (
              <button
                key={o.amount}
                type="button"
                className={`gs-card${amount === o.amount ? " active" : ""}`}
                onClick={() => setAmount(o.amount)}
                aria-pressed={amount === o.amount}
                aria-label={`Preview a $${o.amount} gift card`}
              >
                <div className="gs-card-amount">${o.amount}</div>
                <div className="gs-card-label">Gift Card</div>
                <span className="gs-card-tag">{o.tag}</span>
              </button>
            ))}
          </div>

          <div className="gs-actions">
            <button className="gs-cta" onClick={() => navigate(`/gift-cards?amount=${amount}`)}>
              Buy a ${amount} gift card
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <div className="gs-trust">
              <span className="gs-pill">Instant delivery</span>
              <span className="gs-pill">Valid 6 months</span>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}