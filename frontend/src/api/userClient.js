import axios from "axios";

const userClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

export const USER_TOKEN_KEY = "kaya_user_token";

userClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(USER_TOKEN_KEY);
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const googleLogin = (credential) => userClient.post("/user/google", { credential }).then((r) => r.data.data);
export const getMe = () => userClient.get("/user/me").then((r) => r.data.data);
export const updateMe = (body) => userClient.patch("/user/me", body).then((r) => r.data.data);
export const cancelBooking = (id) => userClient.patch(`/user/bookings/${id}/cancel`).then((r) => r.data.data);

// Logged-in customer ki activity record karo (chup-chaap; fail ho to koi farq nahi). Login nahi hai to kuch nahi hota.
export const logActivity = (type, data = {}) => {
  if (!localStorage.getItem(USER_TOKEN_KEY)) return;
  userClient.post("/user/activity", { type, data }).catch(() => {});
};

export default userClient;
