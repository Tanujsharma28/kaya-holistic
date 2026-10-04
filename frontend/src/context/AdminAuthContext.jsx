import { createContext, useContext, useState, useEffect } from "react";

const AdminAuthContext = createContext(null);

export function AdminAuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("kaya_admin_token"));
  const [email, setEmail] = useState(localStorage.getItem("kaya_admin_email"));

  const login = (newToken, newEmail) => {
    localStorage.setItem("kaya_admin_token", newToken);
    localStorage.setItem("kaya_admin_email", newEmail);
    setToken(newToken);
    setEmail(newEmail);
  };

  const logout = () => {
    localStorage.removeItem("kaya_admin_token");
    localStorage.removeItem("kaya_admin_email");
    setToken(null);
    setEmail(null);
  };

  return (
    <AdminAuthContext.Provider value={{ token, email, login, logout, isAuthenticated: !!token }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used inside AdminAuthProvider");
  return ctx;
}