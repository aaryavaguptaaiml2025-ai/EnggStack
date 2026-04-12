import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Input, Btn, Spinner } from "../components/ui";
import { sfx } from "../hooks/useSfx";

/* ───────────────── AUTH WRAPPER ───────────────── */
function AuthWrap({ children, title, sub }) {
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg)",padding:16}}>
      {/* Ambient orbs */}
      <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0,overflow:"hidden"}}>
        <div style={{position:"absolute",width:"50vw",height:"50vw",maxWidth:500,maxHeight:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(74,222,128,.06),transparent 65%)",top:"-10%",left:"5%",animation:"floatOrb1 18s ease-in-out infinite"}}/>
        <div style={{position:"absolute",width:"40vw",height:"40vw",maxWidth:400,maxHeight:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(96,165,250,.05),transparent 65%)",bottom:"-10%",right:"5%",animation:"floatOrb2 22s ease-in-out infinite"}}/>
      </div>

      <div style={{width:"100%",maxWidth:420,position:"relative",zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:56,height:56,background:"var(--ac)",borderRadius:16,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:900,color:"#000",marginBottom:14,boxShadow:"0 0 32px var(--ac-dim)",animation:"glow 2s ease-in-out infinite"}}>E</div>
          <div style={{fontSize:24,fontWeight:800,color:"var(--text)"}}>{title}</div>
          <div style={{fontSize:13,color:"var(--muted)"}}>{sub}</div>
        </div>
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:24,boxShadow:"0 16px 48px rgba(0,0,0,.4)"}}>
          {children}
        </div>
      </div>
    </div>
  );
}

/* ───────────────── GOOGLE LOGIN ───────────────── */
function GoogleBtn({ onSuccess, label="Continue with Google" }) {
  const [busy, setBusy] = useState(false);
  const initialised = useRef(false);

  const getClientId = () => {
    const e = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    const w = window.__GOOGLE_CLIENT_ID__;
    if (e && !e.includes("YOUR")) return e;
    if (w && !w.includes("YOUR")) return w;
    return null;
  };

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
    const id = getClientId();
    if (!id) return alert("Google Client ID missing");

    setBusy(true);

    if (!window.google) {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.onload = () => runPrompt(id);
      document.head.appendChild(s);
    } else {
      runPrompt(id);
    }
  };

  return (
    <div style={{marginBottom:16}}>
      <Btn full variant="outline" onClick={handleClick} disabled={busy}>
        {busy ? <><Spinner size={14}/> Loading...</> : <>🔐 {label}</>}
      </Btn>
      <div style={{display:"flex",alignItems:"center",gap:12,margin:"14px 0"}}>
        <div style={{flex:1,height:1,background:"var(--border)"}}/>
        <span style={{fontSize:11,color:"var(--dim)"}}>OR</span>
        <div style={{flex:1,height:1,background:"var(--border)"}}/>
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
      <div style={{textAlign:"center",marginBottom:18}}>
        <div style={{fontSize:36,marginBottom:8}}>📧</div>
        <div style={{fontSize:13,color:"var(--muted)"}}>
          Code sent to <span style={{color:"var(--ac)",fontWeight:600}}>{email}</span>
        </div>
      </div>

      <Input
        value={otp}
        onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
        placeholder="Enter 6-digit OTP"
        style={{textAlign:"center",fontSize:22,letterSpacing:8,fontFamily:"'JetBrains Mono',monospace",fontWeight:700}}
      />

      {err && <div style={{color:"#f87171",fontSize:12,marginBottom:12,padding:"8px 12px",background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",borderRadius:8}}>{err}</div>}
      {resendMsg && <div style={{color:"#4ade80",fontSize:12,marginBottom:12,padding:"8px 12px",background:"rgba(74,222,128,.08)",border:"1px solid rgba(74,222,128,.2)",borderRadius:8}}>{resendMsg}</div>}

      <Btn full onClick={verify} disabled={loading} style={{marginBottom:12}}>
        {loading ? <><Spinner size={14}/> Verifying...</> : "✓ Verify & Create Account"}
      </Btn>

      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"var(--muted)",cursor:"pointer",fontSize:12,padding:4}}>← Back</button>
        <button onClick={handleResend} disabled={resending} style={{background:"none",border:"none",color:"var(--ac)",cursor:"pointer",fontSize:12,padding:4,fontWeight:600}}>
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

  // If already logged in, redirect
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

  return (
    <AuthWrap title="Welcome back" sub="Sign in to EnggStack">
      <GoogleBtn onSuccess={handleGoogle} />
      <Input label="Email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
      <Input label="Password" type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Enter password"
        onKeyDown={e => e.key === "Enter" && go()}
      />
      {err && <div style={{color:"#f87171",fontSize:12,marginBottom:12,padding:"8px 12px",background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",borderRadius:8}}>{err}</div>}
      <Btn full onClick={go} disabled={loading} style={{marginBottom:14}}>
        {loading ? <><Spinner size={14}/> Signing in...</> : "Sign In"}
      </Btn>
      <div style={{textAlign:"center",fontSize:13}}>
        <span style={{color:"var(--muted)"}}>No account? </span>
        <Link to="/register" style={{color:"var(--ac)",fontWeight:600}}>Create one</Link>
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

  // If already logged in, redirect
  if (user) { navigate("/dashboard", { replace: true }); return null; }

  const handleSendOTP = async () => {
    if (!name || !email || !pass) return setErr("Name, email and password are required");
    if (pass.length < 6) return setErr("Password must be at least 6 characters");
    setErr("");
    setLoading(true);
    try {
      const result = await sendOtp(name, email, pass, username);
      if (result.skipOTP) {
        // Account created directly (no email configured)
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

  const onVerified = () => {
    navigate("/dashboard");
  };

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

  return (
    <AuthWrap title="Create account" sub="Sign up to start studying smarter">
      <GoogleBtn onSuccess={handleGoogle} />
      <Input label="Full Name" value={name} onChange={e=>setName(e.target.value)} placeholder="e.g. Rahul Sharma"/>
      <Input label="Email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/>
      <Input label="Username (optional)" value={username} onChange={e=>setUsername(e.target.value)} placeholder="@username"/>
      <Input label="Password" type="password" value={pass} onChange={e=>setPass(e.target.value)} placeholder="Min 6 characters"
        onKeyDown={e => e.key === "Enter" && handleSendOTP()}
      />
      {err && <div style={{color:"#f87171",fontSize:12,marginBottom:12,padding:"8px 12px",background:"rgba(248,113,113,.08)",border:"1px solid rgba(248,113,113,.2)",borderRadius:8}}>{err}</div>}
      <Btn full onClick={handleSendOTP} disabled={loading} style={{marginBottom:14}}>
        {loading ? <><Spinner size={14}/> Sending OTP...</> : "Create Account →"}
      </Btn>
      <div style={{textAlign:"center",fontSize:13}}>
        <span style={{color:"var(--muted)"}}>Already have an account? </span>
        <Link to="/login" style={{color:"var(--ac)",fontWeight:600}}>Sign in</Link>
      </div>
    </AuthWrap>
  );
}