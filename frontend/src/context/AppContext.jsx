import { createContext, useContext, useState } from "react";

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [quizAnswers, setQuizAnswers] = useState({});
  const [selectedService, setSelectedService] = useState(null);
  const [booking, setBooking] = useState({
    date: null, slot: null, name: "", email: "", phone: "", note: "",
  });

  const resetQuiz = () => setQuizAnswers({});

  const value = {
    quizAnswers, setQuizAnswers, resetQuiz,
    selectedService, setSelectedService,
    booking, setBooking,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}