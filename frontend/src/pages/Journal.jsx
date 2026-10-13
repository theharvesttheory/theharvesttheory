import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { FadeUp, MaskedLines, Page, Breadcrumb } from "@/components/Reveal";
import Seo from "@/components/Seo";
import JournalCard from "@/components/JournalCard";
import {
  articles,
  journalCategories,
  journalCategoryLabel,
  featuredArticle,
  formatDate,
  readingMinutes,
} from "@/data/journal";

export default function Journal() {
  const [params, setParams] = useSearchParams();
  const activeCat = params.get("cat") || "all";
  const setCat = (id) => {
    const next = new URLSearchParams();
    if (id !== "all") next.set("cat", id);
    setParams(next);
  };

  const featured = featuredArticle();
  const filtered =
    activeCat === "all" ? articles : articles.filter((a) => a.category === activeCat);
  const showFeatured = activeCat === "all" && !!featured;
  const gridArticles = showFeatured ? filtered.filter((a) => a.slug !== featured.slug) : filtered;

  const landingJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "The Harvest Journal",
    description:
      "Stories from The Harvest Theory about tea, ingredients, origins, brewing and everyday rituals.",
    publisher: { "@type": "Organization", name: "The Harvest Theory" },
    blogPost: articles.map((a) => ({
      "@type": "BlogPosting",
      headline: a.title,
      description: a.excerpt,
      articleSection: journalCategoryLabel(a.category),
      datePublished: a.date,
      author: { "@type": "Organization", name: "The Harvest Theory" },
    })),
  };

  return (
    <Page className="limewash">
      <Seo
        title="The Harvest Journal — Tea, Ingredients & Ritual"
        description="Stories about what we grow, what we drink, and why it matters — tea, ingredients, provenance and everyday rituals from The Harvest Theory."
        jsonLd={landingJsonLd}
      />

      <header className="relative overflow-hidden mx-auto max-w-[1500px] px-6 pt-32 pb-16 md:px-10 md:pt-40 lg:px-16">
        <img
          src="/images/editorial/story-table.jpg"
          alt=""
          aria-hidden
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-[0.2] saturate-[0.7]"
        />
        <div aria-hidden className="absolute inset-0 bg-gradient-to-b from-cream/40 via-transparent to-cream" />
        <div className="relative">
          <FadeUp y={12}>
            <Breadcrumb items={[{ to: "/", label: "Home" }, { label: "Journal" }]} />
          </FadeUp>
          <FadeUp>
            <p className="eyebrow">The Harvest Journal</p>
          </FadeUp>
          <MaskedLines
            as="h1"
            delay={0.15}
            lines={["Stories about what we grow,", { text: "what we drink, and why it matters.", className: "font-accent italic" }]}
            className="mt-6 max-w-4xl font-display text-[clamp(2rem,3.4vw,3.5rem)] font-light leading-[1.1] tracking-[-0.01em] text-ink"
          />
          <FadeUp delay={0.4}>
            <p className="mt-6 max-w-lg font-accent text-2xl italic leading-snug text-olive md:text-3xl">
              The right ingredients. Grown the right way. Harvested at the right time.
            </p>
          </FadeUp>
        </div>
      </header>

      <div data-testid="journal-filter-bar" className="border-y border-linewarm bg-cream/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-[1500px] items-center gap-2 overflow-x-auto px-6 py-4 md:px-10 lg:gap-3 lg:px-16 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <span className="shrink-0 whitespace-nowrap text-[11px] uppercase tracking-[0.2em] text-ink/55">
            Browse by
          </span>
          {journalCategories.map((c) => {
            const isActive = activeCat === c.id;
            return (
              <button
                key={c.id}
                data-testid={`journal-filter-${c.id}`}
                onClick={() => setCat(c.id)}
                className={`shrink-0 whitespace-nowrap px-4 py-2 text-[12px] uppercase tracking-[0.16em] transition-colors duration-300 ${
                  isActive ? "bg-olive text-cream" : "text-ink/70 hover:text-olive"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      <section data-testid="journal-landing" className="py-20 md:py-28">
        <div className="mx-auto max-w-[1500px] px-6 md:px-10 lg:px-16">
          {showFeatured && (
            <FadeUp>
              <Link
                to={`/journal/${featured.slug}`}
                data-testid="journal-featured"
                className="group grid items-center gap-10 pb-20 md:grid-cols-12 md:pb-28 lg:gap-14"
              >
                <div className="relative overflow-hidden rounded-sm bg-creamdeep aspect-[4/3] md:col-span-7">
                  <img
                    src={featured.image}
                    alt={featured.imageAlt}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                  />
                </div>
                <div className="md:col-span-5">
                  <p className="text-[10px] uppercase tracking-[0.24em] text-gold">
                    {journalCategoryLabel(featured.category)} · Featured story
                  </p>
                  <h2 className="mt-4 font-display text-3xl font-light leading-[1.08] tracking-tight text-ink transition-colors duration-300 group-hover:text-olive md:text-4xl lg:text-[2.75rem]">
                    {featured.title}
                  </h2>
                  <p className="mt-5 text-base font-light leading-relaxed text-ink/75">
                    {featured.excerpt}
                  </p>
                  <div className="mt-5 flex items-center gap-4 text-[11px] uppercase tracking-[0.18em] text-ink/55">
                    <span>{formatDate(featured.date)}</span>
                    <span className="h-3 w-px bg-ink/20" />
                    <span>{readingMinutes(featured)} min read</span>
                  </div>
                  <span className="mt-6 inline-flex items-center gap-3 text-[13px] uppercase tracking-[0.18em] text-olive">
                    Read story
                    <ArrowUpRight
                      size={17}
                      strokeWidth={1.25}
                      className="transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1"
                    />
                  </span>
                </div>
              </Link>
            </FadeUp>
          )}

          <div
            data-testid="journal-grid"
            className="grid gap-x-8 gap-y-14 md:grid-cols-2 lg:gap-x-12"
          >
            {gridArticles.map((a, i) => (
              <FadeUp key={a.slug} delay={(i % 2) * 0.06}>
                <JournalCard article={a} index={i} />
              </FadeUp>
            ))}
          </div>
          {gridArticles.length === 0 && (
            <p className="py-24 text-center font-display text-2xl text-ink/65">
              Stories arriving soon in this category.
            </p>
          )}
        </div>
      </section>
    </Page>
  );
}
