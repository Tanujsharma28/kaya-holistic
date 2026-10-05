import { useState, useEffect, useRef } from "react";

const GALLERY_ITEMS = [
  {
    id: 1,
    src: "/gallery/1.jpg",
    title: "Aromatic Massage & Oil Therapy",
    category: "Holistic Spa Ritual",
    subtitle: "Pure Organic Essential Oils",
    description: "Nourishing, essential-oil infused bodywork designed to deeply hydrate skin and soothe sensory overload.",
    highlights: ["Custom Blend Oils", "Deep Tension Release", "Aromatherapy Infusion", "Skin Hydration"],
    badge: "Signature Ritual"
  },
  {
    id: 2,
    src: "/gallery/2.jpg",
    title: "Sanctuary Treatment Suite",
    category: "Spa Atmosphere",
    subtitle: "Calm & Intentional Space",
    description: "Our serene, warm-lit Evanston sanctuary featuring arched accents, plush organic linens, and acoustic ambient sounds.",
    highlights: ["Minimalist Warm Wood", "Dual Tables Available", "Calming Acoustic Ambience", "Private Sanctuary"],
    badge: "Sanctuary Space"
  },
  {
    id: 3,
    src: "/gallery/3.jpg",
    title: "Inner Form Massage Therapy",
    category: "Specialized Treatment",
    subtitle: "Nervous System Reset",
    description: "A slow, grounding full-body massage designed to release deep physical tension and settle your nervous system.",
    highlights: ["Relieves Muscle Tension", "Calms Nervous System", "Improves Circulation", "Deep Relaxation"],
    badge: "Mind-Body Alignment"
  },
  {
    id: 4,
    src: "/gallery/4.jpg",
    title: "Deep Tissue & Posture Relief",
    category: "Therapeutic Focus",
    subtitle: "Targeted Healing & Alignment",
    description: "Targeted deep tissue manipulation relieving chronic pain, reducing muscle inflammation, and restoring natural mobility.",
    highlights: ["Pain Relief", "Reduced Inflammation", "Improved Mobility", "Posture Correction", "Stress Relief"],
    badge: "Targeted Relief"
  },
  {
    id: 5,
    src: "/gallery/5.jpg",
    title: "Dual-Technique Bodywork",
    category: "Custom Protocol",
    subtitle: "One Session · Two Techniques",
    description: "One personalized treatment combining two specialized massage techniques tailored specifically to what your body needs.",
    highlights: ["Tailored Technique Pairing", "Specialized Bodywork", "Holistic Healing", "Personalized Consultation"],
    badge: "Tailored Protocol"
  },
  {
    id: 6,
    src: "/gallery/6.jpg",
    title: "The Journey of Massage",
    category: "Wellness Pathway",
    subtitle: "From Stress to Deep Rest",
    description: "A guided therapeutic path from initial tension to deep relaxation, soothing touch, and complete mind-body balance.",
    highlights: ["Stress & Tension Release", "Soothing Touch", "Mind & Body Balance", "Deep Relaxation", "Self-Care Moment"],
    badge: "Therapeutic Journey"
  },
  {
    id: 7,
    src: "/gallery/7.jpg",
    title: "Hidden Power of Your Soles",
    category: "Reflexology Mapping",
    subtitle: "Core Body Reflexology",
    description: "Specialized foot reflexology mapping your soles — connecting toes to head & senses, arches to core alignment, and heels to stress release.",
    highlights: ["Head & Senses Connection", "Chest & Heart Mirroring", "Core Body Map", "Spine Edge Relief", "Heel Stress Release"],
    badge: "Reflexology Map"
  },
  {
    id: 8,
    src: "/gallery/8.jpg",
    title: "Glow Together: His + Hers Treatments",
    category: "Couples Package",
    subtitle: "Shared Renewal & Bodywork",
    description: "Side-by-side couples skin and body rejuvenation treatments designed for shared rest, glow, and deep renewal.",
    highlights: ["His + Hers Pairing", "Dual Therapists", "Skin & Body Glow", "Couples Sanctuary"],
    badge: "Couples Sanctuary"
  }
];

export default function Gallery() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [rotationY, setRotationY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startX = useRef(0);
  const startRotation = useRef(0);
  const itemCount = GALLERY_ITEMS.length;
  const angleStep = 360 / itemCount;

  // Auto spin effect (3-second auto scroll)
  useEffect(() => {
    if (isPaused || isDragging || selectedItem) return;
    const interval = setInterval(() => {
      setRotationY((prev) => prev - angleStep);
      setActiveIndex((prev) => (prev + 1) % itemCount);
    }, 3000);
    return () => clearInterval(interval);
  }, [isPaused, isDragging, selectedItem, angleStep, itemCount]);

  // Sync activeIndex with rotation angle
  const goToIndex = (index) => {
    let diff = index - activeIndex;
    if (diff > itemCount / 2) diff -= itemCount;
    if (diff < -itemCount / 2) diff += itemCount;
    setRotationY((prev) => prev - diff * angleStep);
    setActiveIndex(index);
  };

  const handlePrev = () => {
    const nextIdx = (activeIndex - 1 + itemCount) % itemCount;
    goToIndex(nextIdx);
  };

  const handleNext = () => {
    const nextIdx = (activeIndex + 1) % itemCount;
    goToIndex(nextIdx);
  };

  // Pointer drag handlers
  const handlePointerDown = (e) => {
    setIsDragging(true);
    startX.current = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    startRotation.current = rotationY;
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    const currentX = e.clientX || (e.touches && e.touches[0].clientX) || 0;
    const deltaX = currentX - startX.current;
    const newRotation = startRotation.current + deltaX * 0.45;
    setRotationY(newRotation);
  };

  const handlePointerUp = () => {
    if (!isDragging) return;
    setIsDragging(false);
    // Snap to nearest item index
    const normalizedRotation = ((-rotationY % 360) + 360) % 360;
    const nearestIndex = Math.round(normalizedRotation / angleStep) % itemCount;
    setActiveIndex(nearestIndex);
    setRotationY(-nearestIndex * angleStep);
  };

  // Keyboard navigation when modal is open
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!selectedItem) return;
      if (e.key === "Escape") setSelectedItem(null);
      if (e.key === "ArrowRight") {
        const nextIdx = (selectedItem.id % itemCount) + 1;
        setSelectedItem(GALLERY_ITEMS.find((item) => item.id === nextIdx));
      }
      if (e.key === "ArrowLeft") {
        const prevIdx = ((selectedItem.id - 2 + itemCount) % itemCount) + 1;
        setSelectedItem(GALLERY_ITEMS.find((item) => item.id === prevIdx));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedItem, itemCount]);

  const activeItem = GALLERY_ITEMS[activeIndex];

  return (
    <section className="kaya-gallery-section" aria-label="Inside Kaya Gallery">
      <div className="kaya-gallery-bg-glow glow-1" />
      <div className="kaya-gallery-bg-glow glow-2" />

      <div className="kaya-gallery-header">
        <div className="kaya-section-tag">
          <span className="sparkle">✨</span> INSIDE KAYA HOLISTIC SANCTUARY
        </div>
        <h2>
          Experience the <span className="italic-accent">Serene Sanctuary</span>
        </h2>
        <p className="kaya-gallery-sub">
          A glimpse into our tranquil Evanston spa space — designed for healing, deep rest, and holistic body rejuvenation.
        </p>
      </div>

      {/* 3D Cylinder Carousel Stage */}
      <div
        className="kaya-3d-stage-wrapper"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <div className="kaya-3d-stage">
          <div
            className={`kaya-3d-ring ${isDragging ? "is-dragging" : ""}`}
            style={{ transform: `rotateY(${rotationY}deg)` }}
          >
            {GALLERY_ITEMS.map((item, i) => {
              const cardAngle = i * angleStep;
              // Calculate relative distance from front facing card
              const currentRingAngle = ((-rotationY % 360) + 360) % 360;
              let angleDiff = Math.abs(cardAngle - currentRingAngle);
              if (angleDiff > 180) angleDiff = 360 - angleDiff;
              const isFront = angleDiff < 30;

              return (
                <div
                  key={item.id}
                  className={`kaya-3d-card ${isFront ? "is-front" : ""}`}
                  style={{
                    transform: `rotateY(${cardAngle}deg) translateZ(360px)`,
                  }}
                  onClick={() => {
                    if (isFront) {
                      setSelectedItem(item);
                    } else {
                      goToIndex(i);
                    }
                  }}
                >
                  <div className="card-inner-frame">
                    <img src={item.src} alt={item.title} loading="lazy" />
                    <div className="card-badge">{item.badge}</div>
                    <div className="card-overlay">
                      <span className="card-cat">{item.category}</span>
                      <h4>{item.title}</h4>
                      <span className="expand-hint">🔍 Tap to inspect details</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Carousel Nav Arrows */}
        <button
          className="kaya-nav-arrow left"
          onClick={handlePrev}
          aria-label="Previous image"
        >
          ‹
        </button>
        <button
          className="kaya-nav-arrow right"
          onClick={handleNext}
          aria-label="Next image"
        >
          ›
        </button>
      </div>

      {/* Active Highlight Info Bar */}
      {activeItem && (
        <div className="kaya-active-info-card">
          <div className="info-meta">
            <span className="info-badge">{activeItem.badge}</span>
            <span className="info-cat">{activeItem.category}</span>
          </div>
          <h3>{activeItem.title}</h3>
          <p>{activeItem.description}</p>
          <div className="info-tags">
            {activeItem.highlights.map((h, idx) => (
              <span key={idx} className="info-chip">
                ✦ {h}
              </span>
            ))}
          </div>
          <button
            className="kaya-inspect-btn"
            onClick={() => setSelectedItem(activeItem)}
          >
            <span>✨ View Full Spa Details</span>
          </button>
        </div>
      )}

      {/* Thumbnail Selector Pills */}
      <div className="kaya-thumb-bar">
        {GALLERY_ITEMS.map((item, idx) => (
          <button
            key={item.id}
            className={`kaya-thumb-item ${idx === activeIndex ? "active" : ""}`}
            onClick={() => goToIndex(idx)}
          >
            <img src={item.src} alt={item.title} />
            <span className="thumb-label">{item.title}</span>
          </button>
        ))}
      </div>

      <p className="kaya-drag-hint">
        💡 Drag or swipe horizontally to spin the 3D gallery · Click any photo for interactive view
      </p>

      {/* Interactive Spa Details Lightbox Modal */}
      {selectedItem && (
        <div
          className="kaya-lightbox-overlay"
          onClick={() => setSelectedItem(null)}
        >
          <div
            className="kaya-lightbox-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="kaya-lightbox-close"
              onClick={() => setSelectedItem(null)}
              aria-label="Close modal"
            >
              ✕
            </button>
            <div className="kaya-lightbox-grid">
              <div className="kaya-lightbox-img-wrap">
                <img src={selectedItem.src} alt={selectedItem.title} />
                <span className="lightbox-img-badge">{selectedItem.badge}</span>
              </div>

              <div className="kaya-lightbox-details">
                <div className="lightbox-header">
                  <span className="lightbox-cat">{selectedItem.category}</span>
                  <h3>{selectedItem.title}</h3>
                  <h4 className="lightbox-sub">{selectedItem.subtitle}</h4>
                </div>

                <p className="lightbox-desc">{selectedItem.description}</p>

                <div className="lightbox-highlights-sec">
                  <h5>Key Spa Benefits & Features:</h5>
                  <ul className="lightbox-highlights-list">
                    {selectedItem.highlights.map((point, index) => (
                      <li key={index}>
                        <span className="check-icon">🌿</span>
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="lightbox-footer-action">
                  <a href="/booking" className="btn primary-spa-btn">
                    Book Session for this Treatment
                  </a>
                  <button
                    className="btn ghost-spa-btn"
                    onClick={() => setSelectedItem(null)}
                  >
                    Close Preview
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}