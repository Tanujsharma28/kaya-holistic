export const TZ = "America/Chicago";
export const todayChicago = () => new Date().toLocaleDateString("en-CA", { timeZone: TZ });
export const addDays = (iso, n) => {
  const d = new Date(iso + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
};
export const fmtDate = (iso, o = { weekday: "short", month: "short", day: "numeric" }) =>
  new Date(iso + "T12:00:00").toLocaleDateString("en-US", o);
export const money = (n) => `$${Number(n || 0).toLocaleString("en-US")}`;

export const toMin = (slot) => {
  const m = /^\s*(\d{1,2}):(\d{2})\s*(AM|PM)\s*$/i.exec(String(slot || ""));
  if (!m) return null;
  let h = Number(m[1]) % 12;
  if (m[3].toUpperCase() === "PM") h += 12;
  return h * 60 + Number(m[2]);
};
export const to24 = (slot) => {
  const m = toMin(slot);
  return m == null ? "" : `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
};
export const from24 = (t) => {
  if (!t) return "";
  const [h, mi] = t.split(":").map(Number);
  return `${String(h % 12 || 12).padStart(2, "0")}:${String(mi).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};
export const fmtRange = (slot, dur) => {
  const s = toMin(slot);
  if (s == null) return slot;
  const f = (m) => {
    const h = Math.floor(m / 60) % 24;
    return `${h % 12 || 12}:${String(m % 60).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
  };
  return `${f(s)} to ${f(s + (dur || 60))}`;
};
export const whenKey = (b) => `${b.date} ${String(toMin(b.slot) ?? 0).padStart(4, "0")}`;

export const downloadCsv = (name, rows) => {
  const csv = rows.map((r) => r.map((v) => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
  a.download = name;
  a.click();
  URL.revokeObjectURL(a.href);
};