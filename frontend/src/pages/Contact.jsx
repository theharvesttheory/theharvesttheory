import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FadeUp, MaskedLines, Page } from "@/components/Reveal";

const ENQUIRY_TYPES = [
  { value: "consumer", label: "Consumer enquiry" },
  { value: "retail", label: "Retail & distribution" },
  { value: "export", label: "Export" },
  { value: "collaboration", label: "Collaboration" },
];

const INITIAL = { name: "", email: "", type: "", message: "" };

export default function Contact() {
  const [form, setForm] = useState(INITIAL);
  const [sent, setSent] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  return (
    <Page>
      <div className="mx-auto grid max-w-[1500px] gap-16 px-6 pt-40 pb-28 md:px-10 md:pt-48 lg:grid-cols-12 lg:px-16">
        <div className="lg:col-span-5">
          <FadeUp>
            <p className="eyebrow">Contact</p>
          </FadeUp>
          <MaskedLines
            as="h1"
            delay={0.15}
            lines={["Say", { text: "hello.", className: "font-accent italic" }]}
            className="mt-8 font-display text-[clamp(2.6rem,6vw,5rem)] font-light leading-[1.02] tracking-[-0.02em] text-ink"
          />
          <FadeUp delay={0.4}>
            <p className="mt-8 max-w-md text-base md:text-lg font-light leading-relaxed text-ink/65">
              Consumer questions, retail and distribution, export partnerships,
              collaborations — this reaches all of them.
            </p>
          </FadeUp>

          <FadeUp delay={0.5}>
            <img
              src="/images/editorial/contact.jpg"
              alt="A ceramic cup of golden latte against warm plaster"
              loading="lazy"
              className="mt-14 hidden aspect-[4/5] w-full max-w-sm rounded-sm object-cover lg:block"
            />
          </FadeUp>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <div className="border border-linewarm bg-creamdeep/50 p-8 md:p-14">
            {sent ? (
              <div data-testid="contact-success" className="py-16 text-center">
                <span className="mx-auto block h-10 w-10 rotate-45 border border-gold" />
                <h2 className="mt-8 font-display text-3xl font-light text-ink">
                  Thank you — noted.
                </h2>
                <p className="mx-auto mt-4 max-w-sm text-sm font-light leading-relaxed text-ink/60">
                  We have your message and will be in touch shortly.
                </p>
                <p className="mt-8 text-[10px] uppercase tracking-[0.2em] text-ink/35">
                  Preview build — submissions aren&rsquo;t sent anywhere yet
                </p>
              </div>
            ) : (
              <form data-testid="contact-form" onSubmit={onSubmit} className="space-y-10">
                <div>
                  <label htmlFor="contact-name" className="field-label">Name</label>
                  <input
                    id="contact-name"
                    data-testid="contact-input-name"
                    className="field-input"
                    type="text"
                    required
                    placeholder="Your name"
                    value={form.name}
                    onChange={set("name")}
                  />
                </div>
                <div>
                  <label htmlFor="contact-email" className="field-label">Email</label>
                  <input
                    id="contact-email"
                    data-testid="contact-input-email"
                    className="field-input"
                    type="email"
                    required
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={set("email")}
                  />
                </div>
                <div>
                  <label className="field-label">Enquiry type</label>
                  <Select
                    value={form.type}
                    onValueChange={(v) => setForm((f) => ({ ...f, type: v }))}
                    required
                  >
                    <SelectTrigger
                      data-testid="contact-select-type"
                      className="w-full rounded-none border-0 border-b border-ink/20 bg-transparent py-3 px-0 text-base font-light text-ink focus:ring-0 focus:border-olive data-[placeholder]:text-ink/40"
                    >
                      <SelectValue placeholder="What is this about?" />
                    </SelectTrigger>
                    <SelectContent className="rounded-none border-linewarm bg-cream">
                      {ENQUIRY_TYPES.map((t) => (
                        <SelectItem
                          key={t.value}
                          value={t.value}
                          data-testid={`contact-type-${t.value}`}
                          className="rounded-none font-light"
                        >
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label htmlFor="contact-message" className="field-label">Message</label>
                  <textarea
                    id="contact-message"
                    data-testid="contact-input-message"
                    className="field-input min-h-[120px] resize-none"
                    required
                    placeholder="Tell us a little more"
                    value={form.message}
                    onChange={set("message")}
                  />
                </div>
                <button
                  type="submit"
                  data-testid="contact-submit"
                  className="btn-primary w-full md:w-auto"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}
