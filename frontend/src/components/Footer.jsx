export default function Footer() {
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
          <p>Mon–Sat: 10AM–6PM<br />Sunday: Closed<br />By appointments only</p>
        </div>
        <div>
          <h4>Follow</h4>
          <p>Instagram · Facebook<br /><span className="muted">© 2026 Kaya Holistic Spa</span></p>
        </div>
      </div>
    </footer>
  );
}