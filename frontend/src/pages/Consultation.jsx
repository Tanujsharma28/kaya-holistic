import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { submitConsultation, getServices } from "../api/client";
import { useApp } from "../context/AppContext";

const INTAKE_Q = [
  { q: "Hi! I'm Puja. What's the main concern you'd like to address?", opts: ["Dark spots / pigmentation", "Acne and breakouts", "Dryness or dullness", "Fine lines / aging", "Redness / sensitivity", "Just need a reset!"] },
  { q: "How long have you been dealing with this?", opts: ["Just started noticing it", "A few months", "Over a year", "Most of my life"] },
  { q: "Have you tried any treatments or products for it before?", opts: ["Yes, but nothing worked well", "Yes, and they helped a little", "No, this is my first time", "Not sure what to try"] },
  { q: "Any skin sensitivities or allergies I should know about?", opts: ["Fragrance sensitive", "Allergic to certain actives", "No known allergies", "Not sure"] },
  { q: "Anything else you'd like me to know before your session?", opts: ["Nothing else, thanks"] },
];

const STEPS = [
  { icon: "📅", title: "Book your time", desc: "Pick a slot that suits you. Takes under a minute." },
  { icon: "💬", title: "Share your skin story", desc: "Right after booking, answer 5 quick questions so Puja can prepare." },
  { icon: "📹", title: "30-minute live session", desc: "A real video call on Google Meet. Ask anything, get real answers." },
  { icon: "📝", title: "Your written skin plan", desc: "A summary with product and treatment recommendations, sent to your inbox." },
];

export default function Consultation() {
  const [params] = useSearchParams();
  const bookingId = params.get("booking");
  const ref = bookingId ? bookingId.slice(0, 8).toUpperCase() : "";

  const [virtPrice, setVirtPrice] = useState(45);
  useEffect(() => {
    getServices().then((l) => { const s = l.find((x) => x.id === "virt"); if (s) setVirtPrice(s.price); }).catch(() => {});
  }, []);

  const [answers, setAnswers] = useState([]);
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");
  const [input, setInput] = useState("");
  const { setSelectedService } = useApp();
  const navigate = useNavigate();

  const goBook = () => { setSelectedService({ id: "virt" }); navigate("/online-consultation"); };

  const send = async (finalAnswers) => {
    setError("");
    setTyping(true);
    const payload = {};
    finalAnswers.forEach((x) => { payload[x.q] = x.a; });
    try {
      await submitConsultation({ bookingId, answers: payload });
      setDone(true);
    } catch (e) {
      console.error(e);
      setError(e?.response?.data?.message || "We couldn't save your answers. Please check your connection and try again.");
    } finally {
      setTyping(false);
    }
  };

  const answer = (text) => {
    const next = [...answers, { q: INTAKE_Q[step].q, a: text }];
    setAnswers(next);
    setInput("");
    if (step < INTAKE_Q.length - 1) {
      setTyping(true);
      setTimeout(() => { setTyping(false); setStep(step + 1); }, 600);
    } else {
      send(next);
    }
  };

  const currentQ = INTAKE_Q[step];
  const showQuestion = !done && !typing && !error;
  const progress = done ? 100 : Math.round((answers.length / INTAKE_Q.length) * 100);

  const prepCard = (
    <div className="prep-card">
      <h3>📸 How to prepare</h3>
      <p>Please email 3 clear face photos (front, left, right, no makeup) and photos of your current products to:</p>
      <a
        href={`mailto:kayaholisticspa@gmail.com?subject=${encodeURIComponent(ref ? `Skin photos - ${ref}` : "Skin photos")}`}
        className="prep-email"
      >kayaholisticspa@gmail.com</a>
      {ref && <p className="muted" style={{ fontSize: 13, marginTop: 8 }}>Please add your booking reference <b>{ref}</b> in the subject line.</p>}
    </div>
  );

  const chat = (
    <>
      <div className="chat-card-header">
        <h3>Tell Puja about your skin</h3>
        <span className="chat-progress-label">{done ? "Done" : `${Math.min(answers.length + 1, INTAKE_Q.length)} of ${INTAKE_Q.length}`}</span>
      </div>
      <div className="bar" style={{ marginBottom: 16 }}><i style={{ width: `${progress}%` }} /></div>

      <div className="interview-chat">
        <div className="chat-messages">
          {answers.map((x, i) => (
            <div key={i}>
              <div className="msg puja"><div className="msg-avatar">P</div><div className="bubble">{x.q}</div></div>
              <div className="msg me"><div className="msg-avatar">Y</div><div className="bubble">{x.a}</div></div>
            </div>
          ))}
          {showQuestion && (
            <div className="msg puja"><div className="msg-avatar">P</div><div className="bubble">{currentQ.q}</div></div>
          )}
          {typing && (
            <div className="msg puja"><div className="msg-avatar">P</div><div className="bubble"><span className="typing-dots"><span></span><span></span><span></span></span></div></div>
          )}
          {done && (
            <div className="msg puja"><div className="msg-avatar">P</div><div className="bubble">Thank you! I'll review this before your session. See you soon 💛</div></div>
          )}
          {error && <p style={{ color: "#b3261e", fontSize: 14 }}>{error}</p>}
        </div>

        {showQuestion && (
          <div>
            <div className="chat-opts-grid">
              {currentQ.opts.map((o) => <button className="chat-opt" key={o} onClick={() => answer(o)}>{o}</button>)}
            </div>
            <div className="chat-input-row">
              <input className="chat-input" placeholder="Or type your own answer…" value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && input.trim() && answer(input.trim())} />
              <button className="chat-send" onClick={() => input.trim() && answer(input.trim())}>➤</button>
            </div>
          </div>
        )}

        {error && <button className="btn" style={{ marginTop: 12 }} onClick={() => send(answers)}>Try again</button>}
        {done && (
          <button className="btn ghost" style={{ marginTop: 16, width: "100%", justifyContent: "center" }} onClick={() => navigate("/")}>Back to home</button>
        )}
      </div>
    </>
  );

  // ===== Booking ke baad: sirf intake chat =====
  if (bookingId) {
    return (
      <div className="view consult-page">
        <div style={{ maxWidth: 680, margin: "0 auto" }}>
          <div className="section-label">Step 2 of 2</div>
          <h2 style={{ marginTop: 6 }}>Tell Puja about your <span className="italic-accent">skin</span></h2>
          <p className="muted" style={{ marginBottom: 24 }}>
            Your session is booked. Answer 5 quick questions (about 2 minutes) so Puja can prepare before your call.
          </p>
          {chat}
          <div style={{ marginTop: 24 }}>{prepCard}</div>
        </div>
      </div>
    );
  }

  // ===== Normal sales page =====
  return (
    <div className="view consult-page">

      <div className="consult-hero">
        <div className="section-label">One-to-One Session</div>
        <h2>Your skin, explained —<br />by someone who <span className="italic-accent">really knows it</span>.</h2>
        <p>30 minutes with a licensed esthetician, live on video. No generic advice, no guesswork. Just answers specific to your skin.</p>

        <div className="consult-hero-row">
          <div className="consult-price-box">
            <span className="consult-price-amt">${virtPrice}</span>
            <span className="consult-price-sub">30 min · video call on Google Meet</span>
          </div>
          <button className="btn" onClick={goBook}>Book your session →</button>
        </div>
        <div className="consult-hero-trust" style={{ marginTop: 14 }}>
          <span>⭐ 5.0 rating</span>
          <span>🔒 Secure booking</span>
          <span>↩️ Reschedule anytime</span>
        </div>
      </div>

      <div className="meet-expert-card">
        <div className="meet-avatar">P</div>
        <div className="meet-info">
          <h3>Meet Puja Gupta</h3>
          <p className="muted">Licensed Esthetician · 15+ years · GLO Skin Body Certified</p>
          <p>Puja has spent over a decade helping clients in Evanston and Chicago understand their skin, not just treat it. Every consultation is one-on-one, never templated.</p>
        </div>
      </div>

      <div className="section-label" style={{ marginTop: 40 }}>The Process</div>
      <h3 className="steps-title">What to expect</h3>
      <div className="steps-grid">
        {STEPS.map((s, i) => (
          <div className="step-card" key={i}>
            <div className="step-card-icon">{s.icon}</div>
            <div className="step-card-num">Step {i + 1}</div>
            <h4>{s.title}</h4>
            <p className="muted">{s.desc}</p>
          </div>
        ))}
      </div>

      <div className="consult-grid">
        <div>
          {prepCard}
          <div className="guarantee-card">
            <div className="guarantee-icon">✓</div>
            <div>
              <h4>Satisfaction guaranteed</h4>
              <p className="muted" style={{ margin: 0 }}>If the session isn't valuable to you, we'll make it right. No questions asked.</p>
            </div>
          </div>
        </div>
        <div>
          <div className="prep-card">
            <h3>Ready to start?</h3>
            <p>Book your time first. Right after, you'll get a short 2-minute questionnaire so Puja can prepare for your skin before the call.</p>
            <p className="muted" style={{ fontSize: 13 }}>Already booked? Open the link in your confirmation email to complete your skin profile.</p>
            <button className="btn" onClick={goBook}>Book your session, ${virtPrice} →</button>
          </div>
        </div>
      </div>
    </div>
  );
}