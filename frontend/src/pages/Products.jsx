import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FadeUp, MaskedLines, Page, EASE, Breadcrumb } from "@/components/Reveal";
import ProductCard from "@/components/ProductCard";
import { products, categories } from "@/data/products";
import { lifestyles } from "@/data/lifestyles";

export default function Products() {
  const [params, setParams] = useSearchParams();
  const mode = params.get("mode") === "lifestyle" ? "lifestyle" : "category";
  const activeCat = params.get("cat") || "all";
  const activeLife = params.get("life") || "all";

  const update = (key, val) => {
    const next = new URLSearchParams(params);
    if (val === "all") next.delete(key);
    else next.set(key, val);
    setParams(next);
  };

  const setMode = (m) => {
    const next = new URLSearchParams();
    if (m === "lifestyle") next.set("mode", "lifestyle");
    setParams(next);
  };

  const list =
    mode === "category"
      ? activeCat === "all"
        ? products
        : products.filter((p) => p.category === activeCat)
      : activeLife === "all"
        ? products
        : products.filter((p) => (p.lifestyle || []).includes(activeLife));

  const filters =
    mode === "category"
      ? categories
      : [{ id: "all", label: "All" }, ...lifestyles.map((l) => ({ id: l.id, label: l.name }))];
  const active = mode === "category" ? activeCat : activeLife;
  const prefix = mode === "category" ? "filter-cat" : "filter-life";

  return (
    <Page>
      <header className="mx-auto max-w-[1500px] px-6 pt-32 pb-16 md:px-10 md:pt-40 lg:px-16">
        <FadeUp y={12}>
          <Breadcrumb items={[{ to: "/", label: "Home" }, { label: "Products" }]} />
        </FadeUp>
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
          <p className="mt-8 max-w-lg text-base font-light leading-relaxed text-ink/65 md:text-lg">
            Beverages, foods and pantry staples across categories — united by
            short labels, named sources and slow methods. The collection grows;
            the standard doesn&rsquo;t.
          </p>
        </FadeUp>
      </header>

      <div
        data-testid="products-filter-bar"
        className="sticky top-[81px] md:top-[90px] z-30 border-y border-linewarm bg-cream/85 backdrop-blur-xl"
      >
        <div className="mx-auto flex max-w-[1500px] items-center gap-2 overflow-x-auto px-6 py-4 md:px-10 lg:gap-3 lg:px-16 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="shrink-0 whitespace-nowrap text-[11px] uppercase tracking-[0.2em] text-ink/40">
            Browse by
          </span>
          <button
            data-testid="products-mode-category"
            onClick={() => setMode("category")}
            className={`shrink-0 border px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition-colors duration-300 ${
              mode === "category"
                ? "border-olive bg-olive text-cream"
                : "border-ink/20 text-ink/55 hover:border-olive hover:text-olive"
            }`}
          >
            Category
          </button>
          <button
            data-testid="products-mode-lifestyle"
            onClick={() => setMode("lifestyle")}
            className={`shrink-0 border px-4 py-2 text-[11px] uppercase tracking-[0.18em] transition-colors duration-300 ${
              mode === "lifestyle"
                ? "border-olive bg-olive text-cream"
                : "border-ink/20 text-ink/55 hover:border-olive hover:text-olive"
            }`}
          >
            Lifestyle
          </button>
          <span className="mx-3 h-5 w-px shrink-0 bg-ink/15" />
          {filters.map((c) => {
            const isActive = active === c.id;
            return (
              <button
                key={c.id}
                data-testid={`${prefix}-${c.id}`}
                onClick={() => update(mode === "category" ? "cat" : "life", c.id)}
                className={`shrink-0 whitespace-nowrap px-4 py-2 text-[12px] uppercase tracking-[0.16em] transition-colors duration-300 ${
                  isActive ? "bg-olive text-cream" : "text-ink/55 hover:text-olive"
                }`}
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
