import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Input, Btn, Spinner } from "../components/ui";
import { sfx } from "../hooks/useSfx";

/* ───────────────── AUTH WRAPPER ───────────────── */
function AuthWrap({ children, title, sub }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg p-4 md:p-12 overflow-hidden">
      {/* Ambient orbs */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[50%] h-[50%]
          bg-primary/10 blur-[120px] rounded-full" style={{animation:"floatOrb1 18s ease-in-out infinite"}}/>
        <div className="absolute top-[40%] -right-[5%] w-[40%] h-[40%]
          bg-info/5 blur-[100px] rounded-full" style={{animation:"floatOrb2 22s ease-in-out infinite"}}/>
      </div>

      <div className="relative z-10 w-full max-w-7xl flex flex-col md:flex-row items-center gap-12 lg:gap-20">
        {/* Left hero */}
        <div className="w-full md:w-1/2 flex flex-col items-start text-left">
          <div className="mb-6 flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-primary to-primary-container rounded-2xl
              flex items-center justify-center shadow-[0_0_30px_rgba(75,226,119,0.2)]">
              <span className="material-symbols-outlined text-black font-bold text-xl">terminal</span>
            </div>
            <h1 className="text-3xl font-black text-primary tracking-tighter text-glow">EnggStack</h1>
          </div>
          <h2 className="text-4xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-5 text-on-surface">
            Master the <br/>
            <span className="text-primary italic">engineering</span> <br/>
            stack.
          </h2>
          <p className="text-muted text-base lg:text-lg max-w-md leading-relaxed mb-8">
            The high-fidelity platform for modern engineer-creators. Build, practice, and scale with professional precision.
          </p>
          <div className="hidden md:flex items-center gap-5 p-4 bg-surface-low rounded-2xl border border-white/5">
            <div className="flex -space-x-2">
              {["🟢","🔵","🟣"].map((c,i) => (
                <div key={i} className="w-9 h-9 rounded-full border-2 border-bg flex items-center
                  justify-center text-sm"
                  style={{background:`rgba(75,226,119,${0.1+i*0.1})`}}>
                  {String.fromCharCode(65+i)}
                </div>
              ))}
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">Join 2,400+ engineers</p>
              <p className="text-[10px] text-muted uppercase tracking-widest font-bold">Already on board</p>
            </div>
          </div>
        </div>

        {/* Right form */}
        <div className="w-full md:w-1/2 max-w-md">
          <div className="glass-card p-8 lg:p-10 shadow-2xl relative overflow-hidden">
            <div className="mb-8">
              <h3 className="text-xl font-bold text-on-surface mb-1">{title}</h3>
              <p className="text-muted text-sm">{sub}</p>
            </div>
            {children}
            <div className="absolute -bottom-16 -right-16 w-32 h-32 bg-primary/5 rounded-full blur-3xl"/>
          </div>
          <p className="text-center mt-6 text-dim/50 text-[10px] uppercase tracking-[0.2em] font-black">
            Secure 256-bit AES Encryption
          </p>
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
    <div className="mb-4">
      <button onClick={handleClick} disabled={busy}
        className="w-full flex items-center justify-center gap-3 py-3.5 px-6
          bg-surface-low hover:bg-surface-top border border-white/10
          rounded-xl transition-all duration-300 group">
        {busy ? <><Spinner size={14}/> <span className="text-sm font-semibold text-on-surface">Loading...</span></> : (
          <>
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path d="M12 5.04c1.94 0 3.51.68 4.75 1.81l3.51-3.51C18.1 1.34 15.28 0 12 0 7.31 0 3.25 2.67 1.21 6.6L4.9 9.42C5.77 6.9 8.16 5.04 12 5.04z" fill="#EA4335"/>
              <path d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58l3.7 2.87c2.16-1.99 3.42-4.93 3.42-8.69z" fill="#4285F4"/>
              <path d="M4.9 14.58c-.23-.68-.36-1.41-.36-2.16s.13-1.48.36-2.16L1.21 7.4c-.79 1.56-1.21 3.32-1.21 5.2s.42 3.64 1.21 5.2l3.69-2.82z" fill="#FBBC05"/>
              <path d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.7-2.87c-1.08.73-2.48 1.15-4.23 1.15-3.23 0-5.97-2.18-6.95-5.11l-3.84 2.96C3.12 21.09 7.21 24 12 24z" fill="#34A853"/>
            </svg>
            <span className="font-semibold text-sm text-on-surface">{label}</span>
          </>
        )}
      </button>
      <div className="flex items-center gap-4 my-4">
        <div className="h-px flex-1 bg-white/10"/>
        <span className="text-[10px] font-bold text-dim uppercase tracking-widest">or email</span>
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
    if (otp.length !== 6) return setErr("Enter the 6-digit code from your email");
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
    <AuthWrap title="Verify Email" sub="Enter the 6-digit code sent to your email">
      <div className="text-center mb-5">
        <span className="material-symbols-outlined text-primary text-4xl mb-2 block">mark_email_read</span>
        <div className="text-sm text-muted">
          Code sent to <span className="text-primary font-semibold">{email}</span>
        </div>
      </div>

      <Input
        value={otp}
        onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
        placeholder="Enter 6-digit OTP"
        style={{textAlign:"center",fontSize:22,letterSpacing:8,fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}
      />

      {err && (
        <div className="text-danger text-xs mb-3 p-3 bg-danger/5 border border-danger/20 rounded-xl
          flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>{err}
        </div>
      )}
      {resendMsg && (
        <div className="text-primary text-xs mb-3 p-3 bg-primary/5 border border-primary/20 rounded-xl
          flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">check_circle</span>{resendMsg}
        </div>
      )}

      <Btn full onClick={verify} disabled={loading} style={{marginBottom:12}}>
        {loading ? <><Spinner size={14}/> Verifying...</> : "✓ Verify & Create Account"}
      </Btn>

      <div className="flex justify-between items-center">
        <button onClick={onBack} className="text-dim text-xs hover:text-on-surface transition-colors">← Back</button>
        <button onClick={handleResend} disabled={resending}
          className="text-primary text-xs font-semibold hover:underline">
          {resending ? "Sending..." : "Resend Code"}
        </button>
      </div>
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

  if (user) { navigate("/dashboard", { replace: true }); return null; }

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
    <AuthWrap title="Welcome back" sub="Access your developer dashboard and modules.">
      {hasGoogle && <GoogleBtn onSuccess={handleGoogle} />}

      <div className="space-y-1">
        <label className="label-text ml-1">Email Address</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2
            text-dim text-lg group-focus-within:text-primary transition-colors">alternate_email</span>
          <input value={email} onChange={e=>setEmail(e.target.value)}
            placeholder="dev@enggstack.com" type="email"
            className="input-field pl-12"/>
        </div>
      </div>

      <div className="space-y-1 mt-4">
        <div className="flex justify-between items-center px-1">
          <label className="label-text">Password</label>
          <a className="text-[10px] font-bold text-primary hover:underline" href="#">Forgot?</a>
        </div>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2
            text-dim text-lg group-focus-within:text-primary transition-colors">lock</span>
          <input value={pass} onChange={e=>setPass(e.target.value)}
            placeholder="••••••••" type="password"
            onKeyDown={e => e.key === "Enter" && go()}
            className="input-field pl-12"/>
        </div>
      </div>

      {err && (
        <div className="text-danger text-xs mt-3 p-3 bg-danger/5 border border-danger/20 rounded-xl
          flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>{err}
        </div>
      )}

      <button onClick={go} disabled={loading}
        className="btn-primary w-full mt-5 py-3.5 text-base flex items-center justify-center gap-2">
        {loading ? <><Spinner size={14}/> Signing in...</> : <>Sign In
          <span className="material-symbols-outlined text-lg">arrow_forward</span></>}
      </button>

      <div className="mt-8 pt-6 border-t border-white/5 text-center">
        <p className="text-muted text-sm">
          Don't have an account?{" "}
          <Link to="/register" className="text-primary font-bold hover:underline underline-offset-4">Sign up</Link>
        </p>
      </div>
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
  const [username,setUsername]=useState("");
  const [step,setStep]=useState(1);
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);

  if (user) { navigate("/dashboard", { replace: true }); return null; }

  const handleSendOTP = async () => {
    if (!name || !email || !pass) return setErr("Name, email and password are required");
    if (pass.length < 6) return setErr("Password must be at least 6 characters");
    setErr("");
    setLoading(true);
    try {
      const result = await sendOtp(name, email, pass, username);
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

  return (
    <AuthWrap title="Create account" sub="Sign up to start studying smarter">
      {hasGoogle && <GoogleBtn onSuccess={handleGoogle} />}

      <div className="space-y-1">
        <label className="label-text ml-1">Full Name</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2
            text-dim text-lg group-focus-within:text-primary transition-colors">person</span>
          <input value={name} onChange={e=>setName(e.target.value)}
            placeholder="e.g. Rahul Sharma" className="input-field pl-12"/>
        </div>
      </div>

      <div className="space-y-1 mt-3">
        <label className="label-text ml-1">Email</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2
            text-dim text-lg group-focus-within:text-primary transition-colors">alternate_email</span>
          <input value={email} onChange={e=>setEmail(e.target.value)}
            placeholder="you@example.com" className="input-field pl-12"/>
        </div>
      </div>

      <div className="space-y-1 mt-3">
        <label className="label-text ml-1">Username (optional)</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2
            text-dim text-lg group-focus-within:text-primary transition-colors">alternate_email</span>
          <input value={username} onChange={e=>setUsername(e.target.value)}
            placeholder="@username" className="input-field pl-12"/>
        </div>
      </div>

      <div className="space-y-1 mt-3">
        <label className="label-text ml-1">Password</label>
        <div className="relative group">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2
            text-dim text-lg group-focus-within:text-primary transition-colors">lock</span>
          <input value={pass} onChange={e=>setPass(e.target.value)}
            placeholder="Min 6 characters" type="password"
            onKeyDown={e => e.key === "Enter" && handleSendOTP()}
            className="input-field pl-12"/>
        </div>
      </div>

      {err && (
        <div className="text-danger text-xs mt-3 p-3 bg-danger/5 border border-danger/20 rounded-xl
          flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">error</span>{err}
        </div>
      )}

      <button onClick={handleSendOTP} disabled={loading}
        className="btn-primary w-full mt-5 py-3.5 text-base flex items-center justify-center gap-2">
        {loading ? <><Spinner size={14}/> Sending OTP...</> : <>Create Account
          <span className="material-symbols-outlined text-lg">arrow_forward</span></>}
      </button>

      <div className="mt-8 pt-6 border-t border-white/5 text-center">
        <p className="text-muted text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-primary font-bold hover:underline underline-offset-4">Sign in</Link>
        </p>
      </div>
    </AuthWrap>
  );
}