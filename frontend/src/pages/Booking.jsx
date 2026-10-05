import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Booking = () => {
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const SETMORE_URL = "https://kayaholisticspa.setmore.com";

  return (
    <div className="view booking-page-wrapper">
      <style>{`
        .booking-page-wrapper {
          min-height: 100vh;
          background: #FAF7F2;
          padding: 125px 20px 80px;
          font-family: "DM Sans", system-ui, sans-serif;
          color: #2B2016;
          display: flex;
          justify-content: center;
        }

        .booking-container {
          width: 100%;
          max-width: 1140px;
          margin: 0 auto;
        }

        /* HERO HEADER */
        .booking-hero {
          text-align: center;
          margin-bottom: 36px;
        }

        .booking-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: #F1E8DA;
          color: #7C5C38;
          border-radius: 99px;
          padding: 6px 16px;
          font-size: 0.8rem;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          margin-bottom: 14px;
        }

        .booking-badge-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #A67C52;
          box-shadow: 0 0 0 3px rgba(166, 124, 82, 0.2);
        }

        .booking-title {
          font-family: Fraunces, Georgia, serif;
          font-size: clamp(2.2rem, 4.5vw, 3.4rem);
          font-weight: 400;
          color: #241A13;
          margin: 0 0 12px;
          line-height: 1.15;
          letter-spacing: -0.02em;
        }

        .booking-title .italic-accent {
          font-style: italic;
          color: #7C5C38;
        }

        .booking-subtitle {
          color: #6A5E52;
          max-width: 620px;
          margin: 0 auto 24px;
          font-size: 1.02rem;
          line-height: 1.6;
        }

        /* TRUST BAR */
        .trust-pills {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          flex-wrap: wrap;
          margin-bottom: 10px;
        }

        .trust-pill {
          background: #FFFFFF;
          border: 1px solid #E6DDD0;
          border-radius: 99px;
          padding: 7px 16px;
          font-size: 0.84rem;
          font-weight: 500;
          color: #3A2B1D;
          box-shadow: 0 2px 8px rgba(36, 26, 19, 0.03);
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }

        /* SETMORE IFRAME CARD */
        .iframe-card Shell {
          background: #FFFFFF;
          border-radius: 24px;
          border: 1px solid #E6DDD0;
          box-shadow: 0 20px 48px -12px rgba(36, 26, 19, 0.09);
          overflow: hidden;
          position: relative;
        }

        .iframe-header-bar {
          background: linear-gradient(135deg, #241A13 0%, #3A2B1D 100%);
          color: #FAF7F2;
          padding: 14px 24px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.88rem;
        }

        .iframe-header-left {
          display: flex;
          align-items: center;
          gap: 10px;
          font-weight: 500;
        }

        .iframe-header-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.2);
          padding: 4px 12px;
          border-radius: 99px;
          font-size: 0.75rem;
          color: #F0E2C8;
        }

        .live-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #4ADE80;
          box-shadow: 0 0 8px #4ADE80;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }

        .iframe-wrapper {
          position: relative;
          width: 100%;
          min-height: 800px;
          background: #FFFFFF;
        }

        .iframe-loading-overlay {
          position: absolute;
          inset: 0;
          background: #FFFFFF;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 16px;
          z-index: 10;
          transition: opacity 0.4s ease, visibility 0.4s ease;
        }

        .iframe-loading-overlay.hidden {
          opacity: 0;
          visibility: hidden;
          pointer-events: none;
        }

        .spinner {
          width: 44px;
          height: 44px;
          border: 3px solid #F1E8DA;
          border-top-color: #A67C52;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .loading-text {
          font-size: 0.92rem;
          color: #7C5C38;
          font-weight: 500;
        }

        .setmore-iframe {
          width: 100%;
          height: 840px;
          border: none;
          display: block;
        }

        /* EXTRA INFO SECTION BELOW */
        .booking-info-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 40px;
        }

        .info-card {
          background: #FFFFFF;
          border: 1px solid #E6DDD0;
          border-radius: 20px;
          padding: 24px;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }

        .info-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 28px rgba(36, 26, 19, 0.06);
          border-color: #A67C52;
        }

        .info-icon {
          width: 42px;
          height: 42px;
          border-radius: 12px;
          background: #F1E8DA;
          color: #7C5C38;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.25rem;
          margin-bottom: 14px;
        }

        .info-card h4 {
          font-family: Fraunces, Georgia, serif;
          font-size: 1.1rem;
          color: #241A13;
          margin: 0 0 8px;
        }

        .info-card p {
          font-size: 0.88rem;
          color: #6A5E52;
          line-height: 1.6;
          margin: 0;
        }

        .info-cta-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          margin-top: 14px;
          background: #F1E8DA;
          color: #7C5C38;
          border: none;
          padding: 8px 16px;
          border-radius: 99px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .info-cta-btn:hover {
          background: #A67C52;
          color: #FFFFFF;
        }

        @media (max-width: 768px) {
          .booking-page-wrapper {
            padding: 100px 16px 50px;
          }
          .iframe-header-bar {
            padding: 12px 16px;
            font-size: 0.8rem;
          }
          .setmore-iframe {
            height: 780px;
          }
        }
      `}</style>

      <div className="booking-container">
        {/* HERO SECTION */}
        <div className="booking-hero">
          <div className="booking-badge">
            <span className="booking-badge-dot" />
            Online Reservation Portal
          </div>
          <h1 className="booking-title">
            Reserve Your Spa Visit <span className="italic-accent">Online</span>
          </h1>
          <p className="booking-subtitle">
            Choose your facial, body treatment, or 1-on-1 skin session and select a time with Puja or Sia.
          </p>

          <div className="trust-pills">
            <span className="trust-pill">⭐ 5.0 Rated Evanston Spa</span>
            <span className="trust-pill">🔒 Real-Time Slot Guarantee</span>
            <span className="trust-pill">↩️ Reschedule 24h Prior</span>
            <span className="trust-pill">📍 1567 Sherman Ave, Evanston</span>
          </div>
        </div>

        {/* SETMORE IFRAME CARD */}
        <div className="iframe-card Shell">
          <div className="iframe-header-bar">
            <div className="iframe-header-left">
              <span>🌿 Kaya Holistic Spa — Appointment Calendar</span>
            </div>
            <div className="iframe-header-badge">
              <span className="live-dot" />
              Live Availability
            </div>
          </div>

          <div className="iframe-wrapper">
            <div className={`iframe-loading-overlay ${!loading ? 'hidden' : ''}`}>
              <div className="spinner" />
              <div className="loading-text">Loading appointment schedule...</div>
            </div>

            <iframe
              src={SETMORE_URL}
              title="Kaya Holistic Spa Booking"
              width="100%"
              height="840px"
              frameBorder="0"
              scrolling="yes"
              className="setmore-iframe"
              onLoad={() => setLoading(false)}
            ></iframe>
          </div>
        </div>

        {/* HELPFUL SPA INFORMATION CARDS */}
        <div className="booking-info-grid">
          <div className="info-card">
            <div className="info-icon">📍</div>
            <h4>Location & Hours</h4>
            <p>
              <strong>Kaya Holistic Spa</strong><br />
              1567 Sherman Avenue, Evanston, IL 60201<br />
              Mon – Sat: 9:00 AM – 7:00 PM<br />
              Direct Line: (847) 571-1910
            </p>
          </div>

          <div className="info-card">
            <div className="info-icon">💬</div>
            <h4>Not Sure Which Service to Pick?</h4>
            <p>
              Take our 2-minute personalized Skin Quiz or chat directly with Puja to get a recommended treatment plan before booking.
            </p>
            <button className="info-cta-btn" onClick={() => navigate('/quiz')}>
              Take Skin Quiz →
            </button>
          </div>

          <div className="info-card">
            <div className="info-icon">✨</div>
            <h4>Booking & Cancellation Policy</h4>
            <p>
              Your appointment holds time exclusively for you. Please notify us at least 24 hours in advance if you need to reschedule or cancel.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Booking;