// The Harvest Journal — editorial content layer.
// To add an article: append an object to `articles`. It appears in the landing
// grid, search params, related stories and SEO automatically. Body blocks are
// typed: lead, p, h2, quote, image, fact, list. In any text, *italics* render
// in the Cormorant accent and [label](/path) render as internal links.

export const journalCategories = [
  { id: "all", label: "All stories" },
  { id: "tea-ritual", label: "Tea & Ritual" },
  { id: "ingredients", label: "Ingredients" },
  { id: "origins", label: "Origins" },
  { id: "the-harvest-theory", label: "The Harvest Theory" },
  { id: "brewing", label: "Brewing" },
];

export const journalCategoryLabel = (id) =>
  (journalCategories.find((c) => c.id === id) || {}).label || id;

const wordCount = (blocks) =>
  blocks
    .filter((b) => ["lead", "p", "h2", "quote", "fact", "list"].includes(b.type))
    .map((b) => (b.type === "list" ? b.items.join(" ") : `${b.text} ${b.cite || ""}`))
    .join(" ")
    .split(/\s+/).filter(Boolean).length;

export const articles = [
  {
    slug: "lopchu-a-cup-with-a-sense-of-place",
    category: "origins",
    featured: true,
    title: "Lopchu: a cup with a sense of place",
    date: "2026-10-06",
    image: "/images/products/lopchu.jpg",
    imageAlt: "Lopchu Darjeeling black tea — bright orange pekoe liquor beside loose whole leaf on a warm cream table",
    excerpt:
      "Some teas are flavours. Lopchu is an address — a high Darjeeling estate at nearly 5,000 feet, planted largely to China bushes, where the cup tastes of altitude, patience and a very specific patch of the Himalaya.",
    seoDescription:
      "Why Lopchu Darjeeling black tea tastes of place: a high Himalayan estate at 4,800 feet, China bushes, muscatel character and India's first Geographical Indication.",
    products: ["lopchu"],
    sources: [
      { label: "Lopchu Tea Estate — Wikipedia", url: "https://en.wikipedia.org/wiki/Lopchu_Tea_Estate" },
      { label: "Darjeeling tea — Wikipedia (Geographical Indication, muscatel character)", url: "https://en.wikipedia.org/wiki/Darjeeling_tea" },
      { label: "Lopchu Tea Estate — Darjeeling Tourism directory", url: "https://www.darjeeling-tourism.com/darj_0000c5.htm" },
    ],
    body: [
      { type: "lead", text: "Plenty of teas are named after flavours. Lopchu is named after a place — a tea estate in the Darjeeling hills, at an altitude where tea grows slowly enough to taste of where it comes from." },
      { type: "p", text: "Wine people have a word for this: *provenance*. The idea that a cup can carry an address — a valley, an altitude, a history — and that knowing the address changes the way you drink. It is the idea behind our entire category of Origins, and Lopchu is its purest expression in our pantry." },
      { type: "h2", text: "Darjeeling: a name that has to be earned" },
      { type: "p", text: "Darjeeling is a small hill district in the eastern Himalaya, in the Indian state of West Bengal, where tea has been grown since the mid-nineteenth century. Its name is protected: in 2004, Darjeeling tea became the *first Indian product* to be registered as a Geographical Indication — the same legal idea that protects Champagne or Scotch whisky. Tea that carries the name has to come from the district, from registered gardens, made in the registered way." },
      { type: "p", text: "A Geographical Indication is not a marketing flourish. It is a legal recognition that the combination of place and practice produces something that cannot simply be reproduced elsewhere — that a Darjeeling cup is, in a quiet way, unrepeatable." },
      { type: "h2", text: "The garden above the mist" },
      { type: "p", text: "The Lopchu tea estate was established in the early 1860s, in the first generation of Darjeeling plantings, and it still works the same steep slopes its founders chose. The garden sits at roughly *4,800 feet* above sea level, between Darjeeling town and the Teesta valley toward Kalimpong — high enough that on clear days the estate looks out toward the snowline of the Kanchenjunga massif, the third-highest mountain on earth." },
      { type: "p", text: "Altitude is not scenery. At 4,800 feet, tea grows slowly. Leaves mature in cool air and persistent mist, which concentrates the aromatic compounds that fast, hot lowland growth dilutes. Slowness is the ingredient." },
      { type: "quote", text: "Provenance is not a story poured over a cup. In Darjeeling, it is the cup." },
      { type: "h2", text: "China bushes in thin mountain air" },
      { type: "p", text: "Most of Lopchu's planting consists of the *China-type* tea bush — Camellia sinensis var. sinensis — rather than the broader-leafed Assam variety that dominates Indian black tea. China bushes at altitude ripen into a very different cup: lighter in body, aromatic, with the musky, grape-like brightness the trade calls *muscatel*, a character most famously associated with Darjeeling's second flush." },
      { type: "p", text: "Lopchu's style leans into that inheritance. The garden is known for its orange pekoe and flowery orange pekoe lots — high-fired, whole-leaf teas that brew an orange-hued cup, bright and precise, with the muscatel lift sitting on top like perfume." },
      { type: "h2", text: "A word on \u2018orange pekoe\u2019" },
      { type: "p", text: "It surprises people to learn that orange pekoe says nothing about orange, and nothing about flavour. It is a *grading term* — a description of leaf style and size, referring to whole leaves picked and rolled in a particular way, not a taste or an orange note. What the leaf delivers once brewed is decided by the garden, the altitude and the season." },
      { type: "fact", label: "Good to know", text: "Darjeeling tea was the first product in India to receive Geographical Indication status, in 2004. A GI is the same legal protection that guards Champagne and Parma ham — a name that belongs to a place." },
      { type: "h2", text: "How to drink an address" },
      { type: "p", text: "A tea this articulate asks for little. Water just off the boil, a three-minute steep, no milk — milk would only paper over the bright, wine-like acidity that makes the cup interesting. Drink it in the morning, when your own attention is at its clearest." },
      { type: "p", text: "Then, if you like, look for the muscatel — that faint, musky grape-skin sweetness underneath the brightness. When you find it, you are tasting two things at once: a leaf, and the particular slope of a Himalayan hillside where that leaf decided to grow slowly. That is the whole theory, really. Place, patience, and nothing that needs a footnote." },
      { type: "p", text: "If this way of tasting interests you, our [Ingredients / Our Approach](/approach) page explains how provenance runs through everything we source." },
    ],
  },
  {
    slug: "blue-pea-the-flower-that-changes-colour",
    category: "ingredients",
    title: "Blue Pea: the flower that changes the colour of your cup",
    date: "2026-09-29",
    image: "/images/products/blue-magic.jpg",
    imageAlt: "Blue Magic blue pea blossom infusion — a deep blue tisane in a clear glass beside dried butterfly pea flowers",
    excerpt:
      "It steeps an unearthly blue, then turns violet with a squeeze of lemon. The colour-changing cup is not a trick — it is a plant pigment answering a simple chemistry question.",
    seoDescription:
      "Why butterfly pea flower tea is blue and turns violet with lemon: ternatins, anthocyanin chemistry, flavour, and how to brew the colour-changing cup.",
    products: ["blue-magic", "floral-blends"],
    sources: [
      { label: "McGill University, Office for Science and Society — on blue pea colour change", url: "https://www.mcgill.ca/oss/article/did-you-know-general-science/when-tea-changes-hues-out-blue" },
      { label: "American Chemical Society — delphinidin as a natural pH indicator", url: "https://www.acs.org/education/students/college/social-distancing-socials/mocktails/delphinidin-transition-indicator.html" },
      { label: "Science in School — the chemistry of tea colour", url: "https://www.scienceinschool.org/wp-content/uploads/2021/03/Issue52_TeaChemistry.pdf" },
    ],
    body: [
      { type: "lead", text: "Somewhere in almost every tea collection there is one infusion bought for its colour alone — a cup that steeps a blue so deep and unlikely that people take a photograph of it before they drink it." },
      { type: "p", text: "The blue pea flower — Clitoria ternatea, the butterfly pea — is a vine with vivid cobalt blossoms, long cultivated across Southeast Asia, where the flowers have been used to colour foods and drinks for generations. It has recently become one of the most photographed ingredients in the tea world, and almost entirely for one reason: pour hot water over the dried flowers and the cup turns a blue that looks borrowed from somewhere else." },
      { type: "h2", text: "Where the blue comes from" },
      { type: "p", text: "The pigment is a family of anthocyanins — the same broad group of plant pigments that colours blueberries, blackcurrants and red cabbage. In blue pea, the dominant members are called *ternatins*, built on a core molecule called delphinidin. Anthocyanins are famously sensitive to their chemical surroundings, and that sensitivity is the whole story of this cup." },
      { type: "p", text: "In plain terms: the pigment changes shape depending on how acidic its environment is, and each shape absorbs a different colour of light. Neutral water lets it sit in its blue form. Nudge the chemistry and the colour follows." },
      { type: "h2", text: "The lemon trick, explained" },
      { type: "p", text: "Add a squeeze of lemon to a steeped blue pea infusion and the acidity shifts the pigment toward violet, then pink-magenta as the cup grows more acidic. Make the environment alkaline — with a pinch of baking soda, for the experiment-minded — and the colour drifts the other way, toward green. The drink is behaving exactly like a natural pH indicator, because that is very nearly what it is." },
      { type: "quote", text: "The colour change is not a trick. It is the pigment answering a simple question — how acidic is your cup?" },
      { type: "p", text: "This is why the flower has become the centrepiece of slow ceremonies and tasting tables: the moment of the lemon squeeze is a small, entirely honest piece of theatre. Nothing is added and nothing changes except acidity — the chemistry simply becomes visible." },
      { type: "fact", label: "Good to know", text: "The same pigment family that colours blue pea flowers also colours blueberries and red cabbage — a reminder that the bluest things in the pantry are often chemically cousins." },
      { type: "h2", text: "And what does it taste like?" },
      { type: "p", text: "Honestly: less than it looks. Blue pea is mild, faintly green and earthy, with a soft floral edge — the flavour equivalent of a supporting voice. Its role is colour and ritual, which is why it blends so happily with louder company: rose and chamomile, or a lift of lemongrass that gives the cup something to say." },
      { type: "h2", text: "Brewing the showpiece" },
      { type: "p", text: "One teaspoon of flowers per cup, water just off the boil, four minutes — and a clear glass, because the whole point is the colour. Watch it deepen from pale periwinkle to full cobalt as it steeps. Then pour a second cup, pass the lemon around, and let everyone make their own violet." },
      { type: "p", text: "Our [Blue Magic](/products/blue-magic) blend is built around the flower, with rose petals and a touch of lemongrass; for a softer, all-floral take, [Floral Blends](/products/floral-blends) folds blue pea into rose and chamomile. And if you would like the fuller context of floral infusions — what chamomile, lavender and hibiscus each bring to hot water — start with [what exactly you are drinking when you drink a flower](/journal/what-exactly-are-you-drinking-when-you-drink-a-flower)." },
    ],
  },
  {
    slug: "why-chamomile-became-the-tea-of-slowing-down",
    category: "tea-ritual",
    title: "Why chamomile became the tea of slowing down",
    date: "2026-09-22",
    image: "/images/products/dream-weaver.jpg",
    imageAlt: "Dream Weaver chamomile and lavender infusion — golden tisane beside dried chamomile flowers and lavender",
    excerpt:
      "From ancient apothecaries to the modern evening cup: how a small daisy-like flower became the world's shorthand for the end of the day — and what it can and cannot promise.",
    seoDescription:
      "The story of chamomile tea: its long documented history, why evenings and chamomile belong together, its classic pairing with lavender, and brewing it well.",
    products: ["dream-weaver", "floral-blends"],
    sources: [
      { label: "US National Center for Complementary and Integrative Health — Chamomile", url: "https://www.nccih.nih.gov/health/chamomile" },
      { label: "American Herbal Products Association — Chamomile in herbal history", url: "https://www.ahpa.org/herbs_in_history_chamomile" },
      { label: "American Botanical Council, HerbalGram — German chamomile monograph history", url: "https://www.herbalgram.org/resources/herbalgram/issues/108/table-of-contents/hg108-herbpro-chamomile/" },
    ],
    body: [
      { type: "lead", text: "Ask anyone to name a bedtime tea and they will say chamomile before they finish the sentence. Few ingredients in the pantry carry such an instant association — and like most associations this old, it has a long, well-documented history behind it." },
      { type: "h2", text: "A very old flower" },
      { type: "p", text: "Chamomile is among the most long-used herbs in the written record. References reach back to ancient Egypt, where the flower appeared in medicine and ritual; Greek and Roman medical writers — Dioscorides and Galen among them — describe its use in their pharmacologies. By the European Middle Ages it was a household herb in the fullest sense: grown in cottage gardens, scattered on floors as a *strewing herb* that released its scent underfoot, and simmered for all the small complaints of ordinary life." },
      { type: "p", text: "The name itself is a description. Chamomile traces to the Greek *chamaimelon* — \u2018earth apple\u2019 — a nod to the apple-sweet scent of the fresh flowers when you crush them between your fingers. It is one of the more honest etymologies in the pantry: open a tin of dried chamomile and the apple is unmistakably there." },
      { type: "h2", text: "Why evenings chose chamomile" },
      { type: "p", text: "Chamomile's association with winding down is centuries old. It was traditionally consumed in the evening and has often been associated with rest and comfort — first as custom, later as a subject of research. It is worth being precise here, because precision is what makes an old story believable: researchers have in fact investigated chamomile for sleep and relaxation, and the US National Center for Complementary and Integrative Health summarises the evidence as limited — the studies are small and the results modest. Chamomile is not a sleeping pill in a teacup." },
      { type: "p", text: "But that was never really its role. Its role is the *ritual*: a warm cup, a quiet half hour, a flavour that is gentle by any measure — soft, honeyed, apple-sweet with a hay-warm edge. A cup that asks nothing of you. Whatever the evening needs slowing down for, this is the taste people have reached for while it happens, for a very long time." },
      { type: "quote", text: "No cup can promise a good night. But a warm cup, made slowly, gives the evening somewhere to go." },
      { type: "h2", text: "The lavender question" },
      { type: "p", text: "Why does chamomile so often meet lavender? Partly temperament: both are the quiet, floral end of the pantry, and both have long traditional associations with the evening hour. Partly chemistry-as-flavour: chamomile is herbal and apple-round, lavender resinous and perfumed, and the two fill a cup the way two voices fill a room — each making the other more itself. It is a pairing old enough that neither herbalist tradition needed the other to justify it." },
      { type: "fact", label: "Good to know", text: "Chamomile comes from the same plant family as daisies — look at a fresh flower and the resemblance is suddenly obvious. It is also naturally caffeine-free, which is true of every pure herbal infusion." },
      { type: "h2", text: "Brewing it properly" },
      { type: "p", text: "One heaped teaspoon per cup, water just off the boil, five minutes — and cover it. Chamomile's aromatics are volatile; a saucer over the cup catches them and returns them to the infusion instead of the kitchen air. An hour before bed, lights low, is the traditional slot. The rest is yours." },
      { type: "p", text: "We put the pairing at the heart of [Dream Weaver](/products/dream-weaver) — whole chamomile flowers and lavender with a thread of lemon balm. If you enjoy floral infusions generally, [Floral Blends](/products/floral-blends) extends the idea, and [what exactly you are drinking when you drink a flower](/journal/what-exactly-are-you-drinking-when-you-drink-a-flower) explains the science of how flowers become cups." },
    ],
  },
  {
    slug: "hibiscus-tart-crimson-and-unmistakable",
    category: "ingredients",
    title: "Hibiscus: tart, crimson and unmistakable",
    date: "2026-09-15",
    image: "/images/products/crimson-berry.jpg",
    imageAlt: "Crimson Berry hibiscus and cranberry infusion — deep ruby tisane in a glass beside dried hibiscus petals and cranberries",
    excerpt:
      "One flower, a dozen names, half the world's refreshment: from agua de jamaica to karkadé to sorrel, hibiscus is the most globally travelled ingredient in the tea pantry.",
    seoDescription:
      "Hibiscus tea across cultures — agua de jamaica, karkadé, sorrel and bissap — why it steeps so crimson and tart, and why cranberry pairs with it so well.",
    products: ["crimson-berry"],
    sources: [
      { label: "Hibiscus tea — Wikipedia (global traditions and names)", url: "https://en.wikipedia.org/wiki/Hibiscus_tea" },
      { label: "Serious Eats — hibiscus across the African diaspora", url: "https://www.seriouseats.com/hibiscus-african-diaspora" },
      { label: "AramcoWorld — the red tea of Egypt", url: "https://archive.aramcoworld.com/issue/200105/the.red.tea.of.egypt.htm" },
    ],
    body: [
      { type: "lead", text: "Few ingredients travel further than hibiscus. It simply changes its name at every border — jamaica in Mexico, karkadé on the Nile, sorrel in the Caribbean, bissap in West Africa — and at each stop it is tart, crimson, and poured with pleasure." },
      { type: "h2", text: "One flower, many names" },
      { type: "p", text: "The tea is made from the dried calyces of *Hibiscus sabdariffa*, and almost every warm-weather food culture has claimed it. In Mexico and much of Latin America, *agua de jamaica* is an everyday refresher — brewed strong, sweetened, served over ice. In Egypt and Sudan, *karkadé* is served hot or chilled and has long been tied to hospitality and ceremony, poured at weddings and festive gatherings. Across the Caribbean, *sorrel* is the drink of Christmas, steeped with ginger, cloves and cinnamon. In West and Central Africa the same tart red cup appears as bissap, zobo and wonjo." },
      { type: "p", text: "Different kitchens, different occasions, one unmistakable signature: the deep ruby colour and the bright, cranberry-like tartness that no other common ingredient quite delivers." },
      { type: "h2", text: "Why it steeps so red, so fast" },
      { type: "p", text: "Hibiscus extracts eagerly. The dried calyces are dense with anthocyanin pigments — cousins of the molecules that colour blue pea and blueberries, sitting on the red side of the same chemical family — and with the organic acids that give the cup its sharp edge. Three minutes in hot water and the glass is already stained garnet; even a cold-brew pulls colour and flavour overnight in the fridge." },
      { type: "p", text: "The flavour profile that results is one of the most useful in the pantry: tart and fruity, with comparisons usually reaching for cranberry, pomegranate and sour cherry, and a faint floral finish underneath." },
      { type: "quote", text: "Hibiscus does not need flavouring to be interesting. It needs company that can keep up with it." },
      { type: "h2", text: "Why cranberry and hibiscus get along" },
      { type: "p", text: "Our [Crimson Berry](/products/crimson-berry) blend pairs hibiscus with cranberry and a lift of rosehip, and the logic is simple flavour arithmetic. Both hibiscus and cranberry are acid-driven, tart fruit profiles — neither one has to compete, because they are playing the same register. Cranberry rounds the sharper edges of the hibiscus with a broader, sweeter fruit depth, and the cup ends up more complex than either ingredient alone: still vividly red, still bright, but with a longer finish." },
      { type: "fact", label: "Good to know", text: "The part of the hibiscus plant used for tea is not the petal but the calyx — the cup-shaped base that holds the flower. It is why the dried ingredient looks like small dark-red buds rather than petals." },
      { type: "h2", text: "Serving it" },
      { type: "p", text: "Hibiscus is generous in both directions. Hot, it is a bracing, ruby-coloured evening cup. Iced, it is one of the best arguments for a jug in the fridge — steep, chill, and sweeten only if you must, since the tartness is rather the point. A squeeze of orange or a few cloves wander in and out of fashion across the many cultures that pour it." },
      { type: "p", text: "If the colour chemistry interests you, [Blue Pea: the flower that changes the colour of your cup](/journal/blue-pea-the-flower-that-changes-colour) covers the pigment family hibiscus belongs to — and [what exactly you are drinking when you drink a flower](/journal/what-exactly-are-you-drinking-when-you-drink-a-flower) places all the floral infusions side by side." },
    ],
  },
  {
    slug: "there-is-more-to-mint-tea-than-mint",
    category: "brewing",
    title: "There is more to mint tea than mint",
    date: "2026-09-08",
    image: "/images/products/minty-lemon.jpg",
    imageAlt: "Minty Lemon infusion — cool mint and lemongrass tisane in a clear glass with fresh mint and lemongrass stalks",
    excerpt:
      "The freshest cup in the pantry is also one of the most interesting: real cooling chemistry, a lemon note with no lemon, and a few brewing decisions that change everything.",
    seoDescription:
      "What makes mint tea feel so fresh: menthol's real cooling effect, lemongrass's citral lift, and the brewing temperatures that get the best from herbal infusions.",
    products: ["minty-lemon"],
    sources: [
      { label: "NCBI Bookshelf — Menthol: cooling sensation and TRPM8", url: "https://www.ncbi.nlm.nih.gov/books/NBK5238/" },
      { label: "Menthol binds to the cold-sensing ion channel TRPM8 — Nature", url: "https://www.nature.com/articles/nature05910" },
      { label: "Citral — the lemon-scented compound of lemongrass (reference overview)", url: "https://www.sciencedirect.com/topics/chemistry/citral" },
    ],
    body: [
      { type: "lead", text: "Mint is the most familiar flavour in the tea pantry — and one of the least examined. The freshness is not a mood. It is measurable physiology, and once you know what is happening, you brew the cup differently." },
      { type: "h2", text: "The coolness is real" },
      { type: "p", text: "Mint's signature chill comes from menthol, and menthol does something remarkable: it activates TRPM8, the ion channel your body uses to *sense cold*. The same molecular sensor that reports a winter breeze on your skin is the one menthol switches on. That is why mint tea feels cool on a warm afternoon — your mouth is receiving a genuine cold signal, manufactured without any change in temperature at all." },
      { type: "p", text: "This is why the freshness of a mint cup survives being *hot*. Brewed at a full simmer, mint tea is physically warm and sensorially cool at the same time, which is a rather lovely trick for a drink to manage." },
      { type: "h2", text: "Lemongrass, the bright partner" },
      { type: "p", text: "Pair mint with lemongrass and the cup gains a different kind of lift. Lemongrass's lemon character comes mainly from citral, a lemon-scented aroma compound — the same molecule family that gives citrus its smell, arriving here from a grass stalk instead of a fruit. Crucially, citral brings the *aroma* of lemon without the sourness: the brightness floats above the cup instead of cutting into it." },
      { type: "quote", text: "Mint does not just smell cool. It answers the same nerves that feel cold." },
      { type: "p", text: "Together the two herbs bracket the idea of freshness: menthol delivering cool, citral delivering bright, and neither needing sugar or citrus juice to make the point." },
      { type: "fact", label: "Good to know", text: "Peppermint — the classic mint of tea — is a natural hybrid of watermint and spearmint, which is one reason mint flavours vary so much from garden to garden." },
      { type: "h2", text: "Brewing for freshness" },
      { type: "p", text: "Herbal infusions are more forgiving than green or black tea, and mint and lemongrass are happy at just-off-the-boil water for about four minutes. Two details matter. First, *cover the cup* — both herbs carry volatile aromatics that escape with the steam, and a saucer over the glass returns them to the drink. Second, if you want it iced, brew double-strength and pour over ice rather than diluting a normal brew; the melt should be part of the recipe, not a mistake it is recovering from." },
      { type: "h2", text: "When to reach for it" },
      { type: "p", text: "Mint infusions are naturally caffeine-free and have traditionally been taken after meals across many cultures — the light, clean reset at the end of eating. We think of Minty Lemon as an afternoon cup: the moment the day needs opening a window. It is also, cold, one of the most refreshing things in the pantry." },
      { type: "p", text: "Our [Minty Lemon](/products/minty-lemon) blends peppermint and lemongrass with a lift of lemon verbena. For the other end of the day, [why chamomile became the tea of slowing down](/journal/why-chamomile-became-the-tea-of-slowing-down) is its natural companion read." },
    ],
  },
  {
    slug: "what-exactly-are-you-drinking-when-you-drink-a-flower",
    category: "ingredients",
    title: "What exactly are you drinking when you drink a flower?",
    date: "2026-09-01",
    image: "/images/products/floral-blends.jpg",
    imageAlt: "Floral Blends infusion — a perfumed floral tisane beside rose petals, chamomile and blue flowers on warm plaster",
    excerpt:
      "Chamomile, lavender, hibiscus, blue pea: a field guide to floral infusions — where their colour, aroma and flavour actually come from, and how each behaves in the cup.",
    seoDescription:
      "A field guide to floral teas: what chamomile, lavender, hibiscus and blue pea contribute to an infusion — colour, aroma, flavour and how they steep.",
    products: ["dream-weaver", "crimson-berry", "blue-magic", "floral-blends"],
    sources: [
      { label: "US National Center for Complementary and Integrative Health — Chamomile", url: "https://www.nccih.nih.gov/health/chamomile" },
      { label: "McGill University, Office for Science and Society — blue pea colour chemistry", url: "https://www.mcgill.ca/oss/article/did-you-know-general-science/when-tea-changes-hues-out-blue" },
      { label: "Hibiscus tea — Wikipedia (global traditions)", url: "https://en.wikipedia.org/wiki/Hibiscus_tea" },
    ],
    body: [
      { type: "lead", text: "A floral infusion is the lightest kind of drink there is — hot water, a spoonful of dried petals, nothing else. Which raises a question worth slowing down for: what exactly ends up in the cup?" },
      { type: "h2", text: "A cup built from petals" },
      { type: "p", text: "Start with what it is not. A floral infusion contains no leaves of the tea plant, Camellia sinensis — no white, green, oolong or black tea. That is why pure floral infusions are naturally caffeine-free. What you are drinking is an *extraction*: hot water dissolving the small, volatile, water-soluble compounds that flowers keep in their petals — pigments for colour, aromatic molecules for scent, and the gentle acids and sugars that give the liquor its shape." },
      { type: "p", text: "Different flowers, then, are not variations on one flavour. They are different chemistries, and it is worth meeting them individually." },
      { type: "h2", text: "Chamomile and lavender — the soft ones" },
      { type: "p", text: "Chamomile's apple-sweetness comes from its own bundle of aromatic compounds concentrated in the tiny yellow centre of a daisy-like flower; steeped, it gives a golden cup that is round, honeyed and hay-warm. Lavender contributes perfume in the truest sense — its aroma rides on volatile oils that infuse quickly and dominate easily, which is why lavender should always be the supporting voice rather than the soloist. Together they are the classic evening register: soft, herbal, gently floral." },
      { type: "h2", text: "Hibiscus — the loud one" },
      { type: "p", text: "Hibiscus does nothing quietly. Its calyces are dense with red anthocyanin pigments and organic acids, so the cup stains deep ruby within minutes and arrives tasting sharply, fruitily tart — closer to cranberry than to any flower. It is the backbone of almost every great red infusion and the reason blends can stand up to ice and still taste of something." },
      { type: "h2", text: "Blue pea — the quiet showpiece" },
      { type: "p", text: "Blue pea is the mirror image of hibiscus: the most visually dramatic flower in the pantry and the most mild-mannered in flavour — soft, faintly green and earthy. Its deep blue also comes from anthocyanins, but from the end of the pigment family that answers acidity: squeeze lemon into the cup and it turns violet, then pink. The colour change is genuine chemistry, and it makes the best theatre in tea." },
      { type: "quote", text: "An infusion is a conversation between water and petal — brief, gentle, and entirely about timing." },
      { type: "fact", label: "Good to know", text: "Colour and flavour do not always travel together. Blue pea is the bluest and one of the mildest cups in the pantry; hibiscus is the loudest flavour and the most common colour. Judge each flower on its own terms." },
      { type: "h2", text: "How to steep a flower" },
      { type: "p", text: "Three habits cover almost every floral infusion. Water just off the boil — boiling water is fine for hibiscus and blue pea, while delicate petals like chamomile prefer the same water given a moment to settle. Four to five minutes, because flowers extract more slowly than cut tea leaves. And cover the cup: the aromatics you can smell escaping with the steam are the ones that never make it into the drink." },
      { type: "p", text: "From there, meet each flower properly. [Why chamomile became the tea of slowing down](/journal/why-chamomile-became-the-tea-of-slowing-down) tells the story of the evening cup; [Hibiscus: tart, crimson and unmistakable](/journal/hibiscus-tart-crimson-and-unmistakable) travels the world with the red one; and [Blue Pea](/journal/blue-pea-the-flower-that-changes-colour) explains the cup that changes colour. Our [Floral Blends](/products/floral-blends) exists precisely because we like the way they all behave in one pot." },
    ],
  },
];

export const featuredArticle = () => articles.find((a) => a.featured) || articles[0];

export const articleBySlug = (slug) => articles.find((a) => a.slug === slug) || null;

export const readingMinutes = (a) => Math.max(3, Math.round(wordCount(a.body) / 200));

export const formatDate = (iso) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

// Related stories: same category first, then the rest by date. Excludes self.
export const relatedArticles = (slug, n = 2) => {
  const a = articleBySlug(slug);
  if (!a) return [];
  const rest = articles.filter((x) => x.slug !== slug);
  const same = rest.filter((x) => x.category === a.category);
  const others = rest.filter((x) => x.category !== a.category);
  return [...same, ...others].slice(0, n);
};
