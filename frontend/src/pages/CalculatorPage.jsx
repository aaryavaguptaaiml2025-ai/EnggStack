import { useState, useEffect, useCallback } from "react";

const BUTTONS = [
  ["C", "±", "%", "÷"],
  ["7", "8", "9", "×"],
  ["4", "5", "6", "−"],
  ["1", "2", "3", "+"],
  ["0", ".", "⌫", "="],
];

const OP_MAP = { "÷": "/", "×": "*", "−": "-", "+": "+" };

export default function CalculatorPage() {
  const [display, setDisplay] = useState("0");
  const [prev, setPrev] = useState(null);
  const [op, setOp] = useState(null);
  const [fresh, setFresh] = useState(true);

  const clear = useCallback(() => {
    setDisplay("0");
    setPrev(null);
    setOp(null);
    setFresh(true);
  }, []);

  const calculate = useCallback((a, b, operator) => {
    const na = parseFloat(a);
    const nb = parseFloat(b);
    if (isNaN(na) || isNaN(nb)) return "0";
    let result;
    switch (operator) {
      case "+": result = na + nb; break;
      case "-": result = na - nb; break;
      case "*": result = na * nb; break;
      case "/": result = nb === 0 ? "Error" : na / nb; break;
      default: return b;
    }
    if (result === "Error") return result;
    // Avoid floating point weirdness
    return parseFloat(result.toPrecision(12)).toString();
  }, []);

  const handleEquals = useCallback(() => {
    if (prev !== null && op) {
      const result = calculate(prev, display, op);
      setDisplay(result);
      setPrev(null);
      setOp(null);
      setFresh(true);
    }
  }, [prev, op, display, calculate]);

  const handleOp = useCallback((operator) => {
    const mapped = OP_MAP[operator] || operator;
    if (prev !== null && op && !fresh) {
      const result = calculate(prev, display, op);
      setDisplay(result);
      setPrev(result);
    } else {
      setPrev(display);
    }
    setOp(mapped);
    setFresh(true);
  }, [prev, op, display, fresh, calculate]);

  const handleNumber = useCallback((num) => {
    if (display === "Error") clear();
    if (fresh) {
      setDisplay(num === "." ? "0." : num);
      setFresh(false);
    } else {
      if (num === "." && display.includes(".")) return;
      setDisplay(display === "0" && num !== "." ? num : display + num);
    }
  }, [display, fresh, clear]);

  const handlePress = useCallback((btn) => {
    if (btn === "C") return clear();
    if (btn === "⌫") {
      if (display.length <= 1 || display === "Error") {
        setDisplay("0");
        setFresh(true);
      } else {
        setDisplay(display.slice(0, -1));
      }
      return;
    }
    if (btn === "±") {
      if (display !== "0" && display !== "Error") {
        setDisplay(display.startsWith("-") ? display.slice(1) : "-" + display);
      }
      return;
    }
    if (btn === "%") {
      const val = parseFloat(display);
      if (!isNaN(val)) setDisplay((val / 100).toString());
      return;
    }
    if (btn === "=") return handleEquals();
    if (["÷", "×", "−", "+"].includes(btn)) return handleOp(btn);
    // Number or decimal
    handleNumber(btn);
  }, [display, clear, handleEquals, handleOp, handleNumber]);

  // Keyboard support
  useEffect(() => {
    const handler = (e) => {
      const key = e.key;
      if (key >= "0" && key <= "9") handlePress(key);
      else if (key === ".") handlePress(".");
      else if (key === "+" || key === "-") handlePress(key === "-" ? "−" : "+");
      else if (key === "*") handlePress("×");
      else if (key === "/") { e.preventDefault(); handlePress("÷"); }
      else if (key === "Enter" || key === "=") handlePress("=");
      else if (key === "Backspace") handlePress("⌫");
      else if (key === "Escape") handlePress("C");
      else if (key === "%") handlePress("%");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handlePress]);

  const isOp = (btn) => ["÷", "×", "−", "+"].includes(btn);
  const isActiveOp = (btn) => op === OP_MAP[btn] && fresh;

  return (
    <div className="page-container flex items-start justify-center">
      <div className="w-full max-w-sm">
        <div className="mb-8">
          <h1 className="section-title flex items-center gap-2">
            <span className="material-symbols-outlined text-[#00C896] text-2xl">calculate</span>
            Calculator
          </h1>
          <p className="text-xs text-muted mt-1">Quick calculations while you study</p>
        </div>

        <div className="glass-card overflow-hidden">
          {/* Display */}
          <div className="p-6 pb-4 border-b border-white/5">
            <div className="text-right">
              {prev !== null && op && (
                <div className="text-xs text-muted mb-1 font-mono">
                  {prev} {Object.entries(OP_MAP).find(([,v]) => v === op)?.[0] || op}
                </div>
              )}
              <div className="text-4xl font-bold text-on-surface font-mono tracking-tight truncate"
                style={{ color: display === "Error" ? "#f87171" : undefined }}>
                {display}
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="p-3 grid grid-cols-4 gap-2">
            {BUTTONS.flat().map((btn, i) => {
              const isEquals = btn === "=";
              const isOperator = isOp(btn);
              const isFunc = ["C", "±", "%", "⌫"].includes(btn);
              const active = isOperator && isActiveOp(btn);

              let bg, color, hoverBg;
              if (isEquals) {
                bg = "#00C896";
                color = "#000";
                hoverBg = "#00C896";
              } else if (active) {
                bg = "#00C896";
                color = "#000";
                hoverBg = "#00C896";
              } else if (isOperator) {
                bg = "rgba(0,200,150,0.1)";
                color = "#00C896";
                hoverBg = "rgba(0,200,150,0.18)";
              } else if (isFunc) {
                bg = "rgba(255,255,255,0.06)";
                color = "#8892a8";
                hoverBg = "rgba(255,255,255,0.1)";
              } else {
                bg = "rgba(255,255,255,0.04)";
                color = "#e0e6f0";
                hoverBg = "rgba(255,255,255,0.08)";
              }

              return (
                <button
                  key={i}
                  onClick={() => handlePress(btn)}
                  className={`rounded-xl text-lg font-semibold transition-all duration-150
                    active:scale-95 h-14 flex items-center justify-center
                    ${btn === "0" ? "col-span-1" : ""}`}
                  style={{ background: bg, color }}
                  onMouseEnter={e => e.currentTarget.style.background = hoverBg}
                  onMouseLeave={e => e.currentTarget.style.background = active ? "#00C896" : bg}
                >
                  {btn === "⌫" ? (
                    <span className="material-symbols-outlined text-xl">backspace</span>
                  ) : btn}
                </button>
              );
            })}
          </div>

          {/* Keyboard hint */}
          <div className="px-4 pb-3 text-center">
            <span className="text-[10px] text-dim">Keyboard supported</span>
          </div>
        </div>
      </div>
    </div>
  );
}
