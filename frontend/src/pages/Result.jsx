import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

// ─── Recommendation Engine ────────────────────────────────────────────────────
const SKIN_PROFILES = {
  oily:        { label: 'Oily & Congested',   emoji: '💧', color: '#2d7a6a', bg: '#e8f5f2', border: '#b2dfd6' },
  dry:         { label: 'Dry & Dehydrated',   emoji: '🌿', color: '#7c5c38', bg: '#fbf3e7', border: '#e6ddd0' },
  combination: { label: 'Combination',         emoji: '⚖️', color: '#5d6b3a', bg: '#f0f4e8', border: '#d5e0c5' },
  normal:      { label: 'Balanced / Normal',   emoji: '✨', color: '#3b6978', bg: '#eef6f8', border: '#c3e2e8' },
};

const CONCERN_DATA = {
  hydration:    { label: 'Deep Hydration & Glow',         emoji: '💦', color: '#3b6978' },
  aging:        { label: 'Anti-Aging & Firmness',          emoji: '🌸', color: '#8b3a6b' },
  acne:         { label: 'Acne & Blemish Clearing',        emoji: '🌱', color: '#2d7a6a' },
  pigmentation: { label: 'Pigmentation & Brightening',     emoji: '☀️', color: '#7c5c38' },
};

const INGREDIENT_MAP = {
  oily: {
    hydration:    ['Niacinamide 10%', 'Hyaluronic Acid', 'Salicylic Acid 2%', 'Zinc PCA', 'Green Tea Extract'],
    aging:        ['Retinol 0.3%', 'Niacinamide', 'Peptide Complex', 'Bakuchiol', 'Vitamin C 10%'],
    acne:         ['Salicylic Acid 2%', 'Tea Tree Oil', 'Benzoyl Peroxide 2.5%', 'Niacinamide', 'Azelaic Acid'],
    pigmentation: ['Vitamin C 15%', 'Niacinamide 10%', 'Alpha Arbutin', 'Kojic Acid', 'Tranexamic Acid'],
  },
  dry: {
    hydration:    ['Hyaluronic Acid', 'Ceramide Complex', 'Shea Butter', 'Squalane', 'Glycerin 5%'],
    aging:        ['Retinol 0.1%', 'Bakuchiol', 'Peptides', 'Rosehip Oil', 'Vitamin E'],
    acne:         ['Salicylic Acid 0.5%', 'Niacinamide 5%', 'Centella Asiatica', 'Ceramides', 'Azelaic Acid 10%'],
    pigmentation: ['Vitamin C 10%', 'Alpha Arbutin', 'Rosehip Oil', 'Licorice Root', 'Tranexamic Acid'],
  },
  combination: {
    hydration:    ['Hyaluronic Acid', 'Niacinamide 5%', 'Glycerin', 'Zinc PCA', 'Aloe Vera Extract'],
    aging:        ['Retinol 0.2%', 'Peptide Complex', 'Vitamin C', 'Bakuchiol', 'Resveratrol'],
    acne:         ['Salicylic Acid 1%', 'Niacinamide', 'Tea Tree', 'Clay Extract', 'Centella Asiatica'],
    pigmentation: ['Vitamin C 12%', 'Alpha Arbutin', 'Niacinamide', 'Kojic Acid', 'AHA Blend'],
  },
  normal: {
    hydration:    ['Hyaluronic Acid', 'Ceramides', 'Peptides', 'Aloe Vera', 'Vitamin B5'],
    aging:        ['Retinol 0.25%', 'Vitamin C 15%', 'Collagen Peptides', 'Coenzyme Q10', 'Bakuchiol'],
    acne:         ['Niacinamide 5%', 'Salicylic Acid 1%', 'Centella Asiatica', 'Zinc', 'Tea Tree Extract'],
    pigmentation: ['Vitamin C 20%', 'Alpha Arbutin', 'Kojic Acid', 'AHA/BHA', 'Tranexamic Acid'],
  },
};

const ROUTINE_MAP = {
  oily: {
    morning: ['Oil-free foaming cleanser', 'Niacinamide toner', 'Lightweight vitamin C serum', 'Oil-free moisturizer (gel)', 'SPF 50 sunscreen (matte)'],
    evening: ['Double cleanse (micellar + gel cleanser)', 'Exfoliating toner (BHA)', 'Targeted treatment serum', 'Lightweight moisturizer', 'Optional: retinol (3x/week)'],
  },
  dry: {
    morning: ['Gentle cream cleanser', 'Hydrating essence', 'Vitamin C + E serum', 'Rich moisturizer', 'SPF 30–50 (hydrating formula)'],
    evening: ['Oil cleanse + milk cleanser', 'Hydrating toner', 'Hyaluronic acid serum', 'Nourishing night cream', 'Face oil seal (rosehip/squalane)'],
  },
  combination: {
    morning: ['Balanced foaming cleanser', 'Hydrating toner', 'Niacinamide serum', 'Lightweight moisturizer', 'SPF 50 (non-comedogenic)'],
    evening: ['Double cleanse', 'BHA toner (T-zone focus)', 'Targeted serum', 'Balancing moisturizer', 'Spot treatment as needed'],
  },
  normal: {
    morning: ['Gentle cleanser', 'Antioxidant toner', 'Vitamin C serum', 'Moisturizer with SPF'],
    evening: ['Micellar + cream cleanser', 'AHA toner (2x/week)', 'Retinol or peptide serum', 'Nourishing night cream'],
  },
};

const FACIAL_MAP = {
  cleansing:    { name: 'Deep Pore Purifying Ritual',       duration: '75 min', price: '$95',  desc: 'Intensive steam extraction, enzymatic exfoliation, and activated charcoal mask for a fully detoxed, clarified complexion.',              badge: 'Best for Oily & Acne-Prone' },
  'aging-facial': { name: 'Rejuvenating Collagen Lift Facial', duration: '90 min', price: '$135', desc: 'Micro-current lifting, collagen peptide infusion, and a firming botanical mask. Visibly tightens and restores youthful radiance.',        badge: 'Best for Anti-Aging' },
  soothing:     { name: 'Calming Botanical Healing Facial', duration: '60 min', price: '$85',  desc: 'Gentle barrier repair using chamomile, centella asiatica, and oat extracts. Designed for sensitive, reactive, or redness-prone skin.', badge: 'Best for Sensitive Skin' },
  signature:    { name: 'Kaya Signature Holistic Glow',     duration: '90 min', price: '$120', desc: 'Our iconic all-in-one custom facial tailored by Puja or Sia. Combines cleansing, exfoliation, targeted treatment, and a face massage.',  badge: 'Most Popular' },
};

const CONCERN_FACIAL_FALLBACK = {
  hydration:    'soothing',
  aging:        'aging-facial',
  acne:         'cleansing',
  pigmentation: 'signature',
};

const PRODUCT_PICKS = {
  hydration:    [
    { name: 'Ultra-Barrier Hyaluronic Serum',   type: 'Serum',         match: '98%', why: 'Delivers 5 forms of HA for 72-hour plumping' },
    { name: 'Ceramide Repair Moisturizer',       type: 'Moisturizer',   match: '96%', why: 'Replenishes skin\'s natural lipid matrix' },
    { name: 'Hydrating Rose Facial Mist',        type: 'Toner / Mist',  match: '93%', why: 'Instantly boosts moisture between steps' },
  ],
  aging:        [
    { name: 'Retinol 0.25% Night Concentrate',  type: 'Night Serum',   match: '97%', why: 'Accelerates cell turnover and collagen synthesis' },
    { name: 'Vitamin C Brightening Elixir',      type: 'Serum',         match: '95%', why: 'Neutralizes free radicals and firms skin' },
    { name: 'Peptide Eye Renewal Cream',         type: 'Eye Cream',     match: '91%', why: 'Targets crow\'s feet and under-eye hollows' },
  ],
  acne:         [
    { name: 'BHA 2% Pore-Clarifying Toner',     type: 'Exfoliant',     match: '99%', why: 'Dissolves sebum plugs from inside the pore' },
    { name: 'Niacinamide 10% + Zinc Serum',      type: 'Serum',         match: '97%', why: 'Controls oil, fades blemish marks, tightens pores' },
    { name: 'Centella Acne Spot Treatment',      type: 'Spot Treatment', match: '94%', why: 'Calms inflammation and speeds healing overnight' },
  ],
  pigmentation: [
    { name: 'Vitamin C 20% Radiance Booster',   type: 'Serum',         match: '98%', why: 'Highest-potency brightener for visible dark spots' },
    { name: 'Alpha Arbutin + Kojic Complex',     type: 'Brightening Serum', match: '95%', why: 'Targets melanin production at source' },
    { name: 'AHA/BHA Weekly Resurfacing Mask',   type: 'Treatment Mask', match: '92%', why: 'Sloughs off pigmented dead skin cells' },
  ],
};

const ENV_TIPS = {
  urban:   { label: 'Urban Defender',    tip: 'Prioritise antioxidant serums (Vitamin C, E, Ferulic Acid) and a high-SPF broad-spectrum sunscreen to shield against pollution & blue light.', icon: '🏙️' },
  outdoor: { label: 'Sun Shield',         tip: 'Use SPF 50+ every 2 hours outdoors. Incorporate aloe vera gel and antioxidant mists to repair UV-induced oxidative stress post-exposure.',       icon: '☀️' },
  indoor:  { label: 'Indoor Hydration',   tip: 'AC and heating strip moisture. Use a humidifier, layer hydrating serums, and seal with a rich moisturizer to combat transepidermal water loss.',  icon: '🏠' },
};

const STRESS_TIPS = {
  high:   'Your cortisol is working against your skin. Incorporate calming adaptogens (ashwagandha, reishi) into your diet and use CBD-infused or chamomile skincare to reduce skin inflammation.',
  medium: 'Balance is key. Maintain your evening skincare ritual as a form of mindfulness — it signals to your body that it\'s time to repair and restore.',
  low:    'Your rested state is your skin\'s biggest asset. Maintain your consistent routine and consider graduating to more active ingredients for an amplified glow.',
};

function buildResult(answers) {
  const skin    = answers.skinType       || 'combination';
  const concern = answers.primaryConcern || 'hydration';
  const sens    = answers.sensitivity    || 'medium';
  const env     = answers.environment    || 'urban';
  const stress  = answers.stressLevel    || 'medium';
  const routine = answers.routineGoal    || 'signature';

  const facialKey = FACIAL_MAP[routine] ? routine : CONCERN_FACIAL_FALLBACK[concern] || 'signature';

  const ingredients = INGREDIENT_MAP[skin]?.[concern] || INGREDIENT_MAP.combination.hydration;
  const skinRoutine = ROUTINE_MAP[skin] || ROUTINE_MAP.combination;
  const facial      = FACIAL_MAP[facialKey];
  const products    = PRODUCT_PICKS[concern] || PRODUCT_PICKS.hydration;
  const skinProfile = SKIN_PROFILES[skin] || SKIN_PROFILES.combination;
  const concernData = CONCERN_DATA[concern] || CONCERN_DATA.hydration;
  const envTip      = ENV_TIPS[env] || ENV_TIPS.urban;
  const stressTip   = STRESS_TIPS[stress] || STRESS_TIPS.medium;

  const scoreBase = { high: 62, medium: 78, low: 91 }[sens] || 75;
  const skinScore = Math.min(98, scoreBase + (stress === 'low' ? 8 : stress === 'high' ? -6 : 0));

  return { skin, concern, sens, env, stress, routine, ingredients, skinRoutine, facial, products, skinProfile, concernData, envTip, stressTip, skinScore };
}

export default function Result() {
  const navigate = useNavigate();
  const { quizAnswers } = useApp();
  const r = buildResult(quizAnswers || {});

  return (
    <div className="res-page">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300;0,9..144,400;0,9..144,600;1,9..144,300;1,9..144,400&family=DM+Sans:wght@300;400;500;600;700&display=swap');

        .res-page {
          min-height: 100vh;
          background: #faf7f2;
          font-family: 'DM Sans', sans-serif;
          color: #2b2016;
          padding-bottom: 80px;
        }

        /* ── Light Hero Header ── */
        .res-hero {
          background: radial-gradient(ellipse 80% 60% at 50% 20%, #fbf3e7 0%, #f1e8da 60%, #faf7f2 100%);
          padding: 60px 24px 50px;
          text-align: center;
          position: relative;
          overflow: hidden;
          border-bottom: 1px solid #e6ddd0;
        }
        .res-eyebrow {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-size: .78rem;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #7c5c38;
          font-weight: 700;
          margin-bottom: 14px;
          background: #f1e8da;
          padding: 6px 16px;
          border-radius: 99px;
          border: 1px solid #e6ddd0;
        }
        .res-eyebrow::before {
          content: "";
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #a67c52;
        }
        .res-hero h1 {
          font-family: 'Fraunces', Georgia, serif;
          font-size: clamp(2.2rem, 5vw, 3.4rem);
          font-weight: 400;
          color: #2b2016;
          line-height: 1.2;
          margin: 0 0 16px;
        }
        .res-hero h1 em { color: #7c5c38; font-style: italic; }
        .res-hero-sub {
          color: #8a7d6e;
          font-size: 1.05rem;
          max-width: 580px;
          margin: 0 auto 34px;
          line-height: 1.65;
        }

        /* ── Light Score Badges ── */
        .res-score-row {
          display: flex;
          justify-content: center;
          gap: 14px;
          flex-wrap: wrap;
        }
        .res-badge {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #ffffff;
          border: 1.5px solid #e6ddd0;
          border-radius: 99px;
          padding: 10px 22px;
          color: #2b2016;
          font-size: .88rem;
          font-weight: 500;
          box-shadow: 0 6px 20px rgba(36, 26, 19, 0.05);
        }
        .res-badge-dot {
          width: 10px; height: 10px;
          border-radius: 50%;
          background: #a67c52;
        }
        .res-badge .score-num {
          font-family: 'Fraunces', serif;
          font-size: 1.3rem;
          color: #7c5c38;
          font-weight: 600;
        }

        /* ── Container ── */
        .res-container {
          max-width: 1080px;
          margin: 0 auto;
          padding: 0 24px;
        }

        /* ── Section Header ── */
        .res-section {
          margin-top: 52px;
        }
        .res-section-label {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 22px;
        }
        .res-section-label .label-num {
          width: 32px; height: 32px;
          border-radius: 50%;
          background: #a67c52;
          color: #ffffff;
          font-size: .85rem;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          box-shadow: 0 4px 12px rgba(166, 124, 82, 0.25);
        }
        .res-section-label h2 {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 1.7rem;
          font-weight: 400;
          margin: 0;
          color: #2b2016;
        }

        /* ── Skin Profile Cards ── */
        .skin-profile-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media (max-width: 640px) { .skin-profile-grid { grid-template-columns: 1fr; } }
        .profile-card {
          border-radius: 22px;
          padding: 28px;
          background: linear-gradient(160deg, #ffffff 0%, #fbf3e7 100%);
          border: 1.5px solid #e6ddd0;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 30px rgba(36, 26, 19, 0.04);
        }
        .profile-card::before {
          content: attr(data-emoji);
          position: absolute;
          right: 20px;
          top: 16px;
          font-size: 2.8rem;
          opacity: .25;
        }
        .profile-card .card-label {
          font-size: .72rem;
          letter-spacing: 2px;
          text-transform: uppercase;
          font-weight: 700;
          margin-bottom: 8px;
          color: #7c5c38;
        }
        .profile-card .card-title {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 1.45rem;
          font-weight: 400;
          margin-bottom: 12px;
          color: #2b2016;
        }
        .profile-card .card-desc {
          font-size: .9rem;
          line-height: 1.65;
          color: #5d5043;
        }
        .score-bar-wrap { margin-top: 18px; }
        .score-bar-label {
          display: flex;
          justify-content: space-between;
          font-size: .8rem;
          margin-bottom: 8px;
          color: #8a7d6e;
        }
        .score-bar {
          height: 8px;
          border-radius: 99px;
          background: #e6ddd0;
          overflow: hidden;
        }
        .score-bar-fill {
          height: 100%;
          border-radius: 99px;
          background: linear-gradient(90deg, #a67c52, #c89b5c);
        }

        /* ── Ingredients Grid ── */
        .ing-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
        }
        .ing-chip {
          background: #ffffff;
          border: 1.5px solid #e6ddd0;
          border-radius: 99px;
          padding: 10px 20px;
          font-size: .88rem;
          font-weight: 500;
          color: #2b2016;
          display: flex;
          align-items: center;
          gap: 10px;
          transition: all .25s ease;
          box-shadow: 0 4px 14px rgba(36, 26, 19, 0.03);
        }
        .ing-chip:hover {
          border-color: #a67c52;
          background: #fbf3e7;
          transform: translateY(-2px);
        }
        .ing-chip .ing-num {
          width: 22px; height: 22px;
          background: #f1e8da;
          color: #7c5c38;
          border-radius: 50%;
          font-size: .7rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        /* ── Product Cards ── */
        .product-cards {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 20px;
        }
        .product-card {
          background: linear-gradient(160deg, #ffffff 0%, #fbf3e7 100%);
          border: 1.5px solid #e6ddd0;
          border-radius: 22px;
          padding: 24px;
          position: relative;
          transition: all .3s ease;
          box-shadow: 0 8px 25px rgba(36, 26, 19, 0.04);
        }
        .product-card:hover {
          border-color: #c89b5c;
          box-shadow: 0 14px 35px rgba(36, 26, 19, 0.08);
          transform: translateY(-3px);
        }
        .product-match {
          position: absolute;
          top: 16px; right: 16px;
          background: #f1e8da;
          border: 1px solid #e6ddd0;
          color: #7c5c38;
          font-size: .72rem;
          font-weight: 700;
          padding: 4px 12px;
          border-radius: 99px;
          letter-spacing: .5px;
        }
        .product-type {
          font-size: .72rem;
          letter-spacing: 2px;
          text-transform: uppercase;
          color: #a67c52;
          font-weight: 700;
          margin-bottom: 8px;
        }
        .product-name {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 1.15rem;
          font-weight: 400;
          color: #2b2016;
          margin-bottom: 12px;
          line-height: 1.3;
        }
        .product-why {
          font-size: .85rem;
          color: #6e6052;
          line-height: 1.6;
          padding-top: 12px;
          border-top: 1px solid #e6ddd0;
        }
        .product-why b { color: #7c5c38; }

        /* ── Routine Cards ── */
        .routine-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        @media (max-width: 640px) { .routine-grid { grid-template-columns: 1fr; } }
        .routine-col {
          background: #ffffff;
          border: 1.5px solid #e6ddd0;
          border-radius: 22px;
          padding: 28px;
          box-shadow: 0 8px 25px rgba(36, 26, 19, 0.04);
        }
        .routine-col-header {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 22px;
        }
        .routine-col-icon {
          width: 40px; height: 40px;
          border-radius: 12px;
          background: #f1e8da;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
        }
        .routine-col h3 {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 1.25rem;
          font-weight: 400;
          margin: 0;
          color: #2b2016;
        }
        .routine-steps {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }
        .routine-step {
          display: flex;
          align-items: flex-start;
          gap: 12px;
        }
        .step-num {
          width: 24px; height: 24px;
          background: #f1e8da;
          border-radius: 50%;
          font-size: .75rem;
          font-weight: 700;
          color: #7c5c38;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .step-text {
          font-size: .9rem;
          color: #4a3e33;
          line-height: 1.5;
        }

        /* ── Facial Highlight Banner (Espresso Luxury Dark Accent) ── */
        .facial-card {
          position: relative;
          overflow: hidden;
          background: radial-gradient(circle at top right, #3a2b1d 0%, #241a13 75%);
          color: #ffffff;
          border-radius: 24px;
          padding: 44px;
          box-shadow: 0 18px 45px rgba(36, 26, 19, 0.15);
        }
        .facial-card::before {
          content: "";
          position: absolute;
          top: -60px; right: -60px;
          width: 240px; height: 240px;
          background: radial-gradient(circle, rgba(200,155,92,.22), transparent 70%);
          border-radius: 50%;
          pointer-events: none;
        }
        .facial-badge {
          display: inline-block;
          background: rgba(255, 255, 255, 0.12);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: #f3ead9;
          font-size: .72rem;
          font-weight: 700;
          letter-spacing: 1.8px;
          text-transform: uppercase;
          padding: 6px 16px;
          border-radius: 99px;
          margin-bottom: 18px;
        }
        .facial-name {
          font-family: 'Fraunces', Georgia, serif;
          font-size: clamp(1.6rem, 4vw, 2.2rem);
          font-weight: 400;
          margin: 0 0 10px;
          color: #ffffff;
        }
        .facial-meta {
          display: flex;
          gap: 24px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }
        .facial-meta span {
          font-size: .9rem;
          color: rgba(243, 234, 217, 0.85);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .facial-desc {
          font-size: .98rem;
          color: rgba(243, 234, 217, 0.85);
          line-height: 1.7;
          max-width: 660px;
          margin-bottom: 32px;
        }
        .facial-cta {
          display: flex;
          gap: 16px;
          flex-wrap: wrap;
        }
        .btn-brown {
          background: #a67c52;
          color: #ffffff;
          border: 0;
          padding: 15px 34px;
          border-radius: 99px;
          font-size: .92rem;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: .3px;
          transition: all .25s;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 6px 20px rgba(166, 124, 82, 0.3);
        }
        .btn-brown:hover {
          background: #7c5c38;
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(124, 92, 56, 0.4);
        }
        .btn-ghost-light {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
          border: 1.5px solid rgba(255, 255, 255, 0.3);
          padding: 15px 30px;
          border-radius: 99px;
          font-size: .92rem;
          font-weight: 600;
          cursor: pointer;
          transition: all .25s;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-ghost-light:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        /* ── Insights Cards ── */
        .insights-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media (max-width: 640px) { .insights-grid { grid-template-columns: 1fr; } }
        .insight-card {
          background: #ffffff;
          border: 1.5px solid #e6ddd0;
          border-radius: 22px;
          padding: 26px;
          box-shadow: 0 8px 25px rgba(36, 26, 19, 0.04);
        }
        .insight-icon {
          font-size: 2.2rem;
          margin-bottom: 12px;
          display: block;
        }
        .insight-label {
          font-size: .72rem;
          letter-spacing: 2px;
          text-transform: uppercase;
          font-weight: 700;
          color: #7c5c38;
          margin-bottom: 8px;
        }
        .insight-title {
          font-family: 'Fraunces', Georgia, serif;
          font-size: 1.2rem;
          font-weight: 400;
          margin-bottom: 10px;
          color: #2b2016;
        }
        .insight-text {
          font-size: .88rem;
          color: #5d5043;
          line-height: 1.65;
        }

        /* ── Bottom Section CTA ── */
        .res-cta-section {
          margin-top: 60px;
          text-align: center;
          padding: 56px 24px;
          background: linear-gradient(160deg, #ffffff 0%, #fbf3e7 100%);
          border-radius: 24px;
          border: 1.5px solid #e6ddd0;
          box-shadow: 0 12px 35px rgba(36, 26, 19, 0.05);
        }
        .res-cta-section h2 {
          font-family: 'Fraunces', Georgia, serif;
          font-size: clamp(1.7rem, 4vw, 2.3rem);
          font-weight: 400;
          margin: 0 0 12px;
          color: #2b2016;
        }
        .res-cta-section p {
          color: #8a7d6e;
          font-size: 1rem;
          margin: 0 auto 32px;
          max-width: 500px;
          line-height: 1.65;
        }
        .cta-row {
          display: flex;
          gap: 16px;
          justify-content: center;
          flex-wrap: wrap;
        }
        .btn-cta-brown {
          background: #a67c52;
          color: #ffffff;
          border: 0;
          padding: 16px 38px;
          border-radius: 99px;
          font-size: .95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all .25s;
          font-family: 'DM Sans', sans-serif;
          box-shadow: 0 8px 25px rgba(166, 124, 82, 0.3);
        }
        .btn-cta-brown:hover { background: #7c5c38; transform: translateY(-2px); box-shadow: 0 12px 30px rgba(124, 92, 56, 0.4); }
        .btn-outline-brown {
          background: transparent;
          color: #7c5c38;
          border: 1.5px solid #a67c52;
          padding: 16px 34px;
          border-radius: 99px;
          font-size: .95rem;
          font-weight: 600;
          cursor: pointer;
          transition: all .25s;
          font-family: 'DM Sans', sans-serif;
        }
        .btn-outline-brown:hover { background: #f1e8da; border-color: #7c5c38; }

        @media (max-width: 768px) {
          .res-hero { padding: 44px 20px 36px; }
          .facial-card { padding: 30px 22px; }
          .res-cta-section { padding: 40px 20px; }
        }
      `}</style>

      {/* ── HERO ── */}
      <section className="res-hero">
        <div className="res-eyebrow">Your Personalised Skin Analysis</div>
        <h1>Your Skin is <em>Uniquely Yours.</em><br />Your Ritual Should Be Too.</h1>
        <p className="res-hero-sub">Based on your clinical assessment, here is your complete skin prescription — ingredients, routine, products, and the ideal spa facial treatment for you.</p>
        <div className="res-score-row">
          <div className="res-badge">
            <div className="res-badge-dot" />
            <span>Analysis Complete</span>
          </div>
          <div className="res-badge">
            <span style={{ fontSize: '1.1rem' }}>{r.skinProfile.emoji}</span>
            <span>Skin: <strong>{r.skinProfile.label}</strong></span>
          </div>
          <div className="res-badge">
            <span>{r.concernData.emoji}</span>
            <span>Goal: <strong>{r.concernData.label}</strong></span>
          </div>
          <div className="res-badge">
            Barrier Strength: <span className="score-num">{r.skinScore}</span><span style={{opacity:.6}}>/100</span>
          </div>
        </div>
      </section>

      <div className="res-container">

        {/* ── 1. SKIN PROFILE ── */}
        <section className="res-section">
          <div className="res-section-label">
            <div className="label-num">1</div>
            <h2>Your Skin Profile</h2>
          </div>
          <div className="skin-profile-grid">
            <div className="profile-card"
              data-emoji={r.skinProfile.emoji}>
              <div className="card-label">Skin Type Diagnosis</div>
              <div className="card-title">{r.skinProfile.label}</div>
              <div className="card-desc">
                {r.skin === 'oily' && 'Your sebaceous glands are hyperactive, producing excess sebum. Your barrier needs regulation, not stripping — harsh cleansers will worsen oil production.'}
                {r.skin === 'dry' && 'Your skin has a compromised lipid barrier, causing transepidermal water loss. Ceramides, fatty acids, and occlusive moisturizers are essential.'}
                {r.skin === 'combination' && 'Your skin behaves differently across zones. The T-zone needs sebum control while the cheeks crave hydration — a multi-zone approach is required.'}
                {r.skin === 'normal' && 'You have a balanced barrier function. Focus on maintenance and antioxidant protection to preserve your radiant state long-term.'}
              </div>
              <div className="score-bar-wrap">
                <div className="score-bar-label"><span>Barrier Function Index</span><span>{r.skinScore}/100</span></div>
                <div className="score-bar"><div className="score-bar-fill" style={{ width: `${r.skinScore}%` }} /></div>
              </div>
            </div>
            <div className="profile-card"
              data-emoji={r.concernData.emoji}>
              <div className="card-label">Primary Target Concern</div>
              <div className="card-title">{r.concernData.label}</div>
              <div className="card-desc">
                {r.concern === 'hydration'    && 'Dehydration is different from dryness — even oily skin can be dehydrated. Your treatment plan targets restoring moisture reserves for a deep, lit-from-within glow.'}
                {r.concern === 'aging'        && 'Collagen degrades by ~1% annually post-25. Your prescription focuses on stimulating fibroblast activity and protecting elasticity.'}
                {r.concern === 'acne'         && 'Acne involves sebum, bacteria, and clogged pores. Your plan targets all three pathways while soothing active inflammation.'}
                {r.concern === 'pigmentation' && 'Melanin overproduction causes dark spots. Your formula blocks tyrosinase synthesis while speeding up epidermal renewal.'}
              </div>
            </div>
          </div>
        </section>

        {/* ── 2. KEY INGREDIENTS ── */}
        <section className="res-section">
          <div className="res-section-label">
            <div className="label-num">2</div>
            <h2>Key Recommended Actives</h2>
          </div>
          <p style={{ color: '#8a7d6e', fontSize: '.95rem', marginBottom: 20, lineHeight: 1.6 }}>
            These 5 key ingredients are specifically selected for your skin type ({r.skinProfile.label}) and concern ({r.concernData.label}):
          </p>
          <div className="ing-grid">
            {r.ingredients.map((ing, i) => (
              <div key={ing} className="ing-chip">
                <span className="ing-num">{i + 1}</span>
                {ing}
              </div>
            ))}
          </div>
        </section>

        {/* ── 3. PRODUCT RECOMMENDATIONS ── */}
        <section className="res-section">
          <div className="res-section-label">
            <div className="label-num">3</div>
            <h2>Prescription Skincare Products</h2>
          </div>
          <div className="product-cards">
            {r.products.map((p) => (
              <div key={p.name} className="product-card">
                <div className="product-match">✓ {p.match} Match</div>
                <div className="product-type">{p.type}</div>
                <div className="product-name">{p.name}</div>
                <div className="product-why">
                  <b>Why it works for you:</b> {p.why}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── 4. DAILY ROUTINE ── */}
        <section className="res-section">
          <div className="res-section-label">
            <div className="label-num">4</div>
            <h2>Your Personalised Daily Ritual</h2>
          </div>
          <div className="routine-grid">
            <div className="routine-col">
              <div className="routine-col-header">
                <div className="routine-col-icon">🌅</div>
                <h3>Morning Ritual</h3>
              </div>
              <div className="routine-steps">
                {r.skinRoutine.morning.map((step, i) => (
                  <div key={i} className="routine-step">
                    <div className="step-num">{i + 1}</div>
                    <div className="step-text">{step}</div>
                  </div>
                ))}
              </div>
            </div>
            <div className="routine-col">
              <div className="routine-col-header">
                <div className="routine-col-icon">🌙</div>
                <h3>Evening Ritual</h3>
              </div>
              <div className="routine-steps">
                {r.skinRoutine.evening.map((step, i) => (
                  <div key={i} className="routine-step">
                    <div className="step-num">{i + 1}</div>
                    <div className="step-text">{step}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── 5. LIFESTYLE INSIGHTS ── */}
        <section className="res-section">
          <div className="res-section-label">
            <div className="label-num">5</div>
            <h2>Environmental & Stress Analysis</h2>
          </div>
          <div className="insights-grid">
            <div className="insight-card">
              <span className="insight-icon">{r.envTip.icon}</span>
              <div className="insight-label">Environmental Exposure</div>
              <div className="insight-title">{r.envTip.label}</div>
              <div className="insight-text">{r.envTip.tip}</div>
            </div>
            <div className="insight-card">
              <span className="insight-icon">{r.stress === 'high' ? '😮‍💨' : r.stress === 'low' ? '🧘' : '⚡'}</span>
              <div className="insight-label">Stress & Recovery State</div>
              <div className="insight-title">{r.stress === 'high' ? 'High Cortisol Impact' : r.stress === 'low' ? 'Optimal Rested Balance' : 'Moderate Stress Exposure'}</div>
              <div className="insight-text">{r.stressTip}</div>
            </div>
          </div>
        </section>

        {/* ── 6. RECOMMENDED FACIAL ── */}
        <section className="res-section">
          <div className="res-section-label">
            <div className="label-num">6</div>
            <h2>Your Matched Kaya Spa Facial</h2>
          </div>
          <div className="facial-card">
            <div className="facial-badge">{r.facial.badge}</div>
            <h2 className="facial-name">{r.facial.name}</h2>
            <div className="facial-meta">
              <span>⏱ {r.facial.duration}</span>
              <span>💰 Starting from {r.facial.price}</span>
              <span>📍 Evanston Spa Sanctuary</span>
            </div>
            <p className="facial-desc">{r.facial.desc}</p>
            <div className="facial-cta">
              <button className="btn-brown" onClick={() => navigate('/booking')}>
                Book This Facial · {r.facial.price}
              </button>
              <button className="btn-ghost-light" onClick={() => navigate('/consultation')}>
                Book 1-on-1 Consultation
              </button>
            </div>
          </div>
        </section>

        {/* ── BOTTOM CTA ── */}
        <section className="res-cta-section">
          <h2>Ready for Your Skin Transformation?</h2>
          <p>Book your tailored {r.facial.name} session with licensed estheticians Puja or Sia and begin your holistic skin journey today.</p>
          <div className="cta-row">
            <button className="btn-cta-brown" onClick={() => navigate('/booking')}>
              Book Appointment Now →
            </button>
            <button className="btn-outline-brown" onClick={() => navigate('/quiz')}>
              Retake Assessment
            </button>
          </div>
        </section>

      </div>
    </div>
  );
}