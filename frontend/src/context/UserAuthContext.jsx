import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { googleLogin, getMe, USER_TOKEN_KEY } from "../api/userClient";

const Ctx = createContext(null);

export function UserAuthProvider({ children }) {
  const [data, setData] = useState(null); // { user, upcoming, past, stats, consents, consultations }
  const [ready, setReady] = useState(!localStorage.getItem(USER_TOKEN_KEY));

  const logout = useCallback(() => {
    localStorage.removeItem(USER_TOKEN_KEY);
    setData(null);
  }, []);

  const refresh = useCallback(async () => {
    if (!localStorage.getItem(USER_TOKEN_KEY)) { setData(null); return null; }
    try {
      const d = await getMe();
      setData(d);
      return d;
    } catch (e) {
      // Token expire / invalid ho to logout; network error pe session mat todo
      if (e?.response?.status === 401) logout();
      return null;
    }
  }, [logout]);

  useEffect(() => {
    refresh().finally(() => setReady(true));
  }, [refresh]);

  const login = async (credential) => {
    const d = await googleLogin(credential);
    localStorage.setItem(USER_TOKEN_KEY, d.token);
    await refresh();
    return d.user;
  };

  return (
    <Ctx.Provider value={{ user: data?.user || null, data, ready, login, logout, refresh }}>
      {children}
    </Ctx.Provider>
  );
}

export function useUserAuth() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useUserAuth must be used inside UserAuthProvider");
  return c;
}
