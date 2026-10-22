import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import GiftCertificate from "../components/GiftCertificate";
import { createGiftCheckout } from "../api/client";

const AMOUNTS = [100, 150];

const CSS = `
.gp{min-height:100vh;background:#faf7f2;padding:120px 5vw 80px;font-family:"DM Sans",sans-serif;color:#2b2016}
.gp-in{max-width:1120px;margin:0 auto}
.gp h1{font-size:clamp(2rem,4.5vw,3rem);margin:0 0 10px}
.gp-lead{color:#5d5043;max-width:56ch;margin:0 0 30px}
.gp-grid{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,6fr);gap:40px;align-items:start}
.gp-prev{position:sticky;top:110px}
.gp-prev small{display:block;color:#8a7d6e;margin-top:10px}
@media(max-width:860px){.gp-grid{grid-template-columns:1fr;gap:26px}.gp-prev{position:static;order:-1}}
.gp-amts{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:22px}
.gp-amt{border:1.5px solid #cfd8c0;background:#fff;border-radius:16px;padding:16px 10px;font:inherit;cursor:pointer;color:#2b2016;text-align:center}
.gp-amt b{display:block;font-family:Fraunces,Georgia,serif;font-weight:400;font-size:2rem;line-height:1.1}
.gp-amt span{font-size:.82rem;color:#6a5e52}
.gp-amt[aria-pressed="true"]{border-color:#4c7124;background:#4c7124;color:#fff}
.gp-amt[aria-pressed="true"] span{color:#e1edcf}
.gp-amt:focus-visible,.gp-btn:focus-visible,.gp-i:focus-visible{outline:3px solid #9bbd6a;outline-offset:2px}
.gp fieldset{border:0;padding:0;margin:0 0 18px}
.gp legend{font-weight:600;margin-bottom:10px;padding:0}
.gp-row{display:grid;grid-template-columns:1fr 1fr;gap:12px}
@media(max-width:560px){.gp-row{grid-template-columns:1fr}}
.gp-f{display:flex;flex-direction:column;gap:5px;font-size:.84rem;font-weight:600;color:#5d5043;margin-bottom:12px}
.gp-f em{font-style:normal;font-weight:400;color:#8a7d6e}
.gp-i{border:1.5px solid #ddd3c2;border-radius:10px;padding:11px 12px;font:inherit;font-weight:400;background:#fff;color:#2b2016;width:100%}
textarea.gp-i{resize:vertical;min-height:84px}
.gp-hint{font-size:.82rem;color:#8a7d6e;margin:-4px 0 12px}
.gp-btn{width:100%;border:0;border-radius:99px;background:#4c7124;color:#fff;padding:15px 24px;font:inherit;font-weight:600;font-size:1rem;cursor:pointer;margin-top:6px}
.gp-btn:hover{background:#3c5a1c}.gp-btn:disabled{opacity:.6;cursor:default}
.gp-err{background:#fbebe8;border:1px solid #efc3bc;color:#a1342c;border-radius:10px;padding:10px 14px;margin:0 0 14px;font-size:.9rem}
.gp-note{background:#f1f6e8;border:1px solid #d7e5bd;color:#3c5a1c;border-radius:10px;padding:10px 14px;margin:0 0 18px;font-size:.9rem}
.gp-fine{font-size:.8rem;color:#8a7d6e;text-align:center;margin:12px 0 0}
`;

export default function GiftCards() {
  const [params] = useSearchParams();
  const first = Number(params.get("amount"));
  const [amount, setAmount] = useState(AMOUNTS.includes(first) ? first : 100);
  const [f, setF] = useState({ buyerName: "", buyerEmail: "", recipientName: "", recipientEmail: "", message: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    setBusy(true);
    try {
      const { url } = await createGiftCheckout({ amount, ...f });
      window.location.href = url;
    } catch (ex) {
      setErr(ex?.response?.data?.message || "Could not start payment. Please try again.");
      setBusy(false);
    }
  };

  return (
    <div className="gp view">
      <style>{CSS}</style>
      <div className="gp-in">
        <h1>Give a spa day</h1>
        <p className="gp-lead">A digital gift card for any Kaya Holistic Spa service. Pay online and it reaches your inbox within a minute. Valid for 6 months.</p>

        {params.get("cancelled") && <p className="gp-note">Payment was cancelled. You have not been charged.</p>}

        <div className="gp-grid">
          <form onSubmit={submit}>
            <fieldset>
              <legend>Choose an amount</legend>
              <div className="gp-amts">
                {AMOUNTS.map((a) => (
                  <button type="button" key={a} className="gp-amt" aria-pressed={amount === a} onClick={() => setAmount(a)}>
                    <b>${a}</b><span>Gift card</span>
                  </button>
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend>Your details</legend>
              <div className="gp-row">
                <label className="gp-f">Your name<input className="gp-i" required maxLength={100} value={f.buyerName} onChange={set("buyerName")} autoComplete="name" /></label>
                <label className="gp-f">Your email<input className="gp-i" type="email" required maxLength={150} value={f.buyerEmail} onChange={set("buyerEmail")} autoComplete="email" /></label>
              </div>
            </fieldset>

            <fieldset>
              <legend>Who is it for?</legend>
              <div className="gp-row">
                <label className="gp-f">Recipient name <em>(optional)</em><input className="gp-i" maxLength={100} value={f.recipientName} onChange={set("recipientName")} /></label>
                <label className="gp-f">Recipient email <em>(optional)</em><input className="gp-i" type="email" maxLength={150} value={f.recipientEmail} onChange={set("recipientEmail")} /></label>
              </div>
              <p className="gp-hint">Add their email and we send the gift card to them too. Leave it empty to forward it yourself.</p>
              <label className="gp-f">Message <em>(optional)</em>
                <textarea className="gp-i" maxLength={300} value={f.message} onChange={set("message")} placeholder="Happy birthday, you deserve this." />
              </label>
            </fieldset>

            {err && <p className="gp-err" role="alert">{err}</p>}
            <button className="gp-btn" disabled={busy}>{busy ? "Taking you to secure payment…" : `Pay $${amount} by card`}</button>
            <p className="gp-fine">Payment is handled by Stripe. We never see your card details.</p>
          </form>

          <div className="gp-prev">
            <GiftCertificate amount={amount} to={f.recipientName} from={f.buyerName} />
            <small>Preview. Your gift card code is added after payment.</small>
          </div>
        </div>
      </div>
    </div>
  );
}