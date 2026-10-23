import { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import GiftCertificate from "../components/GiftCertificate";
import { getGiftBySession } from "../api/client";

const CSS = `
.gf{min-height:100vh;background:#faf7f2;padding:130px 5vw 80px;font-family:"DM Sans",sans-serif;color:#2b2016}
.gf-in{max-width:760px;margin:0 auto;text-align:center}
.gf h1{font-size:clamp(1.8rem,4vw,2.5rem);margin:0 0 10px}
.gf-sub{color:#5d5043;margin:0 auto 26px}
.gf-spin{width:44px;height:44px;margin:0 auto 22px;border-radius:50%;border:4px solid #dfe8cf;border-top-color:#4c7124;animation:gfs .8s linear infinite}
@keyframes gfs{to{transform:rotate(360deg)}}
.gf-code{margin:22px auto 0;display:inline-block;border:1.5px dashed #4c7124;border-radius:12px;padding:12px 26px;background:#fff}
.gf-code small{display:block;color:#6a5e52;font-size:.8rem}
.gf-code b{font-family:"Courier New",monospace;font-size:1.5rem;letter-spacing:.14em}
.gf-act{display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:26px}
.gf-btn{border:1.5px solid #4c7124;background:#4c7124;color:#fff;border-radius:99px;padding:12px 26px;font:inherit;font-weight:600;cursor:pointer}
.gf-btn.ghost{background:transparent;color:#3c5a1c}
@media print{
  body *{visibility:hidden}
  .gf-print,.gf-print *{visibility:visible}
  .gf-print{position:absolute;left:0;top:0;width:100%}
}
`;

export default function GiftConfirmation() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const navigate = useNavigate();
  const location = useLocation();
  const pausedGift = location.state?.gift; // payment pause mode se aaya gift (Stripe ke bina)
  const [gift, setGift] = useState(pausedGift || null);
  const [status, setStatus] = useState(pausedGift ? "ready" : sessionId ? "polling" : "none");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    if (!sessionId) return;
    let stop = false;
    let tries = 0;
    const poll = async () => {
      tries += 1;
      try {
        const res = await getGiftBySession(sessionId);
        if (stop) return;
        if (res.data.status === "paid" || res.data.status === "redeemed") {
          setGift(res.data); setStatus("ready"); return;
        }
      } catch { /* retry */ }
      if (stop) return;
      if (tries < 12) setTimeout(poll, 2000);
      else {
        setMsg("Your payment is taking longer than usual to confirm. If you were charged, your gift card will arrive by email shortly, or text us at 847-571-1910.");
        setStatus("error");
      }
    };
    poll();
    return () => { stop = true; };
  }, [sessionId]);

  return (
    <div className="gf view">
      <style>{CSS}</style>
      <div className="gf-in">
        {status === "polling" && (
          <>
            <div className="gf-spin" />
            <h1>Confirming your payment</h1>
            <p className="gf-sub">This takes a few seconds. Please keep this page open.</p>
          </>
        )}
        {status === "error" && (
          <>
            <h1>We are still confirming</h1>
            <p className="gf-sub">{msg}</p>
            <div className="gf-act"><button className="gf-btn ghost" onClick={() => navigate("/")}>Back to home</button></div>
          </>
        )}
        {status === "none" && (
          <>
            <h1>No gift card found</h1>
            <p className="gf-sub">Start from the gift card page to buy one.</p>
            <div className="gf-act"><button className="gf-btn" onClick={() => navigate("/gift-cards")}>Buy a gift card</button></div>
          </>
        )}
        {status === "ready" && gift && (
          <>
            <h1>Your gift card is ready, {gift.buyerName.split(" ")[0]}</h1>
            <p className="gf-sub">We emailed it to you{gift.recipientName ? `, and to ${gift.recipientName} if you added their email` : ""}. Keep the code safe.</p>
            <div className="gf-print">
              <GiftCertificate amount={gift.amount} to={gift.recipientName || gift.buyerName} from={gift.buyerName} date={gift.createdAt} expires={gift.expiresAt} code={gift.code} />
            </div>
            <div className="gf-code"><small>Gift card code</small><b>{gift.code}</b></div>
            <div className="gf-act">
              <button className="gf-btn" onClick={() => window.print()}>Print or save as PDF</button>
              <button className="gf-btn ghost" onClick={() => navigate("/")}>Back to home</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}