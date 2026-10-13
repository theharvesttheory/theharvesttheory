import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowUpRight, Clock } from "lucide-react";
import { FadeUp, Page, Breadcrumb } from "@/components/Reveal";
import Seo from "@/components/Seo";
import JournalCard from "@/components/JournalCard";
import {
  articleBySlug,
  journalCategoryLabel,
  relatedArticles,
  formatDate,
  readingMinutes,
} from "@/data/journal";
import { productBySlug } from "@/data/products";

// Renders *italic accent* and [label](/internal-link) inside article copy.
function RichText({ text }) {
  const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
  return parts.map((part, i) => {
    const m = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
    if (m) {
      return (
        <Link
          key={i}
          to={m[2]}
          className="text-olive underline decoration-gold/60 underline-offset-4 transition-colors duration-300 hover:decoration-olive"
        >
          {m[1]}
        </Link>
      );
    }
    const sub = part.split(/\*([^*]+)\*/g);
    return sub.map((s, j) =>
      j % 2 ? (
        <span key={`${i}-${j}`} className="font-accent italic text-ink">
          {s}
        </span>
      ) : (
        s
      ),
    );
  });
}

function Block({ block }) {
  switch (block.type) {
    case "lead":
      return (
        <p className="font-accent text-xl italic leading-snug text-olive md:text-2xl">
          {block.text}
        </p>
      );
    case "p":
      return (
        <p className="text-base font-light leading-[1.85] text-ink/85 md:text-lg">
          <RichText text={block.text} />
        </p>
      );
    case "h2":
      return (
        <h2 className="pt-4 font-display text-2xl font-light tracking-tight text-ink md:text-[1.75rem]">
          <RichText text={block.text} />
        </h2>
      );
    case "quote":
      return (
        <blockquote className="border-y border-linewarm py-10 text-center">
          <p className="mx-auto max-w-xl font-accent text-2xl italic leading-snug text-olive md:text-[1.7rem]">
            &ldquo;{block.text}&rdquo;
          </p>
        </blockquote>
      );
    case "image":
      return (
        <figure>
          <div className="overflow-hidden rounded-sm bg-creamdeep aspect-[3/2]">
            <img src={block.src} alt={block.alt} loading="lazy" className="h-full w-full object-cover" />
          </div>
          {block.caption && (
            <figcaption className="mt-3 text-[11px] uppercase tracking-[0.2em] text-ink/55">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );
    case "fact":
      return (
        <aside className="border border-linewarm bg-creamdeep/70 px-7 py-6">
          <p className="text-[10px] uppercase tracking-[0.24em] text-gold">{block.label}</p>
          <p className="mt-2.5 text-sm font-light leading-relaxed text-ink/85">{block.text}</p>
        </aside>
      );
    case "list":
      return (
        <ul className="space-y-2.5">
          {block.items.map((n) => (
            <li key={n} className="flex items-baseline gap-3 text-base font-light text-ink/85 md:text-lg">
              <span className="h-1 w-1 shrink-0 rotate-45 bg-gold" />
              {n}
            </li>
          ))}
        </ul>
      );
    default:
      return null;
  }
}

function TasteModule({ article }) {
  const items = (article.products || []).map(productBySlug).filter(Boolean);
  if (items.length === 0) return null;
  return (
    <FadeUp>
      <section data-testid="journal-taste-module" className="border-y border-linewarm bg-creamdeep/60 px-7 py-12 md:px-10">
        <p className="text-[10px] uppercase tracking-[0.24em] text-gold">Taste what you&rsquo;ve been reading about</p>
        <div className={`mt-8 grid gap-8 ${items.length > 1 ? "md:grid-cols-2" : ""}`}>
          {items.map((p) => (
            <Link
              key={p.slug}
              to={`/products/${p.slug}`}
              data-testid={`journal-taste-${p.slug}`}
              className="group flex items-center gap-6"
            >
              <div className="shrink-0 overflow-hidden rounded-sm bg-creamdeep aspect-square w-24 md:w-28">
                <img
                  src={p.image}
                  alt={p.name}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.05]"
                />
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-[0.22em] text-gold">{p.subname}</p>
                <h3 className="mt-1 font-display text-xl font-light tracking-tight text-ink transition-colors duration-300 group-hover:text-olive">
                  {p.name}
                </h3>
                <p className="mt-1 text-sm font-light leading-relaxed text-ink/70">{p.tagline}</p>
                <span className="mt-2.5 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.18em] text-olive">
                  View this tea
                  <ArrowUpRight size={14} strokeWidth={1.25} className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </FadeUp>
  );
}

export default function JournalArticle() {
  const { slug } = useParams();
  const a = articleBySlug(slug);
  if (!a) return <Navigate to="/journal" replace />;
  const related = relatedArticles(slug, 2);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: a.title,
    description: a.excerpt,
    articleSection: journalCategoryLabel(a.category),
    datePublished: a.date,
    author: { "@type": "Organization", name: "The Harvest Theory" },
    publisher: { "@type": "Organization", name: "The Harvest Theory" },
  };

  return (
    <Page className="limewash">
      <Seo
        title={a.title}
        description={a.seoDescription || a.excerpt}
        type="article"
        publishedTime={a.date}
        section={journalCategoryLabel(a.category)}
        jsonLd={jsonLd}
      />

      <article data-testid="journal-article" className="pb-20 md:pb-28">
        <header className="mx-auto max-w-[1100px] px-6 pt-32 md:px-10 md:pt-40 lg:px-16">
          <FadeUp y={12}>
            <Breadcrumb
              items={[
                { to: "/", label: "Home" },
                { to: "/journal", label: "Journal" },
                { label: a.title },
              ]}
            />
          </FadeUp>
          <FadeUp>
            <p className="eyebrow mt-8">{journalCategoryLabel(a.category)}</p>
            <h1 className="mt-5 max-w-4xl font-display text-3xl font-light leading-[1.08] tracking-[-0.01em] text-ink md:text-5xl">
              {a.title}
            </h1>
          </FadeUp>
          <FadeUp delay={0.15}>
            <div className="mt-7 flex flex-wrap items-center gap-4 text-[11px] uppercase tracking-[0.18em] text-ink/55">
              <span>{formatDate(a.date)}</span>
              <span className="h-3 w-px bg-ink/20" />
              <span className="inline-flex items-center gap-2">
                <Clock size={13} strokeWidth={1.25} />
                {readingMinutes(a)} min read
              </span>
              <span className="h-3 w-px bg-ink/20" />
              <span>By The Harvest Theory</span>
            </div>
          </FadeUp>
        </header>

        <FadeUp delay={0.1} className="mx-auto max-w-[1500px] px-6 pt-12 md:px-10 lg:px-16">
          <div className="overflow-hidden rounded-sm bg-creamdeep aspect-[3/2] md:aspect-[21/9]">
            <img src={a.image} alt={a.imageAlt} className="h-full w-full object-cover" />
          </div>
        </FadeUp>

        <div className="mx-auto mt-14 max-w-[760px] px-6 md:px-10 lg:px-0">
          <div data-testid="journal-body" className="space-y-8">
            {a.body.map((b, i) => (
              <FadeUp key={i} y={20}>
                <Block block={b} />
              </FadeUp>
            ))}
          </div>

          {a.sources && a.sources.length > 0 && (
            <FadeUp>
              <section data-testid="journal-sources" className="mt-16 border-t border-linewarm pt-8">
                <p className="text-[10px] uppercase tracking-[0.24em] text-ink/55">
                  Sources &amp; further reading
                </p>
                <ul className="mt-4 space-y-2.5">
                  {a.sources.map((s) => (
                    <li key={s.url} className="flex items-baseline gap-3 text-sm font-light">
                      <span className="h-1 w-1 shrink-0 rotate-45 bg-gold" />
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        data-testid={`journal-source-${a.slug}-${s.url.split("/")[2]}`}
                        className="text-ink/80 underline decoration-gold/50 underline-offset-4 transition-colors duration-300 hover:text-olive hover:decoration-olive"
                      >
                        {s.label}
                      </a>
                    </li>
                  ))}
                </ul>
                <p className="mt-5 text-xs font-light leading-relaxed text-ink/55">
                  We write about ingredients the way we source them — carefully. Where a claim touches
                  health, we report what tradition says and what research has examined, and we leave
                  the rest to your tea. Nothing here is medical advice.
                </p>
              </section>
            </FadeUp>
          )}

          <TasteModule article={a} />
        </div>

        {related.length > 0 && (
          <section data-testid="journal-related" className="mx-auto mt-24 max-w-[1500px] px-6 md:px-10 lg:px-16">
            <div className="border-t border-linewarm pt-16">
              <FadeUp>
                <p className="eyebrow">More from the Journal</p>
              </FadeUp>
              <div className="mt-12 grid gap-x-8 gap-y-14 md:grid-cols-2 lg:gap-x-12">
                {related.map((r, i) => (
                  <FadeUp key={r.slug} delay={i * 0.06}>
                    <JournalCard article={r} index={i} />
                  </FadeUp>
                ))}
              </div>
            </div>
          </section>
        )}
      </article>
    </Page>
  );
}
