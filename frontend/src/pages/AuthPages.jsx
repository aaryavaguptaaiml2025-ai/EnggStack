import { useState, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Input, Btn, Spinner } from "../components/ui";
import { sfx } from "../hooks/useSfx";

const API = import.meta.env.VITE_API_URL || "/api";

/* ───────────────── AUTH WRAPPER ───────────────── */
function AuthWrap({ children, title, sub }) {
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:"var(--bg)",padding:16}}>
      <div style={{width:"100%",maxWidth:420}}>
        <div style={{textAlign:"center",marginBottom:28}}>
          <div style={{fontSize:24,fontWeight:800,color:"var(--text)"}}>{title}</div>
          <div style={{fontSize:13,color:"var(--muted)"}}>{sub}</div>
        </div>
        <div style={{background:"var(--card)",border:"1px solid var(--border)",borderRadius:16,padding:24}}>
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
    <Btn full onClick={handleClick} disabled={busy}>
      {busy ? "Loading..." : label}
    </Btn>
  );
}

/* ───────────────── OTP STEP ───────────────── */
function OTPStep({ email, onVerified, onBack }) {
  const [otp, setOtp] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const verify = async () => {
    if (otp.length !== 6) return setErr("Enter 6-digit OTP");

    setLoading(true);
    try {
      const r = await fetch(`${API}/auth/verify-otp`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ email, otp }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error);

      onVerified(d.token, d.user);
      sfx.success();
    } catch(e) {
      setErr(e.message);
      sfx.error();
    }
    setLoading(false);
  };

  return (
    <>
      <Input value={otp} onChange={e=>setOtp(e.target.value)} placeholder="Enter OTP"/>
      {err && <div style={{color:"red"}}>{err}</div>}
      <Btn full onClick={verify}>{loading?"Verifying...":"Verify"}</Btn>
      <button onClick={onBack}>Back</button>
    </>
  );
}

/* ───────────────── LOGIN PAGE ───────────────── */
export function LoginPage() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const [loading,setLoading]=useState(false);

  const go = async () => {
    setLoading(true);
    try {
      await login(email,pass);
      navigate("/dashboard");
    } catch(e){ setErr(e.message); }
    setLoading(false);
  };

  return (
    <AuthWrap title="Welcome back" sub="Sign in">
      <GoogleBtn onSuccess={c=>googleLogin(c)} />
      <Input label="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
      <Input label="Password" type="password" value={pass} onChange={e=>setPass(e.target.value)}/>
      {err && <div style={{color:"red"}}>{err}</div>}
      <Btn full onClick={go}>{loading?"Loading...":"Login"}</Btn>
      <Link to="/register">Register</Link>
    </AuthWrap>
  );
}

/* ───────────────── REGISTER PAGE ───────────────── */
export function RegisterPage() {
  const { googleLogin } = useAuth();
  const navigate = useNavigate();

  const [name,setName]=useState("");
  const [email,setEmail]=useState("");
  const [pass,setPass]=useState("");
  const [step,setStep]=useState(1);

  const sendOTP = async () => {
    await fetch(`${API}/auth/send-otp`,{
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({ name,email,password:pass }),
    });
    setStep(2);
  };

  const onVerified = (token,user) => {
    localStorage.setItem("token",token);
    navigate("/dashboard");
  };

  if(step===2){
    return <OTPStep email={email} onVerified={onVerified} onBack={()=>setStep(1)}/>
  }

  return (
    <AuthWrap title="Create account" sub="Sign up">
      <GoogleBtn onSuccess={c=>googleLogin(c)} />
      <Input label="Name" value={name} onChange={e=>setName(e.target.value)}/>
      <Input label="Email" value={email} onChange={e=>setEmail(e.target.value)}/>
      <Input label="Password" type="password" value={pass} onChange={e=>setPass(e.target.value)}/>
      <Btn full onClick={sendOTP}>Register</Btn>
      <Link to="/login">Login</Link>
    </AuthWrap>
  );
}