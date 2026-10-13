import { FadeUp } from "./Reveal";

/**
 * Scroll interlude — a quiet full-width pause that breaks long pages.
 * word: giant ghost italic word behind; phrase: the one line you read.
 * Interim device: remove usages (or this file) to revert entirely.
 */
export default function Interlude({ word, phrase, caption, testid = "interlude" }) {
  return (
    <FadeUp y={20}>
      <section
        data-testid={testid}
        className="relative overflow-hidden border-t border-linewarm py-24 md:py-36"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 select-none text-center font-accent text-[26vw] italic leading-none text-olive/[0.08] md:text-[17vw]"
        >
          {word}
        </span>
        <div className="relative mx-auto max-w-2xl px-6 text-center">
          <span className="mx-auto block h-1.5 w-1.5 rotate-45 bg-gold/70" />
          <p className="mt-8 font-display text-3xl font-light tracking-tight text-ink md:text-5xl">
            {phrase}
          </p>
          {caption && (
            <p className="mt-6 text-[11px] uppercase tracking-[0.24em] text-ink/55">{caption}</p>
          )}
        </div>
      </section>
    </FadeUp>
  );
}
