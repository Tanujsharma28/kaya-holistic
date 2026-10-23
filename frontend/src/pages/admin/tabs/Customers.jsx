import { useMemo, useState } from "react";
import { money, fmtDate, todayChicago, downloadCsv } from "../util";

const when = (iso) => (iso ? new Date(iso).toLocaleString() : "-");
const norm = (e = "") => String(e).trim().toLowerCase();
const PRESET_TAGS = ["VIP", "Sensitive skin", "Allergy alert", "Prefers Puja", "Prefers Sia", "Referral"];
const WINBACK_DAYS = 60;
const MAX_BCC = 40;

const daysBetween = (a, b) =>
  Math.round((new Date(b + "T12:00:00") - new Date(a + "T12:00:00")) / 86400000);

// "2004-06-28" -> agla birthday kab hai
const nextBirthday = (dob, today) => {
  const m = /^\d{4}-(\d{2})-(\d{2})$/.exec(dob || "");
  if (!m) return null;
  const year = Number(today.slice(0, 4));
  for (const y of [year, year + 1]) {
    const iso = `${y}-${m[1]}-${m[2]}`;
    if (Number.isNaN(new Date(iso + "T12:00:00").getTime())) continue;
    if (iso >= today) {
      return { iso, days: daysBetween(today, iso), label: fmtDate(iso, { month: "long", day: "numeric" }) };
    }
  }
  return null;
};

const pillStyle = (t) =>
  t.toLowerCase() === "vip" ? { background: "#f6e7c8", color: "#7c5c38" } : undefined;

function Card({ row, meta, onSaveMeta }) {
  const { c, i, lastVisit, sinceVisit, winback, bday } = row;
  const saved = meta || { tags: [], notes: "" };
  const [tags, setTags] = useState(saved.tags || []);
  const [notes, setNotes] = useState(saved.notes || "");
  const [custom, setCustom] = useState("");
  const [busy, setBusy] = useState(false);

  const dirty = notes !== (saved.notes || "") || JSON.stringify(tags) !== JSON.stringify(saved.tags || []);

  const addTag = (t) => {
    const v = t.trim().slice(0, 24);
    if (!v || tags.length >= 12 || tags.some((x) => x.toLowerCase() === v.toLowerCase())) return;
    setTags([...tags, v]);
  };

  const save = async () => {
    setBusy(true);
    await onSaveMeta(c.email, { tags, notes });
    setBusy(false);
  };

  return (
    <details className="adm-intake">
      <summary>
        <b>{c.name}</b>
        <span className="adm-muted">{c.email}</span>
        <span className="adm-pill">{c.registered ? "Account" : "Guest"}</span>
        <span className="adm-pill">{c.stats.bookings} booking{c.stats.bookings === 1 ? "" : "s"}</span>
        {(saved.tags || []).map((t) => (
          <span key={t} className="adm-pill" style={pillStyle(t)}>{t}</span>
        ))}
        {c.stats.upcoming > 0 && <span className="adm-pill" style={{ background: "#e4f2e4", color: "#2f6b34" }}>Next: {c.next?.date}</span>}
        {winback && <span className="adm-pill" style={{ background: "#fbeeea", color: "#8f2f20" }}>Win-back</span>}
        {bday && bday.days <= 30 && (
          <span className="adm-pill" style={{ background: "#eaf0fb", color: "#2f4f8f" }}>
            🎂 {bday.days === 0 ? "Today" : bday.label}
          </span>
        )}
        <span className="adm-muted" style={{ marginLeft: "auto" }}>{when(c.lastActivity)}</span>
      </summary>

      <div className="body">
        {[
          ["Phone", c.phone || "-"],
          ["Signed up", c.registered ? when(c.createdAt) : "No account (booked as guest)"],
          ["Last sign-in", c.registered ? `${when(c.lastLoginAt)} (${c.loginCount} times)` : "-"],
          ["Bookings", `${c.stats.bookings} total · ${c.stats.completed} completed · ${c.stats.upcoming} upcoming · ${c.stats.cancelled} cancelled`],
          ["Last visit", lastVisit ? `${fmtDate(lastVisit, { month: "short", day: "numeric", year: "numeric" })} (${sinceVisit} days ago)` : "No completed visit yet"],
          ["Next appointment", c.next ? `${c.next.serviceName} on ${c.next.date} at ${c.next.slot}` : "None"],
          ["Lifetime spend", `${money(i.spent || 0)} over ${i.visits || 0} completed visit${i.visits === 1 ? "" : "s"}`],
          ["Birthday", bday ? bday.label : "Not known (taken from the consent form)"],
          ["Consent form", i.consentAt ? `On file (${new Date(i.consentAt).toLocaleDateString()})` : "None on file"],
          ["Skin intakes", `${c.stats.intakes}`],
        ].map(([k, v]) => (
          <div className="adm-qa" key={k}><span>{k}</span><b>{v}</b></div>
        ))}

        <div className="adm-qa">
          <span>Tags</span>
          <div className="adm-row" style={{ gap: 6, marginTop: 6 }}>
            {tags.length === 0 && <span className="adm-muted">No tags yet</span>}
            {tags.map((t) => (
              <span key={t} className="adm-pill" style={pillStyle(t)}>
                {t}
                <button
                  type="button"
                  onClick={() => setTags(tags.filter((x) => x !== t))}
                  aria-label={`Remove ${t}`}
                  style={{ border: 0, background: "none", cursor: "pointer", color: "inherit", padding: 0, marginLeft: 6 }}
                >
                  ×
                </button>
              </span>
            ))}
          </div>
          <div className="adm-row" style={{ gap: 6, marginTop: 8 }}>
            {PRESET_TAGS.filter((p) => !tags.some((x) => x.toLowerCase() === p.toLowerCase())).map((p) => (
              <button type="button" key={p} className="adm-btn ghost sm" onClick={() => addTag(p)}>+ {p}</button>
            ))}
          </div>
          <div className="adm-row" style={{ gap: 6, marginTop: 8 }}>
            <input
              className="adm-in"
              style={{ maxWidth: 220 }}
              placeholder="Custom tag"
              value={custom}
              maxLength={24}
              onChange={(e) => setCustom(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(custom); setCustom(""); } }}
            />
            <button type="button" className="adm-btn ghost sm" disabled={!custom.trim()} onClick={() => { addTag(custom); setCustom(""); }}>
              Add tag
            </button>
          </div>
        </div>

        <div className="adm-qa">
          <span>Private notes (only you see this)</span>
          <textarea
            className="adm-in"
            style={{ marginTop: 6 }}
            value={notes}
            maxLength={2000}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Skin history, products she likes, preferences…"
          />
          <div className="adm-row" style={{ marginTop: 8 }}>
            <button className="adm-btn sm" disabled={!dirty || busy} onClick={save}>
              {busy ? "Saving…" : "Save tags and notes"}
            </button>
            {dirty && <span className="adm-muted">Unsaved changes</span>}
          </div>
        </div>

        <div className="adm-qa"><span>What this customer did</span></div>
        {c.events.map((e, idx) => (
          <div key={idx} style={{ padding: "5px 0", fontSize: ".9rem" }}>
            <span className="adm-muted" style={{ marginRight: 10 }}>{when(e.at)}</span>{e.text}
          </div>
        ))}
        <div className="adm-row" style={{ marginTop: 12 }}>
          <a className="adm-btn ghost sm" href={`mailto:${c.email}`} style={{ textDecoration: "none" }}>Email customer</a>
        </div>
      </div>
    </details>
  );
}

export default function Customers({ customers = [], bookings = [], consents = [], meta = {}, onSaveMeta }) {
  const [q, setQ] = useState("");
  const [seg, setSeg] = useState("all");
  const [sort, setSort] = useState("activity");
  const [copied, setCopied] = useState(false);
  const today = todayChicago();

  // email -> visits, spent, last visit, birthday, consent date
  const info = useMemo(() => {
    const map = new Map();
    const get = (e) => { if (!map.has(e)) map.set(e, { visits: 0, spent: 0, lastVisit: "", dob: "", consentAt: "" }); return map.get(e); };
    for (const b of bookings) {
      const e = norm(b.email);
      if (!e || String(b.status).toLowerCase() !== "completed") continue;
      const x = get(e);
      x.visits += 1;
      x.spent += b.price || 0;
      if (b.date > x.lastVisit) x.lastVisit = b.date;
    }
    for (const c of consents) {
      const e = norm(c.email);
      if (!e) continue;
      const x = get(e);
      if (!x.consentAt || String(c.createdAt) > x.consentAt) {
        x.consentAt = c.createdAt || "";
        if (c.dob) x.dob = c.dob;
      }
    }
    return map;
  }, [bookings, consents]);

  const rows = useMemo(
    () =>
      customers.map((c) => {
        const i = info.get(c.email) || {};
        const lastVisit = i.lastVisit || "";
        const sinceVisit = lastVisit ? daysBetween(lastVisit, today) : null;
        const winback = (i.visits || 0) > 0 && sinceVisit >= WINBACK_DAYS && c.stats.upcoming === 0;
        const m = meta[c.email] || {};
        return {
          c, i, lastVisit, sinceVisit, winback,
          bday: nextBirthday(i.dob, today),
          tags: m.tags || [],
          hasNotes: !!(m.notes || "").trim(),
        };
      }),
    [customers, info, meta, today]
  );

  const counts = useMemo(
    () => ({
      winback: rows.filter((r) => r.winback).length,
      birthday: rows.filter((r) => r.bday && r.bday.days <= 30).length,
      vip: rows.filter((r) => r.tags.some((t) => t.toLowerCase() === "vip")).length,
      tagged: rows.filter((r) => r.tags.length || r.hasNotes).length,
      registered: rows.filter((r) => r.c.registered).length,
    }),
    [rows]
  );

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    const out = rows.filter((r) => {
      if (seg === "registered" && !r.c.registered) return false;
      if (seg === "guests" && r.c.registered) return false;
      if (seg === "winback" && !r.winback) return false;
      if (seg === "birthday" && !(r.bday && r.bday.days <= 30)) return false;
      if (seg === "vip" && !r.tags.some((t) => t.toLowerCase() === "vip")) return false;
      if (seg === "tagged" && !(r.tags.length || r.hasNotes)) return false;
      return !s || `${r.c.name} ${r.c.email} ${r.c.phone} ${r.tags.join(" ")}`.toLowerCase().includes(s);
    });
    if (sort === "spent") out.sort((a, b) => (b.i.spent || 0) - (a.i.spent || 0));
    if (sort === "lastvisit") out.sort((a, b) => (a.lastVisit || "9999").localeCompare(b.lastVisit || "9999"));
    if (sort === "name") out.sort((a, b) => a.c.name.localeCompare(b.c.name));
    return out;
  }, [rows, q, seg, sort]);

  const emails = list.map((r) => r.c.email);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(emails.join(", "));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Could not copy automatically. Please try again.");
    }
  };

  const mailAll = () => { window.location.href = `mailto:?bcc=${emails.join(",")}`; };

  const exportCsv = () =>
    downloadCsv("kaya-customers.csv", [
      ["Name", "Email", "Phone", "Account", "Tags", "Bookings", "Completed visits", "Spent", "Last visit", "Win-back"],
      ...list.map((r) => [
        r.c.name, r.c.email, r.c.phone, r.c.registered ? "Yes" : "Guest", r.tags.join("; "),
        r.c.stats.bookings, r.i.visits || 0, r.i.spent || 0, r.lastVisit, r.winback ? "Yes" : "",
      ]),
    ]);

  return (
    <>
      <div className="adm-toolbar">
        <input className="adm-in grow" placeholder="Search name, email, phone or tag" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="adm-in" value={seg} onChange={(e) => setSeg(e.target.value)} aria-label="Segment">
          <option value="all">All ({customers.length})</option>
          <option value="winback">Win-back: no visit in {WINBACK_DAYS}+ days ({counts.winback})</option>
          <option value="birthday">Birthday in next 30 days ({counts.birthday})</option>
          <option value="vip">VIP ({counts.vip})</option>
          <option value="tagged">Has tags or notes ({counts.tagged})</option>
          <option value="registered">Signed in with Google ({counts.registered})</option>
          <option value="guests">Guests ({customers.length - counts.registered})</option>
        </select>
        <select className="adm-in" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
          <option value="activity">Recent activity</option>
          <option value="spent">Most spent</option>
          <option value="lastvisit">Longest since last visit</option>
          <option value="name">Name A to Z</option>
        </select>
      </div>

      <div className="adm-toolbar">
        <span className="adm-muted">{list.length} customer{list.length === 1 ? "" : "s"}</span>
        <span className="adm-row" style={{ marginLeft: "auto", gap: 8 }}>
          <button className="adm-btn ghost sm" disabled={!list.length} onClick={copy}>{copied ? "Copied" : "Copy emails"}</button>
          <button
            className="adm-btn ghost sm"
            disabled={!list.length || list.length > MAX_BCC}
            onClick={mailAll}
            title={list.length > MAX_BCC ? `Too many for one email (max ${MAX_BCC}). Use Copy emails.` : "Opens your email app with everyone in BCC"}
          >
            Email these (BCC)
          </button>
          <button className="adm-btn ghost sm" disabled={!list.length} onClick={exportCsv}>Export CSV</button>
        </span>
      </div>

      {list.length === 0 && <p className="adm-muted">No customers match. They appear here when someone signs in with Google or books.</p>}
      {list.map((r) => (
        <Card key={r.c.email} row={r} meta={meta[r.c.email]} onSaveMeta={onSaveMeta} />
      ))}
    </>
  );
}