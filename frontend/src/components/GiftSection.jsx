import { useNavigate } from "react-router-dom";

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;1,9..144,300;1,9..144,400&family=DM+Sans:wght@300;400;500;600&display=swap');

.gs-wrap {
  position: relative;
  border-radius: 28px;
  overflow: hidden;
  background: #1a110a;
  margin: 10px 0;
  padding: 0;
}

/* ── Background photo strip ── */
.gs-photos {
  display: flex;
  height: 320px;
  overflow: hidden;
  position: relative;
}
.gs-photos::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    to bottom,
    rgba(26,17,10,0.15) 0%,
    rgba(26,17,10,0.55) 60%,
    rgba(26,17,10,0.92) 100%
  );
  z-index: 1;
}
.gs-photo {
  flex: 1;
  min-width: 0;
  overflow: hidden;
}
.gs-photo img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
  display: block;
  filter: saturate(0.85) brightness(0.9);
  transition: transform 0.6s ease;
}
.gs-photo img:hover { transform: scale(1.04); }

/* ── Content over photos ── */
.gs-body {
  position: relative;
  z-index: 2;
  padding: clamp(28px, 4vw, 52px) clamp(24px, 4vw, 52px);
  margin-top: -80px;
}

.gs-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: 'DM Sans', sans-serif;
  font-size: .72rem;
  font-weight: 700;
  letter-spacing: 2.5px;
  text-transform: uppercase;
  color: #c89b5c;
  margin-bottom: 14px;
}
.gs-eyebrow::before {
  content: '';
  display: inline-block;
  width: 22px;
  height: 1px;
  background: #c89b5c;
}

.gs-title {
  font-family: 'Fraunces', Georgia, serif;
  font-size: clamp(1.9rem, 4vw, 2.8rem);
  font-weight: 300;
  color: #fff;
  line-height: 1.18;
  margin: 0 0 12px;
}
.gs-title em { font-style: italic; color: #e8c98a; }

.gs-sub {
  font-family: 'DM Sans', sans-serif;
  font-size: 1rem;
  color: rgba(255,255,255,0.7);
  line-height: 1.65;
  max-width: 560px;
  margin: 0 0 32px;
}

/* ── Cards row ── */
.gs-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  max-width: 560px;
  margin-bottom: 32px;
}
@media (max-width: 520px) { .gs-cards { grid-template-columns: 1fr; } }

.gs-card {
  background: rgba(255,255,255,0.06);
  border: 1.5px solid rgba(200,155,92,0.35);
  border-radius: 18px;
  padding: 22px 20px;
  cursor: pointer;
  text-align: left;
  font-family: inherit;
  color: inherit;
  transition: all 0.25s ease;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  position: relative;
  overflow: hidden;
}
.gs-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(200,155,92,0.1) 0%, transparent 60%);
  opacity: 0;
  transition: opacity 0.25s;
}
.gs-card:hover {
  background: rgba(255,255,255,0.1);
  border-color: rgba(200,155,92,0.7);
  transform: translateY(-3px);
  box-shadow: 0 16px 40px rgba(0,0,0,0.35);
}
.gs-card:hover::before { opacity: 1; }

.gs-card-amount {
  font-family: 'Fraunces', Georgia, serif;
  font-size: 2.2rem;
  font-weight: 300;
  color: #e8c98a;
  line-height: 1;
  margin-bottom: 6px;
}
.gs-card-label {
  font-family: 'DM Sans', sans-serif;
  font-size: .82rem;
  color: rgba(255,255,255,0.6);
  letter-spacing: .5px;
}
.gs-card-tag {
  display: inline-block;
  margin-top: 10px;
  font-size: .7rem;
  font-weight: 700;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #c89b5c;
  background: rgba(200,155,92,0.15);
  border: 1px solid rgba(200,155,92,0.3);
  border-radius: 99px;
  padding: 3px 10px;
}

/* ── CTA button ── */
.gs-cta {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  background: #a67c52;
  color: #fff;
  border: none;
  border-radius: 99px;
  padding: 14px 30px;
  font-family: 'DM Sans', sans-serif;
  font-size: .92rem;
  font-weight: 600;
  cursor: pointer;
  letter-spacing: .3px;
  transition: all .25s ease;
  box-shadow: 0 6px 24px rgba(166,124,82,0.35);
}
.gs-cta:hover {
  background: #7c5c38;
  transform: translateY(-2px);
  box-shadow: 0 10px 30px rgba(124,92,56,0.45);
}
.gs-cta svg { transition: transform .2s; }
.gs-cta:hover svg { transform: translateX(4px); }

/* ── Trust pills ── */
.gs-trust {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}
.gs-pill {
  font-family: 'DM Sans', sans-serif;
  font-size: .78rem;
  color: rgba(255,255,255,0.55);
  display: flex;
  align-items: center;
  gap: 6px;
}
.gs-pill::before {
  content: '✓';
  color: #c89b5c;
  font-weight: 700;
}

@media (max-width: 640px) {
  .gs-photos { height: 200px; }
  .gs-body { margin-top: -50px; }
}
`;

export default function GiftSection() {
  const navigate = useNavigate();

  const PHOTOS = ["/gift/g1.jpg", "/gift/g2.jpg", "/gift/g3.jpg"];

  return (
    <section id="gift-cards" aria-label="Gift Cards">
      <style>{CSS}</style>
      <div className="gs-wrap">

        {/* Photo strip */}
        <div className="gs-photos" aria-hidden="true">
          {PHOTOS.map((src, i) => (
            <div className="gs-photo" key={i}>
              <img src={src} alt="" loading="lazy" />
            </div>
          ))}
        </div>

        {/* Content */}
        <div className="gs-body">
          <div className="gs-eyebrow">Gift Cards</div>
          <h2 className="gs-title">
            Give the gift of <em>radiant skin</em>
          </h2>
          <p className="gs-sub">
            A Kaya Holistic Spa gift card is delivered to any inbox within minutes.
            Choose any amount — redeemable on any facial, treatment, or consultation. Valid 6 months.
          </p>

          <div className="gs-cards">
            {[
              { amount: 100, tag: "Classic" },
              { amount: 150, tag: "Most Popular" },
            ].map(({ amount, tag }) => (
              <button
                key={amount}
                className="gs-card"
                onClick={() => navigate(`/gift-cards?amount=${amount}`)}
                aria-label={`Buy a $${amount} gift card`}
              >
                <div className="gs-card-amount">${amount}</div>
                <div className="gs-card-label">Gift Card</div>
                <span className="gs-card-tag">{tag}</span>
              </button>
            ))}
          </div>

          <button className="gs-cta" onClick={() => navigate("/gift-cards")}>
            Buy a gift card
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>

          <div className="gs-trust">
            <span className="gs-pill">Instant email delivery</span>
            <span className="gs-pill">Valid 6 months</span>
            <span className="gs-pill">Any service, any visit</span>
            <span className="gs-pill">Secure checkout</span>
          </div>
        </div>

      </div>
    </section>
  );
}