import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { FadeUp, MaskedLines, Page } from "@/components/Reveal";

export default function Story() {
  return (
    <Page>
      <header className="mx-auto max-w-[1500px] px-6 pt-40 pb-16 md:px-10 md:pt-48 lg:px-16">
        <FadeUp>
          <p className="eyebrow">Our story</p>
        </FadeUp>
        <MaskedLines
          as="h1"
          delay={0.15}
          lines={["Built on a", { text: "simple belief.", className: "font-accent italic" }]}
          className="mt-8 font-display text-[clamp(2.6rem,6.5vw,5.5rem)] font-light leading-[1.02] tracking-[-0.02em] text-ink"
        />
        <FadeUp delay={0.4}>
          <p className="mt-10 max-w-xl text-lg md:text-xl font-light leading-relaxed text-ink/70">
            That nourishing ingredients should be easy, desirable and enjoyable
            enough to become part of everyday life.
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

      <section className="mx-auto max-w-[1500px] px-6 py-24 md:px-10 md:py-32 lg:px-16">
        <div className="grid gap-14 lg:grid-cols-12">
          <div className="lg:col-span-5 lg:col-start-2">
            <FadeUp>
              <p className="text-lg md:text-xl font-light leading-relaxed text-ink/75">
                The full story is being written. What we can say for now: we are
                a team of cooks, formulators and designers who believe premium
                should mean considered, not complicated — and that the foods we
                reach for daily deserve the most thought of all.
              </p>
            </FadeUp>
          </div>
          <div className="lg:col-span-4 lg:col-start-8">
            <FadeUp delay={0.12}>
              <p className="text-base font-light leading-relaxed text-ink/60">
                What won&rsquo;t change: short labels, named sources, slow
                methods, and products made to be used — not admired.
              </p>
              <p className="mt-10 text-[11px] uppercase tracking-[0.22em] text-ink/40">
                — This page is a working draft; the full story arrives soon
              </p>
            </FadeUp>
          </div>
        </div>
      </section>

      <section className="border-t border-linewarm bg-creamdeep/60 py-24 md:py-32">
        <div className="mx-auto max-w-[1500px] px-6 md:px-10 lg:px-16">
          <FadeUp>
            <h2 className="font-display text-3xl md:text-5xl font-light tracking-tight text-ink">
              Meanwhile, the pantry is <span className="font-accent italic">open.</span>
            </h2>
            <Link to="/products" data-testid="story-cta-products" className="btn-primary mt-10">
              Explore Our Products
              <ArrowRight size={16} strokeWidth={1.5} />
            </Link>
          </FadeUp>
        </div>
      </section>
    </Page>
  );
}
