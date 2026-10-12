import { motion } from "framer-motion";

export const EASE = [0.16, 1, 0.3, 1];

export function FadeUp({ children, delay = 0, y = 28, className = "", once = true }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, amount: 0.15, margin: "0px 0px -40px 0px" }}
      transition={{ duration: 0.9, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  );
}

/**
 * Signature masked line-by-line reveal.
 * `lines` items are strings or { text, className }.
 */
export function MaskedLines({
  lines = [],
  delay = 0,
  stagger = 0.13,
  as: Tag = "h1",
  className = "",
  lineClassName = "",
}) {
  return (
    <Tag className={className}>
      {lines.map((line, i) => {
        const text = typeof line === "string" ? line : line.text;
        const cls = (typeof line === "string" ? "" : line.className) || "";
        return (
          <span key={i} className="block overflow-hidden pb-[0.09em] -mb-[0.09em]">
            <motion.span
              className={`block will-change-transform ${lineClassName} ${cls}`}
              initial={{ y: "112%" }}
              animate={{ y: "0%" }}
              transition={{ duration: 1.15, ease: EASE, delay: delay + i * stagger }}
            >
              {text}
            </motion.span>
          </span>
        );
      })}
    </Tag>
  );
}

export function Page({ children, className = "" }) {
  return (
    <motion.main
      className={className}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.5, ease: EASE }}
    >
      {children}
    </motion.main>
  );
}
