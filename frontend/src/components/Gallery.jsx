const photos = ["/gallery/1.jpg", "/gallery/2.jpg", "/gallery/3.jpg", "/gallery/4.jpg", "/gallery/5.jpg"];
const angleStep = 360 / photos.length;

export default function Gallery() {
  return (
    <section className="gallery">
      <h2>Inside Kaya</h2>
      <p style={{ color: "var(--mut)", marginTop: "-18px", marginBottom: "40px" }}>
        A glimpse into the calm, intentional space we've built for you.
      </p>
      <div className="cylinder-stage">
        <div className="cylinder-ring">
          {photos.map((src, i) => (
            <img
              src={src}
              alt=""
              key={i}
              loading="lazy"
              /* Fixed: Added multiply operator */
              style={{ transform: `rotateY(${i * angleStep}deg) translateZ(320px)` }}
            />
          ))}
        </div>
      </div>
    </section>
  );
}