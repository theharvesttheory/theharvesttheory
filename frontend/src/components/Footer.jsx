import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Logo from "./Logo";
import { FadeUp } from "./Reveal";

const explore = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/collections", label: "Gift Assortments" },
  { to: "/approach", label: "Our Approach" },
  { to: "/story", label: "Our Story / Our Theory" },
  { to: "/contact", label: "Contact" },
];

const trust = [
  { label: "FSSAI details", value: "License no. to be displayed" },
  { label: "Certifications", value: "Details coming soon" },
  { label: "Retail / Distributor enquiries", to: "/contact" },
  { label: "Export enquiries", to: "/contact" },
];

const legal = ["Privacy Policy", "Terms", "Shipping & Returns", "FAQ"];

const social = [
  { label: "Instagram", testid: "footer-social-instagram" },
  { label: "LinkedIn", testid: "footer-social-linkedin" },
];

function Newsletter() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(false);
  return done ? (
    <p data-testid="newsletter-success" className="mt-6 text-sm font-light text-cream/85">
      Thank you — you&rsquo;re on the list.
    </p>
  ) : (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (email) setDone(true);
      }}
      className="mt-6"
    >
      <p className="text-[11px] uppercase tracking-[0.24em] text-cream/55">The seasonal letter</p>
      <div className="mt-4 flex max-w-xs items-center border-b border-cream/25 transition-colors duration-300 focus-within:border-gold">
        <input
          data-testid="newsletter-input"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          className="w-full bg-transparent py-3 text-sm font-light text-cream placeholder:text-cream/50 focus:outline-none"
        />
        <button
          type="submit"
          data-testid="newsletter-submit"
          aria-label="Subscribe"
          className="p-2 text-cream/75 transition-colors duration-300 hover:text-gold"
        >
          <ArrowRight size={16} strokeWidth={1.5} />
        </button>
      </div>
    </form>
  );
}

export default function Footer() {
  return (
    <footer data-testid="site-footer" className="relative overflow-hidden bg-olivedeep text-cream">
      <div className="mx-auto max-w-[1500px] px-6 pt-24 md:pt-32 pb-10">
        <div className="grid gap-16 md:grid-cols-12">
          <div className="md:col-span-6">
            <FadeUp>
              <p className="eyebrow !text-gold">The Harvest Theory</p>
              <h2 className="mt-6 font-display text-4xl font-light leading-[1.05] tracking-tight md:text-5xl">
                There is a theory behind
                <br />
                <span className="font-accent italic text-cream/90">every harvest.</span>
              </h2>
              <div className="mt-10 flex flex-wrap gap-4">
                <Link to="/story" data-testid="footer-cta-theory" className="btn-cream">
                  Explore Our Theory
                </Link>
                <Link to="/products" data-testid="footer-cta-products" className="btn-cream-ghost">
                  Explore Our Products
                  <ArrowRight size={16} strokeWidth={1.5} />
                </Link>
              </div>
            </FadeUp>
          </div>

          <div className="md:col-span-3">
            <FadeUp delay={0.08}>
              <p className="text-[11px] uppercase tracking-[0.24em] text-cream/55">Explore</p>
              <ul className="mt-6 space-y-3">
                {explore.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      data-testid={`footer-link-${l.label.toLowerCase().replace(/[\s/]+/g, "-")}`}
                      className="font-light text-cream/90 transition-colors duration-300 hover:text-gold"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <Newsletter />
            </FadeUp>
          </div>

          <div className="md:col-span-3">
            <FadeUp delay={0.16}>
              <p className="text-[11px] uppercase tracking-[0.24em] text-cream/55">Trust</p>
              <ul className="mt-6 space-y-3 font-light">
                {trust.map((t) => (
                  <li key={t.label}>
                    {t.to ? (
                      <Link
                        to={t.to}
                        data-testid={`footer-trust-${t.label.toLowerCase().replace(/[\s/]+/g, "-")}`}
                        className="text-cream/90 transition-colors duration-300 hover:text-gold"
                      >
                        {t.label}
                      </Link>
                    ) : (
                      <span className="text-cream/90">
                        {t.label}
                        <span className="mt-0.5 block text-xs text-cream/55">{t.value}</span>
                      </span>
                    )}
                  </li>
                ))}
              </ul>

              <p className="mt-10 text-[11px] uppercase tracking-[0.24em] text-cream/55">Follow</p>
              <ul className="mt-6 space-y-3 font-light">
                {social.map((s) => (
                  <li key={s.label}>
                    <a
                      href="#"
                      onClick={(e) => e.preventDefault()}
                      data-testid={s.testid}
                      className="text-cream/90 transition-colors duration-300 hover:text-gold"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
                <li>
                  <a
                    href="mailto:hello@theharvesttheory.com"
                    data-testid="footer-email"
                    className="text-cream/90 transition-colors duration-300 hover:text-gold"
                  >
                    hello@theharvesttheory.com
                  </a>
                </li>
              </ul>
            </FadeUp>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center gap-x-8 gap-y-3 border-t border-cream/10 pt-8">
          {legal.map((l) => (
            <a
              key={l}
              href="#"
              onClick={(e) => e.preventDefault()}
              data-testid={`footer-legal-${l.toLowerCase().replace(/\s+&?\s*/g, "-")}`}
              className="text-[11px] uppercase tracking-[0.18em] text-cream/55 transition-colors duration-300 hover:text-cream"
            >
              {l}
            </a>
          ))}
        </div>

        <div className="mt-8 flex flex-col md:flex-row md:items-end justify-between gap-8">
          <Logo variant="cream" className="h-10 md:h-12 w-auto opacity-90" />
          <p className="text-xs uppercase tracking-[0.14em] text-cream/55">
            © {new Date().getFullYear()} The Harvest Theory · Made in India
          </p>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-8 left-0 right-0 select-none text-center font-display text-[22vw] font-light leading-none text-cream/[0.04]"
      >
        Harvest
      </div>
    </footer>
  );
}
