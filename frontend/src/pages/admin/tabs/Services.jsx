import { useState } from "react";

const DEFAULT_CATEGORIES = ['Facials', 'Advanced Treatments', 'Anti-Aging', 'Acne & Deep Clarity', 'Botanical Calming', 'Enhancements', 'Massage', 'Waxing & Threading', 'Consultation'];

// Skin Quiz ke 4 results. Left side: quiz me customer ka jawab, right side: kaunsi service dikhani hai.
const QUIZ_RESULTS = [
  ['signature', 'Signature Holistic Glow', 'Customer picks "Signature Holistic Glow" in the quiz'],
  ['cleansing', 'Deep Cleansing', 'Customer picks "Deep Cleansing & Purifying Ritual"'],
  ['aging-facial', 'Rejuvenating & Firming', 'Customer picks "Rejuvenating & Firming Therapy"'],
  ['soothing', 'Calming & Sensitive', 'Customer picks "Calming Botanical Healing"'],
];

function Row({ s, count, onSave, onDelete }) {
  const [f, setF] = useState({ 
    name: s.name, 
    category: s.category || 'Facials', 
    price: s.price, 
    duration: s.duration, 
    desc: s.desc || "",
    imageUrl: s.imageUrl || s.image || ""
  });
  
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  
  const dirty = 
    f.name !== s.name || 
    f.category.trim() !== (s.category || 'Facials') || 
    Number(f.price) !== s.price || 
    Number(f.duration) !== s.duration || 
    f.desc !== (s.desc || "") ||
    f.imageUrl !== (s.imageUrl || s.image || "");
    
  const active = s.active !== false;

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${s.name}"?`)) {
      onDelete(s.id);
    }
  };

  return (
    <div className={`adm-svc ${active ? "" : "off"}`}>
      <div>
        <input className="adm-in" value={f.name} onChange={set("name")} aria-label="Service name" placeholder="Service name" />
        <span className="adm-muted">{count} booking{count === 1 ? "" : "s"} · id: {s.id}</span>
      </div>
      
      <input className="adm-in" list="adm-cats" value={f.category} onChange={set("category")} aria-label="Category" placeholder="Category" />

      <input className="adm-in" type="number" min="0" value={f.price} onChange={set("price")} aria-label="Price" placeholder="Price" />
      <input className="adm-in" type="number" min="5" step="5" value={f.duration} onChange={set("duration")} aria-label="Duration" placeholder="Mins" />
      <input className="adm-in" value={f.desc} onChange={set("desc")} aria-label="Description" placeholder="Description" />
      <input className="adm-in" value={f.imageUrl} onChange={set("imageUrl")} aria-label="Image URL" placeholder="Photo/Image URL" />
      
      <div className="adm-row" style={{ gap: 8 }}>
        <button className="adm-btn sm" disabled={!dirty} onClick={() => onSave(s.id, f)}>Save</button>
        <label className="adm-check">
          <input type="checkbox" checked={active} onChange={(e) => onSave(s.id, { active: e.target.checked })} /> Bookable
        </label>
        <button className="adm-btn sm ghost" style={{ color: "#d9534f", borderColor: "rgba(217,83,79,0.3)" }} onClick={handleDelete} title="Delete service">
          🗑️
        </button>
      </div>
    </div>
  );
}

function QuizPanel({ services, quizMap, onSaveQuizMap }) {
  const [m, setM] = useState({ ...(quizMap || {}) });
  const options = (services || []).filter((x) => x.id !== 'virt');
  const dirty = QUIZ_RESULTS.some(([k]) => m[k] !== (quizMap || {})[k]);

  return (
    <div className="adm-panel" style={{ marginTop: 18 }}>
      <h3>Skin Quiz results</h3>
      <p className="adm-muted" style={{ marginBottom: 12 }}>
        At the end of the Skin Quiz, the customer sees one recommended facial. Choose which service each quiz answer recommends.
        The name, price, time and description come from the service above, so editing the service updates the quiz result too.
      </p>
      {QUIZ_RESULTS.map(([key, label, hint]) => {
        const chosen = options.find((x) => x.id === m[key]);
        return (
          <div key={key} style={{ display: "grid", gridTemplateColumns: "minmax(160px, 1fr) minmax(220px, 2fr)", gap: 12, alignItems: "center", padding: "10px 0", borderBottom: "1px solid #f3ece1" }}>
            <div>
              <strong>{label}</strong>
              <span className="adm-muted" style={{ display: "block", fontSize: ".78rem" }}>{hint}</span>
            </div>
            <div>
              <select className="adm-in" value={m[key] || ""} onChange={(e) => setM({ ...m, [key]: e.target.value })} aria-label={`Service for ${label}`}>
                {!chosen && <option value="">Choose a service…</option>}
                {options.map((x) => (
                  <option key={x.id} value={x.id} disabled={x.active === false}>
                    {x.name} · ${x.price} · {x.duration} min{x.active === false ? " (hidden)" : ""}
                  </option>
                ))}
              </select>
            </div>
          </div>
        );
      })}
      <div style={{ marginTop: 14 }}>
        <button className="adm-btn" disabled={!dirty} onClick={() => onSaveQuizMap(m)}>Save quiz results</button>
      </div>
    </div>
  );
}

export default function Services({ services, bookings, quizMap, onSave, onCreate, onDelete, onSaveQuizMap }) {
  const categoryList = Array.from(new Set([...DEFAULT_CATEGORIES, ...(services || []).map((x) => x.category).filter(Boolean)]));
  const [n, setN] = useState({ name: "", category: DEFAULT_CATEGORIES[0], price: "", duration: "", desc: "", imageUrl: "" });
  const set = (k) => (e) => setN({ ...n, [k]: e.target.value });
  
  const countFor = (id) => (bookings || []).filter((b) => b.serviceId === id).length;

  const add = async () => {
    const r = await onCreate(n);
    if (r) setN({ name: "", category: DEFAULT_CATEGORIES[0], price: "", duration: "", desc: "", imageUrl: "" });
  };

  return (
    <>
      <datalist id="adm-cats">
        {categoryList.map((c) => <option key={c} value={c} />)}
      </datalist>
      <div className="adm-panel">
        <h3>All services & Treatments</h3>
        <p className="adm-muted" style={{ marginBottom: 12 }}>
          Manage your spa services, prices, categories, and custom photo URLs. Untick “Bookable” to temporarily hide a service from clients.
        </p>
        
        <div className="adm-svc" style={{ fontSize: ".75rem", color: "var(--mut)", fontWeight: 600 }}>
          <span>Name</span>
          <span>Category</span>
          <span>Price ($)</span>
          <span>Minutes</span>
          <span>Description</span>
          <span>Photo / Image URL</span>
          <span>Actions</span>
        </div>
        
        {(services || []).map((s) => (
          <Row key={s.id + s.price + s.duration + s.name + s.active + s.category + (s.imageUrl || "")} s={s} count={countFor(s.id)} onSave={onSave} onDelete={onDelete} />
        ))}
      </div>

      <div className="adm-panel" style={{ marginTop: 18 }}>
        <h3>Add a new service</h3>
        <div className="adm-svc" style={{ borderBottom: 0 }}>
          <input className="adm-in" placeholder="Service Name" value={n.name} onChange={set("name")} />
          
          <input className="adm-in" list="adm-cats" placeholder="Category (type a new one or pick)" value={n.category} onChange={set("category")} />
          
          <input className="adm-in" type="number" placeholder="Price ($)" value={n.price} onChange={set("price")} />
          <input className="adm-in" type="number" placeholder="Duration (min)" value={n.duration} onChange={set("duration")} />
          <input className="adm-in" placeholder="Short description" value={n.desc} onChange={set("desc")} />
          <input className="adm-in" placeholder="Photo URL (e.g. /gallery/1.jpg)" value={n.imageUrl} onChange={set("imageUrl")} />
          
          <button className="adm-btn" disabled={!n.name || n.price === "" || !n.duration} onClick={add}>
            + Add service
          </button>
        </div>
      </div>

      <QuizPanel key={JSON.stringify(quizMap || {})} services={services} quizMap={quizMap} onSaveQuizMap={onSaveQuizMap} />
    </>
  );
}