import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { api } from "../api";
import { Input, Btn, Spinner } from "../components/ui";
import { sfx } from "../hooks/useSfx";
import { motion } from "framer-motion";
import { GoogleLogin } from "@react-oauth/google";

/* ───────────────── ERROR SANITIZER ───────────────── */
function cleanError(msg) {
  if (!msg) return "Something went wrong. Please try again.";
  if (msg.includes("validation")) return "Something went wrong. Please try again.";
  if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) return "Cannot reach server. Please try again.";
  return msg;
}

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
    <div className="min-h-screen flex items-center justify-center bg-[#0B1220] p-4 md:p-8 overflow-hidden relative">
      <BackgroundOrbs />
      
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 z-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wMykiLz48L3N2Zz4=')] bg-[length:40px_40px] opacity-40" />
      
      <div className="relative z-10 w-full max-w-md perspective-1000">
        <motion.div 
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="bg-[#111827]/40 backdrop-blur-2xl p-8 sm:p-10 rounded-[32px] border border-white/[0.08] shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5),inset_0_1px_0_rgba(255,255,255,0.05)]"
        >
          <div className="flex flex-col items-center text-center mb-10 relative">
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
              className="relative w-16 h-16 mb-6 flex items-center justify-center"
            >
              <div className="absolute inset-0 bg-[#00C896]/20 blur-2xl rounded-full" />
              <img src="/cognit-logo.png" alt="Cognit Logo" className="w-full h-full object-contain relative z-10 drop-shadow-2xl" />
            </motion.div>
            
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="text-3xl font-bold grad-text tracking-tight mb-2"
            >
              Welcome to Cognit
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.5 }}
              className="text-dim text-sm font-medium"
            >
              Your engineering OS
            </motion.p>
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
          >
            {children}
          </motion.div>
        </motion.div>
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
  const [gError, setGError] = useState("");

  const doRedirect = useCallback(() => {
    setBusy(true);
    const id = getGoogleClientId();
    if (!id) return;
    const rootUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const options = {
      redirect_uri: window.location.origin + window.location.pathname,
      client_id: id,
      response_type: "id_token",
      scope: "email profile",
      nonce: "nonce_" + Date.now(),
      prompt: "select_account"
    };
    const qs = new URLSearchParams(options);
    window.location.assign(`${rootUrl}?${qs.toString()}`);
  }, []);

  useEffect(() => {
    const hash = window.location.hash;
    if (hash.includes("id_token=")) {
      setBusy(true);
      const params = new URLSearchParams(hash.substring(1));
      const token = params.get("id_token");
      if (token) {
        window.history.replaceState(null, null, window.location.pathname);
        onSuccess(token);
      }
    }
  }, [onSuccess]);

  return (
    <div className="mb-5 flex flex-col items-center w-full">
      {busy && <div className="py-2"><Spinner size={24} /></div>}
      <div className={`w-full flex flex-col items-center ${busy ? 'hidden' : 'block'}`}>
        <GoogleLogin
          onSuccess={(res) => {
            setBusy(false);
            onSuccess(res.credential);
          }}
          onError={() => {
            console.warn("[GSI_LOGGER]: Popup failed, triggering fallback redirect.");
            doRedirect();
          }}
          useOneTap={true}
          theme="filled_black"
          shape="rectangular"
          text={label === "Sign up with Google" ? "signup_with" : "continue_with"}
          width="320"
        />
        <button 
          onClick={doRedirect} 
          className="text-xs text-dim hover:text-white mt-3 underline decoration-white/20 underline-offset-2 transition-colors"
        >
          Having trouble with the popup? Use redirect
        </button>
      </div>
      {gError && (
        <div className="text-[var(--clr-danger)] text-xs mt-2 text-center">{gError}</div>
      )}
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
          name="otp"
          type="text"
          autoComplete="one-time-code"
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
  const storedEmail = localStorage.getItem("resetEmail");
  const [step, setStep] = useState(storedEmail ? 2 : 1); // 1=email, 2=otp, 3=newPass
  const [email, setEmail] = useState(storedEmail || "");
  const [otp, setOtp] = useState("");
  const [newPass, setNewPass] = useState("");
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    localStorage.removeItem("resetEmail");
    onBack();
  };

  const sendResetOtp = async () => {
    if (!email) { setMsg(""); return setErr("Enter your email"); }
    setErr(""); setLoading(true); setMsg("");
    try {
      const res = await api.forgotPassword({ email });
      setMsg(res.message || "Reset code sent!");
      localStorage.setItem("resetEmail", email);
      sfx.notify();
      setStep(2);
    } catch (e) { 
      setMsg("");
      setErr(cleanError(e.message)); 
      sfx.error(); 
    }
    setLoading(false);
  };

  const resetPassword = async () => {
    const currentEmail = localStorage.getItem("resetEmail");
    if (!currentEmail) {
      setStep(1);
      setMsg("");
      return setErr("Session expired. Please request a new code.");
    }
    if (otp.length !== 6) { setMsg(""); return setErr("Enter 6-digit code"); }
    if (newPass.length < 6) { setMsg(""); return setErr("Password must be at least 6 characters"); }
    setErr(""); setLoading(true); setMsg("");
    try {
      const res = await api.resetPassword({ email: currentEmail, otp, newPassword: newPass });
      setMsg(res.message || "Password reset successfully!");
      localStorage.removeItem("resetEmail");
      sfx.success();
      setStep(3);
    } catch (e) { 
      setMsg("");
      setErr(cleanError(e.message)); 
      sfx.error(); 
    }
    setLoading(false);
  };

  if (step === 3) {
    return (
      <AuthWrap>
        <div className="text-center py-4">
          <span className="material-symbols-outlined text-[var(--ac)] text-5xl mb-3 block">check_circle</span>
          <div className="text-[var(--text)] font-semibold mb-1">Success!</div>
          <div className="text-muted text-sm mb-6">{msg}</div>
          <button onClick={handleBack} className="btn-primary w-full">
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
            <div className="text-xs text-muted mt-1">Enter code sent to <span className="text-[var(--ac)]">{email}</span></div>
          </div>
          <div className="space-y-4">
            <Input name="otp" type="text" autoComplete="one-time-code" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))} placeholder="6-digit code" className="text-center tracking-widest font-mono font-bold w-full"/>
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
        <button onClick={handleBack} className="text-dim text-xs hover:text-[var(--text)] transition-colors">
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
    } catch(e) { 
      setErr(cleanError(e.message)); 
      sfx.error(); 
    }
    setLoading(false);
  };

  const handleGoogle = async (credential) => {
    try {
      await googleLogin(credential);
      sfx.success();
      navigate("/dashboard");
    } catch(e) { 
      setErr(cleanError(e.message)); 
      sfx.error(); 
    }
  };

  const hasGoogle = !!getGoogleClientId();

  return (
    <AuthWrap>
      <div className="flex flex-col gap-2 mb-2">
        {hasGoogle && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <GoogleBtn onSuccess={handleGoogle} />
            <div className="flex items-center gap-4 my-6">
              <div className="h-px flex-1 bg-white/[0.06]"/>
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">or continue with email</span>
              <div className="h-px flex-1 bg-white/[0.06]"/>
            </div>
          </motion.div>
        )}
      </div>

      <motion.div 
        className={`space-y-4 ${err ? "animate-shake" : ""}`}
        initial="hidden" animate="visible"
        variants={{
          visible: { transition: { staggerChildren: 0.1 } }
        }}
      >
        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }} className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-dim text-lg group-focus-within:text-[var(--ac)] transition-colors duration-200">alternate_email</span>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email Address" type="email" className="input-field pl-12 w-full transition-all focus:shadow-[0_0_15px_rgba(0,200,150,0.2)]"/>
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}>
          <PasswordInput value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e => e.key === "Enter" && go()} placeholder="Password" />
        </motion.div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }}
        className="flex justify-between items-center mt-3 px-1"
      >
        <button onClick={() => navigate("/login")} className="text-[11px] font-semibold text-dim hover:text-[var(--text)] transition-colors">Use PIN to sign in</button>
        <button onClick={() => setShowForgot(true)} className="text-[11px] font-semibold text-[var(--ac)] hover:underline">Forgot password?</button>
      </motion.div>

      {err && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="text-[var(--clr-danger)] text-xs mt-4 p-3 bg-[var(--clr-danger)]/10 border border-[var(--clr-danger)]/20 rounded-xl flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">error</span>{err}
        </motion.div>
      )}

      <motion.button 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.9 }}
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={go} disabled={loading} 
        className="btn-primary w-full mt-6 shadow-[0_0_20px_rgba(0,200,150,0.3)] hover:shadow-[0_0_25px_rgba(0,200,150,0.5)] transition-all"
      >
        {loading ? <><Spinner size={14}/> <span className="ml-2">Signing in...</span></> : "Sign in"}
      </motion.button>

      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.0 }}
        className="mt-6 text-center"
      >
        <p className="text-muted text-sm">
          Don't have an account?{" "}
          <Link to="/register" className="text-[var(--ac)] font-bold hover:underline underline-offset-4 transition-all">Sign up</Link>
        </p>
      </motion.div>

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
      await sendOtp(name, email, pass, "");
      sfx.notify();
      setStep(2);
    } catch(e) {
      setErr(cleanError(e.message));
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
    } catch(e) { 
      setErr(cleanError(e.message)); 
      sfx.error(); 
    }
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
      <div className="flex flex-col gap-2 mb-2">
        {hasGoogle && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
            <GoogleBtn onSuccess={handleGoogle} label="Sign up with Google" />
            <div className="flex items-center gap-4 my-6">
              <div className="h-px flex-1 bg-white/[0.06]"/>
              <span className="text-[10px] font-bold text-white/20 uppercase tracking-widest">or register with email</span>
              <div className="h-px flex-1 bg-white/[0.06]"/>
            </div>
          </motion.div>
        )}
      </div>

      <motion.div 
        className={`space-y-4 ${err ? "animate-shake" : ""}`}
        initial="hidden" animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
      >
        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }} className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-dim text-lg group-focus-within:text-[var(--ac)] transition-colors duration-200">person</span>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Full Name" className="input-field pl-12 w-full transition-all focus:shadow-[0_0_15px_rgba(0,200,150,0.2)]"/>
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }} className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-dim text-lg group-focus-within:text-[var(--ac)] transition-colors duration-200">alternate_email</span>
          <input value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email Address" type="email" className="input-field pl-12 w-full transition-all focus:shadow-[0_0_15px_rgba(0,200,150,0.2)]"/>
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}>
          <PasswordInput value={pass} onChange={e=>setPass(e.target.value)} placeholder="Password" />
          {pass && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="flex gap-1 mt-2 px-1">
              {[1, 2, 3, 4].map((level) => (
                <div key={level} className={`h-1 flex-1 rounded-full transition-colors duration-300 ${score >= level ? strengthColors[score] : strengthColors[0]}`} />
              ))}
            </motion.div>
          )}
        </motion.div>
        <motion.div variants={{ hidden: { opacity: 0, x: -10 }, visible: { opacity: 1, x: 0 } }}>
          <PasswordInput value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} placeholder="Confirm Password" onKeyDown={e => e.key === "Enter" && handleSendOTP()} />
        </motion.div>
      </motion.div>

      {err && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
          className="text-[var(--clr-danger)] text-xs mt-4 p-3 bg-[var(--clr-danger)]/10 border border-[var(--clr-danger)]/20 rounded-xl flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-sm">error</span>{err}
        </motion.div>
      )}

      <motion.button 
        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
        onClick={handleSendOTP} disabled={loading} 
        className="btn-primary w-full mt-6 shadow-[0_0_20px_rgba(0,200,150,0.3)] hover:shadow-[0_0_25px_rgba(0,200,150,0.5)] transition-all"
      >
        {loading ? <><Spinner size={14}/> <span className="ml-2">Creating account...</span></> : "Create account"}
      </motion.button>

      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
        className="mt-6 text-center"
      >
        <p className="text-muted text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-[var(--ac)] font-bold hover:underline underline-offset-4 transition-all">Sign in</Link>
        </p>
      </motion.div>

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
