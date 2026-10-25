import axios from "axios";

const adminClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

adminClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("kaya_admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

adminClient.interceptors.response.use(
  (res) => res,
  (err) => {
    const isLogin = err.config?.url?.includes("/admin/login");
    if (err.response?.status === 401 && !isLogin) {
      localStorage.removeItem("kaya_admin_token");
      localStorage.removeItem("kaya_admin_email");
      window.location.href = "/admin/login";
    }
    return Promise.reject(err);
  }
);

export const adminLogin = (email, password) =>
  adminClient.post("/admin/login", { email, password }).then((r) => {
    if (r.data.twoFactor) {
      return { twoFactor: true, challengeId: r.data.challengeId, sentTo: r.data.sentTo };
    }
    const d = r.data.data || r.data;
    return { token: d.token, email: d.email || email };
  });

export const adminVerify = (challengeId, code) =>
  adminClient.post("/admin/login/verify", { challengeId, code }).then((r) => {
    const d = r.data.data || r.data;
    return { token: d.token, email: d.email };
  });
export const adminForgot = (email) =>
  adminClient.post("/admin/forgot", { email }).then((r) => ({ resetId: r.data.resetId, sentTo: r.data.sentTo }));

export const adminReset = (resetId, code, newPassword) =>
  adminClient.post("/admin/reset", { resetId, code, newPassword }).then((r) => r.data);

export const changeAdminPassword = (currentPassword, newPassword) =>
  adminClient.post("/admin/password", { currentPassword, newPassword }).then((r) => {
    const d = r.data.data || r.data;
    return { token: d.token, email: d.email };
  });
export const getStats = () => adminClient.get("/admin/stats").then((r) => r.data.data);
export const getAllBookings = () => adminClient.get("/admin/bookings").then((r) => r.data.data);
export const getAllConsultations = () => adminClient.get("/admin/consultations").then((r) => r.data.data);
export const getServicesAdmin = () => adminClient.get("/admin/services").then((r) => r.data.data);
export const getGiftCards = () => adminClient.get("/admin/gift-cards").then((r) => r.data.data);
export const redeemGiftCard = (id, redeemed) => adminClient.patch(`/admin/gift-cards/${id}/redeem`, { redeemed }).then((r) => r.data);
export const getQuizMapAdmin = () => adminClient.get("/admin/quiz-map").then((r) => r.data.data);
export const saveQuizMap = (map) => adminClient.put("/admin/quiz-map", { map }).then((r) => r.data);

export const updateBooking = (id, body) => adminClient.patch(`/admin/bookings/${id}`, body).then((r) => r.data);
export const approveBooking = (id, meetLink) => adminClient.patch(`/admin/bookings/${id}/approve`, { meetLink }).then((r) => r.data);
export const deleteBookings = (ids) => adminClient.post("/admin/bookings/bulk-delete", { ids }).then((r) => r.data);
export const deleteConsultation = (id) => adminClient.delete(`/admin/consultations/${id}`).then((r) => r.data);
export const getAllConsents = () => adminClient.get("/admin/consents").then((r) => r.data.data);
export const deleteConsent = (id) => adminClient.delete(`/admin/consents/${id}`).then((r) => r.data);
export const getCustomers = () => adminClient.get("/admin/customers").then((r) => r.data.data);
export const createService = (body) => adminClient.post("/admin/services", body).then((r) => r.data);
export const updateService = (id, body) => adminClient.patch(`/admin/services/${id}`, body).then((r) => r.data);
export const deleteService = (id) => adminClient.delete(`/admin/services/${id}`).then((r) => r.data);
export const getTrash = () => adminClient.get("/admin/trash").then((r) => r.data.data);
export const restoreTrash = (id) => adminClient.post(`/admin/trash/${id}/restore`).then((r) => r.data);
export const deleteTrashItem = (id) => adminClient.delete(`/admin/trash/${id}`).then((r) => r.data);
export const getAuditLog = () => adminClient.get("/admin/audit-log").then((r) => r.data.data);
export const getSettings = () => adminClient.get("/admin/settings").then((r) => r.data.data);
export const saveSettings = (body) => adminClient.put("/admin/settings", body).then((r) => r.data);
export const getCustomerMeta = () => adminClient.get("/admin/customer-meta").then((r) => r.data.data);
export const saveCustomerMeta = (email, body) =>
  adminClient.put(`/admin/customers/${encodeURIComponent(email)}/meta`, body).then((r) => r.data);
export const createGiftCard = (body) => adminClient.post("/admin/gift-cards", body).then((r) => r.data);
export const spendGiftCard = (id, body) => adminClient.post(`/admin/gift-cards/${id}/use`, body).then((r) => r.data);
export const undoGiftUse = (id, rid) => adminClient.delete(`/admin/gift-cards/${id}/uses/${rid}`).then((r) => r.data);
export const extendGiftCard = (id, expiresOn) => adminClient.patch(`/admin/gift-cards/${id}`, { expiresOn }).then((r) => r.data);
export const resendGiftCard = (id, to) => adminClient.post(`/admin/gift-cards/${id}/resend`, { to }).then((r) => r.data);
export const voidGiftCard = (id, makeVoid) => adminClient.post(`/admin/gift-cards/${id}/void`, { void: makeVoid }).then((r) => r.data);
export const testNotification = (type) => adminClient.post("/admin/notifications/test", { type }).then((r) => r.data);
export default adminClient;
export const downloadBackup = () => adminClient.get("/admin/backup", { responseType: "blob" });

export const createBookingAdmin = (body) => adminClient.post("/admin/bookings", body).then((r) => r.data);
export const bulkBookingStatus = (ids, status) => adminClient.post("/admin/bookings/bulk-status", { ids, status }).then((r) => r.data);