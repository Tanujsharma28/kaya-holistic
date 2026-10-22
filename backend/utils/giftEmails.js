const GREEN = '#4c7124';
const ADDRESS = '1567 Sherman Ave, Evanston, IL 60201';
const PHONE = '847-571-1910';

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const prettyDate = (iso) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'America/Chicago' });

const clientUrl = () => String(process.env.CLIENT_URL || '').split(',')[0].trim().replace(/\/$/, '');

const certificate = (g) => {
  const base = clientUrl();
  const photo = (n) =>
    `<td width="33%" style="padding:0 3px;"><img src="${base}/gift/g${n}.jpg" width="100%" alt="" style="display:block;width:100%;height:auto;border-radius:22px;"></td>`;
  const line = (label, value) => `<tr>
      <td style="padding:7px 0;width:90px;font-style:italic;color:#555;font-size:14px;">${label}</td>
      <td style="padding:7px 0;border-bottom:1px solid #222;font-size:15px;color:#111;">${value || '&nbsp;'}</td></tr>`;
  return `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#ffffff;border:1px solid #e3e3e3;border-radius:14px;overflow:hidden;">
    ${base ? `<tr><td style="padding:14px 14px 0;"><table width="100%" cellpadding="0" cellspacing="0"><tr>${photo(1)}${photo(2)}${photo(3)}</tr></table></td></tr>` : ''}
    <tr><td style="padding:22px 24px 6px;text-align:center;">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:38px;color:#111;line-height:1.1;">Gift Certificate</div>
      <div style="font-style:italic;font-size:14px;color:#222;margin-top:8px;">Gift the Ultimate Spa Experience for Rejuvenation</div>
    </td></tr>
    <tr><td style="padding:14px 24px 6px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td valign="top" style="padding-right:14px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            ${line('To', esc(g.recipientName || g.buyerName))}
            ${line('From', esc(g.buyerName))}
            ${line('Service', 'Any service')}
            ${line('Date', esc(prettyDate(g.createdAt)))}
          </table>
        </td>
        <td valign="middle" align="center" width="170" style="background:${GREEN};border-radius:16px;padding:18px 8px;color:#fff;">
          <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#d9e8c3;">Amount</div>
          <div style="font-family:Georgia,serif;font-size:40px;line-height:1.1;margin:4px 0 10px;">$${esc(g.amount)}</div>
          <div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;">Kaya Holistic Spa</div>
        </td>
      </tr></table>
    </td></tr>
    <tr><td style="padding:10px 24px 22px;text-align:center;font-size:13px;color:#333;line-height:1.7;">
      <span style="display:inline-block;background:${GREEN};color:#fff;border-radius:99px;padding:4px 16px;">Valid until ${esc(prettyDate(g.expiresAt))}</span><br>
      www.Kayaholisticspa.org<br>${ADDRESS}<br>Text ${PHONE}
    </td></tr>
  </table>`;
};

const wrap = (heading, intro, body, footerNote) => `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#faf7f2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#faf7f2;padding:28px 12px;"><tr><td align="center">
  <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
    <tr><td style="padding:0 4px 18px;text-align:center;">
      <div style="font-size:11px;letter-spacing:3px;text-transform:uppercase;color:${GREEN};font-weight:700;">Kaya Holistic Spa &middot; Evanston, IL</div>
      <div style="font-family:Georgia,serif;font-size:26px;color:#241a13;margin-top:8px;">${heading}</div>
      <p style="margin:12px auto 0;font-size:15px;color:#5c4f41;line-height:1.7;max-width:480px;">${intro}</p>
    </td></tr>
    <tr><td>${body}</td></tr>
    <tr><td style="padding:22px 4px 0;text-align:center;font-size:13px;color:#6a5e52;line-height:1.7;">${footerNote}</td></tr>
  </table>
</td></tr></table></body></html>`;

const codeBlock = (code) => `
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0 0;background:#fff;border:1.5px dashed ${GREEN};border-radius:12px;">
    <tr><td align="center" style="padding:16px;">
      <div style="font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#6a5e52;">Gift card code</div>
      <div style="font-family:'Courier New',monospace;font-size:26px;letter-spacing:3px;color:#111;font-weight:700;margin-top:4px;">${esc(code)}</div>
    </td></tr>
  </table>`;

const howTo = `Book any service at Kaya Holistic Spa and mention this code when you arrive, or text us at <a href="tel:${PHONE}" style="color:${GREEN};font-weight:600;text-decoration:none;">${PHONE}</a>.`;

export const giftBuyerEmail = (g) => {
  const sentToRecipient = g.recipientEmail && g.recipientEmail.toLowerCase() !== g.buyerEmail.toLowerCase();
  const intro = sentToRecipient
    ? `Thank you, ${esc(g.buyerName)}. Your payment of $${esc(g.amount)} went through, and we have emailed this gift card to ${esc(g.recipientName || g.recipientEmail)} as well.`
    : `Thank you, ${esc(g.buyerName)}. Your payment of $${esc(g.amount)} went through. Your gift card is below. Forward this email to the lucky person, or print it.`;
  return {
    subject: `Your Kaya Holistic Spa gift card ($${g.amount})`,
    html: wrap('Your gift card is ready', intro,
      certificate(g) + codeBlock(g.code) +
      (g.message ? `<p style="margin:18px 0 0;font-style:italic;color:#5c4f41;text-align:center;">Your message: &ldquo;${esc(g.message)}&rdquo;</p>` : ''),
      howTo),
  };
};

export const giftRecipientEmail = (g) => ({
  subject: `${g.buyerName} sent you a Kaya Holistic Spa gift card`,
  html: wrap(`A gift from ${esc(g.buyerName)}`,
    `Hi ${esc(g.recipientName || 'there')}, ${esc(g.buyerName)} has given you a $${esc(g.amount)} gift card for Kaya Holistic Spa.`,
    certificate(g) + codeBlock(g.code) +
    (g.message ? `<p style="margin:18px 0 0;font-style:italic;color:#5c4f41;text-align:center;">&ldquo;${esc(g.message)}&rdquo;<br>&mdash; ${esc(g.buyerName)}</p>` : ''),
    howTo),
});

export const giftOwnerEmail = (g) => ({
  subject: `New gift card sold: $${g.amount} from ${g.buyerName}`,
  html: wrap('Gift card purchased', `A $${esc(g.amount)} gift card was just paid for.`,
    `<table width="100%" cellpadding="8" cellspacing="0" style="background:#fff;border:1px solid #e6ddd0;border-radius:12px;font-size:14px;color:#2b2016;">
      <tr><td><b>Code</b></td><td style="font-family:'Courier New',monospace;">${esc(g.code)}</td></tr>
      <tr><td><b>Amount</b></td><td>$${esc(g.amount)}</td></tr>
      <tr><td><b>Buyer</b></td><td>${esc(g.buyerName)} &middot; ${esc(g.buyerEmail)}</td></tr>
      <tr><td><b>Recipient</b></td><td>${g.recipientName || g.recipientEmail ? `${esc(g.recipientName)} ${esc(g.recipientEmail)}` : 'Not given (buyer will forward)'}</td></tr>
      <tr><td><b>Message</b></td><td>${esc(g.message) || '-'}</td></tr>
      <tr><td><b>Valid until</b></td><td>${esc(prettyDate(g.expiresAt))}</td></tr>
    </table>`,
    'Mark it as redeemed in Admin &rarr; Gift Cards when the customer uses it.'),
});