import { useState } from "react";

const CATEGORIES = ['Facials', 'Enhancements', 'Massage', 'Waxing & Threading', 'Consultation'];

function Row({ s, count, onSave, onDelete }) {
  const [f, setF] = useState({ 
    name: s.name, 
    category: s.category || CATEGORIES[0], 
    price: s.price, 
    duration: s.duration, 
    desc: s.desc || "",
    imageUrl: s.imageUrl || s.image || ""
  });
  
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  
  const dirty = 
    f.name !== s.name || 
    f.category !== s.category || 
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
      
      <select className="adm-in" value={f.category} onChange={set("category")} aria-label="Category">
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

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

export default function Services({ services, bookings, onSave, onCreate, onDelete }) {
  const [n, setN] = useState({ name: "", category: CATEGORIES[0], price: "", duration: "", desc: "", imageUrl: "" });
  const set = (k) => (e) => setN({ ...n, [k]: e.target.value });
  
  const countFor = (id) => (bookings || []).filter((b) => b.serviceId === id).length;

  const add = async () => {
    const r = await onCreate(n);
    if (r) setN({ name: "", category: CATEGORIES[0], price: "", duration: "", desc: "", imageUrl: "" });
  };

  return (
    <>
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
          
          <select className="adm-in" value={n.category} onChange={set("category")}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <input className="adm-in" type="number" placeholder="Price ($)" value={n.price} onChange={set("price")} />
          <input className="adm-in" type="number" placeholder="Duration (min)" value={n.duration} onChange={set("duration")} />
          <input className="adm-in" placeholder="Short description" value={n.desc} onChange={set("desc")} />
          <input className="adm-in" placeholder="Photo URL (e.g. /gallery/1.jpg)" value={n.imageUrl} onChange={set("imageUrl")} />
          
          <button className="adm-btn" disabled={!n.name || n.price === "" || !n.duration} onClick={add}>
            + Add service
          </button>
        </div>
      </div>
    </>
  );
}