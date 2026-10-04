import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

const QUESTIONS = [
  {
    k: "skinType",
    t: "What is your primary skin texture and oil balance?",
    sub: "This helps us determine your baseline barrier function.",
    o: [
      ["Oily & Congested", "oily", "Frequent shine, enlarged pores, prone to breakouts"],
      ["Dry & Flaky", "dry", "Tightness, rough patches, lack of natural oils"],
      ["Combination", "combination", "Oily T-zone (forehead/nose) with dry or normal cheeks"],
      ["Balanced / Normal", "normal", "Comfortable, even texture with minimal concerns"],
    ],
  },
  {
    k: "primaryConcern",
    t: "What is your #1 skin goal right now?",
    sub: "We will target this specific concern in your custom prescription.",
    o: [
      ["Deep Hydration & Glow", "hydration", "Restore moisture barrier and lit-from-within radiance"],
      ["Anti-Aging & Firmness", "aging", "Target fine lines, loss of elasticity, and collagen production"],
      ["Acne & Blemish Clearing", "acne", "Clear active breakouts, purify pores, and heal blemishes"],
      ["Pigmentation & Brightening", "pigmentation", "Fade dark spots, sun damage, and uneven skin tone"],
    ],
  },
  {
    k: "sensitivity",
    t: "How does your skin react to active ingredients or weather changes?",
    sub: "Ensures we select soothing, non-irritating botanical rituals.",
    o: [
      ["High Sensitivity", "high", "Easily flushes, stings, or turns red with new products"],
      ["Moderate Sensitivity", "medium", "Occasional redness or mild reactions to harsh weather"],
      ["Resilient / Tolerant", "low", "Hardly ever reacts; handles potent formulas well"],
    ],
  },
  {
    k: "environment",
    t: "What is your daily environmental exposure?",
    sub: "Urban pollution and UV rays dictate your skin's oxidative stress level.",
    o: [
      ["Urban City Environment", "urban", "High pollution, smog, and daily screen/blue light exposure"],
      ["Outdoor / Sun Exposure", "outdoor", "Frequent exposure to sunlight, wind, and elements"],
      ["Indoor Climate-Controlled", "indoor", "Constant AC or heating, dry indoor air"],
    ],
  },
  {
    k: "stressLevel",
    t: "How would you rate your current lifestyle stress and sleep quality?",
    sub: "Stress directly impacts cortisol levels and skin barrier breakdown.",
    o: [
      ["High Stress / Low Sleep", "high", "Fatigued skin, dullness, stress-induced breakouts"],
      ["Moderate / Balanced", "medium", "Occasional busy weeks but generally manageable"],
      ["Low Stress / Rested", "low", "Well-rested with a steady self-care routine"],
    ],
  },
  {
    k: "routineGoal",
    t: "What type of professional treatment experience do you prefer?",
    sub: "Helps us pair you with the ideal facial or holistic therapy session.",
    o: [
      ["Deep Cleansing & Purifying Ritual", "cleansing", "Intensive extraction, detoxification, and pore clarity"],
      ["Rejuvenating & Firming Therapy", "aging-facial", "Lifting massage, collagen boosting, and deep nourishment"],
      ["Calming Botanical Healing", "soothing", "Barrier repair, anti-inflammatory herbs, and extreme relaxation"],
      ["Signature Holistic Glow", "signature", "All-in-one customized facial tailored by Puja or Sia"],
    ],
  },
];

export default function Quiz() {
  const [step, setStep] = useState(0);
  const [selected, setSelected] = useState(null);
  const { quizAnswers, setQuizAnswers } = useApp();
  const navigate = useNavigate();

  const q = QUESTIONS[step];
  const pct = ((step + 1) / QUESTIONS.length) * 100;

  const pick = (val) => {
    setSelected(val);
    const updated = { ...quizAnswers, [q.k]: val };
    setQuizAnswers(updated);
    setTimeout(() => {
      setSelected(null);
      if (step < QUESTIONS.length - 1) setStep(step + 1);
      else navigate("/result");
    }, 350);
  };

  return (
    <div className="view">
      <style>{`
        .view {
          min-height: 100vh;
          background-color: #faf8f5;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding: 50px 20px;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: #2d312e;
        }
        .quiz-wrap.clinical {
          background: #ffffff;
          width: 100%;
          max-width: 680px;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.04);
          border: 1px solid #e8e6e1;
          box-sizing: border-box;
        }
        .quiz-top-row {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-bottom: 12px;
        }
        .quiz-eyebrow {
          font-size: 0.8rem;
          text-transform: uppercase;
          letter-spacing: 1.5px;
          color: #5d7563;
          font-weight: 700;
          margin-bottom: 4px;
        }
        .quiz-title-main {
          font-size: 1.1rem;
          font-weight: 600;
          color: #1a221e;
        }
        .quiz-pct {
          font-size: 1.1rem;
          font-weight: 700;
          color: #5d7563;
        }
        .bar {
          width: 100%;
          height: 6px;
          background-color: #ebe9e4;
          border-radius: 10px;
          overflow: hidden;
          margin-bottom: 24px;
        }
        .bar i {
          display: block;
          height: 100%;
          background-color: #5d7563;
          border-radius: 10px;
          transition: width 0.4s ease;
        }
        .q-title {
          font-size: 1.6rem;
          font-weight: 500;
          color: #111814;
          margin-bottom: 8px;
          line-height: 1.3;
        }
        .q-sub {
          font-size: 0.95rem;
          color: #616965;
          margin-bottom: 24px;
        }
        .opts.clinical-opts {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .opt.clinical-opt {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
          padding: 16px 20px;
          background: #ffffff;
          border: 1.5px solid #e2dfd7;
          border-radius: 14px;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .opt.clinical-opt:hover {
          border-color: #5d7563;
          background-color: #f7f9f7;
        }
        .opt.clinical-opt.sel {
          border-color: #5d7563;
          background-color: #f1f5f2;
          box-shadow: 0 4px 12px rgba(93, 117, 99, 0.12);
        }
        .opt-text b {
          font-size: 1.02rem;
          color: #1a221e;
          display: block;
          margin-bottom: 3px;
        }
        .opt-sub {
          font-size: 0.85rem;
          color: #616965;
        }
        .opt-radio {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          border: 2px solid #c4c0b6;
          transition: all 0.2s ease;
        }
        .opt.clinical-opt.sel .opt-radio {
          border-color: #5d7563;
          background-color: #5d7563;
          box-shadow: inset 0 0 0 3px #ffffff;
        }
        .quiz-footer-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 30px;
          padding-top: 20px;
          border-top: 1px solid #f0eee9;
        }
        .btn.ghost {
          background: transparent;
          border: 1px solid #d4d0c5;
          color: #4a544f;
          padding: 8px 16px;
          border-radius: 8px;
          font-weight: 600;
          cursor: pointer;
        }
        .btn.ghost:hover {
          background: #f0eee9;
        }
      `}</style>

      <div className="quiz-wrap clinical">
        <div className="quiz-top-row">
          <div>
            <div className="quiz-eyebrow">Advanced Skin Analysis</div>
            <div className="quiz-title-main">Step {step + 1} of {QUESTIONS.length}</div>
          </div>
          <div className="quiz-pct">{Math.round(pct)}%</div>
        </div>
        <div className="bar">
          <i style={{ width: `${pct}%` }} />
        </div>

        <div className="q-title">{q.t}</div>
        <div className="q-sub">{q.sub}</div>

        <div className="opts clinical-opts">
          {q.o.map(([label, val, sub]) => (
            <button
              key={val}
              className={"opt clinical-opt" + (selected === val || quizAnswers[q.k] === val ? " sel" : "")}
              onClick={() => pick(val)}
            >
              <div className="opt-text">
                <b>{label}</b>
                <span className="opt-sub">{sub}</span>
              </div>
              <div className="opt-radio" />
            </button>
          ))}
        </div>

        <div className="quiz-footer-row">
          {step > 0 ? (
            <button className="btn ghost" onClick={() => setStep(step - 1)}>← Back</button>
          ) : <span />}
          <span style={{ fontSize: '0.8rem', color: '#7a827d' }}>🔒 Confidential Assessment</span>
        </div>
      </div>
    </div>
  );
}