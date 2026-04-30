import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import { Input, Btn, Spinner } from "../components/ui";
import { sfx } from "../hooks/useSfx";
import { motion } from "framer-motion";

/* ───────────────── PASSWORD INPUT WITH VISIBILITY TOGGLE ───────────────── */
function PasswordInput({ value, onChange, placeholder, onKeyDown, className = "" }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative group">
      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2
        text-dim text-lg group-focus-within:text-[var(--ac)] transition-colors duration-200">lock</span>
      <input value={value} onChange={onChange}
        placeholder={placeholder || "••••••••"}
        type={show ? "text" : "password"}
        onKeyDown={onKeyDown}
        className={`input-field pl-12 pr-12 w-full ${className}`}/>
      <button type="button" onClick={() => setShow(!show)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-dim
          hover:text-[var(--text)] transition-colors duration-200"
        tabIndex={-1}>
        <span className="material-symbols-outlined text-lg">
          {show ? "visibility_off" : "visibility"}
        </span>
      </button>
    </div>
  );
}

/* ───────────────── BACKGROUND ORBS ───────────────── */
function BackgroundOrbs() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const h = (e) => setReduced(e.matches);
    mq.addEventListener("change", h);
    return () => mq.removeEventListener("change", h);
  }, []);
  
  if (reduced) return null;
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      <div className="absolute top-[-10%] left-[-10%] w-[400px] h-[400px] rounded-full bg-[#00C896]/8 blur-[120px]" 
           style={{ animation: 'floatOrb1 15s ease-in-out infinite' }} />
      <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-[#8b5cf6]/8 blur-[100px]" 
           style={{ animation: 'floatOrb2 20s ease-in-out infinite' }} />
      <div className="absolute top-[30%] left-[30%] w-[200px] h-[200px] rounded-full bg-[#3b82f6]/5 blur-[80px]" 
           style={{ animation: 'floatOrb3 18s ease-in-out infinite' }} />
    </div>
  );
}

/* ───────────────── AUTH WRAPPER ───────────────── */
function AuthWrap({ children }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg)] p-4 md:p-8 overflow-hidden relative">
      <BackgroundOrbs />
      <div className="relative z-10 w-full max-w-sm">
        <div className="glass-card p-8 rounded-2xl border border-white/10"
          style={{ backdropFilter: "blur(24px)", WebkitBackdropFilter: "blur(24px)" }}>
          <div className="flex flex-col items-center text-center mb-8">
            <img src="/cognit-logo.png" alt="Cognit" className="w-10 h-10 object-contain mb-3" />
            <h1 className="text-2xl font-extrabold grad-text tracking-tight mb-1">Cognit</h1>
            <p className="text-muted text-sm">Your engineering OS</p>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ───────────────── GOOGLE LOGIN ───────────────── */
function getGoogleClientId() {
  const e = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const w = typeof window !== "undefined" && window.__GOOGLE_CLIENT_ID__;
  if (e && !e.includes("YOUR")) return e;
  if (w && !w.includes("YOUR")) return w;
  return null;
}

function GoogleBtn({ onSuccess, label="Continue with Google" }) {
  const [busy, setBusy] = useState(false);
  const initialised = useRef(false);

  const runPrompt = (clientId) => {
    if (!initialised.current) {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (r) => {
          setBusy(false);
          if (r.credential) onSuccess(r.credential);
        },
      });
      initialised.current = true;
    }
    window.google.accounts.id.prompt((n) => {
      if (n.isNotDisplayed() || n.isSkippedMoment()) setBusy(false);
    });
  };

  const handleClick = () => {
    const id = getGoogleClientId();
    if (!id) return;
    setBusy(true);
    if (!window.google) {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.onload = () => runPrompt(id);
      s.onerror = () => { setBusy(false); };
      document.head.appendChild(s);
    } else {
      runPrompt(id);
    }
  };

  return (
    <div className="mb-5">
      <button onClick={handleClick} disabled={busy}
        className="w-full flex items-center justify-center gap-3 py-3 px-4
          bg-white/5 hover:bg-white/10 border border-white/10
          rounded-xl transition-all duration-200 group backdrop-blur-sm">
        {busy ? <><Spinner size={14}/> <span className="text-sm font-medium text-[var(--text)]">Loading...</span></> : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M12 5.04c1.94 0 3.51.68 4.75 1.81l3.51-3.51C18.1 1.34 15.28 0 12 0 7.31 0 3.25 2.67 1.21 6.6L4.9 9.42C5.77 6.9 8.16 5.04 12 5.04z" fill="#EA4335"/>
              <path d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.7 2.87c2.16-1.99 3.42-4.93 3.42-8.69z" fill="#4285F4"/>
              <path d="M4.9 14.58c-.23-.68-.36-1.41-.36-2.16s.13-1.48.36-2.16L1.21 7.4c-.79 1.56-1.21 3.32-1.21 5.2s.42 3.64 1.21 5.2l3.69-2.82z" fill="#FBBC05"/>
              <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.7-2.87c-1.08.73-2.48 1.15-4.23 1.15-3.23 0-5.97-2.18-6.95-5.11l-3.84 2.96C3.12 21.09 7.21 24 12 24z" fill="#34A853"/>
            </svg>
            <span className="font-medium text-sm text-[var(--text)]">{label}</span>
          </>
        )}
      </button>
      <div className="flex items-center gap-4 my-4">
        <div className="h-px flex-1 bg-white/10"/>
        <span className="text-[10px] font-bold text-dim uppercase tracking-widest">or</span>
        <div className="h-px flex-1 bg-white/10"/>
      </div>
    </div>
  );
}

/* ───────────────── OTP STEP ───────────────── */
function OTPStep({ email, onVerified, onBack }) {
  const { verifyOtp, resendOtp } = useAuth();
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendMsg, setResendMsg] = useState("");

  const verify = async () => {
    if (otp.length !== 6) return setErr("Enter the 6-digit code");
    setErr("");
    setLoading(true);
    try {
      await verifyOtp(email, otp);
      sfx.success();
      onVerified();
    } catch(e) {
      setErr(e.message);
      sfx.error();
    }
    setLoading(false);
  };

  const handleResend = async () => {
    setResending(true);
    setResendMsg("");
    setErr("");
    try {
      await resendOtp(email);
      setResendMsg("New code sent!");
      sfx.notify();
    } catch(e) {
      setErr(e.message);
      sfx.error();
    }
    setResending(false);
  };

  return (
    <AuthWrap>
      <div className="text-center mb-5">
        <span className="material-symbols-outlined text-[var(--ac)] text-4xl mb-2 block">mark_email_read</span>
        <div className="text-sm text-[var(--text)] font-semibold mb-1">Verify Email</div>
        <div className="text-xs text-muted">
          Code sent to <span className="text-[var(--ac)]">{email}</span>
        </div>
      </div>

      <div className={err ? "animate-shake" : ""}>
        <Input
          value={otp}
          onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
          placeholder="Enter 6-digit OTP"
          className="text-center text-lg tracking-[0.5em] font-mono font-bold w-full"
        />
      </div>

      {err && (
        <div className="text-[var(--clr-danger)] text-xs mt-3 p-3 bg-[var(--clr-danger)]/10 border border-[var(--clr-danger)]/20 rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>{err}
        </div>
      )}
      {resendMsg && (
        <div className="text-[var(--ac)] text-xs mt-3 p-3 bg-[var(--ac)]/10 border border-[var(--ac)]/20 rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">check_circle</span>{resendMsg}
        </div>
      )}

      <button onClick={verify} disabled={loading} className="btn-primary w-full mt-5 mb-4">
        {loading ? <><Spinner size={14}/> <span className="ml-2">Verifying...</span></> : "Verify Account"}
      </button>

      <div className="flex justify-between items-center px-1">
        <button onClick={onBack} className="text-dim text-xs hover:text-[var(--text)] transition-colors">Back</button>
        <button onClick={handleResend} disabled={resending}
          className="text-[var(--ac)] text-xs font-semibold hover:underline">
          {resending ? "Sending..." : "Resend Code"}
        </button>
      </div>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 3; }
      `}</style>
    </AuthWrap>
  );
}

/* ───────────────── FORGOT PASSWORD FLOW ───────────────── */
function ForgotPasswordFlow({ onBack }) {
  const [step, setStep] = useState(1); // 1=email, 2=otp, 3=newPass
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const sendResetOtp = async () => {
    if (!email) return setErr("Enter your email");
    setErr(""); setLoading(true);
    try {
      const res = await api.forgotPassword({ email });
      setMsg(res.message || "Reset code sent!");
      sfx.notify();
      setStep(2);
    } catch (e) { setErr(e.message); sfx.error(); }
    setLoading(false);
  };

  const resetPassword = async () => {
    if (otp.length !== 6) return setErr("Enter 6-digit code");
    if (newPass.length < 6) return setErr("Password must be at least 6 characters");
    setErr(""); setLoading(true);
    try {
      const res = await api.resetPassword({ email, otp, newPassword: newPass });
      setMsg(res.message || "Password reset successfully!");
      sfx.success();
      setStep(3);
    } catch (e) { setErr(e.message); sfx.error(); }
    setLoading(false);
  };

  if (step === 3) {
    return (
      <AuthWrap>
        <div className="text-center py-4">
          <span className="material-symbols-outlined text-[var(--ac)] text-5xl mb-3 block">check_circle</span>
          <div className="text-[var(--text)] font-semibold mb-1">Success!</div>
          <div className="text-muted text-sm mb-6">{msg}</div>
          <button onClick={onBack} className="btn-primary w-full">
            Back to Sign In
          </button>
        </div>
      </AuthWrap>
    );
  }

  return (
    <AuthWrap>
      {step === 1 && (
        <div className={err ? "animate-shake" : ""}>
          <div className="text-center mb-5">
            <span className="material-symbols-outlined text-[var(--ac)] text-4xl mb-2 block">lock_reset</span>
            <div className="text-[var(--text)] font-semibold text-sm mb-1">Reset Password</div>
          </div>
          <div className="space-y-4">
            <div className="relative group">
              <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-dim text-lg group-focus-within:text-[var(--ac)] transition-colors">alternate_email</span>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="Email Address" type="email" onKeyDown={e => e.key === "Enter" && sendResetOtp()} className="input-field pl-12 w-full"/>
            </div>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={err ? "animate-shake" : ""}>
          <div className="text-center mb-5">
            <span className="material-symbols-outlined text-[var(--ac)] text-4xl mb-2 block">mark_email_read</span>
            <div className="text-[var(--text)] font-semibold text-sm mb-1">Reset Code</div>
          </div>
          <div className="space-y-4">
            <Input value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="6-digit code" className="text-center tracking-widest font-mono font-bold w-full"/>
            <PasswordInput value={newPass} onChange={e => setNewPass(e.target.value)} placeholder="New Password" onKeyDown={e => e.key === "Enter" && resetPassword()} />
          </div>
        </div>
      )}

      {err && (
        <div className="text-[var(--clr-danger)] text-xs mt-4 p-3 bg-[var(--clr-danger)]/10 border border-[var(--clr-danger)]/20 rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>{err}
        </div>
      )}
      {msg && step !== 3 && (
        <div className="text-[var(--ac)] text-xs mt-4 p-3 bg-[var(--ac)]/10 border border-[var(--ac)]/20 rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">check_circle</span>{msg}
        </div>
      )}

      <button onClick={step === 1 ? sendResetOtp : resetPassword} disabled={loading} className="btn-primary w-full mt-5">
        {loading ? <><Spinner size={14}/> <span className="ml-2">{step === 1 ? "Sending..." : "Resetting..."}</span></> : step === 1 ? "Send Reset Code" : "Reset Password"}
      </button>

      <div className="mt-5 text-center">
        <button onClick={onBack} className="text-dim text-xs hover:text-[var(--text)] transition-colors">
          ← Back to Sign In
        </button>
      </div>
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 3; }
      `}</style>
    </AuthWrap>
  );
}

/* ───────────────── LOGIN PAGE ───────────────── */
export function LoginPage() {
  const { login, googleLogin, user } = useAuth();
  const navigate = useNavigate();

  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);
  const [showForgot, setShowForgot] = useState(false);

  if (user) { navigate("/dashboard", { replace: true }); return null; }
  if (showForgot) { return <ForgotPasswordFlow onBack={() => setShowForgot(false)} />; }

  const go = async () => {
    if (!email || !pass) return setErr("Email and password required");
    setErr("");
    setLoading(true);
    try {
      await login(email,pass);
      sfx.success();
      navigate("/dashboard");
    } catch(e){ setErr(e.message); sfx.error(); }
    setLoading(false);
  };

  const handleGoogle = async (credential) => {
    try {
      await googleLogin(credential);
      sfx.success();
      navigate("/dashboard");
    } catch(e) { setErr(e.message); sfx.error(); }
  };

  const hasGoogle = !!getGoogleClientId();

  return (
    <AuthWrap>
      {hasGoogle && <GoogleBtn onSuccess={handleGoogle} />}

      <div className={`space-y-4 ${err ? "animate-shake" : ""}`}>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-dim text-lg group-focus-within:text-[var(--ac)] transition-colors duration-200">alternate_email</span>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email Address" type="email" className="input-field pl-12 w-full"/>
        </div>
        <PasswordInput value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} placeholder="Password" />
      </div>

      <div className="flex justify-between items-center mt-3 px-1">
        <button onClick={() => navigate("/login")} className="text-[11px] font-semibold text-dim hover:text-[var(--text)] transition-colors">Use PIN to sign in</button>
        <button onClick={() => setShowForgot(true)} className="text-[11px] font-semibold text-[var(--ac)] hover:underline">Forgot password?</button>
      </div>

      {err && (
        <div className="text-[var(--clr-danger)] text-xs mt-4 p-3 bg-[var(--clr-danger)]/10 border border-[var(--clr-danger)]/20 rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>{err}
        </div>
      )}

      <button onClick={go} disabled={loading} className="btn-primary w-full mt-6">
        {loading ? <><Spinner size={14}/> <span className="ml-2">Signing in...</span></> : "Sign in"}
      </button>

      <div className="mt-6 text-center">
        <p className="text-muted text-sm">
          Don't have an account?{" "}
          <Link to="/register" className="text-[var(--ac)] font-bold hover:underline underline-offset-4 transition-all">Sign up</Link>
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 3; }
      `}</style>
    </AuthWrap>
  );
}

/* ───────────────── REGISTER PAGE ───────────────── */
export function RegisterPage() {
  const { sendOtp, googleLogin, user } = useAuth();
  const navigate = useNavigate();

  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [confirmPass,setConfirmPass]=useState("");
  const [step,setStep]=useState(1);
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);

  if (user) { navigate("/dashboard", { replace: true }); return null; }

  const handleSendOTP = async () => {
    if (!name || !email || !pass || !confirmPass) return setErr("All fields are required");
    if (pass !== confirmPass) return setErr("Passwords do not match");
    if (pass.length < 6) return setErr("Password must be at least 6 characters");
    setErr("");
    setLoading(true);
    try {
      const result = await sendOtp(name, email, pass, "");
      if (result.skipOTP) {
        sfx.success();
        navigate("/dashboard");
      } else {
        sfx.notify();
        setStep(2);
      }
    } catch(e) {
      setErr(e.message);
      sfx.error();
    }
    setLoading(false);
  };

  const onVerified = () => { navigate("/dashboard"); };

  const handleGoogle = async (credential) => {
    try {
      await googleLogin(credential);
      sfx.success();
      navigate("/dashboard");
    } catch(e) { setErr(e.message); sfx.error(); }
  };

  if (step === 2) {
    return <OTPStep email={email} onVerified={onVerified} onBack={() => setStep(1)} />;
  }

  const hasGoogle = !!getGoogleClientId();

  // Password strength calculation
  let score = 0;
  if (pass.length > 5) score += 1;
  if (pass.length > 8) score += 1;
  if (/[A-Z]/.test(pass) && /[a-z]/.test(pass)) score += 1;
  if (/[0-9!@#$%^&*]/.test(pass)) score += 1;
  const strengthColors = ["bg-white/10", "bg-[var(--clr-danger)]", "bg-[var(--clr-streak)]", "bg-[var(--clr-warning)]", "bg-[var(--ac)]"];

  return (
    <AuthWrap>
      {hasGoogle && <GoogleBtn onSuccess={handleGoogle} label="Sign up with Google" />}

      <div className={`space-y-4 ${err ? "animate-shake" : ""}`}>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-dim text-lg group-focus-within:text-[var(--ac)] transition-colors duration-200">person</span>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full Name" className="input-field pl-12 w-full"/>
        </div>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-dim text-lg group-focus-within:text-[var(--ac)] transition-colors duration-200">alternate_email</span>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email Address" type="email" className="input-field pl-12 w-full"/>
        </div>
        <div>
          <PasswordInput value={pass} onChange={e=>setPass(e.target.value)} placeholder="Password" />
          {pass && (
            <div className="flex gap-1 mt-2 px-1">
              {[1, 2, 3, 4].map((level) => (
                <div key={level} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${score >= level ? strengthColors[score] : strengthColors[0]}`} />
              ))}
            </div>
          )}
        </div>
        <PasswordInput value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} placeholder="Confirm Password" onKeyDown={e => e.key === "Enter" && handleSendOTP()} />
      </div>

      {err && (
        <div className="text-[var(--clr-danger)] text-xs mt-4 p-3 bg-[var(--clr-danger)]/10 border border-[var(--clr-danger)]/20 rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>{err}
        </div>
      )}

      <button onClick={handleSendOTP} disabled={loading} className="btn-primary w-full mt-6">
        {loading ? <><Spinner size={14}/> <span className="ml-2">Creating account...</span></> : "Create account"}
      </button>

      <div className="mt-6 text-center">
        <p className="text-muted text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-[var(--ac)] font-bold hover:underline underline-offset-4 transition-all">Sign in</Link>
        </p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-6px); }
          75% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 3; }
      `}</style>
    </AuthWrap>
  );
}
