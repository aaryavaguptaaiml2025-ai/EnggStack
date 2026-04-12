import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Input, Btn, Spinner } from "../components/ui";
import { sfx } from "../hooks/useSfx";

const API = import.meta.env.VITE_API_URL || "/api";

function AuthWrap({ children, title, sub }) {
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg)",padding:16,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",width:500,height:500,borderRadius:"50%",background:"radial-gradient(circle,rgba(74,222,128,.07),transparent 70%)",top:"-15%",right:"-10%",pointerEvents:"none"}}/>
      <div style={{position:"absolute",width:400,height:400,borderRadius:"50%",background:"radial-gradient(circle,rgba(96,165,250,.05),transparent 70%)",bottom:"-10%",left:"-10%",pointerEvents:"none"}}/>
      <div className="fade-up" style={{width:"100%",maxWidth:420,zIndex:1}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{width:60,height:60,background:"var(--ac)",borderRadius:16,display:"inline-flex",alignItems:"center",justifyContent:"center",fontSize:28,fontWeight:900,color:"#000",marginBottom:14,boxShadow:"0 0 24px var(--ac-dim)"}}>E</div>
          <div style={{fontSize:24,fontWeight:800,color:"var(--text)",marginBottom:5}}>{title}</div>
          <div style={{fontSize:13,color:"var(--muted)"}}>{sub}</div>
        </div>
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:20,padding:26,boxShadow:"0 20px 48px rgba(0,0,0,.4)"}}>
          {children}
        </div>
      </div>
    </div>
  );
}

// Google button — initialised only once using a ref flag
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
        callback: (r) => { setBusy(false); if (r.credential) onSuccess(r.credential); },
      });
      initialised.current = true;
    }
    window.google.accounts.id.prompt((n) => {
      if (n.isNotDisplayed() || n.isSkippedMoment()) setBusy(false);
    });
  };

  const handleClick = () => {
    const id = getClientId();
    if (!id) { alert("Google Sign-In not configured.\nSet VITE_GOOGLE_CLIENT_ID in Vercel environment variables."); return; }
    setBusy(true);
    if (!window.google) {
      const s = document.createElement("script");
      s.src = "https://accounts.google.com/gsi/client";
      s.onload = () => runPrompt(id);
      s.onerror = () => { setBusy(false); alert("Could not load Google Sign-In. Check your connection."); };
      document.head.appendChild(s);
    } else {
      runPrompt(id);
    }
  };

  return (
    <button onClick={handleClick} disabled={busy} style={{width:"100%",background:"rgba(255,255,255,.06)",border:"1px solid var(--border)",borderRadius:10,padding:"11px 16px",color:"var(--text)",fontSize:13,fontWeight:500,cursor:busy?"default":"pointer",display:"flex",alignItems:"center",justifyContent:"center",gap:10,transition:"all .15s",marginBottom:14,opacity:busy?.7:1}}
      onMouseEnter={e=>{if(!busy)e.currentTarget.style.background="rgba(255,255,255,.1)";}}
      onMouseLeave={e=>e.currentTarget.style.background="rgba(255,255,255,.06)"}>
      {busy ? <div style={{width:18,height:18,border:"2px solid rgba(255,255,255,.3)",borderTop:"2px solid var(--text)",borderRadius:"50%",animation:"spin .7s linear infinite"}}/> :
        <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/><path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
      }
      {label}
    </button>
  );
}

function Divider() {
  return (
    <div style={{display:"flex",alignItems:"center",gap:10,margin:"0 0 14px"}}>
      <div style={{flex:1,height:1,background:"var(--border)"}}/>
      <span style={{fontSize:11,color:"var(--dim)"}}>OR</span>
      <div style={{flex:1,height:1,background:"var(--border)"}}/>
    </div>
  );
}

// ── OTP verification step ────────────────────────────────────────────────────
function OTPStep({ email, onVerified, onBack }) {
  const [otp, setOtp]       = useState("");
  const [err, setErr]       = useState("");
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);

  const verify = async () => {
    if (otp.length !== 6) return setErr("Enter the 6-digit code");
    setLoading(true); setErr("");
    try {
      const r = await fetch(`${API}/auth/verify-otp`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email, otp }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Invalid OTP");
      sfx.success();
      onVerified(d.token, d.user);
    } catch(e) { sfx.error(); setErr(e.message); }
    finally { setLoading(false); }
  };

  const resend = async () => {
    setResending(true); setErr("");
    try {
      const r = await fetch(`${API}/auth/resend-otp`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);
      sfx.notify();
    } catch(e) { setErr(e.message); }
    finally { setResending(false); }
  };

  return (
    <div>
      <div style={{textAlign:"center",marginBottom:18}}>
        <div style={{fontSize:36,marginBottom:8}}>📧</div>
        <div style={{fontSize:15,fontWeight:700,color:"var(--text)",marginBottom:6}}>Check your email</div>
        <div style={{fontSize:13,color:"var(--muted)"}}>We sent a 6-digit code to</div>
        <div style={{fontSize:13,color:"var(--ac)",fontWeight:600,marginTop:3}}>{email}</div>
      </div>

      <Input
        label="6-Digit Verification Code"
        type="text"
        inputMode="numeric"
        maxLength={6}
        placeholder="000000"
        value={otp}
        onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
        style={{letterSpacing:8, fontSize:22, textAlign:"center", marginBottom:0}}
      />
      {err && <div style={{color:"#f87171",fontSize:12,marginTop:8,textAlign:"center"}}>{err}</div>}

      <Btn full color="var(--ac)" onClick={verify} disabled={loading||otp.length!==6} style={{marginTop:14}}>
        {loading ? <Spinner color="#000"/> : "Verify & Create Account"}
      </Btn>

      <div style={{display:"flex",justifyContent:"space-between",marginTop:12}}>
        <button onClick={onBack} style={{background:"none",border:"none",color:"var(--muted)",fontSize:12,cursor:"pointer"}}>← Back</button>
        <button onClick={resend} disabled={resending} style={{background:"none",border:"none",color:"var(--ac)",fontSize:12,cursor:"pointer"}}>
          {resending ? "Sending..." : "Resend code"}
        </button>
      </div>
    </div>
  );
}

// ── Login Page ───────────────────────────────────────────────────────────────
export function LoginPage() {
  const { login, googleLogin, pinLogin } = useAuth();
  const navigate = useNavigate();
  const [tab,  setTab]    = useState("email");
  const [email,setEmail]  = useState("");
  const [pass, setPass]   = useState("");
  const [pin,  setPin]    = useState("");
  const [err,  setErr]    = useState("");
  const [loading,setLoad] = useState(false);

  const go = async (fn,...args) => {
    setErr(""); setLoad(true);
    try { await fn(...args); sfx.success(); navigate("/dashboard"); }
    catch(e) { sfx.error(); setErr(e.message); }
    finally { setLoad(false); }
  };

  return (
    <AuthWrap title="Welcome back" sub="Sign in to continue">
      <GoogleBtn onSuccess={c=>go(googleLogin,c)}/>
      <Divider/>
      <div style={{display:"flex",background:"var(--bg2)",borderRadius:10,padding:3,gap:3,marginBottom:14}}>
        {["email","pin"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{flex:1,padding:"7px",borderRadius:8,border:"none",background:tab===t?"var(--card)":"transparent",color:tab===t?"var(--text)":"var(--muted)",fontSize:13,fontWeight:tab===t?600:400,cursor:"pointer",transition:"all .15s"}}>
            {t==="pin"?"PIN Login":"Email / Password"}
          </button>
        ))}
      </div>

      {tab==="email" && (<>
        <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/>
        <Input label="Password" type="password" placeholder="password" value={pass} onChange={e=>setPass(e.target.value)} style={{marginBottom:0}}/>
        {err && <div style={{color:"#f87171",fontSize:12,marginTop:8}}>{err}</div>}
        <Btn full color="var(--ac)" onClick={()=>go(login,email,pass)} disabled={loading} style={{marginTop:14}}>
          {loading?<Spinner color="#000"/>:"Sign In"}
        </Btn>
      </>)}

      {tab==="pin" && (<>
        <Input label="Email" type="email" placeholder="your email" value={email} onChange={e=>setEmail(e.target.value)}/>
        <Input label="4-Digit PIN" type="password" inputMode="numeric" maxLength={4} placeholder="0000"
          value={pin} onChange={e=>setPin(e.target.value.replace(/\D/g,"").slice(0,4))}
          style={{letterSpacing:8,fontSize:22,textAlign:"center",marginBottom:0}}/>
        {err && <div style={{color:"#f87171",fontSize:12,marginTop:8}}>{err}</div>}
        <Btn full color="var(--ac)" onClick={()=>go(pinLogin,email,pin)} disabled={loading||pin.length!==4} style={{marginTop:14}}>
          {loading?<Spinner color="#000"/>:"Login with PIN"}
        </Btn>
        <div style={{fontSize:11,color:"var(--dim)",textAlign:"center",marginTop:8}}>Set PIN in Settings after login</div>
      </>)}

      <div style={{textAlign:"center",fontSize:12,color:"var(--muted)",marginTop:14}}>
        No account? <Link to="/register" style={{color:"var(--ac)"}}>Register</Link>
      </div>
    </AuthWrap>
  );
}

// ── Register Page ────────────────────────────────────────────────────────────
export function RegisterPage() {
  const { googleLogin, applyUser } = useAuth();
  const navigate = useNavigate();

  // Step 1 fields
  const [name,  setName]  = useState("");
  const [email, setEmail] = useState("");
  const [pass,  setPass]  = useState("");
  const [uname, setUname] = useState("");
  const [err,   setErr]   = useState("");
  const [loading,setLoad] = useState(false);

  // Step 2 — OTP
  const [step, setStep] = useState(1); // 1 = form, 2 = otp

  const go = async (fn,...args) => {
    setErr(""); setLoad(true);
    try { await fn(...args); sfx.success(); navigate("/dashboard"); }
    catch(e) { sfx.error(); setErr(e.message); }
    finally { setLoad(false); }
  };

  const sendOTP = async () => {
    setErr(""); setLoad(true);
    try {
      if (!name || !email || !pass) throw new Error("Name, email and password are required");
      if (pass.length < 6)          throw new Error("Password must be at least 6 characters");

      const r = await fetch(`${API}/auth/send-otp`, {
        method:"POST", headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ name, email, password:pass, username:uname||undefined }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Failed to send code");
      sfx.notify();
      setStep(2);
    } catch(e) { sfx.error(); setErr(e.message); }
    finally { setLoad(false); }
  };

  const onVerified = (token, user) => {
    localStorage.setItem("es_token", token);
    applyUser(user);
    navigate("/dashboard");
  };

  if (step === 2) return (
    <AuthWrap title="Verify your email" sub="One last step">
      <OTPStep email={email} onVerified={onVerified} onBack={()=>setStep(1)}/>
    </AuthWrap>
  );

  return (
    <AuthWrap title="Create account" sub="Join EnggStack — study smarter">
      <GoogleBtn onSuccess={c=>go(googleLogin,c)} label="Sign up with Google"/>
      <Divider/>
      <Input label="Full Name" placeholder="Aaryava Gupta" value={name} onChange={e=>setName(e.target.value)}/>
      <Input label="Email" type="email" placeholder="you@example.com" value={email} onChange={e=>setEmail(e.target.value)}/>
      <Input label="Username (optional)" placeholder="aaryava" value={uname} onChange={e=>setUname(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g,""))}/>
      <Input label="Password" type="password" placeholder="min 6 characters" value={pass} onChange={e=>setPass(e.target.value)} style={{marginBottom:0}}/>
      {err && <div style={{color:"#f87171",fontSize:12,marginTop:8}}>{err}</div>}
      <Btn full color="var(--ac)" onClick={sendOTP} disabled={loading} style={{marginTop:14}}>
        {loading?<Spinner color="#000"/>:"Send Verification Code"}
      </Btn>
      <div style={{textAlign:"center",fontSize:12,color:"var(--muted)",marginTop:14}}>
        Already have an account? <Link to="/login" style={{color:"var(--ac)"}}>Sign in</Link>
      </div>
    </AuthWrap>
  );
}
