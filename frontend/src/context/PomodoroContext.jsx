import { createContext, useContext, useState, useEffect, useRef, useCallback } from "react";
import { useStats } from "./StatsContext";
import { sfx } from "../hooks/useSfx";
import confetti from "canvas-confetti";

const PomodoroContext = createContext(null);

export function PomodoroProvider({ children }) {
  const { logPomodoro } = useStats();
  
  const [durations, setDurations] = useState({ focus: 25, short: 5, long: 15 });
  const [mode, setMode] = useState("focus"); // focus, short, long
  const [tl, setTl] = useState(durations.focus * 60);
  const [run, setRun] = useState(false);
  const [sess, setSess] = useState(0);
  const [autoStart, setAutoStart] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  
  const [toast, setToast] = useState(null);
  const [xpToast, setXpToast] = useState(null);
  
  const ref = useRef(null);

  const sw = useCallback((m) => { 
    clearInterval(ref.current); 
    setRun(false); 
    setMode(m); 
    setTl(durations[m] * 60); 
  }, [durations]);

  const done = useCallback(async () => {
    clearInterval(ref.current);
    setRun(false);
    
    if (mode === "focus") {
      await logPomodoro(durations.focus);
      setSess(s => s + 1);
      setToast(`Focus done! +${durations.focus} XP — take a break.`);

      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ["#00C896", "#3b82f6", "#8b5cf6"],
      });

      setXpToast(durations.focus);

      const nextMode = (sess + 1) % 4 === 0 ? "long" : "short";
      setMode(nextMode);
      setTl(durations[nextMode] * 60);
      if (autoStart) {
        setTimeout(() => setRun(true), 1500);
      }
    } else {
      if (soundOn) sfx.notify();
      setToast("Break over! Ready to focus?");
      setMode("focus");
      setTl(durations.focus * 60);
      if (autoStart) {
        setTimeout(() => setRun(true), 1500);
      }
    }
  }, [mode, logPomodoro, durations, sess, autoStart, soundOn]);

  useEffect(() => {
    if (run) {
      ref.current = setInterval(() => {
        setTl(t => { if (t <= 1) { done(); return 0; } return t - 1; });
      }, 1000);
    } else {
      clearInterval(ref.current);
    }
    return () => clearInterval(ref.current);
  }, [run, done]);

  const handleDurationChange = (m, val) => {
    const v = Math.max(1, parseInt(val) || 1);
    setDurations(prev => ({ ...prev, [m]: v }));
    if (mode === m && !run) setTl(v * 60);
  };
  
  const toggleTimer = () => {
    if (soundOn) sfx.click();
    setRun(r => !r);
  };
  
  const resetTimer = () => {
    if (soundOn) sfx.click();
    clearInterval(ref.current);
    setRun(false);
    setTl(durations[mode] * 60);
  };
  
  const skipTimer = () => {
    if (soundOn) sfx.click();
    sw(mode === "focus" ? "short" : "focus");
  };

  const clearToast = () => setToast(null);
  const clearXpToast = () => setXpToast(null);

  const value = {
    durations, mode, tl, run, sess, autoStart, soundOn, toast, xpToast,
    setDurations, setMode, setTl, setRun, setSess, setAutoStart, setSoundOn,
    sw, handleDurationChange, toggleTimer, resetTimer, skipTimer,
    clearToast, clearXpToast
  };

  return (
    <PomodoroContext.Provider value={value}>
      {children}
    </PomodoroContext.Provider>
  );
}

export const usePomodoro = () => useContext(PomodoroContext);
