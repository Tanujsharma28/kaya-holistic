import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

const SVC_KEY = "kaya_services_cache";
export const getCachedServices = () => {
  try { return JSON.parse(localStorage.getItem(SVC_KEY)) || []; } catch { return []; }
};
export const getServices = () =>
  client.get("/services", { timeout: 90000 }).then((r) => {
    const d = r.data.data;
    try { localStorage.setItem(SVC_KEY, JSON.stringify(d)); } catch { /* ignore */ }
    return d;
  });
export const getQuizMap = () => client.get("/services/quiz-map").then((r) => r.data.data);
export const getQuizQuestions = () => client.get("/quiz").then(r => r.data.data);
export const getAvailability = (date, serviceId) =>
  client.get('/bookings/availability', { params: { date, serviceId } }).then(r => r.data.data);
export const createBooking = (payload) => client.post("/bookings", payload).then(r => r.data.data);
// Online consultation ab payment-first hai: booking turant confirm nahi hoti,
// yeh Stripe Checkout session banati hai — url pe redirect karna hota hai.
export const createCheckoutSession = (payload) => client.post("/bookings/checkout", payload).then(r => r.data.data);
export const getBookingBySession = (sessionId) =>
  client.get(`/bookings/by-session/${encodeURIComponent(sessionId)}`).then(r => r.data);
export const createGiftCheckout = (payload) => client.post("/gift-cards/checkout", payload).then(r => r.data.data);
export const getGiftBySession = (sessionId) =>
  client.get(`/gift-cards/by-session/${encodeURIComponent(sessionId)}`).then(r => r.data);
export const checkGiftCode = (code, date) => client.post("/gift-cards/check", { code, date }).then((r) => r.data.data);
export const submitConsultation = (payload) => client.post("/consultation", payload).then(r => r.data.data);
export const submitConsent = (payload) => client.post("/consent", payload).then(r => r.data.data);
export const getAvailabilityInfo = (date, serviceId) =>
  client.get('/bookings/availability', { params: { date, serviceId } })
    .then(r => ({ slots: r.data.data || [], closed: r.data.closed || '', staff: r.data.staff || '' }));
export const getHours = () => client.get('/settings/hours').then(r => r.data.data);
export default client;