import { useState } from "react";
import { FadeUp, MaskedLines, Page } from "@/components/Reveal";
import ProductCard from "@/components/ProductCard";
import { categories, products } from "@/data/products";

export default function Products() {
  const [active, setActive] = useState("all");
  const list =
    active === "all" ? products : products.filter((p) => p.category === active);

  return (
    <Page>
      <header className="mx-auto max-w-[1500px] px-6 pt-40 pb-16 md:px-10 md:pt-48 lg:px-16">
        <FadeUp>
          <p className="eyebrow">Our products</p>
        </FadeUp>
        <MaskedLines
          as="h1"
          delay={0.15}
          lines={["A pantry of", { text: "considered things.", className: "font-accent italic" }]}
          className="mt-8 font-display text-[clamp(2.6rem,6.5vw,5.5rem)] font-light leading-[1.02] tracking-[-0.02em] text-ink"
        />
        <FadeUp delay={0.4}>
          <p className="mt-8 max-w-lg text-base md:text-lg font-light leading-relaxed text-ink/65">
            Beverages, foods and pantry staples across categories — united by
            short labels, named sources and slow methods. The collection grows;
            the standard doesn&rsquo;t.
          </p>
        </FadeUp>
      </header>

      <div
        data-testid="products-filter-bar"
        className="sticky top-[72px] z-30 border-y border-linewarm bg-cream/85 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-[1500px] gap-2 overflow-x-auto px-6 py-4 md:px-10 lg:gap-6 lg:px-16 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {categories.map((c) => {
            const isActive = active === c.id;
            return (
              <button
                key={c.id}
                data-testid={`filter-${c.id}`}
                onClick={() => setActive(c.id)}
                className={`relative shrink-0 whitespace-nowrap px-4 py-2 text-[12px] uppercase tracking-[0.16em] transition-colors duration-300 ${
                  isActive ? "text-cream" : "text-ink/55 hover:text-olive"
                } ${isActive ? "bg-olive" : ""}`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <section data-testid="products-grid" className="py-20 md:py-28">
        <div className="mx-auto max-w-[1500px] px-6 md:px-10 lg:px-16">
          <div className="grid gap-x-10 gap-y-20 md:grid-cols-2 lg:gap-x-16">
            {list.map((p, i) => (
              <FadeUp
                key={p.slug}
                delay={(i % 2) * 0.08}
                className={i % 2 === 1 ? "md:mt-24" : ""}
              >
                <ProductCard product={p} index={i} />
              </FadeUp>
            ))}
          </div>
          {list.length === 0 && (
            <p className="py-24 text-center font-display text-2xl text-ink/50">
              Products arriving soon in this category.
            </p>
          )}
        </div>
      </section>
    </Page>
  );
}
