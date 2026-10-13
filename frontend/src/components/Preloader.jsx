import { motion } from "framer-motion";

// Full-screen loading moment: an ingredient still-life treated like a watermark —
// "These are the parts. The theory is what we do with them."
export default function Preloader() {
  return (
    <motion.div
      data-testid="preloader"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-cream overflow-hidden"
      exit={{ y: "-100%" }}
      transition={{ duration: 0.9, ease: [0.76, 0, 0.24, 1] }}
    >
      <motion.img
        src="/images/editorial/preloader-ingredients.jpg"
        alt="Raw botanical ingredients arranged in a line on warm plaster"
        className="absolute inset-0 h-full w-full object-cover opacity-40 saturate-[0.55]"
        initial={{ opacity: 0, scale: 1.04 }}
        animate={{ opacity: 0.4, scale: 1 }}
        transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1] }}
      />
      <div className="absolute inset-0 bg-cream/55" />
      <div className="relative flex flex-col items-center px-6 text-center">
        <motion.p
          className="eyebrow !text-olive"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
        >
          These are the parts
        </motion.p>
        <motion.p
          className="mt-4 max-w-md font-display text-2xl md:text-3xl font-light leading-snug text-ink/80"
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.55 }}
        >
          The theory is what we do with them.
        </motion.p>
        <motion.div
          className="mt-8 h-px w-24 bg-gold origin-left"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.7 }}
        />
      </div>
    </motion.div>
  );
}
