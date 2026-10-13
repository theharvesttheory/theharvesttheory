import { products } from "./products";

// Curated seasonal boxes. Teas inside remain individually purchasable —
// edit productSlugs to change a box's composition. One product can sit in
// multiple collections; no duplicate product records are created.
export const collections = [
  {
    slug: "sacred-spring",
    name: "Sacred Spring",
    tagline: "A seasonal curated box for the season of renewal.",
    description:
      "Six teas chosen for the turning of the season — floral, bright and restorative. Hibiscus and cranberry, blue pea and warm spices, green tea and turmeric, Darjeeling black tea, chamomile and lavender, mint and lemongrass.",
    image: "/images/products/sacred-spring-box.jpg",
    note: "Available individually in 50 g packs, or as part of our seasonal curated boxes.",
    productSlugs: [
      "crimson-berry",
      "blue-spice",
      "golden-glow",
      "lopchu",
      "dream-weaver",
      "minty-lemon",
    ],
  },
  {
    slug: "nexus",
    name: "Nexus",
    tagline: "A curated box of slow evenings and quiet ceremony.",
    description:
      "Four teas built around ritual — the colour-changing blues, a perfumed floral medley and a proper masala chai. Made for taking your time.",
    image: "/images/products/nexus-box.jpg",
    note: "Available individually in 50 g packs, or as part of our seasonal curated boxes.",
    productSlugs: [
      "dream-weaver",
      "blue-magic",
      "floral-blends",
      "dhaba-delight",
    ],
  },
];

export const collectionBySlug = (slug) =>
  collections.find((c) => c.slug === slug) || null;

export const collectionProducts = (collection) =>
  collection.productSlugs
    .map((s) => products.find((p) => p.slug === s))
    .filter(Boolean);

// Tin gift-set configurations (2 boxed tins + a single tin). Edit images here.
export const tinConfigs = [
  { id: 1, label: "Tin configuration I", image: "/images/editorial/tin-config-1.jpg" },
  { id: 2, label: "Tin configuration II", image: "/images/editorial/tin-config-2.jpg" },
  { id: 3, label: "Tin configuration III", image: "/images/editorial/tin-config-3.jpg" },
];
