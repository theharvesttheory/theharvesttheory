import { Link, Navigate, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { FadeUp, Page, Breadcrumb } from "@/components/Reveal";
import ProductCard from "@/components/ProductCard";
import { collectionBySlug, collectionProducts } from "@/data/collections";

export default function CollectionDetail() {
  const { slug } = useParams();
  const collection = collectionBySlug(slug);
  if (!collection) return <Navigate to="/collections" replace />;
  const teas = collectionProducts(collection);

  return (
    <Page>
      <article data-testid="collection-detail">
        <div className="mx-auto max-w-[1500px] px-6 pt-32 md:px-10 md:pt-40 lg:px-16">
          <FadeUp y={12}>
            <Breadcrumb
              items={[
                { to: "/", label: "Home" },
                { to: "/collections", label: "Gift Assortments" },
                { label: collection.name },
              ]}
            />
          </FadeUp>

          <div className="mt-12 grid gap-14 pb-24 lg:grid-cols-2 lg:gap-20">
            <div className="lg:sticky lg:top-28 lg:self-start">
              <FadeUp y={30}>
                <img
                  src={collection.image}
                  alt={`${collection.name} curated box`}
                  className="aspect-[4/3] w-full rounded-sm object-cover"
                />
              </FadeUp>
            </div>

            <div>
              <FadeUp>
                <p className="text-[11px] uppercase tracking-[0.24em] text-gold">
                  Curated box · {teas.length} teas
                </p>
                <h1 className="mt-5 font-display text-4xl font-light leading-[1.02] tracking-tight text-ink md:text-6xl">
                  {collection.name}
                </h1>
                <p className="mt-6 max-w-lg font-accent text-2xl italic leading-snug text-olive/80">
                  {collection.tagline}
                </p>
                <p className="mt-8 max-w-lg text-base font-light leading-relaxed text-ink/65 md:text-lg">
                  {collection.description}
                </p>
                <p className="mt-8 border-l-2 border-gold/60 pl-5 text-sm font-light leading-relaxed text-ink/60">
                  {collection.note}
                </p>
              </FadeUp>

              <FadeUp delay={0.1}>
                <div className="mt-14 flex flex-wrap items-center gap-6">
                  <Link to="/products" data-testid="collection-explore-products" className="btn-primary">
                    Explore the full catalogue
                    <ArrowRight size={16} strokeWidth={1.5} />
                  </Link>
                  <Link
                    to={`/contact?type=product-orders&item=${encodeURIComponent(collection.name)}`}
                    data-testid="collection-enquire-link"
                    className="btn-ghost"
                  >
                    Enquire About This Assortment
                  </Link>
                </div>
              </FadeUp>
            </div>
          </div>

          <section data-testid="collection-teas" className="border-t border-linewarm py-20 md:py-24">
            <FadeUp>
              <p className="eyebrow">Inside the box</p>
              <h2 className="mt-6 font-display text-3xl font-light tracking-tight text-ink md:text-4xl">
                The teas, <span className="font-accent italic">individually.</span>
              </h2>
            </FadeUp>
            <div className="mt-14 grid gap-x-10 gap-y-16 md:grid-cols-2 lg:grid-cols-3 lg:gap-x-14">
              {teas.map((p, i) => (
                <FadeUp key={p.slug} delay={(i % 3) * 0.07}>
                  <ProductCard product={p} index={i} />
                </FadeUp>
              ))}
            </div>
          </section>
        </div>
      </article>
    </Page>
  );
}
