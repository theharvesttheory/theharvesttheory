import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { journalCategoryLabel, formatDate, readingMinutes } from "@/data/journal";

export default function JournalCard({ article, index = 0 }) {
  return (
    <Link
      to={`/journal/${article.slug}`}
      data-testid={`journal-card-${article.slug}`}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-sm bg-creamdeep aspect-[4/3]">
        <img
          src={article.image}
          alt={article.imageAlt}
          loading={index < 3 ? "eager" : "lazy"}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]"
        />
      </div>
      <div className="mt-4">
        <p className="text-[10px] uppercase tracking-[0.24em] text-gold">
          {journalCategoryLabel(article.category)}
        </p>
        <h3 className="mt-1.5 font-display font-light text-xl tracking-tight text-ink transition-colors duration-300 group-hover:text-olive md:text-2xl">
          {article.title}
        </h3>
        <p className="mt-1.5 max-w-md text-sm font-light leading-relaxed text-ink/70">
          {article.excerpt}
        </p>
        <div className="mt-3 flex items-center gap-4 text-[11px] uppercase tracking-[0.18em] text-ink/55">
          <span>{formatDate(article.date)}</span>
          <span className="h-3 w-px bg-ink/20" />
          <span>{readingMinutes(article)} min read</span>
        </div>
        <span className="mt-3 inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-olive">
          Read story
          <ArrowUpRight
            size={15}
            strokeWidth={1.25}
            className="transition-transform duration-500 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
          />
        </span>
      </div>
    </Link>
  );
}
