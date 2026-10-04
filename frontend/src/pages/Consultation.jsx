import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { submitConsultation } from "../api/client";
import { useApp } from "../context/AppContext";

const CONSULT_Q = [
  { q: "Hi! I'm Puja. What's the main concern you'd like to address?", opts: ["Dark spots / pigmentation", "Acne and breakouts", "Dryness or dullness", "Fine lines / aging", "Redness / sensitivity", "Just need a reset!"] },
  { q: "How long have you been dealing with this?", opts: ["Just started noticing it", "A few months", "Over a year", "Most of my life"] },
  { q: "Have you tried any treatments or products for it before?", opts: ["Yes, but nothing worked well", "Yes, and they helped a little", "No, this is my first time", "Not sure what to try"] },
  { q: "Any skin sensitivities or allergies I should know about?", opts: ["Fragrance sensitive", "Allergic to certain actives", "No known allergies", "Not sure"] },
  { q: "Name and email so I can send your summary?", opts: [] },
];

const STEPS = [
  { icon: "💬", title: "Share your skin story", desc: "Answer a few quick questions in the chat — takes under 2 minutes." },
  { icon: "🔍", title: "Puja reviews it personally", desc: "She studies your answers and photos before your session, not during it." },
  { icon: "📹", title: "30-minute live session", desc: "A real video call or in-person visit — ask anything, get real answers." },
  { icon: "📝", title: "Your written skin plan", desc: "A summary with product and treatment recommendations, sent to your inbox." },
];

export default function Consultation() {
  const [chat, setChat] = useState([]);
  const [step, setStep] = useState(0);
  const [typing, setTyping] = useState(false);
  const [done, setDone] = useState(false);
  const [input, setInput] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const { setSelectedService } = useApp();
  const navigate = useNavigate();

  const answer = (text) => {
    const newChat = [...chat, { from: "puja", text: CONSULT_Q[step].q }, { from: "user", text }];
    setChat(newChat);
    setInput("");
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      if (step < CONSULT_Q.length - 1) setStep(step + 1);
      else finish(newChat);
    }, 700 + Math.random() * 500);
  };

  const finish = async (finalChat) => {
    setDone(true);
    const answers = {};
    let idx = 0;
    finalChat.filter(c => c.from === "user").forEach(c => { answers[CONSULT_Q[idx]?.q || `q${idx}`] = c.text; idx++; });
    try {
      await submitConsultation({ name: name || "Guest", email: email || "not-provided@example.com", answers });
    } catch (e) { console.error(e); }
  };

  const goBook = () => { setSelectedService({ id: "virt" }); navigate("/booking"); };

  const currentQ = CONSULT_Q[step];
  const isLast = step === CONSULT_Q.length - 1;
  const chatProgress = done ? 100 : Math.round((step / CONSULT_Q.length) * 100);

  return (
    <div className="view consult-page">

      {/* ===== HERO ===== */}
      <div className="consult-hero">
        <div className="section-label">One-to-One Session</div>
        <h2>Your skin, explained —<br />by someone who <span className="italic-accent">really knows it</span>.</h2>
        <p>30 minutes with a licensed esthetician. No generic advice, no guesswork — just answers specific to your skin.</p>

        <div className="consult-hero-row">
          <div className="consult-price-box">
            <span className="consult-price-amt">$45</span>
            <span className="consult-price-sub">30 min · virtual or in-person</span>
          </div>
          <div className="consult-hero-trust">
            <span>⭐ 5.0 rating</span>
            <span>🔒 Secure booking</span>
            <span>↩️ Reschedule anytime</span>
          </div>
        </div>
      </div>

      {/* ===== MEET PUJA ===== */}
      <div className="meet-expert-card">
        <div className="meet-avatar">P</div>
        <div className="meet-info">
          <h3>Meet Puja Gupta</h3>
          <p className="muted">Licensed Esthetician · 15+ years · GLO Skin Body Certified</p>
          <p>Puja has spent over a decade helping clients in Evanston and Chicago understand their skin — not just treat it. Every consultation is one-on-one, never templated.</p>
        </div>
      </div>

      {/* ===== HOW IT WORKS ===== */}
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

      {/* ===== PREP + CHAT ===== */}
      <div className="consult-grid">
        <div>
          <div className="prep-card">
            <h3>📸 How to prepare</h3>
            <p>Right after booking, email 3 clear face photos (front, left, right — no makeup) and photos of your current products to:</p>
            <a href="mailto:kayaholisticspa@gmail.com" className="prep-email">kayaholisticspa@gmail.com</a>
          </div>

          <div className="guarantee-card">
            <div className="guarantee-icon">✓</div>
            <div>
              <h4>Satisfaction guaranteed</h4>
              <p className="muted" style={{ margin: 0 }}>If the session isn't valuable to you, we'll make it right — no questions asked.</p>
            </div>
          </div>
        </div>

        <div>
          <div className="chat-card-header">
            <h3>Start your intake chat</h3>
            <span className="chat-progress-label">{chatProgress}% complete</span>
          </div>
          <div className="bar" style={{ marginBottom: 16 }}><i style={{ width: `${chatProgress}%` }} /></div>

          <div className="interview-chat">
            <div className="chat-messages">
              {chat.map((c, i) => (
                <div className={"msg " + (c.from === "puja" ? "puja" : "me")} key={i}>
                  <div className="msg-avatar">{c.from === "puja" ? "P" : "Y"}</div>
                  <div className="bubble">{c.text}</div>
                </div>
              ))}
              {!done && !typing && (
                <div className="msg puja"><div className="msg-avatar">P</div><div className="bubble">{currentQ.q}</div></div>
              )}
              {typing && (
                <div className="msg puja"><div className="msg-avatar">P</div><div className="bubble"><span className="typing-dots"><span></span><span></span><span></span></span></div></div>
              )}
              {done && (
                <div className="msg puja"><div className="msg-avatar">P</div><div className="bubble">Thanks! I've got your profile — see you soon 💛</div></div>
              )}
            </div>

            {!done && !typing && (
              isLast ? (
                <div className="chat-input-row" style={{ flexDirection: "column", gap: 8 }}>
                  <input className="chat-input" placeholder="Your name" value={name} onChange={e => setName(e.target.value)} />
                  <input className="chat-input" placeholder="Your email" value={email} onChange={e => setEmail(e.target.value)} />
                  <button className="btn" onClick={() => answer(`${name} / ${email}`)} disabled={!name || !email}>Submit →</button>
                </div>
              ) : (
                <div>
                  <div className="chat-opts-grid">
                    {currentQ.opts.map(o => <button className="chat-opt" key={o} onClick={() => answer(o)}>{o}</button>)}
                  </div>
                  <div className="chat-input-row">
                    <input className="chat-input" placeholder="Or type your own answer…" value={input}
                      onChange={e => setInput(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && input.trim() && answer(input.trim())} />
                    <button className="chat-send" onClick={() => input.trim() && answer(input.trim())}>➤</button>
                  </div>
                </div>
              )
            )}

            {done && <button className="btn" style={{ marginTop: 16, width: "100%", justifyContent: "center" }} onClick={goBook}>Book your consultation — $45 →</button>}
          </div>
        </div>
      </div>
    </div>
  );
}