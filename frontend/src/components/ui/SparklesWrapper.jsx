import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * SparklesWrapper — wraps children with animated sparkle ✦ shapes
 * that pulse in/out on a loop around the element.
 *
 * Props:
 *   children — the element to wrap
 *   count    — number of sparkles (default 7)
 *   colors   — array of colors (default gold + violet)
 */
export default function SparklesWrapper({
  children,
  count = 7,
  colors = ["#f59e0b", "#8b5cf6"],
}) {
  const reduced = useReducedMotion();
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    const s = Array.from({ length: count }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 6 + Math.random() * 6,
      color: colors[i % colors.length],
      delay: Math.random() * 2,
      duration: 1.5 + Math.random() * 1,
    }));
    setSparkles(s);
  }, [count]);

  if (reduced) return <>{children}</>;

  return (
    <div className="relative inline-flex">
      {children}
      {/* Sparkle layer */}
      <div className="absolute inset-0 pointer-events-none overflow-visible" aria-hidden="true">
        {sparkles.map((sp) => (
          <motion.svg
            key={sp.id}
            viewBox="0 0 24 24"
            className="absolute"
            style={{
              left: `${sp.x}%`,
              top: `${sp.y}%`,
              width: sp.size,
              height: sp.size,
              marginLeft: -sp.size / 2,
              marginTop: -sp.size / 2,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              rotate: [0, 180],
            }}
            transition={{
              duration: sp.duration,
              repeat: Infinity,
              repeatType: "loop",
              delay: sp.delay,
              ease: "easeInOut",
            }}
          >
            {/* Diamond / 4-point star shape */}
            <path
              d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z"
              fill={sp.color}
            />
          </motion.svg>
        ))}
      </div>
    </div>
  );
}
