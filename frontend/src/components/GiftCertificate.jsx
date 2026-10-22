const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Bodoni+Moda:opsz,wght@6..96,400;6..96,500&family=Sacramento&family=Special+Elite&display=swap');
.gc{--gc-green:#4c7124;container-type:inline-size;position:relative;width:100%;aspect-ratio:1650/1275;background:#fff;border:1px solid #e3e3e3;border-radius:1.2cqw;overflow:hidden;color:#111;font-family:"DM Sans",sans-serif;box-shadow:0 18px 40px -22px rgba(36,26,19,.35)}
.gc *{box-sizing:border-box}
.gc-ph{position:absolute;top:10.2%;height:26.7%;border-radius:3.2cqw;object-fit:cover;width:31%}
.gc-ph.a{left:3.6%}.gc-ph.b{left:34.9%}.gc-ph.c{left:66.2%}
.gc-title{position:absolute;left:14%;top:38.6%;margin:0;font-family:"Bodoni Moda",Georgia,serif;font-weight:400;font-size:7.2cqw;line-height:1.1;letter-spacing:-.01em;white-space:nowrap}
.gc-sub{position:absolute;left:16%;top:50.6%;margin:0;max-width:none;font-style:italic;font-size:1.72cqw;white-space:nowrap}
.gc-lab{position:absolute;margin:0;max-width:none;font-family:Sacramento,cursive;font-size:3.1cqw;line-height:1}
.gc-val{position:absolute;margin:0;max-width:none;height:4.6%;display:flex;align-items:flex-end;padding:0 .6cqw .4cqw;border-bottom:.18cqw solid #111;font-size:1.7cqw;line-height:1.1;overflow:hidden;white-space:nowrap;text-overflow:ellipsis}
.gc-val.ph{color:#b9b9b9}
.gc-circle{position:absolute;left:57.3%;top:50.2%;width:32.6%;aspect-ratio:1;border-radius:50%;background:var(--gc-green);color:#fff;display:flex;align-items:flex-end;justify-content:center;padding-bottom:6%}
.gc-brand{font-family:"Special Elite",Georgia,serif;font-size:4.5cqw;line-height:1.2;text-align:center;letter-spacing:.02em;text-transform:uppercase}
.gc-amt{z-index:2;position:absolute;left:64.7%;top:40.6%;width:15.6%;aspect-ratio:1;background:#fff;border:.2cqw solid #111;border-radius:1.9cqw;display:flex;flex-direction:column;align-items:center;justify-content:space-evenly;padding:1.2cqw 0}
.gc-amt span{background:var(--gc-green);color:#fff;font-family:"Bodoni Moda",Georgia,serif;font-size:2.4cqw;padding:.5cqw 2.2cqw;border-radius:1cqw;line-height:1.2}
.gc-amt b{font-family:"Bodoni Moda",Georgia,serif;font-weight:400;font-size:6cqw;line-height:1}
.gc-valid{position:absolute;left:18%;top:75.3%;margin:0;max-width:none;font-style:italic;font-size:2cqw}
.gc-pill{position:absolute;left:27.9%;top:74.9%;width:14.5%;height:4.3%;border-radius:1.6cqw;background:var(--gc-green);color:#fff;display:flex;align-items:center;justify-content:center;font-family:"Bodoni Moda",Georgia,serif;font-size:2.2cqw;white-space:nowrap}
.gc-foot{position:absolute;left:14%;width:46%;top:81.3%;margin:0;max-width:none;text-align:center;font-size:1.82cqw;line-height:1.45}
.gc-code{position:absolute;left:14%;width:46%;top:92.4%;margin:0;max-width:none;text-align:center;font-family:"Courier New",monospace;font-weight:700;font-size:1.75cqw;letter-spacing:.14em}
`;

const fmt = (iso) =>
  iso ? new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "";

const addMonths = (d, n) => { const x = new Date(d); x.setMonth(x.getMonth() + n); return x; };

export default function GiftCertificate({ amount = 100, to = "", from = "", date, expires, code = "" }) {
  const issued = date || new Date().toISOString();
  const until = expires || addMonths(issued, 6).toISOString();
  const val = (text, ph, style) => (
    <p className={`gc-val ${text ? "" : "ph"}`} style={style}>{text || ph}</p>
  );
  return (
    <div className="gc" role="img" aria-label={`Kaya Holistic Spa gift certificate, $${amount}`}>
      <style>{CSS}</style>
      <img className="gc-ph a" src="/gift/g1.jpg" alt="" />
      <img className="gc-ph b" src="/gift/g2.jpg" alt="" />
      <img className="gc-ph c" src="/gift/g3.jpg" alt="" />

      <h3 className="gc-title">Gift Certificate</h3>
      <p className="gc-sub">Gift the Ultimate Spa Experience for Rejuvenation</p>

      <p className="gc-lab" style={{ left: "7.4%", top: "58.4%" }}>To</p>
      {val(to, "Recipient name", { left: "12.8%", top: "61.2%", width: "21.2%" })}
      <p className="gc-lab" style={{ left: "34%", top: "58.4%" }}>From</p>
      {val(from, "Your name", { left: "37%", top: "61.2%", width: "19.2%" })}
      <p className="gc-lab" style={{ left: "8%", top: "65.8%" }}>Service</p>
      {val("Any service", "", { left: "12.8%", top: "68.8%", width: "21.2%" })}
      <p className="gc-lab" style={{ left: "34%", top: "65.8%" }}>Date</p>
      {val(fmt(issued), "", { left: "37%", top: "68.8%", width: "19.2%" })}

      <p className="gc-valid">Valid Until</p>
      <div className="gc-pill">{fmt(until)}</div>

      <p className="gc-foot">www.Kayaholisticspa.org<br />1567 Sherman Ave, Evanston, IL 60201<br />Text 847-571-1910</p>

      <div className="gc-amt"><span>Amount</span><b>${amount}</b></div>
      <div className="gc-circle"><div className="gc-brand">Kaya<br />Holistic<br />Spa</div></div>
      {code && <p className="gc-code">{code}</p>}
    </div>
  );
}