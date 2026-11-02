import { useEffect, useState } from "react";
import { getHours } from "../api/client";

const FALLBACK = { lines: ["Mon–Sat: 10AM–6PM", "Sunday: Closed"], closures: [] };

export default function Footer() {
  const [hours, setHours] = useState(FALLBACK);

  useEffect(() => {
    let on = true;
    getHours()
      .then((h) => { if (on && h?.lines?.length) setHours(h); })
      .catch(() => {});
    return () => { on = false; };
  }, []);

  return (
    <footer className="footer">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@600;700&display=swap');

        /* ─── Footer full logo pill ─── */
        .footer-logo-wrap {
          display: inline-block;
          margin-bottom: 14px;
        }

        /* Pill/rounded-rect — wide enough to show full logo with text */
        .footer-logo-pill {
          width: 160px;
          height: 80px;
          border-radius: 16px;
          background: #0e0b04;
          border: 1.5px solid #c9a227;
          box-shadow:
            0 0 0 1px rgba(212,175,55,0.12),
            0 6px 28px rgba(180,135,20,0.32),
            0 2px 8px rgba(0,0,0,0.28),
            inset 0 1px 0 rgba(255,220,80,0.06);
          overflow: hidden;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.32s ease;
          cursor: default;
        }

        .footer-logo-pill:hover {
          border-color: #d4af37;
          box-shadow:
            0 0 0 2px rgba(212,175,55,0.28),
            0 8px 36px rgba(180,135,20,0.48),
            0 2px 8px rgba(0,0,0,0.28);
          transform: translateY(-2px);
        }

        /* Full logo image — both lotus + text visible */
        .footer-logo-img {
          width: 88%;
          height: 88%;
          object-fit: contain;
          object-position: center center;
          filter: drop-shadow(0 0 3px rgba(212,175,55,0.35));
          transition: filter 0.3s ease;
        }

        .footer-logo-pill:hover .footer-logo-img {
          filter: drop-shadow(0 0 7px rgba(255,210,60,0.7));
        }

        /* ─── Footer brand name below logo ─── */
        .footer-brand-name-styled {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 0.78rem;
          font-weight: 600;
          color: rgba(212,175,55,0.6);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 10px;
          display: block;
        }

        /* ─── Thin gold divider ─── */
        .footer-gold-divider {
          width: 44px;
          height: 1px;
          background: linear-gradient(90deg, #c9a227, rgba(212,175,55,0.15));
          border-radius: 2px;
          margin-bottom: 12px;
        }
      `}</style>

      <div className="footer-grid">
        <div>
          {/* Full-logo pill: shows lotus + "Kaya Holistic Spa" text */}
          <div className="footer-logo-wrap">
            <div className="footer-logo-pill">
              <img
                src="/logo.png"
                alt="Kaya Holistic Spa"
                className="footer-logo-img"
              />
            </div>
          </div>

          <span className="footer-brand-name-styled">Evanston, Illinois</span>
          <div className="footer-gold-divider" />

          <p style={{ margin: 0, lineHeight: 1.75 }}>
            1567 Sherman Avenue<br />Evanston, IL 60201
          </p>
        </div>

        <div>
          <h4>Contact</h4>
          <p>
            📞 <a href="tel:8475711910">847-571-1910</a><br />
            ✉️ <a href="mailto:kayaholisticspa@gmail.com">kayaholisticspa@gmail.com</a>
          </p>
        </div>

        <div>
          <h4>Hours</h4>
          <p>
            {hours.lines.map((l) => (<span key={l}>{l}<br /></span>))}
            By appointments only
          </p>
          {hours.closures?.length > 0 && (
            <p className="muted" style={{ marginTop: 8 }}>
              Closed: {hours.closures.map((c) => c.label).join(" · ")}
            </p>
          )}
        </div>

        <div>
          <h4>Follow</h4>
          <p>Instagram · Facebook<br /><span className="muted">© 2026 Kaya Holistic Spa</span></p>
        </div>
      </div>
    </footer>
  );
}