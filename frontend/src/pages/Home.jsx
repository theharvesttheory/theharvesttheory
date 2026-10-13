import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { ArrowRight, ArrowUpRight } from "lucide-react";
import { FadeUp, MaskedLines, Page, EASE } from "@/components/Reveal";
import RotatingWord from "@/components/RotatingWord";
import Marquee from "@/components/Marquee";
import ProductCard from "@/components/ProductCard";
import { products, categories } from "@/data/products";
import { lifestyles } from "@/data/lifestyles";
import { HERO_WORDS, FEATURED_SLUGS } from "@/data/site";
import { useIntro } from "@/context/app";

const APPROACH = [
  {
    n: "01",
    title: "Sourcing",
    line: "Fewer, better ingredients — from growers, gardens and waters we can name.",
  },
  {
    n: "02",
    title: "Formulation",
    line: "Short labels and honest ratios. Nothing that needs a footnote.",
  },
  {
    n: "03",
    title: "Testing",
    line: "Every batch checked for purity, consistency and taste.",
  },
  {
    n: "04",
    title: "Craft",
    line: "Small batches, slow methods, contemporary formats.",
  },
];

function Hero() {
  const intro = useIntro();
  const d = (x) => (intro.done ? x : x + 1.5);
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);

  return (
    <section
      ref={ref}
      data-testid="home-hero"
      className="relative flex min-h-[100svh] items-center overflow-hidden"
    >
      <div className="mx-auto grid w-full max-w-[1500px] items-center gap-14 px-6 pt-32 pb-20 md:px-10 lg:grid-cols-12 lg:gap-10 lg:px-16 lg:pt-28">
        <div className="lg:col-span-7">
          <FadeUp delay={d(0.05)} y={14}>
            <p className="eyebrow">A premium food &amp; wellness house</p>
          </FadeUp>
          <h1 className="mt-8 font-display text-[clamp(3rem,8.5vw,7.75rem)] font-light leading-[0.98] tracking-[-0.02em] text-ink">
            <FadeUp delay={d(0.2)} y={0}>
              <RotatingWord words={HERO_WORDS} />
            </FadeUp>
            <span className="block overflow-hidden pb-[0.09em] -mb-[0.09em]">
              <motion.span
                className="block font-accent italic"
                initial={{ y: "112%" }}
                animate={{ y: "0%" }}
                transition={{ duration: 1.15, ease: EASE, delay: d(0.4) }}
              >
                by design.
              </motion.span>
            </span>
          </h1>
          <FadeUp delay={d(0.6)} y={20}>
            <p className="mt-10 max-w-md text-base md:text-lg font-light leading-relaxed text-ink/65">
              The right ingredients. Grown the right way. Harvested at the right
              time. Brought together with purpose.
            </p>
          </FadeUp>
          <FadeUp delay={d(0.75)} y={20}>
            <div className="mt-12 flex flex-wrap items-center gap-8">
              <Link to="/products" data-testid="hero-cta-products" className="btn-primary">
                Explore Our Products
                <ArrowRight size={16} strokeWidth={1.5} />
              </Link>
              <Link
                to="/story"
                data-testid="hero-link-theory"
                className="group text-[13px] uppercase tracking-[0.18em] text-ink/60 transition-colors duration-300 hover:text-olive"
              >
                Discover Our Theory
                <span className="mt-0.5 block h-px w-full origin-left scale-x-100 bg-ink/25 transition-transform duration-500 group-hover:scale-x-50" />
              </Link>
            </div>
          </FadeUp>
        </div>

        <motion.div style={{ y: imgY }} className="relative lg:col-span-5">
          <motion.div
            initial={{ opacity: 0, scale: 1.08 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.6, ease: [0.16, 1, 0.3, 1], delay: d(0.35) }}
            className="overflow-hidden rounded-sm"
          >
            <motion.img
              src="/images/editorial/hero.jpg"
              alt="The Harvest Theory — still life of products on warm cream plaster"
              style={{ y: imgY }}
              className="h-[440px] w-full object-cover md:h-[540px] xl:h-[600px]"
            />
          </motion.div>
          <FadeUp delay={d(0.95)} className="absolute -bottom-5 left-6">
            <span className="inline-block bg-cream px-4 py-2 text-[10px] uppercase tracking-[0.22em] text-olive border border-linewarm">
              There is a theory behind every harvest
            </span>
          </FadeUp>
        </motion.div>
      </div>

      <div className="absolute bottom-8 left-1/2 hidden -translate-x-1/2 flex-col items-center gap-3 lg:flex">
        <span className="text-[10px] uppercase tracking-[0.3em] text-ink/40">Scroll</span>
        <span className="scroll-hint-line block h-10 w-px bg-ink/30" />
      </div>
    </section>
  );
}

function Philosophy() {
  return (
    <section data-testid="home-philosophy" className="py-28 md:py-40">
      <div className="mx-auto grid max-w-[1500px] gap-14 px-6 md:px-10 lg:grid-cols-12 lg:px-16">
        <div className="lg:col-span-7">
          <FadeUp>
            <p className="eyebrow">Our theory</p>
          </FadeUp>
          <FadeUp delay={0.08}>
            <h2 className="mt-8 font-display text-4xl font-light leading-[1.06] tracking-tight text-ink md:text-5xl lg:text-6xl">
              There is a theory behind{" "}
              <span className="font-accent italic">every harvest.</span>
            </h2>
          </FadeUp>
          <FadeUp delay={0.16}>
            <p className="mt-10 max-w-xl text-base md:text-lg font-light leading-relaxed text-ink/65">
              Long before food reaches our tables, an extraordinary sequence has
              already taken place — cultivation, climate, soil, maturity,
              harvest, handling, preparation and formulation. Timing matters.
            </p>
            <p className="mt-6 max-w-xl text-base md:text-lg font-light leading-relaxed text-ink/65">
              We start with ingredients that are remarkable individually and
              bring them together deliberately — because when thoughtfully
              constructed,{" "}
              <span className="font-accent italic text-ink">
                the whole can be greater than the sum of its parts.
              </span>
            </p>
          </FadeUp>
          <FadeUp delay={0.22}>
            <Link
              to="/story"
              data-testid="philosophy-theory-link"
              className="group mt-12 inline-flex items-center gap-3 text-[13px] uppercase tracking-[0.18em] text-olive"
            >
              Read our theory
              <ArrowRight
                size={16}
                strokeWidth={1.5}
                className="transition-transform duration-500 group-hover:translate-x-1.5"
              />
            </Link>
          </FadeUp>
        </div>
        <div className="lg:col-span-4 lg:col-start-9 lg:pt-24">
          <FadeUp delay={0.2}>
            <img
              src="/images/editorial/philosophy.jpg"
              alt="Botanical ingredients arranged in a line on warm plaster"
              loading="lazy"
              className="aspect-[4/3] w-full rounded-sm object-cover"
            />
            <p className="mt-4 text-[11px] uppercase tracking-[0.2em] text-ink/40">
              The parts, before the theory
            </p>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

function ExploreProducts() {
  const [tab, setTab] = useState("category");
  const catList = categories.filter((c) => c.id !== "all");
  const countForCat = (id) => products.filter((p) => p.category === id).length;
  const countForLife = (id) =>
    products.filter((p) => (p.lifestyle || []).includes(id)).length;

  const tabBtn = (id, label) => (
    <button
      key={id}
      data-testid={`home-explore-tab-${id}`}
      onClick={() => setTab(id)}
      className={`relative pb-2 text-[13px] uppercase tracking-[0.18em] transition-colors duration-300 ${
        tab === id ? "text-olive" : "text-ink/45 hover:text-olive"
      }`}
    >
      {label}
      {tab === id && (
        <motion.span
          layoutId="explore-tab-underline"
          className="absolute bottom-0 left-0 right-0 h-px bg-olive"
        />
      )}
    </button>
  );

  return (
    <section
      data-testid="home-explore"
      className="border-t border-linewarm py-28 md:py-36"
    >
      <div className="mx-auto max-w-[1500px] px-6 md:px-10 lg:px-16">
        <div className="flex flex-wrap items-end justify-between gap-8">
          <FadeUp>
            <p className="eyebrow">Explore products</p>
            <h2 className="mt-6 font-display text-4xl font-light tracking-tight text-ink md:text-5xl">
              Two ways to <span className="font-accent italic">browse</span>
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <div className="flex flex-wrap items-baseline gap-x-8 gap-y-3">
              <span className="text-[13px] uppercase tracking-[0.18em] text-ink/40">Browse by</span>
              {tabBtn("category", "Category")}
              {tabBtn("lifestyle", "Lifestyle")}
            </div>
          </FadeUp>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: EASE }}
            className="mt-14"
          >
            {tab === "category"
              ? catList.map((c, i) => (
                  <FadeUp key={c.id} delay={i * 0.05}>
                    <Link
                      to={`/products?cat=${c.id}`}
                      data-testid={`home-explore-cat-${c.id}`}
                      className="group flex items-baseline justify-between gap-6 border-t border-ink/10 py-8 last:border-b md:py-10"
                    >
                      <span className="flex items-baseline gap-8">
                        <span className="font-accent italic text-xl text-gold">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span>
                          <span className="block font-display text-2xl font-light tracking-tight text-ink transition-colors duration-300 group-hover:text-olive md:text-3xl">
                            {c.label}
                          </span>
                        </span>
                      </span>
                      <span className="flex items-center gap-6">
                        <span className="hidden text-[11px] uppercase tracking-[0.2em] text-ink/40 sm:block">
                          {countForCat(c.id)} products
                        </span>
                        <ArrowUpRight
                          size={20}
                          strokeWidth={1.25}
                          className="text-olive opacity-0 transition-all duration-500 group-hover:opacity-100"
                        />
                      </span>
                    </Link>
                  </FadeUp>
                ))
              : lifestyles.map((l, i) => (
                  <FadeUp key={l.id} delay={i * 0.05}>
                    <Link
                      to={`/products?mode=lifestyle&life=${l.id}`}
                      data-testid={`home-explore-life-${l.id}`}
                      className="group flex items-baseline justify-between gap-6 border-t border-ink/10 py-8 last:border-b md:py-10"
                    >
                      <span className="flex items-baseline gap-8">
                        <span className="font-accent italic text-xl text-gold">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span>
                          <span className="block font-display text-2xl font-light tracking-tight text-ink transition-colors duration-300 group-hover:text-olive md:text-3xl">
                            {l.name}
                          </span>
                          <span className="mt-2 block max-w-lg text-sm font-light leading-relaxed text-ink/55">
                            {l.description}
                          </span>
                        </span>
                      </span>
                      <span className="flex items-center gap-6">
                        <span className="hidden text-[11px] uppercase tracking-[0.2em] text-ink/40 sm:block">
                          {countForLife(l.id)} products
                        </span>
                        <ArrowUpRight
                          size={20}
                          strokeWidth={1.25}
                          className="text-olive opacity-0 transition-all duration-500 group-hover:opacity-100"
                        />
                      </span>
                    </Link>
                  </FadeUp>
                ))}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}

function Featured() {
  const featured = FEATURED_SLUGS.map((s) => products.find((p) => p.slug === s)).filter(Boolean);
  return (
    <section
      data-testid="home-featured"
      className="border-t border-linewarm bg-creamdeep/60 py-28 md:py-36"
    >
      <div className="mx-auto max-w-[1500px] px-6 md:px-10 lg:px-16">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <FadeUp>
            <p className="eyebrow">The collection</p>
            <h2 className="mt-6 font-display text-4xl font-light tracking-tight text-ink md:text-5xl">
              Made to be used <span className="font-accent italic">daily</span>
            </h2>
          </FadeUp>
          <FadeUp delay={0.1}>
            <Link
              to="/products"
              data-testid="home-view-all"
              className="group inline-flex items-center gap-3 text-[13px] uppercase tracking-[0.18em] text-olive"
            >
              View all products
              <ArrowUpRight
                size={18}
                strokeWidth={1.5}
                className="transition-transform duration-500 group-hover:translate-x-1 group-hover:-translate-y-1"
              />
            </Link>
          </FadeUp>
        </div>

        <div className="mt-16 grid gap-14 md:grid-cols-3 md:gap-10 lg:gap-16">
          {featured.map((p, i) => (
            <FadeUp
              key={p.slug}
              delay={i * 0.1}
              className={i === 1 ? "md:mt-20" : i === 2 ? "md:mt-40" : ""}
            >
              <ProductCard product={p} index={i} />
            </FadeUp>
          ))}
        </div>
      </div>
    </section>
  );
}

function Approach() {
  return (
    <section data-testid="home-approach" className="py-28 md:py-36">
      <div className="mx-auto grid max-w-[1500px] gap-16 px-6 md:px-10 lg:grid-cols-12 lg:px-16">
        <div className="lg:col-span-5">
          <div className="lg:sticky lg:top-28">
            <FadeUp>
              <p className="eyebrow">Ingredients &amp; approach</p>
              <h2 className="mt-6 font-display text-4xl font-light leading-[1.06] tracking-tight text-ink md:text-5xl">
                Ingredients, taken <span className="font-accent italic">seriously.</span>
              </h2>
              <p className="mt-8 max-w-sm text-base font-light leading-relaxed text-ink/65">
                Quality you can taste is mostly a chain of small, unglamorous
                decisions — made early, made honestly.
              </p>
            </FadeUp>
            <FadeUp delay={0.12}>
              <img
                src="/images/editorial/ingredients-macro.jpg"
                alt="Macro of botanical ingredients — leaves, petals, spices and seeds"
                loading="lazy"
                className="mt-12 aspect-[3/4] w-full rounded-sm object-cover"
              />
            </FadeUp>
          </div>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <div>
            {APPROACH.map((a, i) => (
              <FadeUp key={a.n} delay={i * 0.07}>
                <div
                  data-testid={`approach-item-${a.n}`}
                  className="flex items-baseline gap-8 border-t border-ink/10 py-10 last:border-b md:py-12"
                >
                  <span className="font-accent italic text-xl text-gold">{a.n}</span>
                  <div>
                    <h3 className="font-display text-2xl font-light tracking-tight text-ink md:text-3xl">
                      {a.title}
                    </h3>
                    <p className="mt-3 max-w-md text-sm md:text-base font-light leading-relaxed text-ink/60">
                      {a.line}
                    </p>
                  </div>
                </div>
              </FadeUp>
            ))}
          </div>
          <FadeUp delay={0.1}>
            <p className="mt-10 text-[11px] uppercase tracking-[0.22em] text-ink/40">
              Our approach page arrives with the next release
            </p>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

function Sourcing() {
  return (
    <section data-testid="home-sourcing" className="border-t border-linewarm py-28 md:py-36">
      <FadeUp y={40}>
        <div className="relative overflow-hidden">
          <img
            src="/images/editorial/sourcing.jpg"
            alt="Hands sorting whole spices and tea leaves over a wooden table"
            loading="lazy"
            className="h-[420px] w-full object-cover md:h-[560px]"
          />
          <div className="absolute inset-0 bg-olivedeep/15" />
        </div>
      </FadeUp>
      <div className="mx-auto mt-16 grid max-w-[1500px] gap-10 px-6 md:px-10 lg:grid-cols-12 lg:px-16">
        <div className="lg:col-span-5">
          <FadeUp>
            <p className="eyebrow !text-wood">Sourcing &amp; craft</p>
            <h2 className="mt-6 font-display text-3xl font-light tracking-tight text-ink md:text-4xl">
              Slow methods, <span className="font-accent italic">modern formats.</span>
            </h2>
          </FadeUp>
        </div>
        <div className="lg:col-span-4 lg:col-start-8">
          <FadeUp delay={0.1}>
            <p className="text-base font-light leading-relaxed text-ink/65 md:text-lg">
              We work close to the source — small growers, gardens and presses
              we can name — and finish everything in contemporary formats that
              respect both the ingredient and your day.
            </p>
          </FadeUp>
        </div>
      </div>
    </section>
  );
}

function StoryTeaser() {
  return (
    <section
      data-testid="home-story-teaser"
      className="border-t border-linewarm bg-creamdeep/60 py-28 md:py-36"
    >
      <div className="mx-auto max-w-[1100px] px-6 md:px-10 lg:px-16">
        <FadeUp>
          <p className="eyebrow">Our story</p>
          <blockquote className="mt-8 font-display text-3xl font-light leading-[1.15] tracking-tight text-ink md:text-5xl">
            &ldquo;It began with a difficult year — and a journey through Japan
            that changed how we thought about{" "}
            <span className="font-accent italic">food itself.</span>&rdquo;
          </blockquote>
          <Link
            to="/story"
            data-testid="home-story-link"
            className="group mt-12 inline-flex items-center gap-3 text-[13px] uppercase tracking-[0.18em] text-olive"
          >
            Our Story / Our Theory
            <ArrowRight
              size={16}
              strokeWidth={1.5}
              className="transition-transform duration-500 group-hover:translate-x-1.5"
            />
          </Link>
        </FadeUp>
      </div>
    </section>
  );
}

function FinalCta() {
  return (
    <section
      data-testid="home-final-cta"
      className="relative overflow-hidden bg-olivedeep py-28 md:py-40"
    >
      <img
        src="/images/brand/mark-cream.png"
        alt=""
        aria-hidden
        className="pointer-events-none absolute -right-8 top-1/2 h-[420px] -translate-y-1/2 opacity-[0.07]"
      />
      <div className="mx-auto max-w-[1500px] px-6 md:px-10 lg:px-16">
        <FadeUp>
          <p className="eyebrow !text-gold">Explore the collection</p>
          <h2 className="mt-8 max-w-3xl font-display text-4xl font-light leading-[1.05] tracking-tight text-cream md:text-6xl">
            Taste what the theory <span className="font-accent italic">makes.</span>
          </h2>
          <Link to="/products" data-testid="final-cta-products" className="btn-cream mt-12">
            Explore Our Products
            <ArrowRight size={16} strokeWidth={1.5} />
          </Link>
        </FadeUp>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <Page>
      <Hero />
      <Marquee />
      <ExploreProducts />
      <Philosophy />
      <Featured />
      <Approach />
      <Sourcing />
      <StoryTeaser />
      <FinalCta />
    </Page>
  );
}
