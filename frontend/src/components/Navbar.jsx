import React, { useState, useEffect } from "react";
import { NavLink, useNavigate } from "react-router-dom";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`navbar-header ${scrolled ? "scrolled" : ""}`}>
      <style>{`
        .navbar-header {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 1000;
          padding: 20px 50px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #FAF9F6;
          transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1);
        }

        /* Scroll effects applied when user scrolls down */
        .navbar-header.scrolled {
          padding: 12px 50px;
          background-color: rgba(250, 249, 246, 0.85);
          backdrop-filter: blur(14px);
          -webkit-backdrop-filter: blur(14px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.05);
          border-bottom: 1px solid rgba(226, 232, 228, 0.8);
        }

        .nav-brand {
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          text-decoration: none;
        }

        .brand-icon {
          font-size: 1.5rem;
        }

        .brand-title {
          font-family: Georgia, serif;
          font-size: 1.25rem;
          font-weight: 700;
          color: #1C2B22;
          line-height: 1.1;
        }

        .brand-subtitle {
          font-size: 0.72rem;
          color: #6A7770;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }

        .nav-menu {
          display: flex;
          align-items: center;
          gap: 16px;
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .nav-link {
          text-decoration: none;
          color: #3D5446;
          font-size: 0.92rem;
          font-weight: 500;
          padding: 8px 18px;
          border-radius: 30px;
          transition: all 0.2s ease;
        }

        .nav-link:hover {
          color: #1C2B22;
          background: rgba(45, 71, 55, 0.05);
        }

        .nav-link.active {
          background: #EAF2ED;
          color: #2D4737;
          font-weight: 600;
        }

        .btn-book-visit {
          background: #2D4737;
          color: #FFFFFF;
          border: none;
          padding: 10px 22px;
          border-radius: 30px;
          font-size: 0.9rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          box-shadow: 0 2px 8px rgba(45, 71, 55, 0.15);
        }

        .btn-book-visit:hover {
          background: #1C2B22;
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(45, 71, 55, 0.25);
        }

        @media (max-width: 768px) {
          .navbar-header {
            padding: 14px 20px;
          }
          .navbar-header.scrolled {
            padding: 10px 20px;
          }
          .nav-link {
            padding: 6px 12px;
            font-size: 0.85rem;
          }
        }
      `}</style>

      <div className="nav-brand" onClick={() => navigate("/")}>
        <span className="brand-icon">🌿</span>
        <div>
          <div className="brand-title">Kaya Holistic Spa</div>
          <div className="brand-subtitle">Evanston, Illinois</div>
        </div>
      </div>

      <nav className="nav-menu">
        <NavLink to="/" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
          Home
        </NavLink>
        <NavLink to="/quiz" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
          Skin Quiz
        </NavLink>
        <NavLink to="/consultation" className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
          Consultation
        </NavLink>
        <button className="btn-book-visit" onClick={() => navigate("/booking")}>
          Book a Visit
        </button>
      </nav>
    </header>
  );
}