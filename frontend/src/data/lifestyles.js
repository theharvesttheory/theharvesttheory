// Lifestyle groups — alternate way to browse the catalogue.
// Membership mapping lives on each product (its `lifestyle` array), so a product
// can belong to multiple groups. Add a group here and tag products to extend.
export const lifestyles = [
  {
    id: "launchpad",
    name: "Launchpad",
    description: "Morning rituals designed to help you start the day with intention, energy and momentum.",
  },
  {
    id: "steady-focus",
    name: "Steady Focus & Uplift",
    description: "Daytime products for moments when you want sustained attention, clarity and a gentle lift.",
  },
  {
    id: "find-your-calm",
    name: "Find Your Calm",
    description: "Comforting, aromatic products for slowing down and finding quieter moments.",
  },
  {
    id: "nourish-flourish",
    name: "Nourish & Flourish",
    description: "Everyday products built around ingredients chosen to add meaningful nourishment to regular routines.",
  },
  {
    id: "ceremonial-indulgence",
    name: "Ceremonial Indulgence",
    description: "Products where preparation is part of the pleasure — steeping, whisking, brewing and taking your time.",
  },
  {
    id: "sundowners-sleep",
    name: "Sundowners & Sleep",
    description: "Evening rituals for winding down and transitioning towards rest.",
  },
];

export const lifestyleLabel = (id) =>
  (lifestyles.find((l) => l.id === id) || {}).name || id;
