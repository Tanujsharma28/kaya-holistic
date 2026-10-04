import { Router } from 'express';
const router = Router();

const QUESTIONS = [
  {
    k: "skinType",
    t: "What is your skin type?",
    o: [
      ["Oily", "oily", "💧", "Visible pores, gets shiny through the day"],
      ["Dry", "dry", "🌵", "Feels tight, flaky or rough"],
      ["Combination", "combination", "☯️", "Oily T-zone, dry cheeks"],
      ["Sensitive", "sensitive", "🌸", "Reacts easily, prone to redness"],
    ],
  },
  {
    k: "concern",
    t: "What is your biggest skin concern?",
    o: [
      ["Acne & Breakouts", "acne", "🔴", "Pimples, blackheads, whiteheads"],
      ["Pigmentation", "pigmentation", "🟤", "Dark spots, uneven skin tone"],
      ["Anti-Aging", "aging", "⏳", "Fine lines, dullness, loss of firmness"],
      ["Hydration", "hydration", "💦", "Dry, dehydrated, lacklustre skin"],
    ],
  },
  {
    k: "sensitivity",
    t: "How sensitive is your skin?",
    o: [
      ["Very Sensitive", "high", "🚨", "Burns or stings with most products"],
      ["Mildly Sensitive", "medium", "⚠️", "Reacts occasionally"],
      ["Not Sensitive", "low", "✅", "Most products work fine for me"],
    ],
  },
  {
    k: "routine",
    t: "How would you describe your current skincare routine?",
    o: [
      ["Bare Minimum", "minimal", "😴", "Just a face wash, nothing else"],
      ["Basic", "basic", "🧴", "Cleanser and moisturizer"],
      ["Full Routine", "full", "✨", "Toner, serum, SPF — the works"],
    ],
  },
];

router.get('/', (req, res) => res.json({ success: true, data: QUESTIONS }));

export default router;