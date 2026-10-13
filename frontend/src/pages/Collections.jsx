import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { FadeUp, MaskedLines, Page, Breadcrumb } from "@/components/Reveal";
import { collections, tinConfigs } from "@/data/collections";

export default function Collections() {
  return (
    <Page className="limewash">
      <header className="mx-auto max-w-[1500px] px-6 pt-32 pb-16 md:px-10 md:pt-40 lg:px-16">
        <FadeUp y={12}>
          <Breadcrumb items={[{ to: "/", label: "Home" }, { label: "Gift Assortments" }]} />
        </FadeUp>
        <FadeUp>
          <p className="eyebrow">Gift Assortments</p>
        </FadeUp>
        <MaskedLines
          as="h1"
          delay={0.15}
          lines={["Curated boxes,", { text: "composed with intent.", className: "font-accent italic" }]}
          className="mt-8 font-display text-[clamp(2.6rem,6.5vw,5.5rem)] font-light leading-[1.02] tracking-[-0.02em] text-ink"
        />
        <FadeUp delay={0.4}>
          <p className="mt-8 max-w-lg text-base font-light leading-relaxed text-ink/80 md:text-lg">
            Seasonal gifting experiences built around our teas. Every tea
            inside is also available individually — the box is simply a
            different way to begin.
          </p>
        </FadeUp>
      </header>

      <section data-testid="collections-grid" className="pb-20 md:pb-28">
        <div className="mx-auto max-w-[1500px] px-6 md:px-10 lg:px-16">
          <div className="grid gap-16 md:grid-cols-2 lg:gap-20">
            {collections.map((c, i) => (
              <div key={c.slug}>
                <FadeUp delay={i * 0.1}>
                  <Link
                    to={`/collections/${c.slug}`}
                    data-testid={`collection-card-${c.slug}`}
                    className="group block"
                  >
                    <div className="relative overflow-hidden rounded-sm bg-creamdeep aspect-[3/2]">
                      <img
                        src={c.image}
                        alt={`${c.name} curated box`}
                        loading={i === 0 ? "eager" : "lazy"}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]"
                      />
                      <span className="absolute top-4 left-4 bg-cream/90 px-3 py-1.5 text-[9px] uppercase tracking-[0.22em] text-olive backdrop-blur">
                        Curated box · {c.productSlugs.length} teas
                      </span>
                    </div>
                    <div className="mt-6 flex items-start justify-between gap-6">
                      <div>
                        <h2 className="font-display text-3xl font-light tracking-tight text-ink transition-colors duration-300 group-hover:text-olive md:text-4xl">
                          {c.name}
                        </h2>
                        <p className="mt-2 max-w-md text-sm font-light leading-relaxed text-ink/70">
                          {c.tagline}
                        </p>
                      </div>
                      <ArrowUpRight
                        size={22}
                        strokeWidth={1.25}
                        className="mt-2 shrink-0 text-olive opacity-0 -translate-x-1 translate-y-1 transition-all duration-500 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0"
                      />
                    </div>
                  </Link>
                </FadeUp>
                <FadeUp delay={0.12 + i * 0.1}>
                  <Link
                    to={`/contact?type=product-orders&item=${encodeURIComponent(c.name)}`}
                    data-testid={`collection-enquire-${c.slug}`}
                    className="mt-4 inline-block text-[10px] uppercase tracking-[0.18em] text-olive transition-colors duration-300 hover:text-olive"
                  >
                    Enquire about this assortment
                  </Link>
                </FadeUp>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section data-testid="tin-configs" className="border-t border-linewarm bg-creamdeep/60 py-24 md:py-32">
        <div className="mx-auto max-w-[1500px] px-6 md:px-10 lg:px-16">
          <FadeUp>
            <p className="eyebrow">The tin configurations</p>
            <h2 className="mt-6 font-display text-4xl font-light tracking-tight text-ink md:text-5xl">
              Dressed for <span className="font-accent italic">gifting.</span>
            </h2>
            <p className="mt-6 max-w-lg text-base font-light leading-relaxed text-ink/80">
              Two boxed tins and a single, in three configurations — our teas,
              ready to be given.
            </p>
          </FadeUp>
          <div className="mt-14 grid gap-10 md:grid-cols-3">
            {tinConfigs.map((t, i) => (
              <FadeUp key={t.id} delay={i * 0.08}>
                <Link
                  to={`/contact?type=product-orders&item=${encodeURIComponent(t.label)}`}
                  data-testid={`tin-config-link-${t.id}`}
                  className="group block"
                >
                  <div className="overflow-hidden rounded-sm bg-cream aspect-[3/2]">
                    <img
                      src={t.image}
                      alt={t.label}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                  <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-ink/55 transition-colors duration-300 group-hover:text-olive">
                    {t.label}
                  </p>
                  <p className="mt-1 text-[10px] uppercase tracking-[0.18em] text-olive transition-colors duration-300 group-hover:text-olive">
                    Enquire about this assortment
                  </p>
                </Link>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>
    </Page>
  );
}
