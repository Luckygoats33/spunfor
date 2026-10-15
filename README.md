# Spunfor (spunfor.me): landing site + demo app

Static, dependency-free (Leaflet is vendored). Serve the folder with any static server:

```bash
cd spunfor-site && python3 -m http.server 8000   # then open http://localhost:8000
```

**Local only.** Nothing here is published, deployed or connected to a payment provider.

```
index.html  style.css  app.js     landing page, chat, preview, unlock modal, TEST checkout
fonts/                            Instrument Serif, Bricolage Grotesque, DM Mono (OFL, self-hosted, no CDN)
logo*.svg  favicon.svg  favicon-32.png  apple-touch-icon.png  icon-192/512/maskable PNGs
tests/e2e.py                      Playwright + Chrome end-to-end test (390 and 1280)
logo-concepts/                    3 logo concepts (A "Loop Pin" is primary) + notes
demo/index.html demo.css demo.js  the demo app (Home, Map, Explore, Saved, Help)
demo/config.js                    data-driven config: city, tz, palette, collections, moods, venues
demo/manifest.webmanifest sw.js   install-to-home-screen PWA + offline shell
demo/vendor/                      Leaflet 1.9.4 + leaflet.markercluster (BSD/MIT), served locally
```

## Brand: thread & paper
Warm paper `#F2EBDD` with a fine noise grain, ink `#17140F`, ONE signal color vermilion `#F04E28` (`#FF6038` on dark) and a deep neutral `#1C201D`. Type: **Instrument Serif** (display), **Bricolage Grotesque** (UI), **DM Mono** (labels/data), all self-hosted. Motifs: boarding-pass chat, ticket-stub pricing modal, hard-offset tactile buttons, a stitched thread that draws itself down the landing page as you scroll (static when `prefers-reduced-motion`). Logo: **Loop Pin**, a pin drawn as one thread whose tail loops like yarn; checked at 16/32 px.

## Visitor flow
1. Chat (flight, dates, destination, likes, dislikes, optional budget/group/needs).
2. A **personalized app preview** (phone mockup using their answers) renders, then the modal **"Unlock your personalized app — $9.99"** opens with a promo box.
3. **Promo `goat`** (case-insensitive) makes it free: no payment screen, straight to the success screen.
4. **Buy** opens the **TEST checkout**: order summary, email, simulated card form, then a processing state, then a receipt that unlocks the app ("Open my app" → `demo/`).
   - `4242 4242 4242 4242`, any future expiry, any CVC → success.
   - `4000 0000 0000 0002` → "Your card was declined".
   - Any other number is rejected ("Test mode only accepts test cards") and cleared, so a real card is never "processed" even by the simulation.
   - Everything is labeled **TEST MODE – no real charge**. Card fields have no `name`, `autocomplete="off"`, are only read by in-page JS and are never stored or transmitted. The receipt id and unlock flag are saved in `localStorage` (`spunfor.unlock`); the trip answers are saved at unlock as `spunfor.trip` so the app can personalize.

### Config (`window.SPUNFOR_CONFIG` in `index.html`)
```js
window.SPUNFOR_CONFIG = {
  price: 9.99, currency: 'USD', testMode: true,
  promoCodes: { goat: 100 },        // % off. DEMO ONLY
  checkoutUrl: '',                  // Stripe hook, see below
  demoPath: 'demo/index.html'
};
```

### Promo check is demo-only
The `goat` check runs in the browser, so anyone can read it in the source. **In production, validate promo codes server-side** (e.g. when creating the Stripe Checkout Session with a Coupon/Promotion Code) and never trust a client-side `localStorage` unlock flag: confirm entitlement from a signed server record (webhook → database), and gate the real app on that.

### Stripe later (test mode first)
When `checkoutUrl` is non-empty, **Buy skips the simulated form** and navigates to `checkoutUrl?client_reference_id=spunfor-<ts>`.
1. Server endpoint creates a Checkout Session in **Stripe test mode** (`sk_test_…`, price $9.99, `allow_promotion_codes: true`, `success_url=https://spunfor.me/demo/?paid={CHECKOUT_SESSION_ID}`), returning its URL (or use a test-mode Payment Link).
2. Set `checkoutUrl` to that endpoint/Payment Link. Stripe's own page takes the card (test card 4242…); card data never touches Spunfor.
3. Verify with a `checkout.session.completed` webhook; only then mark the user entitled. Switch to live keys only after the server-side validation above exists.
Do not put secret keys in this repo or in client JS.

## Demo app (`demo/`)
Mirrors the NOLA V3 app's structure and behavior, re-skinned in the Spunfor brand, and is data-driven from the chat answers (`localStorage spunfor.trip`) plus `demo/config.js`. Bottom nav **Home · Map · Explore · Saved · Help**; the Ink/tattoo tab is intentionally omitted and personal/birthday content is an optional module (**Celebration night**, auto-enabled when the answers mention a celebration, toggle in Settings).
- **Home**: greeting, live city time, countdown to the trip (parsed from the dates answer), opt-in live weather (open-meteo, only on tap) + Plan B, quick tiles, four customizable **personas** (rename them and edit their lines in Settings), mood chips, **Surprise Me** (3 optional steps: vibe, hours, walk/ride; Spin again; Add to plan; Route it), Open right now, Time Machine and Passport tiles.
- **Holla Holla** (top bar, every screen): shows only what is open this minute in the section you are on, with search, type filters and a "pretend it is…" day/time.
- **Map**: Leaflet + OSM with clustering, Near me, area jump, collection filter, walking-radius ring, open-now/saved filters, color by open, night travel tips, tap to move start, plan drawn as a thread, in-view list.
- **Explore**: search places and history, collections (matched ones marked "for you"), All places with grouped filters, **Time Machine** (history chapters linked to places), persona pages.
- **Saved**: multi-day **Trip plan** (reorder, stay ±15, start time, walk/ride, Plan B swap, Google Maps route), **Group picks** (Must/Maybe/Skip votes per local traveler, "Everyone's in"), **Passport** stamps, **Journal** with heart ratings and notes.
- **Help**: written guide, quick auto tour on first run + full 14-step spotlight tour, Settings (theme, dates, personas, modules), Install app, reset.
- **Themes**: Generic (blue/white/gray), City colors, Custom (picker + presets) over CSS variables; Light / Dark / Auto (dark after local sunset).
- **PWA**: manifest + service worker (offline shell, tiles cached as seen); `beforeinstallprompt` and an iOS/Android/desktop instructions sheet.
- Deep links: `#home #map #explore #saved #help #col.<key> #persona.<key> #place.<id> #tour`.

### Making it another city
Replace `demo/config.js` (`city`, `tz`, `center`, `palette`, `collections`, `moods`, `stopMinutes`, `outdoorIds`, `venues[]`). A venue needs: `id, name, cats[], area, price, address, coords[lat,lng], hours{sun..sat:[["HH:MM","HH:MM"]]}, hoursText, note, source, confidence` (+ optional `phone, url, reserve, music`). Close times earlier than/equal to open (e.g. `"00:00"`, `"02:00"`) are treated as after midnight.

## Honesty & data
- The 23 venues come from the NOLA V3 trip data (research dated Oct 2026): names, addresses, coordinates, weekly hours, hours notes, phone/URL, source link and confidence were copied as-is. Personal wording from the original (names, trip-specific remarks) was removed; no hours were invented. Venues with only approximate/low-confidence hours were left out, except a few marked "medium" which show their confidence in the venue sheet.
- **Estimates** (labeled in the UI): price tiers (`$`–`$$$$`), time spent per stop (`config.stopMinutes`), travel times (walk 4.8 km/h × 1.3 street factor; rideshare ~22 km/h + 5 min).
- Hours change. Always verify with the venue.

## Privacy
No analytics, cookies or trackers. The only third-party request is OpenStreetMap map tiles when the Map tab is opened. Google Maps/venue websites open only when the user taps a link. The previous optional `endpoint` (LLM backend) hook was removed from the landing page to keep it request-free; re-add it behind your own server if needed.

## Testing
`python3 -m http.server 8433 --bind 127.0.0.1` in this folder, then `python3 tests/e2e.py [screenshot-dir]` (Playwright + system Chrome). Covers chat, promo `goat`, bad promo, declined and approved test cards, every demo tab and V3 feature, themes, dark mode, tours, deep links, PWA files, reduced motion; asserts no JS errors, no horizontal scroll and WCAG AA text contrast at 390 and 1280.
