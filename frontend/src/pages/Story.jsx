import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { FadeUp, MaskedLines, Page } from "@/components/Reveal";
import { FOUNDERS } from "@/data/site";

const MUST_EARN = [
  { title: "Taste", line: "It must be genuinely enjoyable — never something consumed purely because it is considered healthy." },
  { title: "Ingredient quality", line: "We begin with ingredients we are confident enough to stand behind." },
  { title: "Nutritional purpose", line: "Every product should bring something meaningful to the table — nourishment, function or dietary variety." },
  { title: "Everyday relevance", line: "Products should fit into real life. We sit between convenience and ceremony." },
  { title: "Sensory appeal", line: "Aroma, colour, texture, taste, presentation and ritual all matter." },
  { title: "Consistency", line: "A dependable experience, supported by disciplined manufacturing and quality control." },
];

function Eyebrow({ children }) {
  return <p className="eyebrow">{children}</p>;
}

export default function Story() {
  return (
    <Page>
      <header className="mx-auto max-w-[1500px] px-6 pt-40 pb-20 md:px-10 md:pt-48 lg:px-16">
        <FadeUp>
          <Eyebrow>Our story / our theory</Eyebrow>
        </FadeUp>
        <MaskedLines
          as="h1"
          delay={0.15}
          lines={["There is a theory behind", { text: "every harvest.", className: "font-accent italic" }]}
          className="mt-8 font-display text-[clamp(2.4rem,6vw,5.25rem)] font-light leading-[1.04] tracking-[-0.02em] text-ink"
        />
        <FadeUp delay={0.4}>
          <p className="mt-10 max-w-xl text-lg font-light leading-relaxed text-ink/70 md:text-xl">
            The Harvest Theory is a premium food and wellness brand built on a
            simple belief — that the whole can be greater than the sum of its
            parts.
          </p>
        </FadeUp>
      </header>

      <FadeUp y={40}>
        <img
          src="/images/editorial/story-table.jpg"
          alt="A formulator's table — jars, bottles, a brass scale and botanicals"
          loading="lazy"
          className="h-[380px] w-full object-cover md:h-[560px]"
        />
      </FadeUp>

      <section data-testid="story-origin" className="mx-auto max-w-[1500px] px-6 py-24 md:px-10 md:py-32 lg:px-16">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-4 lg:col-start-2">
            <FadeUp>
              <Eyebrow>Where it began</Eyebrow>
              <p className="mt-8 text-lg font-light leading-relaxed text-ink/75 md:text-xl">
                The Harvest Theory was born after a challenging personal year
                for its founders.
              </p>
            </FadeUp>
          </div>
          <div className="lg:col-span-5 lg:col-start-7">
            <FadeUp delay={0.12}>
              <p className="text-base font-light leading-relaxed text-ink/65 md:text-lg">
                We experienced how stress can easily turn eating into something
                hurried, irregular and thoughtless. Food may still fill us,
                while the act of actually nourishing ourselves becomes
                incidental.
              </p>
              <p className="mt-6 text-base font-light leading-relaxed text-ink/65 md:text-lg">
                We kept circling one question: how did the most basic act of
                self-care become the easiest to skip?
              </p>
            </FadeUp>
          </div>
        </div>

        <div className="mt-24 grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5 lg:col-start-2">
            <FadeUp y={30}>
              <img
                src="/images/editorial/ritual-pour.jpg"
                alt="Hot water poured in a thin stream into a glass teapot of blooming tea"
                loading="lazy"
                className="aspect-[4/3] w-full rounded-sm object-cover"
              />
            </FadeUp>
          </div>
          <div className="lg:col-span-4 lg:col-start-8">
            <FadeUp>
              <Eyebrow>A journey through Japan</Eyebrow>
              <p className="mt-8 text-base font-light leading-relaxed text-ink/65 md:text-lg">
                A subsequent journey through Japan became the catalyst. We were
                struck not simply by the quality of the food, but by the
                thought surrounding it — ingredient quality, preparation,
                presentation, balance, ritual, cleanliness, consistency,
                sensory detail.
              </p>
              <p className="mt-6 text-base font-light leading-relaxed text-ink/65 md:text-lg">
                Meals could evoke comfort, anticipation, pleasure and calm.
                That experience helped shape The Harvest Theory.
              </p>
            </FadeUp>
          </div>
        </div>
      </section>

      <section data-testid="story-theory" className="border-t border-linewarm bg-creamdeep/60 py-24 md:py-32">
        <div className="mx-auto max-w-[1500px] px-6 md:px-10 lg:px-16">
          <div className="grid gap-14 lg:grid-cols-12">
            <div className="lg:col-span-4 lg:col-start-2">
              <FadeUp>
                <Eyebrow>The theory</Eyebrow>
                <h2 className="mt-8 font-display text-3xl font-light leading-[1.08] tracking-tight text-ink md:text-4xl">
                  There is a theory behind{" "}
                  <span className="font-accent italic">every harvest.</span>
                </h2>
              </FadeUp>
            </div>
            <div className="lg:col-span-5 lg:col-start-7">
              <FadeUp delay={0.1}>
                <p className="text-base font-light leading-relaxed text-ink/70 md:text-lg">
                  Long before food reaches our tables, an extraordinary chain
                  of events has already taken place — from the conditions that
                  allow a plant to grow, to the soil, climate and cultivation
                  that shape it, to the precise moment at which it should be
                  harvested.
                </p>
                <p className="mt-6 text-base font-light leading-relaxed text-ink/70 md:text-lg">
                  Timing matters. A mango harvested too early may never develop
                  its full sweetness and aroma. An avocado left too long on the
                  tree can move past its ideal maturity and develop
                  undesirable flavours. The ingredient may be the same, but
                  when and how it is grown and harvested changes what finally
                  reaches us.
                </p>
                <p className="mt-10 font-accent text-2xl italic leading-snug text-olive md:text-3xl">
                  That is the idea behind The Harvest Theory.
                </p>
                <p className="mt-8 text-base font-light leading-relaxed text-ink/70 md:text-lg">
                  We believe nutrition should not be taken for granted simply
                  because food is available to us. There is science in choosing
                  the right ingredient, growing it well, harvesting it at the
                  right moment, preserving what makes it valuable, and
                  understanding how it should be combined with other
                  ingredients.
                </p>
                <p className="mt-10 font-accent text-2xl italic leading-snug text-olive md:text-3xl">
                  Our &ldquo;theory&rdquo; is the sum of all those choices.
                </p>
                <p className="mt-8 text-base font-light leading-relaxed text-ink/70 md:text-lg">
                  We start with ingredients that are already remarkable on
                  their own and bring them together deliberately — for
                  nutrition, flavour, texture, aroma and the experience of
                  eating itself. Because the whole, when thoughtfully
                  constructed, can be greater than its parts.
                </p>
                <p className="mt-6 text-base font-light leading-relaxed text-ink/70 md:text-lg">
                  The Harvest Theory is therefore an invitation to slow down
                  and pay attention: to know what you are eating, where it came
                  from, why it was chosen and how it came together.
                </p>
              </FadeUp>
            </div>
          </div>

          <FadeUp delay={0.1}>
            <blockquote className="mt-24 max-w-4xl font-display text-2xl font-light leading-[1.3] tracking-tight text-ink md:text-4xl">
              &ldquo;The right ingredients. Grown the right way. Harvested at
              the right time.{" "}
              <span className="font-accent italic">Brought together with purpose.</span>&rdquo;
            </blockquote>
            <p className="mt-8 font-accent text-2xl italic text-olive md:text-3xl">
              That is the bounty of our theory.
            </p>
          </FadeUp>
        </div>
      </section>

      <section data-testid="story-parts" className="py-24 md:py-32">
        <div className="mx-auto grid max-w-[1500px] gap-14 px-6 md:px-10 lg:grid-cols-12 lg:px-16">
          <div className="lg:col-span-5 lg:col-start-2">
            <FadeUp>
              <Eyebrow>The whole, greater than its parts</Eyebrow>
              <p className="mt-8 text-lg font-light leading-relaxed text-ink/75 md:text-xl">
                We start with ingredients that are already remarkable
                individually and bring them together deliberately — for
                flavour, nutrition, texture, aroma, function and sensory
                experience.
              </p>
              <p className="mt-6 text-base font-light leading-relaxed text-ink/65 md:text-lg">
                Because when thoughtfully constructed, the whole can be greater
                than the sum of its parts.
              </p>
            </FadeUp>
          </div>
          <div className="lg:col-span-4 lg:col-start-8 lg:pt-16">
            <FadeUp y={30} delay={0.1}>
              <img
                src="/images/editorial/ritual-whisk.jpg"
                alt="A hand slowly whisking bright matcha in a ceramic bowl"
                loading="lazy"
                className="aspect-[4/3] w-full rounded-sm object-cover"
              />
            </FadeUp>
          </div>
        </div>
      </section>

      <section data-testid="story-product-philosophy" className="border-t border-linewarm bg-creamdeep/60 py-24 md:py-32">
        <div className="mx-auto max-w-[1500px] px-6 md:px-10 lg:px-16">
          <FadeUp>
            <Eyebrow>What a product must earn</Eyebrow>
            <h2 className="mt-8 max-w-2xl font-display text-3xl font-light leading-[1.08] tracking-tight text-ink md:text-4xl">
              A place in someone&rsquo;s{" "}
              <span className="font-accent italic">everyday life.</span>
            </h2>
          </FadeUp>
          <div className="mt-16 grid gap-x-16 md:grid-cols-2">
            {MUST_EARN.map((m, i) => (
              <FadeUp key={m.title} delay={(i % 2) * 0.06}>
                <div className="border-t border-ink/10 py-8">
                  <h3 className="font-display text-xl font-light tracking-tight text-ink md:text-2xl">
                    {m.title}
                  </h3>
                  <p className="mt-3 max-w-md text-sm font-light leading-relaxed text-ink/60 md:text-base">
                    {m.line}
                  </p>
                </div>
              </FadeUp>
            ))}
          </div>
          <FadeUp delay={0.1}>
            <p className="mt-12 max-w-xl text-base font-light leading-relaxed text-ink/65 md:text-lg">
              Preparation should invite participation — tearing open a package,
              boiling water, warming milk, whisking, steeping, stirring — but
              never become burdensome. We want The Harvest Theory to become
              part of a customer&rsquo;s everyday ritual of self-love: a small
              moment of choosing something nourishing, and taking a little time
              for oneself.
            </p>
          </FadeUp>
        </div>
      </section>

      <section data-testid="story-customer" className="py-24 md:py-32">
        <div className="mx-auto max-w-[1100px] px-6 md:px-10 lg:px-16">
          <FadeUp>
            <Eyebrow>Slow time</Eyebrow>
            <p className="mt-8 text-lg font-light leading-relaxed text-ink/75 md:text-xl">
              Our customer is urban, curious and time-constrained — exploring
              better food and aspiring to healthier habits, if not always
              consistently. Where frustration exists, it is around poor taste,
              inconsistent quality, unclear benefits and wellness that demands
              too much effort.
            </p>
            <p className="mt-6 text-lg font-light leading-relaxed text-ink/75 md:text-xl">
              The experience we want to create feels like slow time. Aroma
              rising from a cup. Colour developing. A little preparation. A
              little anticipation.
            </p>
            <blockquote className="mt-12 font-accent text-3xl italic leading-snug text-olive md:text-4xl">
              &ldquo;I started today by prioritising myself.&rdquo;
            </blockquote>
            <p className="mt-8 text-base font-light leading-relaxed text-ink/60">
              We want to provide the spread for a more mindful dining experience.
            </p>
          </FadeUp>
        </div>
      </section>

      <section data-testid="story-founders" className="border-t border-linewarm bg-creamdeep/60 py-24 md:py-32">
        <div className="mx-auto max-w-[1500px] px-6 md:px-10 lg:px-16">
          <FadeUp>
            <Eyebrow>The founders</Eyebrow>
            <h2 className="mt-8 font-display text-3xl font-light tracking-tight text-ink md:text-4xl">
              The people behind the <span className="font-accent italic">theory.</span>
            </h2>
          </FadeUp>
          <div className="mt-16 grid gap-12 md:grid-cols-3 lg:gap-16">
            {FOUNDERS.map((f, i) => (
              <FadeUp key={f.name} delay={i * 0.08}>
                <div
                  data-testid={`founder-card-${f.initials.toLowerCase()}`}
                  className="relative flex aspect-[3/4] items-center justify-center rounded-sm border border-linewarm bg-cream"
                >
                  <span className="font-accent text-6xl italic text-gold/70">{f.initials}</span>
                  <span className="absolute bottom-5 text-[10px] uppercase tracking-[0.22em] text-ink/35">
                    Portrait to come
                  </span>
                </div>
                <h3 className="mt-6 font-display text-2xl font-light tracking-tight text-ink">
                  {f.name}
                </h3>
                <p className="mt-1 text-[11px] uppercase tracking-[0.2em] text-gold">{f.role}</p>
                <p className="mt-4 text-sm font-light leading-relaxed text-ink/60">{f.bio}</p>
              </FadeUp>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-olivedeep py-24 md:py-32">
        <div className="mx-auto max-w-[1500px] px-6 md:px-10 lg:px-16">
          <FadeUp>
            <h2 className="max-w-3xl font-display text-4xl font-light leading-[1.05] tracking-tight text-cream md:text-6xl">
              See what the theory <span className="font-accent italic">makes.</span>
            </h2>
            <Link to="/products" data-testid="story-cta-products" className="btn-cream mt-12">
              Explore Our Products
              <ArrowRight size={16} strokeWidth={1.5} />
            </Link>
          </FadeUp>
        </div>
      </section>
    </Page>
  );
}
