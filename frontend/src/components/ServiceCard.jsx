import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { logActivity } from "../api/userClient";
import { SERVICE_DETAILS } from "../data/serviceDetails";

// Har service ke liye matching photo (Unsplash CDN – relevant to exact treatment)
const IMG = (id) => `https://images.unsplash.com/photo-${id}?w=600&h=700&fit=crop&auto=format&q=80`;
const SERVICE_IMG = {
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
  // Nano-needling serum infusion – local uploaded image
  nano:       null,
  // Men's facial – local uploaded image
  gent:       null,
  // Indian head massage – local uploaded image
  ihm:        null,
  ihm30:      null,
  // Full face waxing – precision waxing close-up
  wax:          IMG("1560750588-73207b1ef5b8"),
  // Signature tailored facial – luxury layered facial
  signature:    IMG("1544161515-4ab6ce6db874"),
  // Lymphatic drainage – sculpting facial massage
  lymph:        IMG("1515377905703-c4788e51af15"),
  // Clear skin / acne facial – breakout-prone skin treatment
  clear:        IMG("1598440947619-2c35fc9aa908"),
  // Rosacea / sensitive skin – calming gentle facial
  rosacea:      IMG("1512290923902-8a9f81dc236c"),
  // LED corrective therapy – LED light panel on face
  corrective:   IMG("1487412720507-e7ab37603c6f"),
  // Teen gentle facial – young adult gentle skincare treatment (local /services/teen.jpg)
  teen:         null,
  // Dermaplaning – blade gliding for smooth glow
  dermaplane:   IMG("1556228852-80b6678ced23"),
  // Brightening facial – radiant lit-from-within skin
  brighten:     IMG("1571875257727-256c39da42af"),
  // Virtual consultation – video skincare session
  virt:         IMG("1587614382346-4ec70e388b28"),
  // Waxing & Threading sub-services – use local uploaded images (no Unsplash override)
  "wax-guasha": null,
  "wax-clear":  null,
  "wax-led":    null,
  "wax-derma":  null,
  "wax-ihm":    null,
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
  ihm30:     { icon: "🙏", tagline: "Head · face · décolletage", tag: null },
  back:      { icon: "🌿", tagline: "Clear, smooth, refreshed", tag: null },
  nuface:    { icon: "⚡", tagline: "Lift & tone upgrade", tag: "Add-on" },
  enzyme:    { icon: "🍃", tagline: "Extra glow upgrade", tag: "Add-on" },
  ledup:     { icon: "💡", tagline: "Light therapy upgrade", tag: "Add-on" },
  chempeel:  { icon: "🧴", tagline: "Deeper exfoliation upgrade", tag: "Add-on" },
  wax:     {
    icon: "🌸",
    tagline: "Full body · facial · threading · from $15",
    desc: "Full waxing & threading menu — eyebrows, lips, face, underarms, arms, legs, bikini and more. Low-temperature stripless wax, gentle even on sensitive skin.",
    tag: null,
  },
  "wax-guasha": { icon: "🪨", tagline: "Ayurvedic Gua Sha · sculpt · de-puff · relax", tag: null },
  "wax-clear":  { icon: "🍃", tagline: "Calm breakouts · clear congestion", tag: null },
  "wax-led":    { icon: "💡", tagline: "LED light therapy · all skin types", tag: null },
  "wax-derma":  { icon: "🪞", tagline: "Smooth · glow · peach fuzz removal", tag: "Popular" },
  "wax-ihm":    { icon: "🙏", tagline: "Traditional Ayurvedic head massage", tag: null },
  signature: { icon: "✨", tagline: "Tailored by Puja or Sia", tag: "Most Popular" },
  lymph:     { icon: "💆", tagline: "Ayurvedic Gua Sha · sculpt · de-puff", tag: null },
  clear:     { icon: "🍃", tagline: "Calm breakouts, clear congestion", tag: null },
  rosacea:   { icon: "🌿", tagline: "Soothe redness & sensitivity", tag: null },
  corrective:{ icon: "💡", tagline: "LED light therapy", tag: null },
  teen:      { icon: "🌱", tagline: "Gentle care for young skin", tag: null },
  dermaplane:{ icon: "🪞", tagline: "Smooth, instant glow", tag: null },
  brighten:  { icon: "🌟", tagline: "Brighter, clearer skin", tag: null },
  virt:    {
    icon: "🖥️",
    tagline: "Expert skin advice, anywhere",
    desc: "One-on-one video skin analysis with Puja — personalised routine, product picks & treatment plan.",
    tag: "Online",
  },
};


// Photo service ke NAAM se dhoondhta hai (public/services/ me). Ye sab naam chalte hain, e.g.
//   BrighteningGalvanicFacial.jpg, customizedfacial.png, Dermaplaning Facial.jpg, skinconsultation.jpg
// Na mile to service id (signature.jpg) par fallback. Jo pehle mile wahi lagta hai.
const PHOTO_EXTS = ["jpg", "jpeg", "png", "webp"];
// Jahan tumhari filename service ke naam se alag hai, wahan yahan likh do (extension ke bina)
const PHOTO_EXTRA = {
  corrective: ["correctivefacialwithledlight", "correctivefacialwithled", "correctivefacial"],
  virt: ["skinconsultation", "skinconsultationwithpuja", "skinconsult"],
  signature: ["customizedfacial", "customisedfacial"],
  dermaplane: ["DermaplaningFacial", "dermaplaningfacial", "dermaplaning"],
  brighten: ["BrighteningGalvanicFacial", "brighteninggalvanicfacial"],
  ultimate: ["UltimateFacial", "ultimatefacial"],
};
function photoCandidates(service) {
  const base = String(service.name || "")
    .replace(/\(.*?\)/g, "")           // "(60 min)" hata do
    .replace(/w\s*\/\s*/gi, "with ")    // "w/ LED" -> "with LED"
    .replace(/[\/\\']/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  const words = base.split(" ").filter(Boolean);
  const names = new Set(PHOTO_EXTRA[service.id] || []);
  // poora naam + chhote-chhote hisse ("Skin Consultation With Puja" -> "SkinConsultation", ...)
  for (let n = words.length; n >= 1; n--) {
    const part = words.slice(0, n);
    if (n < 2 && words.length > 1) continue;
    const joined = part.join("");
    names.add(joined);                       // BrighteningGalvanicFacial
    names.add(joined.toLowerCase());         // brighteninggalvanicfacial
    names.add(part.join(" "));               // Brightening Galvanic Facial
    names.add(part.join(" ").toLowerCase());
    names.add(part.join("-").toLowerCase()); // brightening-galvanic-facial
    names.add(part.join("_").toLowerCase());
  }
  const out = [];
  names.forEach((nm) => PHOTO_EXTS.forEach((e) => out.push(`/services/${encodeURIComponent(nm)}.${e}`)));
  PHOTO_EXTS.forEach((e) => out.push(`/services/${service.id}.${e}`));
  return out;
}

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
  const expectText = det?.expect;
  const isWax = service.id === "wax";
  const durLabel = isWax ? "15–45 min" : `${service.duration} min`;
  const pricePre = isWax ? "From " : "";
  const photos = useMemo(() => photoCandidates(service), [service.id, service.name]);
  const [imgIdx, setImgIdx] = useState(0);                // agli photo try karo; sab fail to art panel
  const imgOk = imgIdx < photos.length;
  const photoSrc = photos[imgIdx];
  const setImgOk = () => setImgIdx((i) => i + 1);
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

  // For wax sub-services: null in SERVICE_IMG means use local /services/<id>.jpg
  const img = SERVICE_IMG[service.id] === null ? undefined : SERVICE_IMG[service.id];

  return (
    <>
      <div className="svc-card" onClick={() => setOpen(true)}>
        {badge && <span className="svc-tag">{badge}</span>}
        <div className="svc-card-top">
          <div className="svc-card-icon">{meta.icon}</div>
          <div className="svc-card-dur">{durLabel}</div>
        </div>
        <h4 className="svc-card-name">{service.name}</h4>
        <p className="svc-card-tagline">{meta.tagline}</p>
        <p className="svc-card-desc">{text}</p>
        <div className="svc-card-footer">
          <span className="svc-card-price">{pricePre}${service.price}</span>
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
                 det?.imgFit === "contain" ? (
  <>
    <img src={photoSrc} alt="" aria-hidden="true" className="svc-img-blur" />
    <img
      src={photoSrc}
      alt={service.name}
      className="svc-img-full"
      onError={() => setImgOk(false)}
    />
  </>
) : (
  <img
    src={photoSrc}
    alt={service.name}
    style={{ objectPosition: det?.imgPos || "center" }}
    onError={() => setImgOk(false)}
  />
)
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
                  <h5>{det?.pointsTitle || "Key Benefits & Details:"}</h5>
                  <ul className="lightbox-highlights-list">
                    {highlights.map((point, i) => (
                      <li key={i}><span className="check-icon">🌿</span><span>{point}</span></li>
                    ))}
                  </ul>
                </div>
                {!isVirt && (
                  <p className="lightbox-desc" style={{ fontSize: ".88rem" }}>
                    <b>What to expect:</b> {expectText || "a relaxing, customised service with spa music, a cozy bed, hot towels, aromatherapy, answers to your skin-care questions and tips for regular care at home."}
                  </p>
                )}
                <div className="lightbox-footer-action">
                  <button className="btn primary-spa-btn" onClick={handleBook}>Book Now · {pricePre}${service.price}</button>
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