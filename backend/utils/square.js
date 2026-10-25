import crypto from 'crypto';

const SQUARE_VERSION = '2025-10-16';
const baseUrl = () =>
  process.env.SQUARE_ENV === 'production'
    ? 'https://connect.squareup.com'
    : 'https://connect.squareupsandbox.com';

export const squareConfigured = () =>
  Boolean(process.env.SQUARE_ACCESS_TOKEN && process.env.SQUARE_LOCATION_ID);

async function sq(method, path, body) {
  const res = await fetch(baseUrl() + path, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.SQUARE_ACCESS_TOKEN}`,
      'Square-Version': SQUARE_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (json.errors || []).map((e) => e.detail || e.code).join('; ') || res.statusText;
    throw new Error(`Square ${res.status}: ${msg}`);
  }
  return json;
}

export async function createPaymentLink({ name, description, amountCents, referenceId, kind, redirectUrl, buyerEmail }) {
  const json = await sq('POST', '/v2/online-checkout/payment-links', {
    idempotency_key: crypto.randomUUID(),
    order: {
      location_id: process.env.SQUARE_LOCATION_ID,
      reference_id: referenceId,
      metadata: { kind },
      line_items: [{
        name: String(name).slice(0, 200),
        note: String(description || '').slice(0, 500),
        quantity: '1',
        base_price_money: { amount: amountCents, currency: 'USD' },
      }],
    },
    checkout_options: { redirect_url: redirectUrl },
    pre_populated_data: buyerEmail ? { buyer_email: buyerEmail } : undefined,
  });
  const link = json.payment_link;
  return { url: link.url, orderId: link.order_id, linkId: link.id };
}

export const deletePaymentLink = (linkId) =>
  sq('DELETE', `/v2/online-checkout/payment-links/${encodeURIComponent(linkId)}`);

export const getOrder = (orderId) =>
  sq('GET', `/v2/orders/${encodeURIComponent(orderId)}`).then((j) => j.order);

export const refundPayment = (paymentId, amountCents) =>
  sq('POST', '/v2/refunds', {
    idempotency_key: String(paymentId).slice(0, 45),
    payment_id: paymentId,
    amount_money: { amount: amountCents, currency: 'USD' },
  });

// Signature = base64(HMAC-SHA256(notificationUrl + rawBody))
export function verifyWebhookSignature(rawBody, signature) {
  const key = process.env.SQUARE_WEBHOOK_SIGNATURE_KEY;
  const url = process.env.SQUARE_WEBHOOK_URL;
  if (!key || !url || !signature) return false;
  const expected = crypto.createHmac('sha256', key).update(url + rawBody).digest('base64');
  const a = Buffer.from(expected);
  const b = Buffer.from(String(signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}