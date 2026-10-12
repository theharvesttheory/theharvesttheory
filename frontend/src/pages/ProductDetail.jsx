import { Link, Navigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { FadeUp, Page, EASE } from "@/components/Reveal";
import { categoryLabel, products } from "@/data/products";

function DetailRow({ label, children, testid }) {
  return (
    <FadeUp>
      <div data-testid={testid} className="border-t border-ink/10 py-8">
        <p className="text-[11px] uppercase tracking-[0.22em] text-ink/45">{label}</p>
        <div className="mt-4">{children}</div>
      </div>
    </FadeUp>
  );
}

export default function ProductDetail() {
  const { slug } = useParams();
  const idx = products.findIndex((p) => p.slug === slug);
  if (idx === -1) return <Navigate to="/products" replace />;
  const p = products[idx];
  const prev = products[(idx - 1 + products.length) % products.length];
  const next = products[(idx + 1) % products.length];

  return (
    <Page>
      <article data-testid="product-detail">
        <div className="mx-auto max-w-[1500px] px-6 pt-32 md:px-10 md:pt-40 lg:px-16">
          <FadeUp y={12}>
            <Link
              to="/products"
              data-testid="product-back-link"
              className="group inline-flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-ink/55 transition-colors duration-300 hover:text-olive"
            >
              <ArrowLeft size={15} strokeWidth={1.5} className="transition-transform duration-500 group-hover:-translate-x-1" />
              All products
            </Link>
          </FadeUp>

          <div className="mt-12 grid gap-14 pb-24 lg:grid-cols-2 lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <motion.div
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, ease: EASE, delay: 0.1 }}
                className="overflow-hidden rounded-sm bg-creamdeep"
              >
                <img
                  src={p.image}
                  alt={p.name}
                  className="aspect-[3/4] w-full object-cover"
                />
              </motion.div>
            </div>

            <div>
              <FadeUp>
                <p className="text-[11px] uppercase tracking-[0.24em] text-gold">
                  {categoryLabel(p.category)}
                </p>
                <h1 className="mt-5 font-display text-4xl md:text-6xl font-light leading-[1.02] tracking-tight text-ink">
                  {p.name}
                </h1>
                <p className="mt-6 font-accent text-2xl italic leading-snug text-olive/80">
                  {p.tagline}
                </p>
                <p className="mt-8 max-w-lg text-base md:text-lg font-light leading-relaxed text-ink/65">
                  {p.description}
                </p>
              </FadeUp>

              <div className="mt-12">
                <DetailRow label="Ingredients" testid="product-ingredients">
                  <p className="font-light leading-relaxed text-ink/75">
                    {p.ingredients.join(" · ")}
                  </p>
                </DetailRow>
                <DetailRow label="Tasting notes" testid="product-notes">
                  <div className="flex flex-wrap gap-3">
                    {p.notes.map((n) => (
                      <span
                        key={n}
                        className="border border-ink/15 px-4 py-1.5 text-[12px] tracking-[0.08em] text-ink/70"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </DetailRow>
                <DetailRow label="Preparation" testid="product-prep">
                  <p className="font-light leading-relaxed text-ink/75">{p.prep}</p>
                </DetailRow>
                <DetailRow label="Good to know" testid="product-goodtoknow">
                  <p className="font-light leading-relaxed text-ink/75">{p.goodToKnow}</p>
                </DetailRow>
              </div>

              <FadeUp>
                <div className="mt-14 flex flex-wrap items-center gap-6">
                  <button
                    data-testid="product-buy-button"
                    onClick={() =>
                      toast("Online shopping arrives with our first release.", {
                        description: `${p.name} is coming soon.`,
                      })
                    }
                    className="btn-primary"
                  >
                    Purchase — Coming Soon
                  </button>
                  <span className="text-[11px] uppercase tracking-[0.2em] text-ink/40">
                    Joining the collection shortly
                  </span>
                </div>
              </FadeUp>
            </div>
          </div>
        </div>

        <nav
          data-testid="product-prev-next"
          className="border-t border-linewarm bg-creamdeep/60"
        >
          <div className="mx-auto grid max-w-[1500px] md:grid-cols-2">
            <Link
              to={`/products/${prev.slug}`}
              data-testid="product-prev"
              className="group flex items-center gap-4 border-b border-linewarm px-6 py-10 md:border-b-0 md:border-r md:px-10 lg:px-16"
            >
              <ArrowLeft size={18} strokeWidth={1.25} className="text-olive transition-transform duration-500 group-hover:-translate-x-1.5" />
              <span>
                <span className="block text-[10px] uppercase tracking-[0.22em] text-ink/40">Previous</span>
                <span className="mt-1 block font-display text-xl font-light text-ink">{prev.name}</span>
              </span>
            </Link>
            <Link
              to={`/products/${next.slug}`}
              data-testid="product-next"
              className="group flex items-center justify-end gap-4 px-6 py-10 text-right md:px-10 lg:px-16"
            >
              <span>
                <span className="block text-[10px] uppercase tracking-[0.22em] text-ink/40">Next</span>
                <span className="mt-1 block font-display text-xl font-light text-ink">{next.name}</span>
              </span>
              <ArrowRight size={18} strokeWidth={1.25} className="text-olive transition-transform duration-500 group-hover:translate-x-1.5" />
            </Link>
          </div>
        </nav>
      </article>
    </Page>
  );
}
