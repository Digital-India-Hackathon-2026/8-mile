import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { api, setToken, getToken } from './api.js';

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;
    api
      .me()
      .then((d) => setUser(d.user))
      .catch(() => setToken(null))
      .finally(() => setLoading(false));
  }, []);

  const adopt = (d) => {
    setToken(d.token);
    setUser(d.user);
    return d.user;
  };

  const register = useCallback(async (body) => adopt(await api.register(body)), []);
  const login = useCallback(async (body) => adopt(await api.login(body)), []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const updatePrefs = useCallback(async (patch) => {
    if (!getToken()) return null;
    const { user: u } = await api.updateMe(patch);
    setUser(u);
    return u;
  }, []);

  const changePassword = useCallback(async (body) => {
    return api.changePassword(body);
  }, []);

  const deleteAccount = useCallback(async () => {
    await api.deleteAccount();
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthCtx.Provider value={{ user, loading, register, login, logout, updatePrefs, changePassword, deleteAccount, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthCtx.Provider>
  );
}