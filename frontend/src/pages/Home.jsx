import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getServices, getCachedServices } from "../api/client";
import ServiceCard from "../components/ServiceCard";
import Testimonials from "../components/Testimonials";
import StaffCards from "../components/StaffCards";
import Reveal from "../components/Reveal";
import GiftSection from "../components/GiftSection";

function ServicesCarousel({ services = [] }) {
  const count = services?.length ?? 0;
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);
  const startX = useRef(null);

  const go = (dir) => setActive((a) => (a + dir + count) % count);

  useEffect(() => {
    if (paused || count === 0) return;
    const t = setInterval(() => setActive((a) => (a + 1) % count), 3500);
    return () => clearInterval(t);
  }, [paused, count]);

  if (count === 0) return null;

  const offsetOf = (i) => {
    let d = i - active;
    if (d > count / 2) d -= count;
    if (d < -count / 2) d += count;
    return d;
  };

  const slotStyle = (d) => {
    const abs = Math.abs(d);
    return {
      /* Fixed: Added proper math operators (* and -) for 3D positioning */
      transform: `translateX(${d * 62}%) translateZ(${-abs * 140}px) rotateY(${-d * 38}deg) scale(${1 - abs * 0.08})`,
      opacity: abs > 2 ? 0 : 1 - abs * 0.28,
      zIndex: 10 - abs,
      pointerEvents: abs > 2 ? "none" : "auto",
    };
  };

  return (
    <div
      className="svc3d"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onPointerDown={(e) => { startX.current = e.clientX; }}
      onPointerUp={(e) => {
        if (startX.current === null) return;
        /* Fixed: Added minus operator for drag calculation */
        const diff = e.clientX - startX.current;
        if (Math.abs(diff) > 50) go(diff < 0 ? 1 : -1);
        startX.current = null;
      }}
    >
      <div className="svc3d-stage">
        {services.map((s, i) => {
          const d = offsetOf(i);
          return (
            <div
              key={s.id}
              className={`svc3d-slot ${d === 0 ? "is-active" : ""}`}
              style={slotStyle(d)}
              onClickCapture={(e) => {
                if (d !== 0) { e.stopPropagation(); setActive(i); }
              }}
            >
              <ServiceCard service={s} />
            </div>
          );
        })}
      </div>

      <button className="svc3d-arrow left" onClick={() => go(-1)} aria-label="Previous service">‹</button>
      <button className="svc3d-arrow right" onClick={() => go(1)} aria-label="Next service">›</button>

      <div className="svc3d-dots">
        {services.map((s, i) => (
          <button
            key={s.id}
            className={`svc3d-dot ${i === active ? "on" : ""}`}
            onClick={() => setActive(i)}
            aria-label={`Show ${s.name}`}
          />
        ))}
      </div>
    </div>
  );
}


export default function Home() {
  const [services, setServices] = useState(getCachedServices());
  const [loading, setLoading] = useState(getCachedServices().length === 0);
  const navigate = useNavigate();
  const [cat, setCat] = useState("All");

  useEffect(() => {
    getServices().then(setServices).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const catOf = (s) => s.category || "Facials";
  const categories = ["All", ...Array.from(new Set(services.map(catOf)))];
  const filtered = cat === "All" ? services : services.filter((s) => catOf(s) === cat);
  const shown = filtered.length ? filtered : services;

  return (
    <div className="view">
      <section className="hero">
        <div>
          <div className="hero-eyebrow"><span className="hero-dot" />Licensed Esthetician · 15+ Years</div>
          <h1>Skin care that starts with <span className="italic-accent">knowing your skin</span>.</h1>
          <p>Puja Gupta treats the cause of a concern, not only its surface. Take a one-minute quiz to see what suits your skin, then book your visit in Evanston.</p>
          <div className="hero-ctas">
            <button className="btn" onClick={() => navigate("/quiz")}>Take the skin quiz</button>
            <button className="btn ghost" onClick={() => navigate("/booking")}>Book a visit</button>
            <button className="btn ghost" onClick={() => navigate("/consultation")}>1-on-1 Consultation</button>
          </div>
          <div className="hero-trust">
            <span>⭐ 5.0 · 120+ reviews</span>
            <span>📅 By appointment only</span>
            <span>🎓 GLO Skincare certified</span>
          </div>
        </div>
      </section>

      <Reveal>
        <section className="svc-section">
          <div className="svc-head">
            <div>
              <div className="section-label">Spa Services</div>
              <h2>Designed around your <span className="italic-accent">well-being</span></h2>
            </div>
            <p className="svc-carousel-hint">Swipe or use arrows · Click the centre card for details</p>
          </div>
          {loading ? (
            <div className="svc-loading">
              <div className="quiz-spinner" />
              <p>Loading services…</p>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "center", margin: "0 0 18px" }}>
                {categories.map((c) => (
                  <button
                    key={c}
                    onClick={() => setCat(c)}
                    style={{
                      padding: "7px 16px", borderRadius: 99, cursor: "pointer", fontSize: ".85rem", fontFamily: "inherit",
                      border: "1.5px solid #a67c52",
                      background: cat === c ? "#a67c52" : "transparent",
                      color: cat === c ? "#fff" : "#7c5c38", fontWeight: 600,
                    }}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <ServicesCarousel key={cat} services={shown} />
            </>
          )}
        </section>
      </Reveal>

      <Reveal>
        <StaffCards />
      </Reveal>

      <Reveal>
        <div className="trust-row">
          <div className="trust-card"><span className="trust-num">15+</span><p>Years of practice in advanced facial treatments</p></div>
          <div className="trust-card"><span className="trust-num">120+</span><p>Five-star reviews from Evanston and Chicago clients</p></div>
          <div className="trust-card"><span className="trust-num">$45</span><p>Virtual skin consultation — book from anywhere</p></div>
        </div>
      </Reveal>

      <Reveal>
        <GiftSection />
      </Reveal>

      <Reveal>
        <Testimonials />
      </Reveal>
    </div>
  );
}