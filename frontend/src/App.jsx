import { Routes, Route } from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Quiz from "./pages/Quiz";
import Result from "./pages/Result";
import Consultation from "./pages/Consultation";
import Booking from "./pages/Booking";
import OnlineConsultation from "./pages/OnlineConsultation";
import Confirmation from "./pages/Confirmation";
import AdminLogin from "./pages/admin/AdminLogin";
import AdminDashboard from "./pages/admin/AdminDashboard";

function PublicSite() {
  return (
    <>
      <Navbar />
      <main className="main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/result" element={<Result />} />
          <Route path="/consultation" element={<Consultation />} />
          <Route path="/booking" element={<Booking />} />
          <Route path="/online-consultation" element={<OnlineConsultation />} />
          <Route path="/confirmation" element={<Confirmation />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <AdminAuthProvider>
      <AppProvider>
        <Routes>
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={
            <ProtectedRoute><AdminDashboard /></ProtectedRoute>
          } />
          <Route path="/*" element={<PublicSite />} />
        </Routes>
      </AppProvider>
    </AdminAuthProvider>
  );
}