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
    const d = r.data.data || r.data;
    return { token: d.token, email: d.email || email };
  });

export const getStats = () => adminClient.get("/admin/stats").then((r) => r.data.data);
export const getAllBookings = () => adminClient.get("/admin/bookings").then((r) => r.data.data);
export const getAllConsultations = () => adminClient.get("/admin/consultations").then((r) => r.data.data);
export const getServicesAdmin = () => adminClient.get("/admin/services").then((r) => r.data.data);

export const updateBooking = (id, body) => adminClient.patch(`/admin/bookings/${id}`, body).then((r) => r.data);
export const approveBooking = (id, meetLink) => adminClient.patch(`/admin/bookings/${id}/approve`, { meetLink }).then((r) => r.data);
export const deleteBookings = (ids) => adminClient.post("/admin/bookings/bulk-delete", { ids }).then((r) => r.data);
export const deleteConsultation = (id) => adminClient.delete(`/admin/consultations/${id}`).then((r) => r.data);
export const createService = (body) => adminClient.post("/admin/services", body).then((r) => r.data);
export const updateService = (id, body) => adminClient.patch(`/admin/services/${id}`, body).then((r) => r.data);
export const deleteService = (id) => adminClient.delete(`/admin/services/${id}`).then((r) => r.data);

export default adminClient;