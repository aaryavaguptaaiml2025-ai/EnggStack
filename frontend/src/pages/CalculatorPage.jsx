import { useState, useEffect, useCallback } from "react";
import { Card } from "../components/ui";
import { sfx } from "../hooks/useSfx";

const DEG_TO_RAD = Math.PI / 180;

export default function CalculatorPage() {
  const [expr, setExpr] = useState("0");
  const [result, setResult] = useState("");
  const [history, setHistory] = useState([]);
  const [isRad, setIsRad] = useState(false);
  const [sciMode, setSciMode] = useState(true);
  const [lastOp, setLastOp] = useState(false);

  /* ── FIXED EVALUATE FUNCTION ── */
  const evaluate = useCallback((expression) => {
    try {
      let e = expression
        .replace(/π/g, `${Math.PI}`)
        .replace(/e(?![xp])/g, `${Math.E}`);

      // Prevent invalid endings
      if (/[\+\-\*\/\.]$/.test(e)) return "Error";

      // Handle scientific functions
      const convertAngle = (x) =>
        isRad ? x : `(${x}) * ${Math.PI} / 180`;

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
      if (expr.endsWith("**")) {
        setResult("Error");
        return;
      }

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
      if (lastOp && "0123456789.(".includes(val)) {
        setLastOp(false);
        return val;
      }
      setLastOp(false);
      if (prev === "0" && val !== ".") return val;
      return prev + val;
    });

  }, [expr, lastOp, evaluate]);

  /* ── KEYBOARD SUPPORT ── */
  useEffect(() => {
    const handler = (e) => {
      const k = e.key;
      if ("0123456789.".includes(k)) input(k);
      else if ("+-*/".includes(k)) input(k);
      else if (k === "Enter" || k === "=") input("=");
      else if (k === "Backspace") input("⌫");
      else if (k === "Escape") input("C");
      else if ("()".includes(k)) input(k);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [input]);

  return (
    <div className="page-container max-w-lg mx-auto">
      <Card className="p-6">
        <div className="text-right mb-2 text-muted font-mono">
          {expr}
        </div>

        <div className={`text-right font-bold text-3xl ${
          result === "Error" ? "text-red-400" : "text-[#00C896]"
        }`}>
          {result || expr}
        </div>

        {/* Scientific Mode Toggle */}
        <div className="flex justify-between items-center mt-4 mb-4 pb-4 border-b border-white/5">
          <div className="flex gap-2">
            <button onClick={() => setIsRad(false)} className={`text-xs px-2 py-1 rounded ${!isRad ? 'bg-white/10 text-[var(--text)]' : 'text-dim'}`}>DEG</button>
            <button onClick={() => setIsRad(true)} className={`text-xs px-2 py-1 rounded ${isRad ? 'bg-white/10 text-[var(--text)]' : 'text-dim'}`}>RAD</button>
          </div>
          <button onClick={() => setSciMode(!sciMode)} className="text-xs text-[var(--ac)] hover:underline">
            {sciMode ? "Basic" : "Scientific"}
          </button>
        </div>

        {/* Keypad */}
        <div className="grid grid-cols-4 gap-2 sm:gap-3">
          {sciMode && (
            <>
              <Btn label="sin" onClick={() => input("sin")} cls="bg-white/5 text-[15px]" />
              <Btn label="cos" onClick={() => input("cos")} cls="bg-white/5 text-[15px]" />
              <Btn label="tan" onClick={() => input("tan")} cls="bg-white/5 text-[15px]" />
              <Btn label="log" onClick={() => input("log")} cls="bg-white/5 text-[15px]" />
              <Btn label="ln" onClick={() => input("ln")} cls="bg-white/5 text-[15px]" />
              <Btn label="√" onClick={() => input("√")} cls="bg-white/5 text-[15px]" />
              <Btn label="x²" onClick={() => input("x²")} cls="bg-white/5 text-[15px]" />
              <Btn label="xʸ" onClick={() => input("xʸ")} cls="bg-white/5 text-[15px]" />
              <Btn label="π" onClick={() => input("π")} cls="bg-white/5 text-[15px]" />
              <Btn label="e" onClick={() => input("e")} cls="bg-white/5 text-[15px]" />
              <Btn label="1/x" onClick={() => input("1/x")} cls="bg-white/5 text-[15px]" />
              <Btn label="x!" onClick={() => input("x!")} cls="bg-white/5 text-[15px]" />
              
              <Btn label="(" onClick={() => input("(")} cls="bg-white/5" />
              <Btn label=")" onClick={() => input(")")} cls="bg-white/5" />
              <div className="col-span-2"></div>
            </>
          )}

          {/* Row 1 */}
          <Btn label="C" onClick={() => input("C")} cls="bg-[var(--clr-danger)]/20 text-[var(--clr-danger)]" />
          <Btn label="±" onClick={() => input("±")} cls="bg-white/10" />
          <Btn label="%" onClick={() => input("%")} cls="bg-white/10" />
          <Btn label="/" onClick={() => input("/")} cls="bg-[var(--ac)]/20 text-[var(--ac)] text-xl" />

          {/* Row 2 */}
          <Btn label="7" onClick={() => input("7")} cls="bg-white/5 hover:bg-white/10" />
          <Btn label="8" onClick={() => input("8")} cls="bg-white/5 hover:bg-white/10" />
          <Btn label="9" onClick={() => input("9")} cls="bg-white/5 hover:bg-white/10" />
          <Btn label="*" onClick={() => input("*")} cls="bg-[var(--ac)]/20 text-[var(--ac)] text-xl" />

          {/* Row 3 */}
          <Btn label="4" onClick={() => input("4")} cls="bg-white/5 hover:bg-white/10" />
          <Btn label="5" onClick={() => input("5")} cls="bg-white/5 hover:bg-white/10" />
          <Btn label="6" onClick={() => input("6")} cls="bg-white/5 hover:bg-white/10" />
          <Btn label="-" onClick={() => input("-")} cls="bg-[var(--ac)]/20 text-[var(--ac)] text-xl" />

          {/* Row 4 */}
          <Btn label="1" onClick={() => input("1")} cls="bg-white/5 hover:bg-white/10" />
          <Btn label="2" onClick={() => input("2")} cls="bg-white/5 hover:bg-white/10" />
          <Btn label="3" onClick={() => input("3")} cls="bg-white/5 hover:bg-white/10" />
          <Btn label="+" onClick={() => input("+")} cls="bg-[var(--ac)]/20 text-[var(--ac)] text-xl" />

          {/* Row 5 */}
          <Btn label="0" onClick={() => input("0")} cls="col-span-2 bg-white/5 hover:bg-white/10" />
          <Btn label="." onClick={() => input(".")} cls="bg-white/5 hover:bg-white/10 text-xl" />
          <Btn label="=" onClick={() => input("=")} cls="bg-[var(--ac)] text-[#0B1220] font-extrabold text-xl" />
        </div>
      </Card>
    </div>
  );
}

function Btn({ label, onClick, cls }) {
  return (
    <button
      onClick={onClick}
      className={`h-12 sm:h-14 rounded-xl flex items-center justify-center text-lg font-medium transition-all active:scale-95 ${cls}`}
    >
      {label}
    </button>
  );
}