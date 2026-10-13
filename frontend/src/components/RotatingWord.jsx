import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { EASE } from "./Reveal";

export default function RotatingWord({ words = [], interval = 3200, className = "" }) {
  const [i, setI] = useState(0);

  useEffect(() => {
    if (!words.length) return undefined;
    const t = setInterval(() => setI((v) => (v + 1) % words.length), interval);
    return () => clearInterval(t);
  }, [words.length, interval]);

  if (!words.length) return null;

  return (
    <span
      data-testid="hero-word-rotator"
      className={`relative block h-[1.05em] overflow-hidden ${className}`}
    >
      <AnimatePresence initial={false}>
        <motion.span
          key={words[i]}
          className="absolute inset-x-0 top-0 block will-change-transform"
          initial={{ y: "65%", opacity: 0 }}
          animate={{ y: "0%", opacity: 1 }}
          exit={{ y: "-45%", opacity: 0 }}
          transition={{ duration: 0.7, ease: EASE }}
        >
          {words[i]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}
