import { useState, useEffect, useCallback } from "react";
import { Card } from "../components/ui";
import { sfx } from "../hooks/useSfx";

/* ── Scientific Calculator ─────────────────────────────── */
const DEG_TO_RAD = Math.PI / 180;

export default function CalculatorPage() {
  const [expr, setExpr]         = useState("0");
  const [result, setResult]     = useState("");
  const [history, setHistory]   = useState([]);
  const [isRad, setIsRad]       = useState(false);
  const [sciMode, setSciMode]   = useState(true);
  const [lastOp, setLastOp]     = useState(false);

  /* ── Evaluate expression safely ── */
  const evaluate = useCallback((expression) => {
    try {
      let e = expression
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
        .replace(/π/g, `(${Math.PI})`)
        .replace(/e(?![xp])/g, `(${Math.E})`);

      // Scientific functions
      const angleFn = isRad ? (x) => x : (x) => x * DEG_TO_RAD;
      const fns = {
        sin: (x) => Math.sin(angleFn(x)),
        cos: (x) => Math.cos(angleFn(x)),
        tan: (x) => Math.tan(angleFn(x)),
        log: (x) => Math.log10(x),
        ln:  (x) => Math.log(x),
        "√":  (x) => Math.sqrt(x),
        sqrt: (x) => Math.sqrt(x),
        abs: (x) => Math.abs(x),
      };

      // Replace function calls: sin(x) → fns.sin(x)
      for (const [name] of Object.entries(fns)) {
        const re = new RegExp(`${name.replace("√","√")}\\(`, "g");
        e = e.replace(re, `__${name}__(`);
      }

      // Build safe eval
      const safeEval = new Function(
        ...Object.keys(fns).map(k => `__${k}__`),
        `"use strict"; return (${e});`
      );
      const val = safeEval(...Object.values(fns));

      if (typeof val !== "number" || !isFinite(val)) return "Error";
      return Number.isInteger(val) ? val.toString() : parseFloat(val.toPrecision(12)).toString();
    } catch {
      return "Error";
    }
  }, [isRad]);

  /* ── Handle input ── */
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
      const res = evaluate(expr);
      setResult(res);
      if (res !== "Error") {
        setHistory(prev => [{ expr, result: res }, ...prev].slice(0, 10));
        sfx.success();
      } else {
        sfx.error();
      }
      setLastOp(true);
      return;
    }
    if (val === "±") {
      setExpr(prev => {
        if (prev.startsWith("-")) return prev.slice(1);
        if (prev === "0") return prev;
        return "-" + prev;
      });
      return;
    }
    if (val === "%") {
      const res = evaluate(expr + "/100");
      if (res !== "Error") { setExpr(res); setResult(""); }
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
        if (n < 0 || n > 170) { setResult("Error"); return; }
        let f = 1; for (let i = 2; i <= n; i++) f *= i;
        setExpr(f.toString());
        setResult("");
      } catch { setResult("Error"); }
      return;
    }
    // Functions like sin, cos, etc
    if (["sin","cos","tan","log","ln","√","abs"].includes(val)) {
      if (lastOp && result && result !== "Error") {
        setExpr(`${val}(${result})`);
      } else {
        setExpr(prev => prev === "0" ? `${val}(` : prev + `${val}(`);
      }
      setLastOp(false);
      return;
    }
    // Constants
    if (val === "π") {
      setExpr(prev => prev === "0" ? "π" : prev + "π");
      return;
    }
    if (val === "e") {
      setExpr(prev => prev === "0" ? "e" : prev + "e");
      return;
    }

    // Regular input
    setExpr(prev => {
      if (lastOp && result !== "Error" && "0123456789.(".includes(val)) {
        setLastOp(false);
        return val;
      }
      setLastOp(false);
      if (prev === "0" && val !== ".") return val;
      return prev + val;
    });
  }, [expr, result, lastOp, evaluate]);

  /* ── Keyboard support ── */
  useEffect(() => {
    const handler = (e) => {
      const k = e.key;
      if ("0123456789.".includes(k)) input(k);
      else if (k === "+" || k === "-") input(k);
      else if (k === "*") input("×");
      else if (k === "/") { e.preventDefault(); input("÷"); }
      else if (k === "Enter" || k === "=") { e.preventDefault(); input("="); }
      else if (k === "Backspace") input("⌫");
      else if (k === "Escape") input("C");
      else if (k === "(" || k === ")") input(k);
      else if (k === "%") input("%");
      else if (k === "^") input("xʸ");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [input]);

  /* ── Button configs ── */
  const SCI_BUTTONS = [
    ["sin","cos","tan","log","ln"],
    ["√","x²","xʸ","(",")"],
    ["π","e","x!","1/x","±"],
  ];

  const BASIC_BUTTONS = [
    ["C","⌫","%","÷"],
    ["7","8","9","×"],
    ["4","5","6","-"],
    ["1","2","3","+"],
    ["0",".","="],
  ];

  const getButtonStyle = (btn) => {
    if (btn === "=") return { bg: "#00C896", text: "#000", span: 2, shadow: "0 4px 20px rgba(0,200,150,0.3)" };
    if (["÷","×","-","+"].includes(btn)) return { bg: "rgba(59,130,246,0.12)", text: "#3b82f6", border: "rgba(59,130,246,0.2)" };
    if (["C","⌫","%"].includes(btn)) return { bg: "rgba(248,113,113,0.08)", text: "#f87171", border: "rgba(248,113,113,0.15)" };
    if (["sin","cos","tan","log","ln","√","x²","xʸ","π","e","x!","1/x","±","(",")"].includes(btn))
      return { bg: "rgba(139,92,246,0.08)", text: "#8b5cf6", border: "rgba(139,92,246,0.15)" };
    return { bg: "rgba(255,255,255,0.04)", text: "#e0e6f0", border: "rgba(255,255,255,0.06)" };
  };

  return (
    <div className="page-container max-w-lg mx-auto">
      <div className="mb-6">
        <h1 className="section-title flex items-center gap-2">
          <span className="material-symbols-outlined text-[#00C896] text-2xl">calculate</span>
          Calculator
        </h1>
        <p className="text-xs text-muted mt-1">Scientific & basic calculations</p>
      </div>

      <Card className="fade-up overflow-hidden">
        {/* Display */}
        <div className="p-6 pb-4 border-b border-white/5">
          <div className="text-right mb-1 min-h-[24px]">
            <span className="text-sm text-muted font-mono break-all leading-relaxed">{expr === "0" ? "" : expr}</span>
          </div>
          <div className="text-right">
            <span className={`font-mono font-bold break-all ${
              result
                ? result === "Error" ? "text-[#f87171] text-2xl" : "text-[#00C896] text-3xl"
                : "text-on-surface text-3xl"
            }`}>
              {result || expr}
            </span>
          </div>
        </div>

        {/* Mode toggle bar */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-white/5">
          <div className="flex gap-2">
            <button onClick={() => setSciMode(!sciMode)}
              className="text-[10px] font-bold px-3 py-1 rounded-lg transition-all duration-200"
              style={{
                background: sciMode ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.03)",
                color: sciMode ? "#8b5cf6" : "#4a5568",
                border: `1px solid ${sciMode ? "rgba(139,92,246,0.2)" : "rgba(255,255,255,0.05)"}`,
              }}>
              {sciMode ? "Scientific" : "Basic"}
            </button>
            {sciMode && (
              <button onClick={() => { setIsRad(!isRad); sfx.click(); }}
                className="text-[10px] font-bold px-3 py-1 rounded-lg transition-all duration-200"
                style={{
                  background: "rgba(249,115,22,0.08)",
                  color: "#f97316",
                  border: "1px solid rgba(249,115,22,0.15)",
                }}>
                {isRad ? "RAD" : "DEG"}
              </button>
            )}
          </div>
          {history.length > 0 && (
            <span className="text-[10px] text-dim">{history.length} calculations</span>
          )}
        </div>

        {/* Scientific buttons */}
        {sciMode && (
          <div className="px-3 pt-3 space-y-1.5">
            {SCI_BUTTONS.map((row, ri) => (
              <div key={ri} className="grid grid-cols-5 gap-1.5">
                {row.map(btn => {
                  const s = getButtonStyle(btn);
                  return (
                    <button key={btn} onClick={() => input(btn)}
                      className="py-2.5 rounded-xl text-xs font-semibold
                        transition-all duration-150 active:scale-95 hover:brightness-125"
                      style={{
                        background: s.bg, color: s.text,
                        border: `1px solid ${s.border || "transparent"}`,
                      }}>
                      {btn}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        {/* Basic buttons */}
        <div className="p-3 space-y-1.5">
          {BASIC_BUTTONS.map((row, ri) => (
            <div key={ri} className="grid grid-cols-4 gap-1.5">
              {row.map(btn => {
                const s = getButtonStyle(btn);
                return (
                  <button key={btn} onClick={() => input(btn)}
                    className="py-3.5 rounded-xl text-base font-bold
                      transition-all duration-150 active:scale-95 hover:brightness-110"
                    style={{
                      background: s.bg, color: s.text,
                      border: `1px solid ${s.border || "transparent"}`,
                      gridColumn: s.span ? `span ${s.span}` : undefined,
                      boxShadow: s.shadow || "none",
                    }}>
                    {btn}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </Card>

      {/* History */}
      {history.length > 0 && (
        <Card className="mt-4 fade-up" style={{animationDelay:".1s"}}>
          <div className="flex justify-between items-center mb-3">
            <div className="text-xs font-bold text-on-surface flex items-center gap-1.5">
              <span className="material-symbols-outlined text-sm text-[#3b82f6]">history</span>
              History
            </div>
            <button onClick={() => setHistory([])}
              className="text-[10px] text-dim hover:text-[#f87171] transition-colors">
              Clear
            </button>
          </div>
          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {history.map((h, i) => (
              <div key={i}
                onClick={() => { setExpr(h.result); setResult(""); sfx.click(); }}
                className="flex justify-between items-center py-2 px-3 rounded-xl
                  bg-white/[.02] hover:bg-white/[.05] cursor-pointer transition-all duration-200
                  border border-white/[.04]">
                <span className="text-xs text-muted font-mono truncate mr-3">{h.expr}</span>
                <span className="text-xs text-[#00C896] font-bold font-mono flex-shrink-0">= {h.result}</span>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
