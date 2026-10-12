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

## Verified
- Desktop (1440) + mobile (390) screenshots of all pages; no overflow-x
- Filters (seafood → 1 card), product detail, buy toast, contact fill→submit→success, mobile menu open→navigate

## Backlog
- P1: Ingredients / Our Approach page (structure reserved on home + footer "Soon")
- P1: Real story copy on /story (user to provide)
- P1: Backend for contact enquiries (currently frontend-only by choice)
- P2: Journal; ecommerce checkout; real product assets & prices; export/wholesale catalogue
