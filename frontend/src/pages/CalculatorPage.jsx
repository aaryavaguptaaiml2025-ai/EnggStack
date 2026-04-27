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
        .replace(/×/g, "*")
        .replace(/÷/g, "/")
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
      else if ("+-".includes(k)) input(k);
      else if (k === "*") input("×");
      else if (k === "/") { e.preventDefault(); input("÷"); }
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
      </Card>
    </div>
  );
}