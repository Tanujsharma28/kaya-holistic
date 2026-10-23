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
      <div className="footer-grid">
        <div>
          <div className="brand-name">Kaya Holistic Spa</div>
          <p>1567 Sherman Avenue<br />Evanston, IL 60201</p>
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
          <h4>Clients</h4>
          <p><a href="/consent">Facial Consent Form</a></p>
          <h4 style={{ marginTop: 14 }}>Follow</h4>
          <p>Instagram · Facebook<br /><span className="muted">© 2026 Kaya Holistic Spa</span></p>
        </div>
      </div>
    </footer>
  );
}