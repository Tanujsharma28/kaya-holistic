import { useMemo, useState } from "react";

const when = (iso) => (iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "-");

export default function GiftCards({ cards, onRedeem }) {
  const [q, setQ] = useState("");
  const [only, setOnly] = useState("all");
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (cards || []).filter((g) => {
      if (only !== "all" && g.status !== only) return false;
      return !s || `${g.code} ${g.buyerName} ${g.buyerEmail} ${g.recipientName} ${g.recipientEmail}`.toLowerCase().includes(s);
    });
  }, [cards, q, only]);
  const sold = (cards || []).reduce((n, g) => n + g.amount, 0);
  const open = (cards || []).filter((g) => g.status === "paid").reduce((n, g) => n + g.amount, 0);

  return (
    <>
      <p className="adm-muted">Sold ${sold} in total. ${open} still unredeemed.</p>
      <div className="adm-toolbar">
        <input className="adm-in grow" placeholder="Search code, buyer or recipient" value={q} onChange={(e) => setQ(e.target.value)} />
        <select className="adm-in" value={only} onChange={(e) => setOnly(e.target.value)} aria-label="Filter">
          <option value="all">All</option>
          <option value="paid">Unredeemed</option>
          <option value="redeemed">Redeemed</option>
        </select>
      </div>
      {list.length === 0 && <p className="adm-muted">No gift cards yet. Paid gift cards appear here.</p>}
      {list.map((g) => {
        const expired = g.status === "paid" && new Date(g.expiresAt) < new Date();
        return (
          <details className="adm-intake" key={g.id}>
            <summary>
              <b style={{ fontFamily: "monospace" }}>{g.code}</b>
              <span className="adm-pill">${g.amount}</span>
              <span className="adm-pill" style={g.status === "redeemed" ? { background: "#e7eef6", color: "#2c5a8a" } : expired ? { background: "#fbe9e7", color: "#a1342c" } : { background: "#e4f2e4", color: "#2f6b34" }}>
                {g.status === "redeemed" ? "Redeemed" : expired ? "Expired" : "Unredeemed"}
              </span>
              <span className="adm-muted">{g.buyerName}</span>
              <span className="adm-muted" style={{ marginLeft: "auto" }}>{when(g.createdAt)}</span>
            </summary>
            <div className="body">
              {[
                ["Buyer", `${g.buyerName} · ${g.buyerEmail}`],
                ["Recipient", g.recipientName || g.recipientEmail ? `${g.recipientName} ${g.recipientEmail}` : "Not given"],
                ["Message", g.message || "-"],
                ["Paid", when(g.paidAt)],
                ["Valid until", when(g.expiresAt)],
                ["Redeemed", g.status === "redeemed" ? when(g.redeemedAt) : "-"],
              ].map(([k, v]) => (
                <div key={k} style={{ display: "flex", gap: 12, padding: "4px 0" }}><span className="adm-muted" style={{ width: 90 }}>{k}</span><span>{v}</span></div>
              ))}
              <button className="adm-btn" style={{ marginTop: 10 }} onClick={() => onRedeem(g.id, g.status !== "redeemed")}>
                {g.status === "redeemed" ? "Mark as unredeemed" : "Mark as redeemed"}
              </button>
            </div>
          </details>
        );
      })}
    </>
  );
}