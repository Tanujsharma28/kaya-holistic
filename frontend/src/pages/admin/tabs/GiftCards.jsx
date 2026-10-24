import { useMemo, useState } from "react";

const TZ = "America/Chicago";
const DAY = 86400000;
const when = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: TZ }) : "-";
const dayKey = (iso) => new Date(iso).toLocaleDateString("en-CA", { timeZone: TZ });
const usd = (n) => `$${Number.isInteger(Number(n)) ? Number(n) : Number(n).toFixed(2)}`;

const isExpired = (g) => new Date(g.expiresAt) < new Date();
const isExpiring = (g) => !isExpired(g) && new Date(g.expiresAt) - Date.now() <= 30 * DAY;

const PILL = {
  green: { background: "#e4f2e4", color: "#2f6b34" },
  blue: { background: "#e7eef6", color: "#2c5a8a" },
  red: { background: "#fbe9e7", color: "#a1342c" },
  amber: { background: "#fff4e0", color: "#7c4422" },
  grey: { background: "#eee", color: "#666" },
};

function Stat({ label, value, sub }) {
  return (
    <div className="adm-panel" style={{ padding: "12px 16px", minWidth: 170, flex: 1 }}>
      <div className="adm-muted" style={{ fontSize: ".78rem" }}>{label}</div>
      <b style={{ fontSize: "1.35rem" }}>{value}</b>
      {sub && <div className="adm-muted" style={{ fontSize: ".78rem" }}>{sub}</div>}
    </div>
  );
}

function Card({ g, onSpend, onUndo, onExtend, onResend, onVoid }) {
  const [amt, setAmt] = useState("");
  const [note, setNote] = useState("");
  const [exp, setExp] = useState(dayKey(g.expiresAt));
  const [to, setTo] = useState(g.buyerEmail ? "buyer" : "recipient");
  const [busy, setBusy] = useState(false);

  const expired = isExpired(g);
  const used = g.balance <= 0;
  const amountNum = Number(amt);
  const canSpend = !g.voided && !used && !expired && amountNum > 0 && amountNum <= g.balance + 0.001;
  const wrap = async (fn) => { setBusy(true); try { return await fn(); } finally { setBusy(false); } };

  const status = g.voided
    ? <span className="adm-pill" style={PILL.grey}>Void</span>
    : used
      ? <span className="adm-pill" style={PILL.blue}>Fully used</span>
      : expired
        ? <span className="adm-pill" style={PILL.red}>Expired · {usd(g.balance)} left</span>
        : <span className="adm-pill" style={PILL.green}>{g.balance < g.amount ? `${usd(g.balance)} left of ${usd(g.amount)}` : `${usd(g.balance)} available`}</span>;

  return (
    <details className="adm-intake" style={g.voided ? { opacity: 0.6 } : undefined}>
      <summary>
        <b style={{ fontFamily: "monospace" }}>{g.code}</b>
        {status}
        {!g.voided && !used && isExpiring(g) && <span className="adm-pill" style={PILL.amber}>Expires {when(g.expiresAt)}</span>}
        {g.source === "admin" && <span className="adm-pill">In store</span>}
        <span className="adm-muted">{g.buyerName}</span>
        <span className="adm-muted" style={{ marginLeft: "auto" }}>{when(g.createdAt)}</span>
      </summary>

      <div className="body">
        {[
          ["Value", usd(g.amount)],
          ["Balance", usd(g.balance)],
          ["Buyer", `${g.buyerName}${g.buyerEmail ? " · " + g.buyerEmail : ""}`],
          ["Recipient", g.recipientName || g.recipientEmail ? `${g.recipientName} ${g.recipientEmail}` : "Not given"],
          ["Message", g.message || "-"],
          ["Sold", `${when(g.paidAt)}${g.source === "admin" ? " (in store)" : ""}`],
          ["Valid until", when(g.expiresAt)],
        ].map(([k, v]) => (
          <div key={k} style={{ display: "flex", gap: 12, padding: "4px 0" }}>
            <span className="adm-muted" style={{ width: 90 }}>{k}</span><span>{v}</span>
          </div>
        ))}

        {expired && !g.voided && !used && (
          <div style={{ ...PILL.red, borderRadius: 10, padding: "10px 14px", margin: "12px 0", fontSize: ".88rem" }}>
            This card expired on {when(g.expiresAt)}. Extend its validity below if you want to honour it.
          </div>
        )}

        {!g.voided && !used && (
          <div className="adm-qa">
            <span>Use this gift card</span>
            <div className="adm-row" style={{ gap: 8, marginTop: 6, alignItems: "flex-end" }}>
              <input className="adm-in" style={{ maxWidth: 130 }} type="number" min="0" step="0.01" placeholder="Amount"
                value={amt} onChange={(e) => setAmt(e.target.value)} disabled={expired} />
              <button type="button" className="adm-btn ghost sm" disabled={expired} onClick={() => setAmt(String(g.balance))}>
                Full balance ({usd(g.balance)})
              </button>
              <input className="adm-in grow" placeholder="Note (e.g. Express Facial, Oct 24)" maxLength={100}
                value={note} onChange={(e) => setNote(e.target.value)} disabled={expired} />
              <button className="adm-btn sm" disabled={busy || !canSpend}
                onClick={() => wrap(async () => { const r = await onSpend(g.id, { amount: amountNum, note }); if (r) { setAmt(""); setNote(""); } })}>
                {busy ? "Saving…" : `Use ${amountNum > 0 ? usd(amountNum) : ""}`}
              </button>
            </div>
            {amountNum > g.balance + 0.001 && <p style={{ color: "#8f2f20", fontSize: ".82rem", marginTop: 6 }}>Only {usd(g.balance)} is left on this card.</p>}
          </div>
        )}

        <div className="adm-qa">
          <span>Redemption history</span>
          {g.redemptions.length === 0 && <p className="adm-muted" style={{ marginTop: 6 }}>Not used yet.</p>}
          {g.redemptions.map((r) => (
            <div key={r.id} className="adm-row" style={{ justifyContent: "space-between", padding: "6px 0" }}>
              <span>
                <b>{usd(r.amount)}</b> <span className="adm-muted">· {when(r.at)}{r.note ? ` · ${r.note}` : ""}</span>
              </span>
              <button className="adm-btn ghost sm" disabled={busy}
                onClick={() => confirm("Undo this redemption? The amount goes back onto the card.") && wrap(() => onUndo(g.id, r.id))}>
                Undo
              </button>
            </div>
          ))}
        </div>

        {!g.voided && (
          <div className="adm-qa">
            <span>Valid until</span>
            <div className="adm-row" style={{ gap: 8, marginTop: 6 }}>
              <input className="adm-in" style={{ maxWidth: 190 }} type="date" value={exp} onChange={(e) => setExp(e.target.value)} />
              <button className="adm-btn ghost sm" disabled={busy || !exp || exp === dayKey(g.expiresAt)} onClick={() => wrap(() => onExtend(g.id, exp))}>
                Change date
              </button>
            </div>
          </div>
        )}

        {!g.voided && (g.buyerEmail || g.recipientEmail) && (
          <div className="adm-qa">
            <span>Email the gift card again (shows the original value)</span>
            <div className="adm-row" style={{ gap: 8, marginTop: 6 }}>
              <select className="adm-in" style={{ maxWidth: 220 }} value={to} onChange={(e) => setTo(e.target.value)}>
                <option value="buyer" disabled={!g.buyerEmail}>Buyer</option>
                <option value="recipient" disabled={!g.recipientEmail}>Recipient</option>
                <option value="both" disabled={!g.buyerEmail || !g.recipientEmail}>Both</option>
              </select>
              <button className="adm-btn ghost sm" disabled={busy} onClick={() => wrap(() => onResend(g.id, to))}>Send email</button>
            </div>
          </div>
        )}

        <div className="adm-row" style={{ marginTop: 14 }}>
          {g.voided ? (
            <button className="adm-btn ghost sm" disabled={busy} onClick={() => wrap(() => onVoid(g.id, false))}>Restore card</button>
          ) : (
            <button className="adm-btn danger sm" disabled={busy}
              onClick={() => confirm(`Void gift card ${g.code}? It can no longer be used. You can restore it later.`) && wrap(() => onVoid(g.id, true))}>
              Void card
            </button>
          )}
        </div>
      </div>
    </details>
  );
}

function NewCard({ onCreate, onClose }) {
  const [f, setF] = useState({
    amount: "100", buyerName: "", buyerEmail: "", recipientName: "", recipientEmail: "",
    message: "", validMonths: 6, sendEmail: true,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const set = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const amountNum = Number(f.amount);
  const hasEmail = !!(f.buyerEmail.trim() || f.recipientEmail.trim());
  const valid = amountNum >= 1 && amountNum <= 1000 && f.buyerName.trim();
  const label = { display: "block", fontSize: ".78rem", fontWeight: 600, marginBottom: 5 };

  const submit = async () => {
    setBusy(true);
    setError("");
    const r = await onCreate({
      ...f,
      amount: amountNum,
      validMonths: Number(f.validMonths),
      sendEmail: f.sendEmail && hasEmail,
    });
    setBusy(false);
    if (r.ok) onClose();
    else setError(r.message);
  };

  return (
    <>
      <div className="adm-back" onClick={onClose} />
      <aside className="adm-drawer" role="dialog" aria-label="New gift card">
        <div className="adm-row" style={{ justifyContent: "space-between" }}>
          <h3>New gift card</h3>
          <button className="adm-btn ghost sm" onClick={onClose}>Close</button>
        </div>
        <p className="adm-muted" style={{ marginTop: 6 }}>For gift cards sold in the spa or over the phone.</p>

        {error && (
          <div className="adm-alert" role="alert" style={{ marginTop: 14, background: "#fbeeea", color: "#8f2f20" }}>
            <span>{error}</span>
          </div>
        )}

        <div className="adm-sec">
          <h4>Amount</h4>
          <div className="adm-row" style={{ gap: 8 }}>
            {[100, 150].map((a) => (
              <button type="button" key={a} className={`adm-btn sm ${Number(f.amount) === a ? "" : "ghost"}`}
                onClick={() => setF((p) => ({ ...p, amount: String(a) }))}>${a}</button>
            ))}
            <input className="adm-in" style={{ maxWidth: 140 }} type="number" min="1" max="1000" step="1"
              value={f.amount} onChange={set("amount")} aria-label="Custom amount" />
          </div>
          <label style={{ ...label, marginTop: 12 }}>Valid for</label>
          <select className="adm-in" value={f.validMonths} onChange={set("validMonths")}>
            {[3, 6, 12, 24].map((m) => <option key={m} value={m}>{m} months</option>)}
          </select>
        </div>

        <div className="adm-sec">
          <h4>Buyer</h4>
          <label style={label}>Name</label>
          <input className="adm-in" value={f.buyerName} onChange={set("buyerName")} />
          <label style={{ ...label, marginTop: 12 }}>Email (optional)</label>
          <input className="adm-in" type="email" value={f.buyerEmail} onChange={set("buyerEmail")} />
        </div>

        <div className="adm-sec">
          <h4>Recipient (optional)</h4>
          <label style={label}>Name</label>
          <input className="adm-in" value={f.recipientName} onChange={set("recipientName")} />
          <label style={{ ...label, marginTop: 12 }}>Email</label>
          <input className="adm-in" type="email" value={f.recipientEmail} onChange={set("recipientEmail")} />
          <label style={{ ...label, marginTop: 12 }}>Message</label>
          <textarea className="adm-in" maxLength={300} value={f.message} onChange={set("message")} />
        </div>

        <div className="adm-sec">
          <label className="adm-check">
            <input type="checkbox" checked={f.sendEmail && hasEmail} disabled={!hasEmail}
              onChange={(e) => setF((p) => ({ ...p, sendEmail: e.target.checked }))} />
            Email the gift card {hasEmail ? "now" : "(add an email first)"}
          </label>
          <button className="adm-btn" style={{ marginTop: 14 }} disabled={busy || !valid} onClick={submit}>
            {busy ? "Creating…" : "Create gift card"}
          </button>
        </div>
      </aside>
    </>
  );
}

export default function GiftCards({ cards = [], onCreate, onSpend, onUndo, onExtend, onResend, onVoid }) {
  const [q, setQ] = useState("");
  const [only, setOnly] = useState("all");
  const [adding, setAdding] = useState(false);

  const stats = useMemo(() => {
    let sold = 0, outstanding = 0, soonN = 0, soonAmt = 0, expiredAmt = 0;
    for (const g of cards) {
      if (g.voided) continue;
      sold += g.amount;
      if (g.balance <= 0) continue;
      if (isExpired(g)) expiredAmt += g.balance;
      else {
        outstanding += g.balance;
        if (isExpiring(g)) { soonN += 1; soonAmt += g.balance; }
      }
    }
    return { sold, outstanding, soonN, soonAmt, expiredAmt };
  }, [cards]);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return cards.filter((g) => {
      const live = !g.voided && g.balance > 0;
      if (only === "active" && !(live && !isExpired(g))) return false;
      if (only === "partial" && !(live && !isExpired(g) && g.balance < g.amount)) return false;
      if (only === "expiring" && !(live && isExpiring(g))) return false;
      if (only === "expired" && !(live && isExpired(g))) return false;
      if (only === "used" && !(!g.voided && g.balance <= 0)) return false;
      if (only === "void" && !g.voided) return false;
      return !s || `${g.code} ${g.buyerName} ${g.buyerEmail} ${g.recipientName} ${g.recipientEmail}`.toLowerCase().includes(s);
    });
  }, [cards, q, only]);

  return (
    <>
      <div className="adm-row" style={{ gap: 12, marginBottom: 14, flexWrap: "wrap", alignItems: "stretch" }}>
        <Stat label="Outstanding balance" value={usd(stats.outstanding)} sub="Still to be honoured" />
        <Stat label="Expiring in 30 days" value={`${stats.soonN} card${stats.soonN === 1 ? "" : "s"}`} sub={usd(stats.soonAmt)} />
        <Stat label="Expired with balance" value={usd(stats.expiredAmt)} />
        <Stat label="Sold in total" value={usd(stats.sold)} sub="Excluding void cards" />
      </div>

      {stats.soonN > 0 && (
        <div className="adm-alert">
          <span>{stats.soonN} gift card{stats.soonN === 1 ? "" : "s"} ({usd(stats.soonAmt)}) expire within 30 days.</span>
          <button className="adm-btn ghost sm" onClick={() => setOnly("expiring")}>Show them</button>
        </div>
      )}

      <div className="adm-toolbar">
        <input className="adm-in grow" placeholder="Search code, buyer or recipient" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="adm-in" value={only} onChange={(e) => setOnly(e.target.value)} aria-label="Filter">
          <option value="all">All ({cards.length})</option>
          <option value="active">Active (has balance)</option>
          <option value="partial">Partly used</option>
          <option value="expiring">Expiring in 30 days</option>
          <option value="expired">Expired with balance</option>
          <option value="used">Fully used</option>
          <option value="void">Void</option>
        </select>
        <button className="adm-btn" onClick={() => setAdding(true)}>+ New gift card</button>
      </div>

      {list.length === 0 && <p className="adm-muted">No gift cards match. Paid gift cards appear here.</p>}
      {list.map((g) => (
        <Card key={g.id} g={g} onSpend={onSpend} onUndo={onUndo} onExtend={onExtend} onResend={onResend} onVoid={onVoid} />
      ))}

      {adding && <NewCard onCreate={onCreate} onClose={() => setAdding(false)} />}
    </>
  );
}