import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useUserAuth } from "../context/UserAuthContext";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const { user } = useUserAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`navbar-header ${scrolled ? "scrolled" : ""}`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,600;0,700;1,500&display=swap');

        /* ─── Navbar Shell ─── */
        .navbar-header {
          position: fixed;
          top: 0; left: 0; right: 0;
          z-index: 1000;
          padding: 11px 48px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #FAF9F6;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .navbar-header.scrolled {
          padding: 8px 48px;
          background-color: rgba(250, 249, 246, 0.93);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 2px 24px rgba(0,0,0,0.07);
          border-bottom: 1px solid rgba(212,175,55,0.18);
        }

        /* ─── Brand wrapper ─── */
        .nav-brand {
          display: flex;
          align-items: center;
          gap: 13px;
          cursor: pointer;
          text-decoration: none;
          user-select: none;
        }

        /* ─── Premium Circle Badge ─── */
        /* Outer glow ring */
        .brand-logo-ring {
          position: relative;
          flex-shrink: 0;
          width: 76px;
          height: 76px;
          border-radius: 50%;
          padding: 2.5px;
          background: conic-gradient(
            from 0deg,
            #c9a227 0%,
            #f5e07a 25%,
            #a07820 50%,
            #f5e07a 75%,
            #c9a227 100%
          );
          box-shadow:
            0 0 0 1px rgba(212,175,55,0.12),
            0 4px 20px rgba(160,115,10,0.35),
            0 1px 4px rgba(0,0,0,0.2);
          transition: all 0.35s cubic-bezier(0.4,0,0.2,1);
        }

        .nav-brand:hover .brand-logo-ring {
          box-shadow:
            0 0 0 1px rgba(212,175,55,0.2),
            0 6px 28px rgba(160,115,10,0.52),
            0 2px 8px rgba(0,0,0,0.22);
          transform: scale(1.05) rotate(18deg);
        }

        /* Inner dark circle — the actual badge */
        .brand-logo-badge {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: radial-gradient(circle at 40% 35%, #1e1505 0%, #0e0b02 70%);
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }

        /* Subtle inner shine at top */
        .brand-logo-badge::before {
          content: '';
          position: absolute;
          top: 4px; left: 20%; right: 20%;
          height: 1px;
          background: linear-gradient(90deg, transparent, rgba(255,230,100,0.3), transparent);
          border-radius: 50%;
          z-index: 2;
        }

        /* Logo image — FULL image (lotus + "Kaya Holistic Spa" text) */
        .brand-logo-img {
          width: 90%;
          height: 90%;
          object-fit: contain;
          object-position: center center;
          display: block;
          filter: drop-shadow(0 0 3px rgba(212,175,55,0.3));
          transition: filter 0.3s ease, transform 0.35s ease;
          position: relative;
          z-index: 1;
        }

        .nav-brand:hover .brand-logo-img {
          filter: drop-shadow(0 0 7px rgba(255,215,60,0.7)) brightness(1.08);
          transform: scale(1.06) rotate(-18deg); /* counter-rotate so logo stays upright */
        }

        /* Scrolled → slightly smaller */
        .navbar-header.scrolled .brand-logo-ring {
          width: 62px;
          height: 62px;
        }

        /* ─── Brand text ─── */
        .brand-text-wrap {
          display: flex;
          flex-direction: column;
          gap: 2px;
        }
        .brand-title {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-size: 1.18rem;
          font-weight: 700;
          color: #1C2B22;
          line-height: 1.15;
          letter-spacing: 0.015em;
          transition: color 0.2s;
        }
        .nav-brand:hover .brand-title { color: #7c5c38; }
        .brand-subtitle {
          font-size: 0.6rem;
          color: #a08060;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .brand-tagline {
          font-family: 'Cormorant Garamond', Georgia, serif;
          font-style: italic;
          font-size: 0.7rem;
          color: #9a7850;
          letter-spacing: 0.02em;
        }

        /* ─── Nav Links ─── */
        .nav-menu {
          display: flex;
          align-items: center;
          gap: 4px;
          list-style: none;
          margin: 0; padding: 0;
        }
        .nav-link {
          text-decoration: none;
          color: #3D5446;
          font-size: 0.9rem;
          font-weight: 500;
          padding: 8px 15px;
          border-radius: 30px;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .nav-link:hover { color: #1C2B22; background: rgba(45,71,55,0.06); }
        .nav-link.active { background: #EAF2ED; color: #2D4737; font-weight: 600; }

        /* ─── Book Button ─── */
        .btn-book-visit {
          background: linear-gradient(135deg, #2D4737 0%, #1C2B22 100%);
          color: #fff;
          border: none;
          padding: 10px 22px;
          border-radius: 30px;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 2px 10px rgba(45,71,55,0.22);
          letter-spacing: 0.02em;
          white-space: nowrap;
        }
        .btn-book-visit:hover {
          background: linear-gradient(135deg, #1C2B22 0%, #0f1a13 100%);
          transform: translateY(-1px);
          box-shadow: 0 5px 18px rgba(45,71,55,0.32);
        }

        /* ─── Auth ─── */
        .nav-signin {
          background: none;
          border: 1.5px solid #c9a227;
          color: #7c5c38;
          border-radius: 99px;
          padding: 8px 18px;
          font: inherit;
          font-weight: 600;
          font-size: .86rem;
          cursor: pointer;
          transition: all 0.2s;
          white-space: nowrap;
        }
        .nav-signin:hover {
          background: linear-gradient(135deg,#fdf6e8,#fff8ed);
          border-color: #d4af37;
          box-shadow: 0 2px 8px rgba(212,175,55,0.2);
        }
        .nav-acct {
          display: flex; align-items: center; gap: 8px;
          background: none; border: 1.5px solid #e2d8c8;
          border-radius: 99px; padding: 4px 14px 4px 4px;
          font: inherit; cursor: pointer; color: #5d5043;
          white-space: nowrap;
        }
        .nav-acct img, .nav-acct span {
          width: 30px; height: 30px; border-radius: 50%;
          background: #a67c52; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-weight: 600; object-fit: cover;
        }
        .nav-acct b { font-weight: 600; font-size: .88rem; }

        /* ─── Responsive ─── */
        @media (max-width: 900px) {
          .navbar-header { padding: 9px 22px; }
          .navbar-header.scrolled { padding: 7px 22px; }
          .brand-tagline { display: none; }
        }
        @media (max-width: 680px) {
          .navbar-header { padding: 8px 14px; flex-wrap: wrap; gap: 8px; }
          .navbar-header.scrolled { padding: 6px 14px; }
          .brand-logo-ring { width: 56px; height: 56px; }
          .navbar-header.scrolled .brand-logo-ring { width: 48px; height: 48px; }
          .brand-title { font-size: 1rem; }
          .brand-subtitle { display: none; }
          .nav-menu { gap: 2px; width: 100%; justify-content: space-between; overflow-x: auto; padding-bottom: 2px; -webkit-overflow-scrolling: touch; }
          .nav-link { padding: 6px 8px; font-size: 0.78rem; }
          .btn-book-visit { padding: 7px 12px; font-size: 0.78rem; }
        }
        @media (max-width: 420px) {
          .brand-logo-ring { width: 48px; height: 48px; }
          .brand-text-wrap { gap: 1px; }
          .brand-title { font-size: 0.94rem; }
          .nav-link { padding: 5px 7px; font-size: 0.74rem; }
          .btn-book-visit { padding: 6px 10px; font-size: 0.74rem; }
        }
      `}</style>

      <div className="nav-brand" onClick={() => navigate("/")}>

        {/* Premium circle: outer conic-gradient gold ring → inner dark circle → full logo */}
        <div className="brand-logo-ring">
          <div className="brand-logo-badge">
            <img
              src="/logo.png"
              alt="Kaya Holistic Spa"
              className="brand-logo-img"
            />
          </div>
        </div>

        {/* Brand text next to badge */}
        <div className="brand-text-wrap">
          <div className="brand-title">Kaya Holistic Spa</div>
          <div className="brand-subtitle">Evanston, Illinois</div>
          <div className="brand-tagline">Holistic Skin Care</div>
        </div>
      </div>

      <nav className="nav-menu">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>Home</NavLink>
        <NavLink to="/quiz" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>Skin Quiz</NavLink>
        <NavLink to="/consultation" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>Consultation</NavLink>
        <NavLink to="/gift-cards" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>Gift Cards</NavLink>
        <button className="btn-book-visit" onClick={() => navigate("/booking")}>Book a Visit</button>
        {user ? (
          <button className="nav-acct" onClick={() => navigate("/account")} title="My account">
            {user.picture
              ? <img src={user.picture} alt="" referrerPolicy="no-referrer" />
              : <span>{(user.name || "?")[0].toUpperCase()}</span>}
            <b>{(user.name || "Account").split(" ")[0]}</b>
          </button>
        ) : (
          <button className="nav-signin" onClick={() => navigate("/login")}>Sign in</button>
        )}
      </nav>
    </header>
  );
}