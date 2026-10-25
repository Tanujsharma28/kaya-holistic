import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { logActivity } from "../api/userClient";
import { SERVICE_DETAILS } from "../data/serviceDetails";

// Har service ke liye matching photo (Unsplash CDN – relevant to exact treatment)
const IMG = (id) => `https://images.unsplash.com/photo-${id}?w=600&h=700&fit=crop&auto=format&q=80`;
const SERVICE_IMG = {
  // Express facial – quick refresh, esthetician hands on glowing skin
  express:    IMG("1570172619644-dfd03ed5d881"),
  // Deep cleansing – steam + clay mask on face
  deep:       IMG("1596755389378-c31d21fd1273"),
  // Ultimate – gua sha stone massage, full ritual
  ultimate:   IMG("1519823551278-64ac92734fb1"),
  // Anti-aging – jade roller, firming facial massage
  anti:       IMG("1614859324967-bdf413c45494"),
  // Hydradermabrasion – dewy glowing hydrated skin close-up
  hydra:      IMG("1559757175-0eb30cd8c063"),
  // Diamond microdermabrasion – resurfacing device on skin
  diamond:    IMG("1522337360788-8b13dee7a37e"),
  // Nano-needling serum infusion – micro-needling device
  nano:       IMG("1612349317150-e413f6a5b16d"),
  // Men's facial – man on treatment bed, clean skin
  gent:       IMG("1621607512214-68297480165e"),
  // Indian head massage – head & neck relaxation
  ihm:        IMG("1600334129128-685c5582fd35"),
  // Full face waxing – precision waxing close-up
  wax:        IMG("1560750588-73207b1ef5b8"),
  // Signature tailored facial – luxury layered facial
  signature:  IMG("1544161515-4ab6ce6db874"),
  // Lymphatic drainage – sculpting facial massage
  lymph:      IMG("1515377905703-c4788e51af15"),
  // Purifying facial – deep pore cleansing, charcoal
  purify:     IMG("1616394584738-fc6e612e71b9"),
  // Clear skin / acne facial – breakout-prone skin treatment
  clear:      IMG("1598440947619-2c35fc9aa908"),
  // Rosacea / sensitive skin – calming gentle facial
  rosacea:    IMG("1512290923902-8a9f81dc236c"),
  // LED corrective therapy – LED light panel on face
  corrective: IMG("1487412720507-e7ab37603c6f"),
  // Holistic facial – full balance, botanical oils
  holistic:   IMG("1471639549519-80f7c8b50be4"),
  // Teen gentle facial – young skin care
  teen:       IMG("1508214751196-bcfd4ca60f91"),
  // Dermaplaning – blade gliding for smooth glow
  dermaplane: IMG("1556228852-80b6678ced23"),
  // Brightening facial – radiant lit-from-within skin
  brighten:   IMG("1571875257727-256c39da42af"),
  // MD Peel – chemical peel, skin resurfacing
  mdpeel:     IMG("1586996292898-71f4036c4e07"),
  // Virtual consultation – video skincare session
  virt:       IMG("1587614382346-4ec70e388b28"),
};


const SERVICE_META = {
  express: {
    icon: "🌿",
    tagline: "Quick glow, no compromise",
    desc: "A targeted express facial to cleanse, exfoliate & hydrate — perfect for a lunch-break refresh.",
    tag: "Popular",
  },
  deep:    {
    icon: "💧",
    tagline: "Deep clean for clear skin",
    desc: "Steam & enzyme exfoliation to unclog pores, followed by a calming mask suited to your skin type.",
    tag: null,
  },
  ultimate: {
    icon: "✨",
    tagline: "Our signature experience",
    desc: "Full facial ritual — double cleanse, gua sha massage, LED therapy & personalised serum layering.",
    tag: "Best Value",
  },
  anti:    {
    icon: "⏳",
    tagline: "Turn back the clock",
    desc: "Peptide-rich treatment that firms, plumps & visibly reduces fine lines with advanced lifting massage.",
    tag: null,
  },
  hydra:   {
    icon: "💦",
    tagline: "Instant radiance boost",
    desc: "Hyaluronic-infused hydradermabrasion leaves skin dewy, bouncy & luminous — zero downtime.",
    tag: "Fan Favourite",
  },
  diamond: {
    icon: "💎",
    tagline: "Crystal-clear complexion",
    desc: "Diamond-tip microdermabrasion resurfaces skin texture and fades pigmentation for a porcelain finish.",
    tag: null,
  },
  nano:    {
    icon: "🧬",
    tagline: "Science meets skincare",
    desc: "Nano-needling infusion drives active serums deep into the dermis, amplifying results significantly.",
    tag: "Advanced",
  },
  gent:    {
    icon: "🧔",
    tagline: "Skincare for every skin",
    desc: "A no-fuss, results-driven facial designed specifically for men's skin — tough on congestion, gentle on texture.",
    tag: null,
  },
  ihm:     {
    icon: "🙏",
    tagline: "Head · face · décolletage",
    desc: "Indian head massage combined with a face & neck treatment for complete upper-body relaxation.",
    tag: null,
  },
  wax:     {
    icon: "🌸",
    tagline: "Smooth & long-lasting",
    desc: "Precision facial waxing using low-temperature stripless wax — gentle even on sensitive skin.",
    tag: null,
  },
  signature: { icon: "✨", tagline: "Tailored by Puja or Sia", tag: "Most Popular" },
  lymph:     { icon: "💆", tagline: "Lift · sculpt · de-puff", tag: null },
  purify:    { icon: "💧", tagline: "Deep clarity for clear skin", tag: null },
  clear:     { icon: "🍃", tagline: "Calm breakouts, clear congestion", tag: null },
  rosacea:   { icon: "🌿", tagline: "Soothe redness & sensitivity", tag: null },
  corrective:{ icon: "💡", tagline: "LED light therapy", tag: null },
  holistic:  { icon: "🌿", tagline: "Total balance & glow", tag: null },
  teen:      { icon: "🌱", tagline: "Gentle care for young skin", tag: null },
  dermaplane:{ icon: "🪞", tagline: "Smooth, instant glow", tag: null },
  brighten:  { icon: "🌟", tagline: "Brighter, clearer skin", tag: null },
  mdpeel:    { icon: "💎", tagline: "Resurface & refine", tag: null },
  virt:    {
    icon: "🖥️",
    tagline: "Expert skin advice, anywhere",
    desc: "One-on-one video skin analysis with Puja — personalised routine, product picks & treatment plan.",
    tag: "Online",
  },
};

const DEFAULT_META = { icon: "🌸", tagline: "Personalised treatment", desc: "A bespoke spa experience tailored to your unique skin needs.", tag: null };

export default function ServiceCard({ service }) {
  const navigate = useNavigate();
  const { setSelectedService } = useApp();
  const [open, setOpen] = useState(false);
  const meta = SERVICE_META[service.id] || DEFAULT_META;
  const badge = service.popular ? "Very Popular" : meta.tag;
  const isVirt = service.id === "virt";
  const det = SERVICE_DETAILS[service.id];
  const text = service.desc || meta.desc;            // card par chhota text
  const longText = det?.long || text;                 // popup me poora text
  const [imgOk, setImgOk] = useState(true);           // /services/<id>.jpg na mile to art panel
  const [c1, c2, e1, e2, e3] = det?.art || ["#f3e6d3", "#d9bb93", meta.icon, "🌿", "✨"];

  // Modal ke "Key benefits": admin ne service.highlights diya ho to wo, warna details, warna service ke data se
  const highlights = Array.isArray(service.highlights) && service.highlights.length
    ? service.highlights
    : det?.points || [
        `${service.duration} minute session`,
        service.category,
        isVirt ? "Live 1-on-1 over Google Meet" : "With licensed estheticians Puja or Sia",
        isVirt ? "Personalised routine & product picks" : "Customised to your skin",
      ].filter(Boolean);

  // Esc se band + modal khula ho to page scroll lock
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = prev; };
  }, [open]);

  const handleBook = () => {
    logActivity("book_click", { service: service.name });
    setSelectedService(service);
    setOpen(false);
    navigate("/booking");
  };

  const img = SERVICE_IMG[service.id];

  return (
    <>
      <div className="svc-card" onClick={() => setOpen(true)}>
        {badge && <span className="svc-tag">{badge}</span>}
        <div className="svc-card-top">
          <div className="svc-card-icon">{meta.icon}</div>
          <div className="svc-card-dur">{service.duration} min</div>
        </div>
        <h4 className="svc-card-name">{service.name}</h4>
        <p className="svc-card-tagline">{meta.tagline}</p>
        <p className="svc-card-desc">{text}</p>
        <div className="svc-card-footer">
          <span className="svc-card-price">${service.price}</span>
          <button className="svc-card-btn">View details →</button>
        </div>
      </div>

      {/* Portal: 3D carousel ke transform ke bahar, taaki modal poori screen par aaye */}
      {open && createPortal(
        <div className="kaya-lightbox-overlay" onClick={() => setOpen(false)}>
          <div className="kaya-lightbox-modal" role="dialog" aria-modal="true" aria-label={service.name} onClick={(e) => e.stopPropagation()}>
            <button className="kaya-lightbox-close" onClick={() => setOpen(false)} aria-label="Close">✕</button>
            <div className="kaya-lightbox-grid">
              <div className="kaya-lightbox-img-wrap">
                {imgOk ? (
                  <img src={`/services/${service.id}.jpg`} alt={service.name} onError={() => setImgOk(false)} />
                ) : (
                  <div className="svc-modal-art" style={{ background: `linear-gradient(160deg, ${c1}, ${c2})` }}>
                    <div className="svc-modal-icon">{e1}</div>
                    <div className="svc-modal-mini"><span>{e2}</span><span>{e3}</span></div>
                    <div className="svc-modal-facts">
                      <span>{service.duration} min</span>
                      <span>${service.price}</span>
                    </div>
                  </div>
                )}
                {badge && <span className="lightbox-img-badge">{badge}</span>}
              </div>

              <div className="kaya-lightbox-details">
                <div className="lightbox-header">
                  <span className="lightbox-cat">{service.category || "Treatment"}</span>
                  <h3>{service.name}</h3>
                  <h4 className="lightbox-sub">{meta.tagline}</h4>
                </div>

                <p className="lightbox-desc">{longText}</p>

                <div className="lightbox-highlights-sec">
                  <h5>Key Benefits & Details:</h5>
                  <ul className="lightbox-highlights-list">
                    {highlights.map((point, i) => (
                      <li key={i}><span className="check-icon">🌿</span><span>{point}</span></li>
                    ))}
                  </ul>
                </div>
                {!isVirt && (
                  <p className="lightbox-desc" style={{ fontSize: ".88rem" }}>
                    <b>What to expect:</b> a relaxing, customised service with spa music, a cozy bed, hot towels, aromatherapy, answers to your skin-care questions and tips for regular care at home.
                  </p>
                )}
                <div className="lightbox-footer-action">
                  <button className="btn primary-spa-btn" onClick={handleBook}>Book Now · ${service.price}</button>
                  <button className="btn ghost-spa-btn" onClick={() => setOpen(false)}>Close</button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}