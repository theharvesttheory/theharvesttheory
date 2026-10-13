import { Link, Navigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { FadeUp, Page, EASE, Breadcrumb } from "@/components/Reveal";
import { categoryLabel, products } from "@/data/products";
import { lifestyleLabel } from "@/data/lifestyles";

function DetailRow({ label, children, testid }) {
  return (
    <FadeUp>
      <div data-testid={testid} className="border-t border-ink/10 py-6">
        <p className="text-[11px] uppercase tracking-[0.22em] text-ink/55">{label}</p>
        <div className="mt-3">{children}</div>
      </div>
    </FadeUp>
  );
}

function ListRow({ items }) {
  return (
    <ul className="space-y-2">
      {items.map((n) => (
        <li key={n} className="flex items-baseline gap-3 font-light text-ink/88">
          <span className="h-1 w-1 shrink-0 rotate-45 bg-gold" />
          {n}
        </li>
      ))}
    </ul>
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
    <Page className="limewash">
      <article data-testid="product-detail">
        <div className="mx-auto max-w-[1500px] px-6 pt-28 md:px-10 md:pt-36 lg:px-16">
          <FadeUp y={12}>
            <Breadcrumb
              items={[
                { to: "/", label: "Home" },
                { to: "/products", label: "Products" },
                { label: p.name },
              ]}
            />
          </FadeUp>

          <div className="mt-10 grid gap-10 pb-20 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-5 lg:sticky lg:top-32 lg:self-start">
              <motion.div
                initial={{ opacity: 0, scale: 1.04 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.1, ease: EASE, delay: 0.1 }}
                className="overflow-hidden rounded-sm bg-creamdeep aspect-[4/3]"
              >
                <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
              </motion.div>
              <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-ink/55">
                {p.name} {p.packSize ? `· ${p.packSize.replace(" individual pack", "")}` : ""}
              </p>
            </div>

            <div className="lg:col-span-7">
              <FadeUp>
                <p className="text-[11px] uppercase tracking-[0.24em] text-gold">
                  {categoryLabel(p.category)}
                </p>
                <h1 className="mt-4 font-display text-3xl font-light leading-[1.04] tracking-tight text-ink md:text-5xl">
                  {p.name}
                </h1>
                <p className="mt-2 font-accent text-xl italic text-olive md:text-2xl">{p.subname}</p>
                <p className="mt-5 max-w-xl font-accent text-xl italic leading-snug text-olive md:text-2xl">
                  {p.tagline}
                </p>
                <p className="mt-5 max-w-xl text-base font-light leading-relaxed text-ink/80">
                  {p.description}
                </p>
                {p.lifestyle && p.lifestyle.length > 0 && (
                  <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-ink/55">
                    {p.lifestyle.map(lifestyleLabel).join(" · ")}
                  </p>
                )}
              </FadeUp>

              <div className="mt-8">
                <DetailRow label="Ingredients" testid="product-ingredients">
                  <p className="font-light leading-relaxed text-ink/88">
                    {p.ingredients.join(" · ")}
                  </p>
                </DetailRow>
                <DetailRow label="How to prepare" testid="product-prep">
                  <p className="font-light leading-relaxed text-ink/88">{p.prep}</p>
                </DetailRow>
                <DetailRow label="Flavour & tasting notes" testid="product-notes">
                  <div className="flex flex-wrap gap-2.5">
                    {p.notes.map((n) => (
                      <span
                        key={n}
                        className="border border-ink/15 px-3.5 py-1.5 text-[12px] tracking-[0.08em] text-ink/88"
                      >
                        {n}
                      </span>
                    ))}
                  </div>
                </DetailRow>
                <DetailRow label="Nutritional value" testid="product-nutrition">
                  <ListRow items={p.nutrition} />
                </DetailRow>
                <DetailRow label="Functional benefits" testid="product-benefits">
                  <ListRow items={p.benefits} />
                </DetailRow>
                <DetailRow label="Pack size" testid="product-packsize">
                  <p className="font-light text-ink/88">{p.packSize || "—"}</p>
                </DetailRow>
                <DetailRow label="Price" testid="product-price">
                  <p className="font-light text-ink/88">{p.price || "—"}</p>
                </DetailRow>
                <DetailRow label="Provenance" testid="product-provenance">
                  <p className="font-light leading-relaxed text-ink/70">
                    {p.provenance || "Provenance details are being documented — coming soon."}
                  </p>
                </DetailRow>
                <DetailRow label="Reviews" testid="product-reviews">
                  <p className="text-sm font-light text-ink/55">Reviews are on the way.</p>
                </DetailRow>
              </div>

              <FadeUp>
                <div className="mt-10 flex flex-wrap items-center gap-4 md:gap-6">
                  <button
                    data-testid="product-buy-button"
                    onClick={() =>
                      toast("Ordering will be available shortly.", {
                        description: `${p.name} — we'll let you know the moment it opens.`,
                      })
                    }
                    className="btn-primary"
                  >
                    Order — Coming Soon
                  </button>
                  <Link
                    to={`/contact?type=product-orders&item=${encodeURIComponent(p.name)}`}
                    data-testid="product-enquire-link"
                    className="btn-ghost"
                  >
                    Enquire About This Product
                  </Link>
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
              className="group flex items-center gap-4 border-b border-linewarm px-6 py-8 md:border-b-0 md:border-r md:px-10 lg:px-16"
            >
              <ArrowLeft
                size={18}
                strokeWidth={1.25}
                className="text-olive transition-transform duration-500 group-hover:-translate-x-1.5"
              />
              <span>
                <span className="block text-[10px] uppercase tracking-[0.22em] text-ink/55">
                  Previous
                </span>
                <span className="mt-1 block font-display text-xl font-light text-ink">
                  {prev.name}
                </span>
              </span>
            </Link>
            <Link
              to={`/products/${next.slug}`}
              data-testid="product-next"
              className="group flex items-center justify-end gap-4 px-6 py-8 text-right md:px-10 lg:px-16"
            >
              <span>
                <span className="block text-[10px] uppercase tracking-[0.22em] text-ink/55">
                  Next
                </span>
                <span className="mt-1 block font-display text-xl font-light text-ink">
                  {next.name}
                </span>
              </span>
              <ArrowRight
                size={18}
                strokeWidth={1.25}
                className="text-olive transition-transform duration-500 group-hover:translate-x-1.5"
              />
            </Link>
          </div>
        </nav>
      </article>
    </Page>
  );
}
