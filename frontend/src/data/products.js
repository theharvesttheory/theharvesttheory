export const categories = [
  { id: "all", label: "All Products" },
  { id: "botanical", label: "Botanical Beverages" },
  { id: "teas", label: "Teas & Infusions" },
  { id: "matcha", label: "Matcha" },
  { id: "coffee", label: "Coffee & Functional" },
  { id: "traditional", label: "Traditional Foods" },
  { id: "seeds", label: "Seeds & Nutrition" },
  { id: "seafood", label: "Seafood" },
  { id: "wellness", label: "Wellness" },
];

export const categoryLabel = (id) =>
  (categories.find((c) => c.id === id) || {}).label || id;

export const products = [
  {
    slug: "verbena-bloom",
    name: "Verbena Bloom",
    category: "botanical",
    tagline: "Sparkling verbena & white peony, brewed slow and poured cold.",
    description:
      "A sparkling botanical infusion built on lemon verbena and white peony, picked for clarity and brewed slowly over cool nights. Light, dry and quietly floral — made for the middle of the afternoon.",
    image: "/images/products/verbena.jpg",
    ingredients: ["Lemon verbena", "White peony petals", "Cold-pressed lemon", "Lightly sparkling water"],
    notes: ["Lemon zest", "Fresh herbs", "White florals"],
    prep: "Serve ice-cold, straight from the bottle. Garnish with a sprig of verbena if you have one.",
    goodToKnow: "Vegan · No preservatives · Lightly sparkling",
  },
  {
    slug: "nilgiri-first-light",
    name: "Nilgiri First Light",
    category: "teas",
    tagline: "High-grown whole-leaf black tea, picked at first light.",
    description:
      "Whole-leaf black tea from high-altitude gardens in the Nilgiris, where cool mornings slow the leaf and concentrate the flavour. Bright, aromatic and endlessly drinkable.",
    image: "/images/products/nilgiri.jpg",
    ingredients: ["Whole-leaf black tea (Nilgiri, high-grown)"],
    notes: ["Bright citrus", "Stone fruit", "Cut grass"],
    prep: "One teaspoon per cup. Water just off the boil. Steep for three minutes, no more.",
    goodToKnow: "Single origin · Whole leaf only · Naturally energising",
  },
  {
    slug: "stone-and-leaf-matcha",
    name: "Stone & Leaf Matcha",
    category: "matcha",
    tagline: "Ceremonial-grade matcha, stone-ground the slow way.",
    description:
      "Shade-grown leaves, steamed, dried and ground between granite stones into a fine, vivid powder. Whisked, it tastes green and creamy with a long, calm finish.",
    image: "/images/products/matcha.jpg",
    ingredients: ["Ceremonial-grade matcha (shade-grown, first harvest)"],
    notes: ["Sweet grass", "Warm milk", "Umami"],
    prep: "Whisk two grams with 70ml of water at 80°C until bright and frothy.",
    goodToKnow: "First harvest · Stone-ground · No additives",
  },
  {
    slug: "monsoon-cold-brew",
    name: "Monsoon Cold Brew",
    category: "coffee",
    tagline: "Slow-steeped arabica with cardamom warmth and a cocoa finish.",
    description:
      "Arabica beans steeped for eighteen hours, then finished with green cardamom and a whisper of cacao. Smooth, spiced and made for long mornings.",
    image: "/images/products/coldbrew.jpg",
    ingredients: ["Arabica cold brew", "Green cardamom", "Cacao nib infusion"],
    notes: ["Cardamom", "Dark cocoa", "Brown sugar"],
    prep: "Serve over ice with a splash of milk, or straight from the bottle.",
    goodToKnow: "No added sugar · Smooth & low-acid · Ready to drink",
  },
  {
    slug: "cultured-a2-ghee",
    name: "Cultured A2 Ghee",
    category: "traditional",
    tagline: "Slow-churned cultured ghee from single-origin A2 milk.",
    description:
      "Butter from grass-fed A2 milk, cultured overnight and simmered slowly in small batches until it turns golden and nutty. The old way, kept that way.",
    image: "/images/products/ghee.jpg",
    ingredients: ["Cultured A2 cow butter"],
    notes: ["Toasted nuts", "Caramel", "Fresh grass"],
    prep: "Spoon over hot rice, dal or toast. Keeps for months without refrigeration.",
    goodToKnow: "Small batch · Grass-fed · Lactose-friendly",
  },
  {
    slug: "nine-seed-sprinkle",
    name: "Nine-Seed Sprinkle",
    category: "seeds",
    tagline: "Nine sprouted seeds and grains, toasted to a quiet crunch.",
    description:
      "Sprouted sunflower, pumpkin, flax and more, gently toasted with a pinch of sea salt. A daily spoonful over breakfast, salads or anything else.",
    image: "/images/products/seeds.jpg",
    ingredients: ["Sunflower seeds", "Pumpkin seeds", "Flax", "Sesame", "Melon seeds", "Quinoa", "Amaranth", "Sea salt"],
    notes: ["Toasted nuts", "Sesame", "Sea salt"],
    prep: "Sprinkle two tablespoons over oats, yoghurt, salads or eggs.",
    goodToKnow: "Sprouted for absorption · High in fibre · No refined sugar",
  },
  {
    slug: "coast-and-cure-mackerel",
    name: "Coast & Cure Mackerel",
    category: "seafood",
    tagline: "Wild mackerel, hand-packed in cold-pressed olive oil.",
    description:
      "Wild-caught mackerel from coastal waters, hand-packed in tins with cold-pressed olive oil and a bay leaf. Firm, rich and ready straight from the tin.",
    image: "/images/products/mackerel.jpg",
    ingredients: ["Wild mackerel", "Cold-pressed olive oil", "Bay leaf", "Sea salt"],
    notes: ["Rich olive oil", "Sea salt", "Bay"],
    prep: "Eat straight from the tin, on toast with lemon, or folded through warm pasta.",
    goodToKnow: "Wild-caught · Hand-packed · Source of omega-3",
  },
  {
    slug: "golden-root-latte",
    name: "Golden Root Latte",
    category: "wellness",
    tagline: "A golden latte blend of turmeric, cinnamon and slow mornings.",
    description:
      "Lakadong turmeric, Ceylon cinnamon and black pepper, blended for warmth without bitterness. Stir into hot milk for the ten quiet minutes of the day.",
    image: "/images/products/goldenroot.jpg",
    ingredients: ["Lakadong turmeric", "Ceylon cinnamon", "Black pepper", "Cardamom", "Coconut milk powder"],
    notes: ["Warm turmeric", "Cinnamon", "Gentle spice"],
    prep: "Whisk two teaspoons into hot milk of your choice. Sweeten if you like.",
    goodToKnow: "Plant-based · No refined sugar · Caffeine-free",
  },
];

export const featuredProducts = ["verbena-bloom", "stone-and-leaf-matcha", "cultured-a2-ghee"]
  .map((slug) => products.find((p) => p.slug === slug))
  .filter(Boolean);
