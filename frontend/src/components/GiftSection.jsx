import { useNavigate } from "react-router-dom";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,500;1,9..144,300;1,9..144,400&family=DM+Sans:wght@300;400;500;600&display=swap');

.gs-wrap {
  position: relative;
  border-radius: 22px;
  overflow: hidden;
  background: #fff;
  margin: 28px 0;
  display: grid;
  grid-template-columns: 0.85fr 1.15fr;
  box-shadow: 0 10px 40px rgba(30,30,20,0.08);
  border: 1px solid #ece3d6;
}
@media (max-width: 760px) {
  .gs-wrap { grid-template-columns: 1fr; border-radius: 16px; margin: 12px 0; }
  .gs-media { min-height: 220px !important; }
  .gs-body { padding: 18px 16px 22px; }
  .gs-cards { gap: 8px; }
  .gs-card { flex: 1 1 calc(50% - 4px); min-width: 110px; }
  .gs-actions { flex-direction: column; align-items: flex-start; gap: 12px; }
  .gs-cta { width: 100%; justify-content: center; }
}
@media (max-width: 480px) {
  .gs-media { min-height: 180px !important; }
  .gs-card { flex: 1 1 100%; }
  .gs-media-tag { font-size: .6rem; padding: 5px 10px; }
  .gs-title { font-size: 1.3rem; }
}
@media (max-width: 380px) {
  .gs-media { min-height: 160px !important; }
  .gs-body { padding: 14px 12px 18px; }
  .gs-card-amount { font-size: 1.4rem; }
}

/* ── Image side ── */
.gs-media {
  position: relative;
  min-height: 420px;
  overflow: hidden;
}
@media (max-width: 760px) { .gs-media { min-height: 260px; } }

.gs-media img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center center;
  display: block;
  position: absolute;
  inset: 0;
}
.gs-media::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(0,0,0,0) 60%,
    rgba(0,0,0,0.08) 100%
  );
}
.gs-media-tag {
  position: absolute;
  top: 20px;
  left: 20px;
  z-index: 2;
  font-family: 'DM Sans', sans-serif;
  font-size: .68rem;
  font-weight: 700;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: #1f3321;
  background: rgba(255,255,255,0.92);
  padding: 7px 14px;
  border-radius: 99px;
}

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
  margin: 0 0 24px;
}

/* ── Cards row ── */
.gs-cards {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

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
  position: relative;
}
.gs-card.featured {
  background: #1f3321;
  border-color: #1f3321;
}
.gs-card:hover {
  border-color: #c89b5c;
  transform: translateY(-2px);
  box-shadow: 0 10px 24px rgba(30,30,20,0.12);
}

.gs-card-amount {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 1.7rem;
  font-weight: 500;
  color: #1a1a16;
  line-height: 1;
  margin-bottom: 4px;
}
.gs-card.featured .gs-card-amount { color: #fff; }

.gs-card-label {
  font-family: 'DM Sans', sans-serif;
  font-size: .76rem;
  color: #8a8275;
}
.gs-card.featured .gs-card-label { color: rgba(255,255,255,0.65); }

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
.gs-card.featured .gs-card-tag {
  color: #1f3321;
  background: #d9c89a;
}

/* ── Actions row ── */
.gs-actions {
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
}

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
.gs-cta:hover {
  background: #142316;
  transform: translateY(-1px);
}
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

export default function GiftSection() {
  const navigate = useNavigate();

  return (
    <section id="gift-cards" aria-label="Gift Cards">
      <style>{CSS}</style>
      <div className="gs-wrap">

        <div className="gs-media">
          <img src="/gift/g1.jpg" alt="" loading="lazy" />
          <span className="gs-media-tag">Gift Cards</span>
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

          <div className="gs-cards">
            {[
              { amount: 100, tag: "Classic", featured: false },
              { amount: 150, tag: "Most Popular", featured: true },
            ].map(({ amount, tag, featured }) => (
              <button
                key={amount}
                className={`gs-card${featured ? " featured" : ""}`}
                onClick={() => navigate(`/gift-cards?amount=${amount}`)}
                aria-label={`Buy a $${amount} gift card`}
              >
                <div className="gs-card-amount">${amount}</div>
                <div className="gs-card-label">Gift Card</div>
                <span className="gs-card-tag">{tag}</span>
              </button>
            ))}
          </div>

          <div className="gs-actions">
            <button className="gs-cta" onClick={() => navigate("/gift-cards")}>
              Buy a gift card
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