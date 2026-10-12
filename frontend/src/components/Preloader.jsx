import { motion } from "framer-motion";
import { EASE } from "./Reveal";

export default function Preloader() {
  return (
    <motion.div
      data-testid="preloader"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-cream"
      exit={{ y: "-100%" }}
      transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
    >
      <motion.img
        src="/images/brand/mark.png"
        alt="The Harvest Theory mark"
        className="h-24 md:h-28 w-auto"
        initial={{ opacity: 0, scale: 0.92, filter: "blur(6px)" }}
        animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        transition={{ duration: 1, ease: EASE }}
      />
      <motion.p
        className="mt-6 text-[11px] uppercase tracking-[0.42em] text-olive"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: EASE, delay: 0.35 }}
      >
        The Harvest Theory
      </motion.p>
      <motion.div
        className="mt-6 h-px w-24 bg-gold origin-left"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 1.1, ease: EASE, delay: 0.45 }}
      />
    </motion.div>
  );
}
