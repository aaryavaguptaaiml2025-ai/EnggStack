import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline  = () => {
      setIsOffline(false);
      // Process any queued actions when back online
      if (window._offlineQueue?.length) {
        window._offlineQueue.forEach(fn => {
          try { fn(); } catch {}
        });
        window._offlineQueue = [];
      }
    };

    window.addEventListener("offline", goOffline);
    window.addEventListener("online",  goOnline);
    return () => {
      window.removeEventListener("offline", goOffline);
      window.removeEventListener("online",  goOnline);
    };
  }, []);

  return (
    <AnimatePresence>
      {isOffline && (
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -40, opacity: 0 }}
          className="fixed top-0 left-0 right-0 z-[99999] flex items-center justify-center gap-2 
            py-2 px-4 text-xs font-semibold"
          style={{
            background: "linear-gradient(90deg, #f97316, #f59e0b)",
            color: "#0f172a",
          }}
        >
          <span className="material-symbols-outlined text-sm">cloud_off</span>
          You're offline — showing cached data
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// Helper to queue actions when offline
export function queueWhenOffline(asyncFn) {
  if (navigator.onLine) {
    return asyncFn();
  }
  if (!window._offlineQueue) window._offlineQueue = [];
  window._offlineQueue.push(asyncFn);
  return Promise.resolve({ queued: true });
}
