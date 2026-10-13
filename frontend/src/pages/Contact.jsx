import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FadeUp, MaskedLines, Page, EASE } from "@/components/Reveal";
import { CONTACT_TYPES } from "@/data/contact-options";

function Field({ f, value, onChange }) {
  const id = `contact-field-${f.id}`;
  if (f.type === "textarea") {
    return (
      <div className="md:col-span-2">
        <label htmlFor={id} className="field-label">
          {f.label}
          {f.required && " *"}
        </label>
        <textarea
          id={id}
          data-testid={`contact-field-${f.id}`}
          className="field-input min-h-[110px] resize-none"
          required={f.required}
          value={value}
          onChange={onChange}
        />
      </div>
    );
  }
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {f.label}
        {f.required && " *"}
      </label>
      <input
        id={id}
        data-testid={`contact-field-${f.id}`}
        className="field-input"
        type={f.type}
        required={f.required}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

export default function Contact() {
  const [typeId, setTypeId] = useState(null);
  const [values, setValues] = useState({});
  const [sent, setSent] = useState(false);

  const [params] = useSearchParams();

  useEffect(() => {
    const t = params.get("type");
    const item = params.get("item");
    const schema = CONTACT_TYPES.find((c) => c.id === t);
    if (schema) setTypeId(schema.id);
    if (item && schema) {
      const fid = (schema.fields.find((f) =>
        ["products", "offering", "customisation", "subject", "about", "notes", "message"].includes(f.id),
      ) || {}).id;
      if (fid) setValues((v) => ({ ...v, [fid]: item }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const schema = CONTACT_TYPES.find((t) => t.id === typeId) || null;

  const pick = (id) => {
    setTypeId(id);
    setValues({});
    setSent(false);
  };

  const onSubmit = (e) => {
    e.preventDefault();
    setSent(true);
  };

  const reset = () => {
    setTypeId(null);
    setValues({});
    setSent(false);
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
            <p className="mt-8 max-w-md text-base font-light leading-relaxed text-ink/65 md:text-lg">
              Product orders, general questions, retail and distribution,
              corporate gifting, export, collaborations, press, wholesale and
              sourcing — tell us what you need and the right person will pick
              it up.
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
            {sent && schema ? (
              <div data-testid="contact-success" className="py-12 text-center">
                <span className="mx-auto block h-10 w-10 rotate-45 border border-gold" />
                <h2 className="mt-8 font-display text-3xl font-light text-ink">
                  {schema.successTitle}
                </h2>
                <p className="mx-auto mt-4 max-w-sm text-sm font-light leading-relaxed text-ink/60">
                  {schema.successNote}
                </p>
                <p className="mt-8 text-[10px] uppercase tracking-[0.2em] text-ink/35">
                  Preview build — submissions aren&rsquo;t sent anywhere yet
                </p>
                <button
                  data-testid="contact-send-another"
                  onClick={reset}
                  className="mt-10 text-[12px] uppercase tracking-[0.18em] text-olive underline-offset-4 hover:underline"
                >
                  Send another
                </button>
              </div>
            ) : (
              <div>
                <FadeUp>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-ink/45">
                    What can we help you with?
                  </p>
                </FadeUp>
                <div data-testid="contact-type-grid" className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-3">
                  {CONTACT_TYPES.map((t) => (
                    <button
                      key={t.id}
                      data-testid={`contact-type-${t.id}`}
                      onClick={() => pick(t.id)}
                      className={`border px-4 py-3 text-left text-[12px] leading-snug tracking-[0.06em] transition-colors duration-300 ${
                        typeId === t.id
                          ? "border-olive bg-olive text-cream"
                          : "border-ink/15 text-ink/70 hover:border-olive hover:text-olive"
                      }`}
                    >
                      {t.label}
                    </button>
                  ))}
                </div>

                <AnimatePresence mode="wait">
                  {schema && (
                    <motion.form
                      key={schema.id}
                      data-testid="contact-form"
                      onSubmit={onSubmit}
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.4, ease: EASE }}
                      className="mt-12"
                    >
                      <div className="grid gap-8 md:grid-cols-2">
                        {schema.fields.map((f) => (
                          <Field
                            key={f.id}
                            f={f}
                            value={values[f.id] || ""}
                            onChange={(e) =>
                              setValues((v) => ({ ...v, [f.id]: e.target.value }))
                            }
                          />
                        ))}
                      </div>
                      <button
                        type="submit"
                        data-testid="contact-submit"
                        className="btn-primary mt-12 w-full md:w-auto"
                      >
                        Send Message
                      </button>
                    </motion.form>
                  )}
                </AnimatePresence>

                {!schema && (
                  <p className="mt-10 text-sm font-light text-ink/45">
                    Choose an enquiry type above and the form will adapt.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </Page>
  );
}
