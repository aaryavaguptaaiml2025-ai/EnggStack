import { useRef, useEffect, useState } from "react";

/*
 * MovingBorderButton — A button with an animated conic-gradient border
 * that rotates continuously around the perimeter.
 *
 * Props:
 *   children     — button content
 *   className    — extra classes for the inner button
 *   onClick      — click handler
 *   disabled     — disabled state
 *   style        — extra inline styles for inner button
 *   borderColors — array of 4 CSS colors (defaults to violet→cyan→amber→violet)
 *   duration     — rotation duration in seconds (default 3)
 *   as           — render as a different tag (default "button")
 */
export default function MovingBorderButton({
  children,
  className = "",
  onClick,
  disabled = false,
  style = {},
  borderColors,
  duration = 3,
  as: Tag = "button",
  ...rest
}) {
  const wrapRef = useRef(null);
  const [angle, setAngle] = useState(0);
  const rafRef = useRef(null);
  const startRef = useRef(null);

  // Check for reduced motion preference
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (e) => setReduced(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  useEffect(() => {
    if (reduced) return;
    const animate = (ts) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const deg = (elapsed / (duration * 1000)) * 360;
      setAngle(deg % 360);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, [duration, reduced]);

  const colors = borderColors || ["#8b5cf6", "#06b6d4", "#f59e0b", "#8b5cf6"];
  const gradient = `conic-gradient(from ${angle}deg, ${colors.join(", ")})`;

  return (
    <div
      ref={wrapRef}
      className="relative inline-flex rounded-xl p-[2px] group"
      style={{
        background: reduced
          ? `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`
          : gradient,
      }}
    >
      {/* Glow layer */}
      <div
        className="absolute inset-0 rounded-xl opacity-40 blur-md transition-opacity duration-300 group-hover:opacity-60"
        style={{
          background: reduced
            ? `linear-gradient(135deg, ${colors[0]}, ${colors[1]})`
            : gradient,
        }}
        aria-hidden="true"
      />
      <Tag
        onClick={onClick}
        disabled={disabled}
        className={`relative z-10 bg-[#0B1220] rounded-[10px] font-semibold
          transition-all duration-200 active:scale-95
          ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
          ${className}`}
        style={style}
        {...rest}
      >
        {children}
      </Tag>
    </div>
  );
}
