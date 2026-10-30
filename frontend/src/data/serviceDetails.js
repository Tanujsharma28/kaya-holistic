// Har service ka poora description, key points aur photo ka fallback art.
// Photo: frontend/public/services/<id>.jpg  (naam = service id). Photo na ho to art panel dikhta hai.
// art: [rang1, rang2, emoji1, emoji2, emoji3]
export const SERVICE_DETAILS = {
  signature: {
    long: "Our signature customised facial helps stimulate lymphatic drainage and improve circulation for visibly better-looking skin. Your treatment is tailored to the appearance of dehydration, hyperpigmentation, fine lines and blemishes, and includes manual dermabrasion and exfoliation.",
    points: ["Supports lymphatic drainage & circulation", "Customised for dehydration, pigmentation, fine lines & blemishes", "Manual dermabrasion & exfoliation", "Tailored to your skin on the day"],
    art: ["#f6e7d2", "#dfc09a", "✨", "🌿", "💆"],
  },
  holistic: {
    long: "A full holistic facial ritual for a radiant, balanced glow. Your treatment is customised to your skin and to your stress level, so the session cares for how your skin looks and how you feel.",
    points: ["Customised to skin & stress level", "Full facial ritual", "Radiant, balanced glow", "Deeply relaxing"],
    art: ["#e8efd9", "#c3d3a0", "🌿", "🌸", "🧘"],
  },
  gent: {
    long: "Our Gentleman's Facial is a customised treatment with deep pore cleansing and exfoliation. It can be tailored to the appearance of dehydration, hyperpigmentation, fine lines and blemishes caused by sun damage, sensitivity, dullness and aging, and includes manual dermabrasion and exfoliation.",
    points: ["Deep pore cleansing & exfoliation", "Manual dermabrasion", "Sun damage, dullness & aging concerns", "Customised for men's skin"],
    art: ["#dfe6ea", "#aebfca", "🧔", "🧼", "💧"],
  },
  express: {
    long: "A targeted express facial that cleanses, exfoliates and hydrates. Perfect for a lunch-break refresh when you want fresher, brighter-looking skin in a short visit.",
    points: ["Cleanse, exfoliate & hydrate", "Quick, lunch-break session", "Targeted to your skin", "Fresh, glowing finish"],
    art: ["#e3f1e4", "#b4d8b8", "🌿", "⏱️", "💧"],
  },
  teen: {
    long: "This rapid-results treatment begins with a deep, purifying double cleanse under warm steam to open tight pores. Next, we apply a gentle exfoliating treatment to loosen debris, followed by precise, professional extractions to clear out stubborn blockages. We finish with a cooling, antibacterial mist and a lightweight, oil-free hydration barrier to protect and soothe the skin.",
    points: ["Deep double cleanse under warm steam", "Gentle exfoliation to loosen debris", "Professional extractions", "Cooling antibacterial mist & oil-free hydration"],
    art: ["#e6f3ea", "#bde0c8", "🌱", "🫧", "😊"],
  },
  dermaplane: {
    long: "Dermaplaning gently exfoliates and refines the skin. A sterile medical scalpel glides over the surface in light, feathering strokes, which is typically painless, and removes dead skin cells and peach fuzz. It lets skin breathe, helps skin-care products absorb deeper, and has no downtime. Paired with microdermabrasion for an extra-smooth finish.",
    points: ["Sterile medical scalpel, light strokes", "Removes dead cells & peach fuzz", "Helps products absorb deeper", "No downtime"],
    art: ["#f4ecee", "#dcc6cc", "🪞", "✨", "🌸"],
  },
  dermaplaning: {
    long: "Dermaplaning gently exfoliates and refines the skin. A sterile blade glides over the surface in light, feathering strokes, typically painless, removing dead skin cells and peach fuzz. It leaves skin instantly smooth and bright, helps skin-care products absorb deeper, and has no downtime. A perfect add-on to any facial.",
    points: ["Sterile blade, light strokes", "Removes dead cells & peach fuzz", "Helps products absorb deeper", "No downtime"],
    art: ["#f4ecee", "#dcc6cc", "🪞", "✨", "🌸"],
  },
  brighten: {
    long: "A versatile treatment for rejuvenation and one of our best-selling facials. Galvanic and ultrasonic technology is beneficial for acne management, aging concerns, dry or dehydrated skin, hyperpigmentation, lines and wrinkles, rosacea, sensitive skin and overall skin health.",
    points: ["Our best-selling facial", "Galvanic / ultrasonic treatment", "Acne, aging & pigmentation concerns", "Beneficial for sensitive skin"],
    art: ["#fbf0c9", "#f0d27c", "🌟", "🍋", "✨"],
  },
  hydra: {
    long: "An advanced treatment using a patented HydraDermabrasion device for deep exfoliation, cleansing, extraction and hydration. The 10-step system helps lift, boost collagen and brighten skin. Suitable for all skin tones, with no downtime.",
    points: ["Patented HydraDermabrasion device", "10-step system", "Exfoliation, extraction & hydration", "All skin tones, no downtime"],
    art: ["#dbeef7", "#a6d3ea", "💦", "💧", "✨"],
  },
  nano: {
    long: "A gentle yet effective treatment designed to boost collagen and improve overall skin health, with little to no downtime. Includes a double-mask technique and a deep hydration infusion. Great for textured skin, acne scars, enlarged pores and fine lines.",
    points: ["Boosts collagen", "Double mask & hydration infusion", "Texture, acne scars & enlarged pores", "Little to no downtime"],
    art: ["#e7e0f2", "#c4b4de", "🧬", "✨", "🔬"],
  },
  lymph: {
    long: "Combining Gua Sha strokes with targeted lymphatic drainage, we help open the body's natural pathways to clear waste and toxic buildup. The result is an instant, healthy skin glow that radiates from the root cause of surface health. Our Gua Sha is Ayurvedic in style, not the Chinese way: it is done with warm Ayurvedic oils and a slow, soothing rhythm that balances skin and calms the nervous system.",
    points: [
      "Sculpts and defines the jawline, cheekbones and brow area",
      "Reduces facial puffiness and fluid retention instantly",
      "Boosts microcirculation to restore a natural, vibrant glow",
      "Detoxifies the skin tissue by moving fluid toward key lymph nodes",
      "Melts away deep facial tension, smooths tight muscles and relaxes the nervous system",
      "Delivers traditional Ayurvedic hydration to deeply nourish and balance all skin types",
    ],
    expect: "Your session begins with a gentle clearing of the lymphatic pathways around the collarbones and neck to open up circulation. Next, the facial tissue is prepared with a warm, nutrient-rich Ayurvedic oil blend. Using precise, ultra-light upward and outward sweeping motions, the stone tool glides seamlessly across your face and neck. This soothing, completely painless rhythm induces a deep state of physical relaxation while actively contouring and detoxifying your skin.",
    art: ["#f4e1e1", "#e0b4b4", "💆", "🪨", "🌸"],
  },
  anti: {
    long: "Microdermabrasion with a glycolic peel, a dynamic treatment customised to most skin conditions. Beneficial for acne management, aging concerns, dry or dehydrated skin, hyperpigmentation, lines and wrinkles.",
    points: ["Microdermabrasion + glycolic peel", "Customised to your skin", "Aging, pigmentation & dehydration", "Lines & wrinkles"],
    art: ["#f3e3d0", "#dbb98f", "⏳", "✨", "🧴"],
  },
  ultimate: {
    long: "A relaxing enzyme facial that uses fruit enzymes to exfoliate and support the skin's natural turnover, with vitamin A and beta-carotene. Lactic acid helps improve tone and texture while gentle enzymes lift the superficial layers for a healthy glow.",
    points: ["Fruit enzyme exfoliation", "Vitamin A & beta-carotene", "Lactic acid for tone & texture", "Healthy glow"],
    art: ["#dcebe6", "#a9cfc3", "🔍", "🫧", "💚"],
  },
  clear: {
    long: "Say goodbye to problem skin and hello to a clearer complexion. Deep pore cleansing clarifies and balances the skin to reduce the signs of acne, and a high-frequency light treatment targets acne-causing bacteria.",
    points: ["Deep pore cleansing", "Clarifies & balances skin", "High-frequency light treatment", "Reduces the signs of acne"],
    art: ["#dff0dc", "#aed3a8", "🍃", "💧", "🌿"],
  },
  deep: {
    long: "A targeted facial treatment to extract blemishes and manage oil production. Regular deep pore cleansing helps improve the look of problem skin and breakouts.",
    points: ["Extracts blemishes", "Helps manage oil production", "Deep pore cleansing", "Good for problem, acne-prone skin"],
    art: ["#dff0f3", "#a9d6de", "♨️", "💧", "🫧"],
  },
  rosacea: {
    long: "A soothing facial designed to calm sensitive skin and reduce the look of redness and inflammation. Gentle cleansing, hydrating masks and targeted serums with nourishing ingredients restore balance and leave a calm, refreshed complexion.",
    points: ["Calms sensitive, rosacea-prone skin", "Gentle cleansing", "Hydrating masks & targeted serums", "Reduces the look of redness"],
    art: ["#f7e3e0", "#e6b9b1", "🌼", "🌿", "🤍"],
  },
  corrective: {
    long: "Designed to wash away impurities, smooth and refine skin texture and support the growth of newer, younger cells. LED light is great for softening the look of fine lines and wrinkles, improving uneven tone, reducing pore size and brightening the skin.",
    points: ["Cleanses & refines texture", "LED light therapy", "Fine lines & uneven tone", "Pore size & brightness"],
    art: ["#e6dcf5", "#bda6e3", "💡", "🔴", "🔵"],
  },
  diamond: {
    long: "A gentler approach for sun-damaged skin, fine lines and wrinkles and dehydrated skin. As the diamond tip glides across the skin it loosens dull, dead skin cells and helps smooth the look of lines and wrinkles.",
    points: ["Diamond-tip microdermabrasion", "Sun-damaged & dehydrated skin", "Smooths fine lines & wrinkles", "Gentle approach"],
    art: ["#e3eef7", "#b2cde6", "💎", "✨", "🔹"],
  },
  ihm: {
    long: "Indian head massage is an ancient Ayurvedic therapeutic treatment that has been practised in India for thousands of years. The focus is on the scalp, face, neck and shoulders.",
    points: ["Ancient Ayurvedic therapy", "Scalp, face, neck & shoulders", "Deeply relaxing", "Melts away tension"],
    art: ["#f2e1c9", "#d9b27a", "🙏", "💆", "🪔"],
  },
  wax: {
    long: "Precision facial waxing using low-temperature stripless wax. Gentle, even on sensitive skin, for a smooth and long-lasting finish.",
    points: ["Low-temperature stripless wax", "Precise facial waxing", "Gentle on sensitive skin", "Smooth, long-lasting finish"],
    art: ["#f7e6ee", "#e8b9cf", "🌸", "🍯", "✨"],
  },
  virt: {
    long: "A one-on-one video skin analysis with Puja over Google Meet. You leave with a personalised routine, product picks and a treatment plan.",
    points: ["Live 1-on-1 video call", "Personalised skin routine", "Product recommendations", "Treatment plan"],
    art: ["#e0e8f5", "#aebfe3", "🖥️", "💬", "🌿"],
  },
};