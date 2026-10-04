import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

export const getServices = () => client.get("/services").then(r => r.data.data);
export const getQuizQuestions = () => client.get("/quiz").then(r => r.data.data);
export const getAvailability = (date) => client.get(`/bookings/availability?date=${date}`).then(r => r.data.data);
export const createBooking = (payload) => client.post("/bookings", payload).then(r => r.data.data);
export const submitConsultation = (payload) => client.post("/consultation", payload).then(r => r.data.data);

export default client;