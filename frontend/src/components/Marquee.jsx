import { FadeUp } from "./Reveal";
import { MARQUEE_ITEMS } from "@/data/site";

function Row({ ariaHidden = false }) {
  return (
    <div aria-hidden={ariaHidden} className="flex shrink-0 items-center">
      {MARQUEE_ITEMS.map((item, i) => (
        <span key={i} className="flex shrink-0 items-center">
          <span
            className={`whitespace-nowrap px-8 md:px-14 text-2xl md:text-4xl font-display font-light tracking-tight ${
              i % 2 === 1 ? "font-accent italic text-ink/60" : "text-ink/80"
            }`}
          >
            {item}
          </span>
          <span className="inline-block h-1.5 w-1.5 rotate-45 bg-gold/70" />
        </span>
      ))}
    </div>
  );
}

export default function Marquee() {
  return (
    <FadeUp y={16}>
      <section
        data-testid="home-marquee"
        className="marquee overflow-hidden border-y border-linewarm py-7 md:py-9"
      >
        <div className="marquee-track flex w-max">
          <Row />
          <Row ariaHidden />
        </div>
      </section>
    </FadeUp>
  );
}
