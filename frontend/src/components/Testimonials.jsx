import { useState, useEffect, useRef } from "react";

const reviews = [
  { text: "The facials are amazing, I'm hooked. The scalp treatment is absolutely heavenly and the oil serum has helped my hair texture.", name: "Cynthia Flores", city: "Chicago" },
  { text: "An awesome experience. Great skin care. Puja is an amazing skin expert. Highly recommend.", name: "Manjary Verma", city: "Chicago" },
  { text: "Puja created such a relaxing atmosphere, walked me through each step, and my skin was glowing afterwards.", name: "Nicole Inniss", city: "Chicago" },
  { text: "Did the home facial via video chat — she analyzed my skin and sent a kit. Such a treat during a difficult time.", name: "Michelle Drucker", city: "Chicago" },
  { text: "I've fallen asleep during her facials more times than I can count — the environment is that calming. Years of client and still grateful.", name: "Julie Brdicka", city: "Chicago" },
  { text: "Attentive, knowledgeable, and I always leave feeling refreshed and pampered. Truly a wonderful experience.", name: "Pooja Vasudev Mane", city: "Wheeling, IL" },
];

export default function Testimonials() {
  const count = reviews.length;
  const angleStep = 360 / count;
  // radius so cards don't overlap — tuned for 300px wide cards
  const radius = Math.round(300 / (2 * Math.tan(Math.PI / count)));

  const [angle, setAngle] = useState(0);
  const paused = useRef(false);
  const raf = useRef(null);
  const last = useRef(null);

  useEffect(() => {
    function tick(ts) {
      if (!last.current) last.current = ts;
      const dt = ts - last.current;
      last.current = ts;
      if (!paused.current) setAngle(a => a - dt * 0.018); // deg per ms
      raf.current = requestAnimationFrame(tick);
    }
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, []);

  return (
    <section className="testimonials">
      <h2>Loved by our clients</h2>
      <p className="testimonials-sub">⭐⭐⭐⭐⭐ 5.0 rating from 120+ real visits</p>

      <div
        className="carousel-scene"
        onMouseEnter={() => { paused.current = true; }}
        onMouseLeave={() => { paused.current = false; last.current = null; }}
      >
        <div
          className="carousel-ring"
          style={{ transform: `rotateY(${angle}deg)` }}
        >
          {reviews.map((r, i) => (
            <div
              key={i}
              className="review-card"
              style={{
                transform: `rotateY(${i * angleStep}deg) translateZ(${radius}px)`,
              }}
            >
              <span className="quote-mark">"</span>
              <p>{r.text}</p>
              <div className="review-footer">
                <span className="review-avatar">{r.name.charAt(0)}</span>
                <div>
                  <b>{r.name}</b>
                  <span className="review-city">{r.city}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}