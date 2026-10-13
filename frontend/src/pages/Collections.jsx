import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { FadeUp, MaskedLines, Page } from "@/components/Reveal";
import { collections } from "@/data/collections";

export default function Collections() {
  return (
    <Page>
      <header className="mx-auto max-w-[1500px] px-6 pt-40 pb-16 md:px-10 md:pt-48 lg:px-16">
        <FadeUp>
          <p className="eyebrow">Collections</p>
        </FadeUp>
        <MaskedLines
          as="h1"
          delay={0.15}
          lines={["Curated boxes,", { text: "composed with intent.", className: "font-accent italic" }]}
          className="mt-8 font-display text-[clamp(2.6rem,6.5vw,5.5rem)] font-light leading-[1.02] tracking-[-0.02em] text-ink"
        />
        <FadeUp delay={0.4}>
          <p className="mt-8 max-w-lg text-base font-light leading-relaxed text-ink/65 md:text-lg">
            Seasonal gifting experiences built around our teas. Every tea
            inside is also available individually — the box is simply a
            different way to begin.
          </p>
        </FadeUp>
      </header>

      <section data-testid="collections-grid" className="pb-28 md:pb-36">
        <div className="mx-auto max-w-[1500px] px-6 md:px-10 lg:px-16">
          <div className="grid gap-16 md:grid-cols-2 lg:gap-20">
            {collections.map((c, i) => (
              <FadeUp key={c.slug} delay={i * 0.1}>
                <Link
                  to={`/collections/${c.slug}`}
                  data-testid={`collection-card-${c.slug}`}
                  className="group block"
                >
                  <div className="relative overflow-hidden rounded-sm bg-creamdeep aspect-[4/5]">
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
                      <p className="mt-2 max-w-md text-sm font-light leading-relaxed text-ink/55">
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
            ))}
          </div>
        </div>
      </section>
    </Page>
  );
}
