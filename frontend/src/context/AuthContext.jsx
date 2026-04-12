import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { api } from "../api";

const Ctx = createContext(null);

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  const applyUser = (u) => {
    setUser(u);
    document.documentElement.setAttribute("data-theme", u?.theme || "dark");
    const ac = u?.accentColor || "#4ade80";
    document.documentElement.style.setProperty("--ac", ac);
    document.documentElement.style.setProperty("--ac-dim", ac + "20");
  };

  useEffect(() => {
    const token = localStorage.getItem("es_token");
    if (token) {
      api.me().then(applyUser).catch(() => localStorage.removeItem("es_token")).finally(() => setLoading(false));
    } else setLoading(false);
  }, []);

  const login = async (email, password) => {
    const d = await api.login({ email, password });
    localStorage.setItem("es_token", d.token);
    applyUser(d.user);
  };

  // OTP-based registration — step 1: send OTP
  const sendOtp = async (name, email, password, username) => {
    const d = await api.sendOtp({ name, email, password, username });
    // If GMAIL not configured, backend auto-creates account (skipOTP flag)
    if (d.skipOTP && d.token) {
      localStorage.setItem("es_token", d.token);
      applyUser(d.user);
      return { skipOTP: true };
    }
    return { skipOTP: false, message: d.message };
  };

  // OTP-based registration — step 2: verify OTP
  const verifyOtp = async (email, otp) => {
    const d = await api.verifyOtp({ email, otp });
    localStorage.setItem("es_token", d.token);
    applyUser(d.user);
  };

  // Resend OTP
  const resendOtp = async (email) => {
    await api.resendOtp({ email });
  };

  const googleLogin = async (credential) => {
    const d = await api.googleAuth({ credential });
    localStorage.setItem("es_token", d.token);
    applyUser(d.user);
  };

  const pinLogin = async (email, pin) => {
    const d = await api.pinLogin({ email, pin });
    localStorage.setItem("es_token", d.token);
    applyUser(d.user);
  };

  const logout = () => {
    localStorage.removeItem("es_token");
    setUser(null);
    document.documentElement.setAttribute("data-theme", "dark");
  };

  const refreshUser = useCallback(async () => {
    try { const u = await api.me(); applyUser(u); } catch {}
  }, []);

  return (
    <Ctx.Provider value={{ user, loading, login, sendOtp, verifyOtp, resendOtp, googleLogin, pinLogin, logout, refreshUser, applyUser }}>
      {children}
    </Ctx.Provider>
  );
}
export const useAuth = () => useContext(Ctx);
