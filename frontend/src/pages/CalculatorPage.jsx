import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "../components/ui";
import { sfx } from "../hooks/useSfx";

const DEG_TO_RAD = Math.PI / 180;

export default function CalculatorPage() {
  const [expr, setExpr] = useState("0");
  const [result, setResult] = useState("");
  const [history, setHistory] = useState([]);
  const [isRad, setIsRad] = useState(false);
  const [sciMode, setSciMode] = useState(false);
  const [lastOp, setLastOp] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  /* ── EVALUATE FUNCTION ── */
  const evaluate = useCallback((expression) => {
    try {
      let e = expression
        .replace(/π/g, `${Math.PI}`)
        .replace(/e(?![xp])/g, `${Math.E}`)
        .replace(/×/g, "*")
        .replace(/÷/g, "/");

      if (/[\+\-\*\/\.]$/.test(e)) return "Error";

      const convertAngle = (x) => isRad ? x : `(${x}) * ${Math.PI} / 180`;

      e = e
        .replace(/sin\((.*?)\)/g, (_, x) => `Math.sin(${convertAngle(x)})`)
        .replace(/cos\((.*?)\)/g, (_, x) => `Math.cos(${convertAngle(x)})`)
        .replace(/tan\((.*?)\)/g, (_, x) => `Math.tan(${convertAngle(x)})`)
        .replace(/log\((.*?)\)/g, (_, x) => `Math.log10(${x})`)
        .replace(/ln\((.*?)\)/g, (_, x) => `Math.log(${x})`)
        .replace(/√\((.*?)\)/g, (_, x) => `Math.sqrt(${x})`)
        .replace(/abs\((.*?)\)/g, (_, x) => `Math.abs(${x})`);

      const val = eval(e);
      if (!isFinite(val)) return "Error";

      return Number.isInteger(val)
        ? val.toString()
        : parseFloat(val.toPrecision(10)).toString();
    } catch {
      return "Error";
    }
  }, [isRad]);

  /* ── INPUT HANDLER ── */
  const input = useCallback((val) => {
    sfx.click();
    setResult("");

    if (val === "C") {
      setExpr("0");
      setResult("");
      setLastOp(false);
      return;
    }

    if (val === "⌫") {
      setExpr(prev => prev.length <= 1 ? "0" : prev.slice(0, -1));
      return;
    }

    if (val === "=") {
      if (expr.endsWith("**")) return setResult("Error");
      const res = evaluate(expr);
      setResult(res);

      if (res !== "Error") {
        setHistory(prev => [{ id: Date.now(), expr, result: res }, ...prev].slice(0, 15));
        sfx.success();
      } else {
        sfx.error();
      }
      setLastOp(true);
      return;
    }

    if (val === "±") {
      setExpr(prev => prev.startsWith("-") ? prev.slice(1) : "-" + prev);
      return;
    }

    if (val === "%") {
      const res = evaluate(expr + "/100");
      if (res !== "Error") setExpr(res);
      return;
    }

    if (val === "x²") {
      setExpr(prev => `(${prev})**2`);
      return;
    }

    if (val === "xʸ") {
      setExpr(prev => prev + "**");
      return;
    }

    if (val === "1/x") {
      setExpr(prev => `1/(${prev})`);
      return;
    }

    if (val === "x!") {
      try {
        const n = parseInt(evaluate(expr));
        if (n < 0 || n > 170) return setResult("Error");
        let f = 1;
        for (let i = 2; i <= n; i++) f *= i;
        setExpr(f.toString());
      } catch {
        setResult("Error");
      }
      return;
    }

    if (["sin","cos","tan","log","ln","√","abs"].includes(val)) {
      setExpr(prev => prev === "0" ? `${val}(` : prev + `${val}(`);
      return;
    }

    if (val === "π" || val === "e") {
      setExpr(prev => prev === "0" ? val : prev + val);
      return;
    }

    setExpr(prev => {
      const dispVal = val === "*" ? "×" : val === "/" ? "÷" : val;
      if (lastOp && "0123456789.(".includes(dispVal)) {
        setLastOp(false);
        return dispVal;
      }
      setLastOp(false);
      if (prev === "0" && dispVal !== ".") return dispVal;
      return prev + dispVal;
    });

  }, [expr, lastOp, evaluate]);

  /* ── KEYBOARD ── */
  useEffect(() => {
    const handler = (e) => {
      const k = e.key;
      if ("0123456789.".includes(k)) input(k);
      else if ("+-*/".includes(k)) input(k);
      else if (k === "Enter" || k === "=") { e.preventDefault(); input("="); }
      else if (k === "Backspace") input("⌫");
      else if (k === "Escape") input("C");
      else if ("()".includes(k)) input(k);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [input]);

  const loadHistoryItem = (item) => {
    sfx.click();
    setExpr(item.expr);
    setResult(item.result);
    setLastOp(true);
    if(window.innerWidth < 1024) setShowHistory(false);
  };

  return (
    <div className="page-container max-w-5xl mx-auto h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-extrabold grad-text tracking-tight flex items-center gap-3">
            <span className="material-symbols-outlined text-[var(--ac)] text-3xl">calculate</span>
            Calculator
          </h1>
          <p className="text-muted text-sm mt-1">Smart and minimal calculations</p>
        </div>
        <button
          onClick={() => { sfx.click(); setShowHistory(!showHistory); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-300
            ${showHistory ? 'bg-[var(--ac)] text-[#0B1220] shadow-[0_0_20px_rgba(0,200,150,0.3)]' : 'glass-card text-dim hover:text-on-surface'}`}
        >
          <span className="material-symbols-outlined text-lg">history</span>
          History
        </button>
      </div>

      <div className="flex-1 flex gap-6 min-h-0 relative">
        {/* Main Calculator */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${showHistory ? 'lg:max-w-[65%]' : 'max-w-xl mx-auto w-full'}`}>
          <Card className="flex-1 flex flex-col p-6 shadow-2xl relative overflow-hidden bg-[#0B132B]/80 backdrop-blur-2xl border-white/[0.08]">
            {/* Display */}
            <div className="flex-none mb-6">
              <div className="w-full bg-[#050A15]/50 rounded-2xl p-6 min-h-[140px] flex flex-col justify-end items-end relative overflow-hidden border border-white/5 shadow-inner">
                <div className="absolute top-4 left-4 flex gap-2">
                  <button onClick={() => setIsRad(false)} className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${!isRad ? 'bg-[var(--ac)] text-black' : 'text-dim hover:bg-white/5'}`}>DEG</button>
                  <button onClick={() => setIsRad(true)} className={`text-[10px] font-bold px-2 py-1 rounded transition-colors ${isRad ? 'bg-[var(--ac)] text-black' : 'text-dim hover:bg-white/5'}`}>RAD</button>
                </div>
                
                <div className="text-dim font-mono text-lg mb-2 tracking-wider break-all max-h-16 overflow-y-auto w-full text-right">
                  {expr}
                </div>
                <div className={`font-mono text-4xl sm:text-5xl tracking-tight font-light truncate w-full text-right transition-colors duration-300 ${
                  result === "Error" ? "text-red-400" : "text-[var(--ac)]"
                }`}>
                  {result || expr}
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setSciMode(!sciMode)}
                className="text-[11px] font-bold uppercase tracking-wider text-dim hover:text-[var(--ac)] transition-colors flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-sm">{sciMode ? 'keyboard_arrow_left' : 'science'}</span>
                {sciMode ? "Hide Scientific" : "Scientific Mode"}
              </button>
              <button onClick={() => input("⌫")} className="text-dim hover:text-white p-2 rounded-lg hover:bg-white/5 transition-all">
                <span className="material-symbols-outlined text-[20px]">backspace</span>
              </button>
            </div>

            {/* Keypad */}
            <div className="flex-1 grid grid-cols-4 gap-3">
              <AnimatePresence>
                {sciMode && (
                  <motion.div
                    initial={{ opacity: 0, width: 0, padding: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0, padding: 0 }}
                    className="col-span-4 grid grid-cols-5 gap-3 mb-1"
                  >
                    <SciBtn label="sin" onClick={() => input("sin")} />
                    <SciBtn label="cos" onClick={() => input("cos")} />
                    <SciBtn label="tan" onClick={() => input("tan")} />
                    <SciBtn label="log" onClick={() => input("log")} />
                    <SciBtn label="ln" onClick={() => input("ln")} />
                    <SciBtn label="√" onClick={() => input("√")} />
                    <SciBtn label="x²" onClick={() => input("x²")} />
                    <SciBtn label="xʸ" onClick={() => input("xʸ")} />
                    <SciBtn label="π" onClick={() => input("π")} />
                    <SciBtn label="e" onClick={() => input("e")} />
                  </motion.div>
                )}
              </AnimatePresence>

              <Btn label="C" onClick={() => input("C")} cls="text-[var(--clr-danger)] hover:bg-[var(--clr-danger)]/10 font-bold" />
              <Btn label="()" onClick={() => input(expr.split("(").length > expr.split(")").length ? ")" : "(")} cls="text-[var(--ac)] bg-[var(--ac)]/5 hover:bg-[var(--ac)]/15" />
              <Btn label="%" onClick={() => input("%")} cls="text-[var(--ac)] bg-[var(--ac)]/5 hover:bg-[var(--ac)]/15" />
              <Btn label="÷" onClick={() => input("/")} cls="text-[var(--ac)] bg-[var(--ac)]/10 hover:bg-[var(--ac)]/20 text-2xl" />

              <Btn label="7" onClick={() => input("7")} />
              <Btn label="8" onClick={() => input("8")} />
              <Btn label="9" onClick={() => input("9")} />
              <Btn label="×" onClick={() => input("*")} cls="text-[var(--ac)] bg-[var(--ac)]/10 hover:bg-[var(--ac)]/20 text-2xl" />

              <Btn label="4" onClick={() => input("4")} />
              <Btn label="5" onClick={() => input("5")} />
              <Btn label="6" onClick={() => input("6")} />
              <Btn label="-" onClick={() => input("-")} cls="text-[var(--ac)] bg-[var(--ac)]/10 hover:bg-[var(--ac)]/20 text-3xl" />

              <Btn label="1" onClick={() => input("1")} />
              <Btn label="2" onClick={() => input("2")} />
              <Btn label="3" onClick={() => input("3")} />
              <Btn label="+" onClick={() => input("+")} cls="text-[var(--ac)] bg-[var(--ac)]/10 hover:bg-[var(--ac)]/20 text-2xl" />

              <Btn label="±" onClick={() => input("±")} />
              <Btn label="0" onClick={() => input("0")} />
              <Btn label="." onClick={() => input(".")} cls="text-2xl" />
              <Btn label="=" onClick={() => input("=")} cls="bg-gradient-to-br from-[var(--ac)] to-[#00a37a] text-black shadow-[0_0_15px_rgba(0,200,150,0.4)] hover:shadow-[0_0_25px_rgba(0,200,150,0.6)] text-3xl font-light scale-100 hover:scale-[1.02]" />
            </div>
          </Card>
        </div>

        {/* History Panel */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0, x: 20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "35%" }}
              exit={{ opacity: 0, x: 20, width: 0 }}
              className="hidden lg:flex flex-col min-w-[300px]"
            >
              <Card className="flex-1 flex flex-col p-0 overflow-hidden border-white/[0.05] bg-[#050A15]/60 backdrop-blur-md">
                <div className="p-4 border-b border-white/[0.05] flex justify-between items-center bg-white/[0.02]">
                  <span className="text-sm font-bold text-on-surface flex items-center gap-2">
                    <span className="material-symbols-outlined text-[18px] text-[var(--ac)]">history</span>
                    Recent Calculations
                  </span>
                  {history.length > 0 && (
                    <button onClick={() => { sfx.click(); setHistory([]); }} className="text-[10px] uppercase font-bold text-dim hover:text-red-400 transition-colors">Clear</button>
                  )}
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1">
                  {history.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-dim text-sm">
                      <span className="material-symbols-outlined text-4xl mb-2 opacity-50">hourglass_empty</span>
                      No history yet
                    </div>
                  ) : (
                    history.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => loadHistoryItem(item)}
                        className="w-full text-right p-3 rounded-xl hover:bg-white/5 transition-all group border border-transparent hover:border-white/5 flex flex-col items-end gap-1"
                      >
                        <div className="text-xs text-dim font-mono group-hover:text-on-surface transition-colors truncate w-full">{item.expr}</div>
                        <div className="text-lg font-light text-[var(--ac)] font-mono">{item.result}</div>
                      </button>
                    ))
                  )}
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile History Drawer Overlay */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowHistory(false)}
            />
          )}
        </AnimatePresence>

        {/* Mobile History Drawer */}
        <AnimatePresence>
          {showHistory && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="lg:hidden fixed bottom-0 left-0 right-0 z-50 h-[60vh] bg-[#0B132B] rounded-t-3xl border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] flex flex-col"
            >
              <div className="p-4 border-b border-white/[0.05] flex justify-between items-center">
                <span className="text-sm font-bold text-on-surface">History</span>
                <button onClick={() => setShowHistory(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 text-dim hover:text-white">
                  <span className="material-symbols-outlined text-lg">close</span>
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {history.length === 0 ? (
                   <div className="mt-10 text-center text-dim text-sm">No history yet</div>
                ) : (
                  history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadHistoryItem(item)}
                      className="w-full text-right p-4 rounded-xl bg-white/5 active:bg-white/10 transition-all flex flex-col items-end gap-1"
                    >
                      <div className="text-xs text-dim font-mono truncate w-full">{item.expr}</div>
                      <div className="text-xl font-light text-[var(--ac)] font-mono">{item.result}</div>
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function Btn({ label, onClick, cls = "" }) {
  return (
    <button
      onClick={onClick}
      className={`h-full min-h-[3.5rem] rounded-[18px] flex items-center justify-center text-xl sm:text-2xl transition-all duration-200 active:scale-90 bg-white/5 hover:bg-white/10 text-on-surface ${cls}`}
    >
      {label}
    </button>
  );
}

function SciBtn({ label, onClick }) {
  return (
    <button
      onClick={onClick}
      className="h-10 rounded-xl flex items-center justify-center text-[13px] sm:text-[14px] transition-all active:scale-90 bg-[#050A15]/50 hover:bg-white/10 text-dim hover:text-[var(--ac)] font-mono"
    >
      {label}
    </button>
  );
}