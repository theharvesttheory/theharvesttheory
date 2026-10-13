import { Link } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { FadeUp, MaskedLines, Page } from "@/components/Reveal";

const PILLARS = [
  {
    n: "01",
    title: "Selection & sourcing",
    lead: "It begins with the ingredient.",
    body: [
      "We begin with ingredients we are confident enough to stand behind — grown well, harvested at the right moment, and chosen for what they individually bring to flavour, nourishment and wellbeing.",
      "We work close to the source: small growers, gardens and presses we can name — visited and tasted, not just quoted.",
    ],
    image: "/images/editorial/sourcing.jpg",
    alt: "Hands sorting whole spices and tea leaves over a wooden table",
  },
  {
    n: "02",
    title: "Formulation",
    lead: "The whole, greater than its parts.",
    body: [
      "We start with ingredients that are already remarkable on their own and bring them together deliberately — for nutrition, flavour, texture, aroma and the experience of eating itself.",
      "Short labels and honest ratios. Nothing that needs a footnote.",
    ],
    image: "/images/editorial/philosophy.jpg",
    alt: "Botanical ingredients arranged in a line on warm plaster",
  },
  {
    n: "03",
    title: "Testing & manufacturing",
    lead: "Made to a standard, not to a mood.",
    body: [
      "Every batch is checked for purity, consistency and taste. Disciplined manufacturing and quality control make sure the cup you loved last month tastes the same today — a dependable experience, batch after batch.",
    ],
    image: "/images/editorial/story-table.jpg",
    alt: "A formulator's table — jars, bottles, a brass scale and botanicals",
  },
  {
    n: "04",
    title: "Ritual & format",
    lead: "Between convenience and ceremony.",
    body: [
      "Preparation should invite participation — tearing open a package, boiling water, warming milk, whisking, steeping, stirring — but never become burdensome.",
      "We design contemporary formats that ask just enough of you, and reward the small effort with aroma, colour and flavour.",
    ],
    image: "/images/editorial/ritual-whisk.jpg",
    alt: "A hand slowly whisking bright matcha in a ceramic bowl",
  },
];

const TRUST = [
  { label: "FSSAI details", value: "License no. to be displayed" },
  { label: "Certifications", value: "Details coming soon" },
];

export default function Approach() {
  return (
    <Page>
      <header className="mx-auto max-w-[1500px] px-6 pt-32 pb-16 md:px-10 md:pt-40 lg:px-16">
        <FadeUp y={12}>
          <Link
            to="/"
            data-testid="approach-back-home"
            className="group inline-flex items-center gap-3 text-[12px] uppercase tracking-[0.18em] text-ink/55 transition-colors duration-300 hover:text-olive"
          >
            <ArrowLeft
              size={15}
              strokeWidth={1.5}
              className="transition-transform duration-500 group-hover:-translate-x-1"
            />
            Home
          </Link>
        </FadeUp>
        <FadeUp>
          <p className="eyebrow">Ingredients / our approach</p>
        </FadeUp>
        <MaskedLines
          as="h1"
          delay={0.15}
          lines={["Ingredients, taken", { text: "seriously.", className: "font-accent italic" }]}
          className="mt-8 font-display text-[clamp(2.6rem,6.5vw,5.5rem)] font-light leading-[1.02] tracking-[-0.02em] text-ink"
        />
        <FadeUp delay={0.4}>
          <p className="mt-8 max-w-lg text-base font-light leading-relaxed text-ink/65 md:text-lg">
            Quality you can taste is mostly a chain of small, unglamorous
            decisions — made early, made honestly. This is how we make them.
          </p>
        </FadeUp>
      </header>

      <FadeUp y={40}>
        <img
          src="/images/editorial/ritual-pour.jpg"
          alt="Hot water poured in a thin stream into a glass teapot of blooming tea"
          loading="lazy"
          className="h-[380px] w-full object-cover md:h-[560px]"
        />
      </FadeUp>

      {PILLARS.map((p) => (
        <section
          key={p.n}
          data-testid={`approach-section-${p.n}`}
          className="border-t border-linewarm py-24 md:py-32"
        >
          <div className="mx-auto grid max-w-[1500px] gap-14 px-6 md:px-10 lg:grid-cols-12 lg:px-16">
            <div className={p.n === "02" || p.n === "04" ? "lg:col-span-5 lg:order-2" : "lg:col-span-5"}>
              <FadeUp>
                <p className="font-accent text-2xl italic text-gold">{p.n}</p>
                <h2 className="mt-4 font-display text-3xl font-light tracking-tight text-ink md:text-4xl">
                  {p.title}
                </h2>
                <p className="mt-6 font-accent text-2xl italic leading-snug text-olive/80 md:text-3xl">
                  {p.lead}
                </p>
                {p.body.map((t, i) => (
                  <p
                    key={i}
                    className="mt-6 max-w-md text-base font-light leading-relaxed text-ink/65 md:text-lg"
                  >
                    {t}
                  </p>
                ))}
              </FadeUp>
            </div>
            <div className={p.n === "02" || p.n === "04" ? "lg:col-span-6 lg:order-1" : "lg:col-span-6 lg:col-start-7"}>
              <FadeUp y={30} delay={0.1}>
                <img
                  src={p.image}
                  alt={p.alt}
                  loading="lazy"
                  className="aspect-[4/3] w-full rounded-sm object-cover"
                />
              </FadeUp>
            </div>
          </div>
        </section>
      ))}

      <section
        data-testid="approach-trust"
        className="border-t border-linewarm bg-creamdeep/60 py-24 md:py-32"
      >
        <div className="mx-auto max-w-[1500px] px-6 md:px-10 lg:px-16">
          <FadeUp>
            <p className="eyebrow">Trust, documented</p>
            <h2 className="mt-6 max-w-2xl font-display text-3xl font-light leading-[1.08] tracking-tight text-ink md:text-4xl">
              Standards you will be able to{" "}
              <span className="font-accent italic">read for yourself.</span>
            </h2>
          </FadeUp>
          <div className="mt-14 grid gap-x-16 md:grid-cols-2">
            {TRUST.map((t) => (
              <FadeUp key={t.label}>
                <div className="border-t border-ink/10 py-8">
                  <h3 className="font-display text-xl font-light tracking-tight text-ink md:text-2xl">
                    {t.label}
                  </h3>
                  <p className="mt-2 text-sm font-light text-ink/50">{t.value}</p>
                </div>
              </FadeUp>
            ))}
          </div>
          <FadeUp delay={0.1}>
            <p className="mt-10 max-w-xl text-sm font-light leading-relaxed text-ink/50">
              Laboratory reports, batch-level traceability, manufacturing
              information and export certifications arrive with the next
              release — the structure is ready for them.
            </p>
          </FadeUp>
        </div>
      </section>

      <section className="relative overflow-hidden bg-olivedeep py-24 md:py-32">
        <div className="mx-auto max-w-[1500px] px-6 md:px-10 lg:px-16">
          <FadeUp>
            <h2 className="max-w-3xl font-display text-4xl font-light leading-[1.05] tracking-tight text-cream md:text-6xl">
              See what the approach <span className="font-accent italic">makes.</span>
            </h2>
            <div className="mt-12 flex flex-wrap gap-4">
              <Link to="/products" data-testid="approach-cta-products" className="btn-cream">
                Explore Our Products
                <ArrowRight size={16} strokeWidth={1.5} />
              </Link>
              <Link to="/story" data-testid="approach-cta-story" className="btn-cream-ghost">
                Our Story / Our Theory
              </Link>
              <Link to="/" data-testid="approach-back-home-bottom" className="btn-cream-ghost">
                Back to Home
              </Link>
            </div>
          </FadeUp>
        </div>
      </section>
    </Page>
  );
}
