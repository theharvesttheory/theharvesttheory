import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

export default function ProductCard({ product, index = 0 }) {
  return (
    <Link
      to={`/products/${product.slug}`}
      data-testid={`product-card-${product.slug}`}
      className="group block"
    >
      <div className="relative overflow-hidden rounded-sm bg-creamdeep aspect-[4/3]">
        <img
          src={product.image}
          alt={product.name}
          loading={index < 3 ? "eager" : "lazy"}
          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]"
        />
        {product.packSize ? (
          <span className="absolute top-3 left-3 bg-cream/90 backdrop-blur px-2.5 py-1 text-[9px] uppercase tracking-[0.22em] text-olive">
            {product.packSize.replace(" individual pack", "")}
          </span>
        ) : null}
      </div>
      <div className="mt-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] uppercase tracking-[0.24em] text-gold">{product.subname}</p>
          <h3 className="mt-1.5 font-display font-light text-xl tracking-tight text-ink transition-colors duration-300 group-hover:text-olive md:text-2xl">
            {product.name}
          </h3>
          <p className="mt-1.5 max-w-md text-sm font-light leading-relaxed text-ink/70">
            {product.tagline}
          </p>
          {product.price ? (
            <p
              data-testid={`product-price-${product.slug}`}
              className="mt-3 text-sm tracking-[0.08em] text-ink/85"
            >
              {product.price}
            </p>
          ) : null}
        </div>
        <ArrowUpRight
          size={18}
          strokeWidth={1.25}
          className="mt-2 shrink-0 text-olive opacity-0 -translate-x-1 translate-y-1 transition-all duration-500 group-hover:opacity-100 group-hover:translate-x-0 group-hover:translate-y-0"
        />
      </div>
    </Link>
  );
}
