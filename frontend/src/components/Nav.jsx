import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import Logo from "./Logo";
import { EASE } from "./Reveal";
import { lenisRef } from "@/context/app";

const LINKS = [
  { to: "/products", label: "Products" },
  { to: "/collections", label: "Gift Assortments" },
  { to: "/story", label: "Our Theory" },
];

const MOBILE_LINKS = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/collections", label: "Gift Assortments" },
  { to: "/story", label: "Our Story / Our Theory" },
  { to: "/contact", label: "Contact" },
];

export default function Nav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (open) lenisRef.current?.stop();
    else lenisRef.current?.start();
  }, [open]);

  const isActive = (to) => location.pathname.startsWith(to);

  return (
    <>
      <header
        data-testid="site-nav"
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          scrolled
            ? "bg-cream/85 backdrop-blur-xl border-b border-linewarm"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="mx-auto flex max-w-[1500px] items-center justify-between px-6 md:px-10 lg:px-16 py-4">
          <Link
            to="/"
            data-testid="nav-logo-home"
            className="flex items-center"
            aria-label="The Harvest Theory — home"
          >
            <Logo className="h-9 md:h-10 w-auto" />
          </Link>

          <nav className="hidden md:flex items-center gap-10 lg:gap-12">
            {LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                data-testid={`nav-link-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
                className={`relative text-[13px] uppercase tracking-[0.18em] transition-colors duration-300 ${
                  isActive(l.to) ? "text-olive" : "text-ink/60 hover:text-olive"
                }`}
              >
                {l.label}
                {isActive(l.to) && (
                  <motion.span
                    layoutId="nav-underline"
                    className="absolute -bottom-1.5 left-0 right-0 h-px bg-olive"
                  />
                )}
              </Link>
            ))}
            <Link
              to="/contact"
              data-testid="nav-cta"
              className="border border-olive/40 px-6 py-2.5 text-[13px] uppercase tracking-[0.18em] text-olive transition-colors duration-300 hover:bg-olive hover:text-cream"
            >
              Get in Touch
            </Link>
          </nav>

          <button
            data-testid="nav-mobile-toggle"
            className="md:hidden flex flex-col justify-center items-end gap-[7px] w-10 h-10"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Close menu" : "Open menu"}
          >
            <span
              className={`h-px bg-ink transition-all duration-300 ${
                open ? "w-7 rotate-45 translate-y-[4px]" : "w-7"
              }`}
            />
            <span
              className={`h-px bg-ink transition-all duration-300 ${
                open ? "w-7 -rotate-45 -translate-y-[4px]" : "w-5"
              }`}
            />
          </button>
        </div>
      </header>

      <AnimatePresence>
        {open && (
          <motion.div
            data-testid="nav-mobile-menu"
            className="fixed inset-0 z-40 bg-cream flex flex-col justify-between pt-28 pb-10 px-6 overflow-y-auto"
            initial={{ opacity: 0, y: -24 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -24 }}
            transition={{ duration: 0.45, ease: EASE }}
          >
            <nav className="flex flex-col gap-1">
              {MOBILE_LINKS.map((l, i) => (
                <motion.div
                  key={l.to}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: EASE, delay: 0.08 + i * 0.06 }}
                >
                  <Link
                    to={l.to}
                    data-testid={`nav-mobile-link-${l.label.toLowerCase().replace(/[\s/]+/g, "-")}`}
                    className={`block font-display font-light text-[2.6rem] leading-tight py-2 ${
                      location.pathname === l.to ? "text-olive" : "text-ink"
                    }`}
                  >
                    {l.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
            <motion.p
              className="text-[11px] uppercase tracking-[0.24em] text-ink/40"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
            >
              The right ingredients. Harvested at the right time.
            </motion.p>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
