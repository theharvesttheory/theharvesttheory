import { Link } from "react-router-dom";
import Logo from "./Logo";
import { FadeUp } from "./Reveal";

const explore = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Products" },
  { to: "/story", label: "Our Story" },
  { to: "/contact", label: "Contact" },
];

export default function Footer() {
  return (
    <footer data-testid="site-footer" className="relative overflow-hidden bg-olivedeep text-cream">
      <div className="mx-auto max-w-[1500px] px-6 md:px-10 lg:px-16 pt-24 md:pt-32 pb-10">
        <div className="grid gap-16 md:grid-cols-12">
          <div className="md:col-span-6">
            <FadeUp>
              <p className="eyebrow !text-gold">The Harvest Theory</p>
              <h2 className="mt-6 font-display font-light text-4xl md:text-5xl leading-[1.05] tracking-tight">
                Nourishment,
                <br />
                <span className="font-accent italic text-cream/80">by design.</span>
              </h2>
              <Link
                to="/products"
                data-testid="footer-cta-products"
                className="btn-cream mt-10"
              >
                Explore Our Products
              </Link>
            </FadeUp>
          </div>

          <div className="md:col-span-3">
            <FadeUp delay={0.08}>
              <p className="text-[11px] uppercase tracking-[0.24em] text-cream/40">Explore</p>
              <ul className="mt-6 space-y-3">
                {explore.map((l) => (
                  <li key={l.to}>
                    <Link
                      to={l.to}
                      data-testid={`footer-link-${l.label.toLowerCase().replace(/\s+/g, "-")}`}
                      className="text-cream/80 transition-colors duration-300 hover:text-gold font-light"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </FadeUp>
          </div>

          <div className="md:col-span-3">
            <FadeUp delay={0.16}>
              <p className="text-[11px] uppercase tracking-[0.24em] text-cream/40">Company</p>
              <ul className="mt-6 space-y-3 font-light text-cream/80">
                <li className="flex items-center gap-3">
                  <span>Our Approach</span>
                  <span className="border border-cream/25 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-cream/50">
                    Soon
                  </span>
                </li>
                <li className="flex items-center gap-3">
                  <span>Journal</span>
                  <span className="border border-cream/25 px-2 py-0.5 text-[9px] uppercase tracking-[0.18em] text-cream/50">
                    Soon
                  </span>
                </li>
                <li>
                  <Link
                    to="/contact"
                    data-testid="footer-link-wholesale-export"
                    className="transition-colors duration-300 hover:text-gold"
                  >
                    Wholesale &amp; Export
                  </Link>
                </li>
                <li>
                  <a
                    href="mailto:hello@theharvesttheory.com"
                    data-testid="footer-email"
                    className="transition-colors duration-300 hover:text-gold"
                  >
                    hello@theharvesttheory.com
                  </a>
                </li>
              </ul>
            </FadeUp>
          </div>
        </div>

        <div className="mt-20 flex flex-col md:flex-row md:items-end justify-between gap-8 border-t border-cream/10 pt-8">
          <Logo variant="cream" className="h-10 md:h-12 w-auto opacity-90" />
          <p className="text-xs tracking-[0.14em] uppercase text-cream/40">
            © {new Date().getFullYear()} The Harvest Theory · India
          </p>
        </div>
      </div>

      <div
        aria-hidden
        className="pointer-events-none select-none absolute -bottom-8 left-0 right-0 text-center font-display font-light text-[22vw] leading-none text-cream/[0.04]"
      >
        Harvest
      </div>
    </footer>
  );
}
