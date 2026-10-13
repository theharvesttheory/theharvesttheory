# The Harvest Theory — PRD

## Original Problem Statement
Build a premium consumer food and wellness brand website for The Harvest Theory — a modern food and wellness company with products across many food and beverage categories (not a tea-only, supplement, or Ayurveda brand). The site must communicate what the brand stands for, its products, ingredient quality, credibility, and how to explore/buy. Main CTA: "Explore Our Products". Pages: Home, Our Products, Our Story, Contact (structure ready for Ingredients/Our Approach, Journal and ecommerce later). Warm cream/botanical green palette, editorial typography, subtle motion, mobile-first.

## User Decisions (from ask_human)
- Contact form: frontend-only (does not submit anywhere yet)
- Imagery: AI-generated premium product photography (replaceable)
- 8 products across the 8 initial categories
- Buy action: "Coming soon" placeholder (toast on click)

## User-Provided Assets
- Final logo PDF (TH botanical monogram + stacked wordmark, olive #5A5C37 / gold #AB8E54) → rendered to PNG lockups (dark + cream variants), mark-only crop, favicon.png, apple-touch-icon.png

## Architecture
- React (CRA + craco) frontend only; no backend functionality per brief (backend template untouched, health route remains)
- React Router v7 with AnimatePresence page transitions, ErrorBoundary
- Lenis smooth scrolling (module ref in src/context/app.js; respects prefers-reduced-motion)
- Framer Motion: masked line-by-line hero reveal, FadeUp scroll reveals, parallax hero image (useScroll/useTransform)
- Brand system in tailwind.config.js: cream #F6F2E9, creamdeep #EDE7D9, ink #2E311F, olive #5A5C37, olivedeep #242716, sage, gold #AB8E54, terracotta, wood; Fraunces (display) + Cormorant Garamond italic (accent) + Outfit (body); film-grain overlay; slow editorial marquee
- Product catalogue: /app/frontend/src/data/products.js (categories + products arrays — extend here for new products/categories)
- Images in /app/frontend/public/images/{products,editorial}/ — same-filename drop-in replacement supported

## Pages
- / — Hero (kinetic masked reveal, parallax image, CTA), marquee, philosophy, featured products (3, staggered), ingredients/approach (numbered list + sticky image), sourcing/craft, story teaser, final CTA (deep olive)
- /products — intro, sticky category filter bar (9 filters), staggered 2-col grid, 8 products with "Coming soon" tags
- /products/:slug — split layout, sticky image, ingredients/tasting notes/preparation/good-to-know, "Purchase — Coming Soon" button (sonner toast), prev/next nav
- /story — placeholder story (marked as working draft, to be revised by user)
- /contact — split layout, form (name/email/enquiry type/message), frontend-only success state

## Implemented (2026-10-12)
- Full design system, logo asset pipeline, favicon
- All 5 routes + page transitions + preloader intro
- 14 AI-generated images (8 products, 6 editorial)
- Mobile nav drawer, glass sticky header
- data-testids on all interactive elements

## Implemented (2026-10-13) — content & structure refinement (visual language preserved)
- Hero: rotating words Nourishment/Upliftment/Calmness with static italic "by design."; CTAs "Explore Our Products" + "Discover Our Theory" above the fold
- Preloader: ingredient still-life watermark ("These are the parts. The theory is what we do with them.")
- Homepage Explore section: By Category (5 categories) / Lifestyle (6 groups) tabs, deep-link to /products?cat= / ?mode=lifestyle&life=
- Catalogue rebuilt: 13 products (Root & Leaf, Coco Matcha, Woodland Brew, Teesi + 9 teas in 50 g packs) — all data in src/data/products.js
- Lifestyle mapping on products (lifestyle arrays) + groups in src/data/lifestyles.js
- Collections: nav tab + /collections + /collections/:slug (Sacred Spring 6 teas, Nexus 4 teas) — composition in src/data/collections.js; teas remain individually purchasable
- Product page: what it is / ingredients / prepare / tasting notes / nutrition / benefits / pack size / price (blank) / provenance (blank) / reviews (low priority)
- Story page: full theory + origin story (life → Japan → theory → parts → product philosophy → customer) + 3 founder profiles with portrait placeholders (src/data/site.js)
- Contact: "What can we help you with?" — 9 enquiry types, per-type field schemas in src/data/contact-options.js; Product Orders shows "Ordering will be available shortly."; architecture ready for email→Slack later
- Footer: FSSAI/certification placeholders, socials, legal placeholders, newsletter signup, Made in India
- Marquee now carries the brand line; nav = Products / Collections / Our Theory + mobile full set

## Verified (2026-10-13)
- Desktop + mobile screenshots all pages; no overflow-x
- Rotating hero words cycle (Calmness → Nourishment observed); lifestyle filter (5 ceremonial-indulgence), category filter (9 teas); collection detail shows 6 teas; tea detail shows all 9 sections; order button toast "Ordering will be available shortly."; contact retail form renders 8 fields, submits to success; product-orders state verified; mobile menu navigates

## Implemented (2026-10-13b) — real packaging assets
- Sacred Spring + Nexus collection cards and detail heroes now use the final packaging renders (converted from user PNGs)
- New "The tin configurations" showcase on /collections: the 3 tin gift-set renders (2 boxed tins + single), editable in src/data/collections.js (tinConfigs)

## Implemented (2026-10-13c) — brews & teas only
- Dream Weaver, Blue Spice and Lopchu product pages/cards now use the final tin gift-set renders
- Hero still-life and Root & Leaf regenerated with brews-and-teas imagery only; all wine-bottle-shaped and superseded AI images deleted from the media library
- "Browse by" label added beside the Category/Lifestyle controls on Home and in the Products filter bar

## Implemented (2026-10-13d) — theory copy
- "The theory" section on Our Story / Our Theory replaced with the user's final copy verbatim (mango/avocado timing, "Our theory is the sum of all those choices", "That is the bounty of our theory"); the old numbered sequence rows were removed

## Implemented (2026-10-13e) — naming
- Tin configurations named: Pink Symphony Assortment, Birds and Bees Collection, A Ballad in Blue (edit in src/data/collections.js)
- Header nav label changed Collections → Gift Assortments (desktop + mobile); footer link still reads Collections; homepage philosophy stays short per user choice

## Implemented (2026-10-13f) — approach page, naming, tea renders
- New Ingredients / Our Approach page at /approach: four pillars (Selection & sourcing, Formulation, Testing & manufacturing, Ritual & format) with alternating imagery, trust placeholders (FSSAI/certifications) structured for future lab reports, batch traceability and export certifications; linked in nav (desktop + mobile), footer and homepage
- "Gift Assortments" naming now consistent: header nav, footer link, page eyebrow and back links
- Remaining six teas re-rendered (caddy + brewed cup + ingredient still-lifes) replacing all AI placeholder pack shots
- Footer: "Explore Our Theory" (primary) + "Explore Our Products" (ghost) buttons under the theory heading

## Implemented (2026-10-13g) — header spacing
- Header links reduced to 11px with added vertical padding (py-2) for click targets, larger inter-link gaps (28/40/56px responsive), compact Get in Touch button; clear logo-to-links separation verified at 1440px and 1100px

## Implemented (2026-10-13h) — enquiry links & header polish
- Each named tin configuration is clickable → /contact with Product Orders pre-selected and the Products field prefilled with that assortment's name ("Enquire about this assortment" affordance); mechanism is generic (?type=&item=) and works for any assortment
- Header: nav pushed right with guaranteed clear logo separation (456px at 1440), 11px links, desktop nav from 1024px up, hamburger below; Get in Touch now solid olive matching the primary button style

## Implemented (2026-10-13i) — browse heading & collection enquiries
- Homepage explore section: "Two ways to browse" removed; "Browse by" now the display heading with Category/Lifestyle tabs beside it, left-aligned
- Sacred Spring and Nexus cards (and both detail pages) carry "Enquire about this assortment" links → contact with Product Orders pre-selected and the assortment name prefilled

## Implemented (2026-10-13j) — cross-page navigation
- Our Story / Our Theory page: "← Home" back link at top, and end-of-page buttons Explore Our Products + Our Approach + Back to Home
- Our Approach page: same treatment (← Home top; Explore Our Products + Our Story / Our Theory + Back to Home at end)
- Verified end-to-end: hero Discover Our Theory → story → Home; story ↔ approach cross-links; no overflow
- Pending user decision: "Enquire about this product" on product pages (explained, not yet added)

## Implemented (2026-10-13k) — tea imagery to spec
- Blue Spice: new render (blueberries, cinnamon, cloves, berry-toned brew); copy updated to "Blueberry & Warm Spices" with matching ingredients/notes; Sacred Spring description corrected to "blueberry and warm spices"
- Lopchu: new render showing the bright orange pekoe liquor; description now references the orange-hued cup
- Dream Weaver: new individual render with chamomile flowers and lavender (replacing the gift-set crop)

## Implemented (2026-10-13l) — logo size & site-wide breadcrumbs
- Header logo enlarged to 48px mobile / 56px desktop (was 36/40) for legibility; products filter bar sticky offset adjusted to sit flush under the taller header
- Breadcrumbs on every inner page: Products, product detail (Home / Products / name), Gift Assortments, collection detail (Home / Gift Assortments / name), Our Approach, Our Story / Our Theory, Contact — last crumb is the current page, parents are links; replaces the one-off back links
- Fixed: collection detail crash from a missing Breadcrumb import (caught by ErrorBoundary) — verified recovered

## Implemented (2026-10-13m) — products header & enquire links
- Products headline changed to "A pantry of carefully considered ingredients." with a very transparent ingredient still-life filling the header background (cream gradient blend)
- Header logo enlarged again: 56px mobile / 64px desktop; filter-bar sticky offset matched
- "Enquire About This Product" ghost button beside "Order — Coming Soon" on all 13 product pages → contact with Product Orders pre-selected and the product name prefilled (verified with Blue Spice)

## Implemented (2026-10-13n) — products header refinement
- Headline reduced to a compact size with "carefully considered ingredients." in italic accent; background image opacity doubled to 30% so the ingredient still-life reads clearly behind the header

## Implemented (2026-10-13o) — hero backdrop
- Homepage hero now carries the same subtle ingredient still-life backdrop (18% opacity, cream gradient blend) behind the rotating headline and CTAs, matching the products header treatment; verified desktop + mobile with no overflow

## Implemented (2026-10-13p) — story page brevity pass
- Origin rewritten: "a year of introspection and personal growth" (no challenging year, no stress narrative); Japan section removed entirely; unified first-person voice and present tense throughout
- Removed redundant "whole, greater than its parts" section (covered verbatim in the theory copy) and the duplicated page eyebrow; page ~30% shorter; theory copy left verbatim per user instruction

## Implemented (2026-10-13q) — hero text & rotation
- Hero phrase changed to "by intent." everywhere (headline + browser tab/OG title); rotating word now crossfades continuously (old word slides out while the new slides in) so the ingredient backdrop always sits behind fully visible text; content layer explicitly above the backdrop

## Implemented (2026-10-13r) — backdrop positioning & transparency
- Hero backdrop raised so the ingredient line sits directly behind the rotating word + "by intent." (scaled/translated up), opacity reduced to 12%; products header backdrop reduced to 20%

## Implemented (2026-10-13s) — limewash texture
- Our Story / Our Theory page now carries a subtle limewash-style wash for its full length: an SVG-turbulence cloud layer (~5% alpha, olive-toned) plus soft sage/gold/terracotta radial washes on the cream base; the flat alternating section bands were replaced by the continuous wash with hairline dividers (.limewash class in index.css — reusable on any page)

## Implemented (2026-10-13t) — agentic edit: hero raised
- Hero content block top-aligned to sit just below the header (section items-start, top padding 96px desktop / 96px mobile instead of 112/128); verified on both viewports, no overflow

## Implemented (2026-10-13u) — contrast & richer canvas
- Type darkened site-wide: ink base #2E311F → #202312, all body-text opacities raised (e.g. /65 → /80), footer cream text brightened, italic accents set to full olive — noticeably more legible on laptops
- Richer canvas: base cream #F6F2E9 → parchment #F1EBDC (creamdeep #E6DECA), limewash texture rolled out on every page, film grain retained — large-screen whitespace now feels filled

## Implemented (2026-10-13v) — products tagline
- Products sub-line replaced with "Turning Exotics to Staples." set in the italic accent style

## Implemented (2026-10-13w) — story vignettes
- Field-notebook style "Fig." studies fill the empty left columns on the theory page: Fig. 01 (ripe mango on stone pedestal, golden light) under "There is a theory behind every harvest."; Fig. 02 (steeping cup by a window) beside "Slow time" — gentle, artistic, captioned in small caps

## Implemented (2026-10-13x) — scroll interludes (interim, easily revertible)
- New reusable Interlude component (components/Interlude.jsx): full-width pause with a giant ghost italic word + one quiet phrase + small caption
- Products: interlude inserted mid-grid after the 6th card ("Patience / Good things steep.") when a view has 7+ items; Story: "Ceremony / Between convenience and ceremony."; Approach: "Consistency / Every batch, the same standard."
- Revert = delete the three usages (and optionally the component)

## Implemented (2026-10-13y) — break rule
- Products grid now inserts an Interlude after every 4 products (row-aligned in the 2-col grid), cycling through editable lines in src/data/site.js (PRODUCT_BREAKS): Patience/Ritual/Purpose; verified 3 breaks on All(13), 2 on Teas(9), 0 on Botanical(1)

## Implemented (2026-10-13z) — product pages fit one screen
- Product detail restructured: image reduced to a compact 4:3 (sticky beside the text), headline tightened, detail rows condensed (py-8→py-6), CTA row tightened — image + name + subname + tagline + description + first detail rows all visible in the first 900px viewport (measured: image bottom 586px, name 281px, description 445px)
- Fixed a regression where the text column lost its grid span and collapsed to one word per line; limewash retained

## Implemented (2026-10-14a) — compact product cards
- Product card images reduced from tall 3:4 to compact 4:3, card text tightened, staggered offsets removed, grid gaps reduced — a full row of 2 products (image + description) now measures ~570px and fits within one screen on desktop (mobile card ~350px); the every-4 interlude rhythm still aligns

## Implemented (2026-10-14b) — prices & japan purge
- The last Japan reference (homepage story teaser) replaced with the introspection story — zero Japan/trip references anywhere on the site (grep-verified)
- All 13 products now carry placeholder prices (₹ 320–₹ 550 by category) in the editable price field, shown on each product page

## Implemented (2026-10-14c) — prices visible while browsing
- Root cause of "I don't see the prices": prices existed in the data and on product detail pages, but ProductCard never rendered them — the Products grid and Home featured section showed no prices at all
- Price now shown as a small elegant line under each card's description (13/13 cards, ₹ 320–₹ 550), with data-testid product-price-{slug}
- Product detail: price surfaced beside the "Order — Coming Soon" button (display type, data-testid product-detail-cta-price) in addition to the details list
- Verified desktop (1440) + mobile (390): 13/13 price labels render, CTA price present, no overflow-x

## Implemented (2026-10-14d) — The Harvest Journal
- New editorial section at /journal (nav label JOURNAL; added to desktop nav, mobile nav, footer Explore) — landing has hero ("Stories about what we grow, what we drink, and why it matters."), featured story (Lopchu) + 2-col editorial grid, category filters (Tea & Ritual / Ingredients / Origins / The Harvest Theory / Brewing) with ?cat= params and empty state
- 6 seeded, researched articles in src/data/journal.js (typed body blocks: lead/p/h2/quote/image/fact/list; *italic* accents and [label](/path) internal links parsed by RichText): Lopchu provenance (featured), Blue Pea chemistry, chamomile history, hibiscus across cultures, mint/menthol-TRPM8 + lemongrass, floral-infusions field guide — each with category, excerpt, date, computed reading time, byline "The Harvest Theory", image alt text
- Every article: Sources & further reading (real verified external links: Wikipedia, NCCIH, AHPA, McGill OSS, ACS, Nature, NCBI, AramcoWorld, Serious Eats), restrained "Taste what you've been reading about" product module (links to real product pages), "More from the Journal" related stories (same category first)
- HEALTH-CLAIM POLICY (user requirement): no therapeutic claims anywhere — tradition/sensory framing ("traditionally consumed", "research has investigated… evidence remains limited"), explicit "nothing here is medical advice" note; testing agent grep-verified prohibited phrases absent
- SEO: custom dependency-free Seo.jsx head manager (react-helmet-async avoided on React 19) — per-article unique title/description/og:type=article/article:published_time/Article JSON-LD, Blog JSON-LD on landing, restore-on-unmount to static defaults; robots.txt + llms.txt added; canonical/og:url/sitemap intentionally omitted until a production domain is confirmed (per SEO skill policy)
- Architecture: adding an article = one object in src/data/journal.js; it appears in grid, filters, related stories, JSON-LD automatically
- Design: existing limewash/typography/tokens reused unchanged; no other pages redesigned
- Testing agent: 100% pass — filters (ingredients=3, brewing=1, tea-ritual=1, origins=1, harvest-theory=0 empty state), SEO tags + title reset, nav fits at 1440/1280/1024, mobile 390 no overflow, regression on all existing pages + prices intact, no console errors

## Implemented (2026-10-14e) — founder portraits
- Real portraits added for two of three founders from user-uploaded assets: Punith Prasad (founders/punith.jpg, from "Punith Founder Pic.jpeg") and Vartika Verma (founders/vartika.jpg, PNG converted/optimised to JPG) — rendered in the Story page founders section in the 3:4 cards with descriptive alt text; Shiva Chaitanya keeps the initials placeholder ("Portrait to come") until his portrait arrives
- FOUNDERS data in src/data/site.js now carries an image field (null = placeholder); Story.jsx renders photo when present, placeholder when not — drop-in replacement for Shiva's later
- Verified desktop (1440) + mobile (390): both photos render correctly matched to the right founder per the uploaded filenames, placeholder intact, no overflow
- Shiva Chaitanya's portrait added (founders/shiva.jpg, from "Shiv founder pic.png") — all three founders now show real portraits; placeholder path retained in Story.jsx as fallback for any future null image

## Backlog
- P1: Real pricing (placeholders ₹ 320–₹ 550 currently shown) + real provenance data (field exists, blank); real founder portraits; FSSAI details
- P1: Journal growth — provenance-led stories on turmeric, lemongrass, moringa, matcha and the farms/suppliers behind THT ingredients (user direction); backend for contact/orders → email → Slack integration → Slackbot reconciliation (form schemas ready)
- P2: Reviews capability; ecommerce checkout; lab reports, batch traceability, export certifications
