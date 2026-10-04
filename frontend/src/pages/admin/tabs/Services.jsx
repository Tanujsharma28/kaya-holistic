import { useState } from "react";

// Master Categories (Humne backend schemas mein yahi discuss kiye the)
const CATEGORIES = ['Facials', 'Enhancements', 'Massage', 'Waxing & Threading', 'Consultation'];

function Row({ s, count, onSave }) {
  const [f, setF] = useState({ 
    name: s.name, 
    category: s.category || CATEGORIES[0], 
    price: s.price, 
    duration: s.duration, 
    desc: s.desc || "" 
  });
  
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });
  
  const dirty = 
    f.name !== s.name || 
    f.category !== s.category || 
    Number(f.price) !== s.price || 
    Number(f.duration) !== s.duration || 
    f.desc !== (s.desc || "");
    
  const active = s.active !== false;

  return (
    <div className={`adm-svc ${active ? "" : "off"}`}>
      <div>
        <input className="adm-in" value={f.name} onChange={set("name")} aria-label="Service name" />
        <span className="adm-muted">{count} booking{count === 1 ? "" : "s"} · id: {s.id}</span>
      </div>
      
      {/* Naya Category Dropdown */}
      <select className="adm-in" value={f.category} onChange={set("category")} aria-label="Category">
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      <input className="adm-in" type="number" min="0" value={f.price} onChange={set("price")} aria-label="Price in dollars" />
      <input className="adm-in" type="number" min="5" step="5" value={f.duration} onChange={set("duration")} aria-label="Duration in minutes" />
      <input className="adm-in" value={f.desc} onChange={set("desc")} aria-label="Description" />
      
      <div className="adm-row">
        <button className="adm-btn sm" disabled={!dirty} onClick={() => onSave(s.id, f)}>Save</button>
        <label className="adm-check">
          <input type="checkbox" checked={active} onChange={(e) => onSave(s.id, { active: e.target.checked })} /> Bookable
        </label>
      </div>
    </div>
  );
}

export default function Services({ services, bookings, onSave, onCreate }) {
  const [n, setN] = useState({ name: "", category: CATEGORIES[0], price: "", duration: "", desc: "" });
  const set = (k) => (e) => setN({ ...n, [k]: e.target.value });
  
  const countFor = (id) => (bookings || []).filter((b) => b.serviceId === id).length;

  const add = async () => {
    const r = await onCreate(n);
    // Success hone par form reset
    if (r) setN({ name: "", category: CATEGORIES[0], price: "", duration: "", desc: "" });
  };

  return (
    <>
      <div className="adm-panel">
        <h3>All services</h3>
        <p className="adm-muted" style={{ marginBottom: 6 }}>
          Price changes apply to new bookings only. Old bookings keep the price they were booked at. Untick “Bookable” to hide a service from the website without deleting it.
        </p>
        
        {/* Header mein Category add kiya */}
        <div className="adm-svc" style={{ fontSize: ".75rem", color: "var(--mut)", fontWeight: 600 }}>
          <span>Name</span>
          <span>Category</span>
          <span>Price ($)</span>
          <span>Minutes</span>
          <span>Description</span>
          <span />
        </div>
        
        {(services || []).map((s) => (
          <Row key={s.id + s.price + s.duration + s.name + s.active + s.category} s={s} count={countFor(s.id)} onSave={onSave} />
        ))}
      </div>

      <div className="adm-panel" style={{ marginTop: 18 }}>
        <h3>Add a service</h3>
        <div className="adm-svc" style={{ borderBottom: 0 }}>
          <input className="adm-in" placeholder="Name" value={n.name} onChange={set("name")} />
          
          {/* Naya Add Service Dropdown */}
          <select className="adm-in" value={n.category} onChange={set("category")}>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          
          <input className="adm-in" type="number" placeholder="Price" value={n.price} onChange={set("price")} />
          <input className="adm-in" type="number" placeholder="Minutes" value={n.duration} onChange={set("duration")} />
          <input className="adm-in" placeholder="Short description" value={n.desc} onChange={set("desc")} />
          
          <button className="adm-btn" disabled={!n.name || n.price === "" || !n.duration} onClick={add}>
            Add service
          </button>
        </div>
      </div>
    </>
  );
}