import { useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";

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
  const meta = SERVICE_META[service.id] || DEFAULT_META;

  const handleClick = () => {
    setSelectedService(service);
    navigate("/booking");
  };

  return (
    <div className="svc-card" onClick={handleClick}>
      {meta.tag && <span className="svc-tag">{meta.tag}</span>}
      <div className="svc-card-top">
        <div className="svc-card-icon">{meta.icon}</div>
        <div className="svc-card-dur">{service.duration} min</div>
      </div>
      <h4 className="svc-card-name">{service.name}</h4>
      <p className="svc-card-tagline">{meta.tagline}</p>
      <p className="svc-card-desc">{meta.desc}</p>
      <div className="svc-card-footer">
        <span className="svc-card-price">${service.price}</span>
        <button className="svc-card-btn">Book now →</button>
      </div>
    </div>
  );
}