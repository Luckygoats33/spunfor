# Spunfor (spunfor.me): landing site + demo app

Static, dependency-free (Leaflet is vendored). Serve the folder with any static server:

```bash
cd spunfor-site && python3 -m http.server 8000   # then open http://localhost:8000
```

**Local only.** Nothing here is published, deployed or connected to a payment provider.

```
index.html  style.css  app.js     landing page, chat, preview, unlock modal, TEST checkout
fonts/                            Unbounded (display), Bricolage Grotesque (UI), DM Mono (labels): OFL, self-hosted, no CDN
logo*.svg  favicon.svg  favicon-32.png  apple-touch-icon.png  icon-192/512/maskable PNGs
tests/e2e.py                      Playwright + Chrome end-to-end test (390 and 1280)
logo-concepts/                    3 "spun" logo concepts (A "Spun Pin" is primary) + notes
demo/index.html                   the demo app: a faithful copy of the NOLA V3 app (see below)
demo/{photos,places,ink}/         V3 images, copied as-is
demo/fonts/ demo/vendor/          V3's fonts (Fraunces, DM Sans, DM Mono) self-hosted; Leaflet 1.9.4 + markercluster, served locally
demo/manifest.webmanifest icon.svg
```

## Brand: spun together
The idea: a trip is **spun together**. Rotation, spinning discs and rings, orbital/spiral geometry, and modules that spin into place and snap into a trip. (The earlier sewing metaphor is retired everywhere.)
Palette (own it, no gradients, no glass, no purple/blue): ink `#0D0D0C`, bone `#F3EFE4`, lime `#C8F31D`, tomato `#FF4A1C`. Type: **Unbounded** 900 for display (huge, tracking -0.05em), **Bricolage Grotesque** for UI, **DM Mono** for labels.
Motion: hero rings spin in from random angles and snap into place, then drift; a giant spiral turns with scroll; module cards, steps and chat bubbles rotate into place as they appear; buttons spin their arrow on hover; the chat progress is a dial. All of it stops under `prefers-reduced-motion`.
Logo: **Spun Pin**, a map pin whose face is a spiral wound from a tomato center dot; wordmark is Unbounded Black outlined. See `logo-concepts/`.
This brand applies to the landing page, chat, preview, unlock modal and checkout, **not** the app chrome.

## Pricing (local test build)
- **Consumer: $29.99 one-time** (was $9.99). Includes full customization chosen in the unlock modal: color scheme (Generic blue/white/gray, City colors, Custom colors) and optional modules (Ink/tattoos, Nature, Nightlife, History/Time Machine, Celebration, Animals, Food/dietary), on the NOLA V3 design/layout/functionality. Choices are saved in `localStorage` (`spunfor.theme` is read by the demo; `spunfor.modules` and `unlock.custom` are saved for the build; the demo does not yet toggle modules).
- **Business: from $299/month** for vacation planners/agencies (white-label, client sharing, reusable trip templates). Landing section `#planners` with a **Talk to us** action: a clearly marked placeholder form that only builds a `mailto:` link to `business@spunfor.example`. No backend, nothing sent.
- Promo `goat` stays free. TEST MODE labels stay.

## Visitor flow
1. Chat (flight, dates, destination, likes, dislikes, optional budget/group/needs).
2. A **personalized app preview** (phone mockup using their answers) renders, then the modal **"Unlock your personalized app — $29.99"** opens with a promo box.
3. **Promo `goat`** (case-insensitive) makes it free: no payment screen, straight to the success screen.
4. **Buy** opens the **TEST checkout**: order summary, email, simulated card form, then a processing state, then a receipt that unlocks the app ("Open my app" → `demo/`).
   - `4242 4242 4242 4242`, any future expiry, any CVC → success.
   - `4000 0000 0000 0002` → "Your card was declined".
   - Any other number is rejected ("Test mode only accepts test cards") and cleared, so a real card is never "processed" even by the simulation.
   - Everything is labeled **TEST MODE – no real charge**. Card fields have no `name`, `autocomplete="off"`, are only read by in-page JS and are never stored or transmitted. The receipt id and unlock flag are saved in `localStorage` (`spunfor.unlock`); the trip answers are saved at unlock as `spunfor.trip` so the app can personalize.

### Config (`window.SPUNFOR_CONFIG` in `index.html`)
```js
window.SPUNFOR_CONFIG = {
  price: 29.99, currency: 'USD', testMode: true,
  promoCodes: { goat: 100 },        // % off. DEMO ONLY
  checkoutUrl: '',                  // Stripe hook, see below
  demoPath: 'demo/index.html'
};
```

### Promo check is demo-only
The `goat` check runs in the browser, so anyone can read it in the source. **In production, validate promo codes server-side** (e.g. when creating the Stripe Checkout Session with a Coupon/Promotion Code) and never trust a client-side `localStorage` unlock flag: confirm entitlement from a signed server record (webhook → database), and gate the real app on that.

### Stripe later (test mode first)
When `checkoutUrl` is non-empty, **Buy skips the simulated form** and navigates to `checkoutUrl?client_reference_id=spunfor-<ts>`.
1. Server endpoint creates a Checkout Session in **Stripe test mode** (`sk_test_…`, price $29.99, `allow_promotion_codes: true`, `success_url=https://spunfor.me/demo/?paid={CHECKOUT_SESSION_ID}`), returning its URL (or use a test-mode Payment Link).
2. Set `checkoutUrl` to that endpoint/Payment Link. Stripe's own page takes the card (test card 4242…); card data never touches Spunfor.
3. Verify with a `checkout.session.completed` webhook; only then mark the user entitled. Switch to live keys only after the server-side validation above exists.
Do not put secret keys in this repo or in client JS.

## Demo app (`demo/`)
`demo/index.html` is a **faithful copy of https://luckygoats33.github.io/nola-trip/v3/** (the NOLA Girls trip app): same markup, CSS, data, venues, collections, Golden Girls personas and wording, Time Machine, Holla Holla, Surprise Me, Saved tabs, Ink, help and tours, Ask, install pop-up. It runs standalone from this folder. Source snapshot: `nola-trip` repo, `v3/index.html` as served on 2026-10-15.

Differences from V3 (everything else is byte-for-byte V3):
1. **Self-hosted assets:** Google Fonts and the cdnjs Leaflet/markercluster scripts are replaced by local copies (`demo/fonts`, `demo/vendor`); the same families and versions.
2. **Service worker registration removed** (V3 registered `../sw.js` on its own origin). Manifest and icon paths point at `demo/`.
3. **Theme picker added**, the only new feature: Generic (blue/white/gray), City colors (V3's own palette, the default) and Custom (color picker). It lives at the top of **Help > Trip details** and works only by overriding the CSS variables V3 already uses (`--coral --accent --burg --brass --bg --surface ...`) in both Day and After Dark. Three hard-coded brand hex values inside V3's `<style>` blocks (`#7B2446`, `#D9A441`) became `var(--burg)` / `var(--brass)` so they follow the theme; the resulting City colors are identical to V3. Theme is stored in `localStorage spunfor.theme`. A "Back to Spunfor" link sits in that box.
4. **Private data removed** (the demo is public): the real travelers' names (replaced by neutral wording), the niece's 21st birthday framing (renamed "The Big Night", ages removed), the real hotel (replaced by "Sample Hotel, 123 Sample St" with a fictional 555 phone and approximate map point), the real flight itinerary (replaced by a fictional "Sample Air" itinerary), and the names in the custom tattoo designs. Public business data (venue addresses, phones, hours, tattoo shop contacts) is kept as in V3. The trip dates (Nov 4 to 8, 2026) are kept so the countdown works.

External requests exactly as V3: OpenStreetMap tiles, open-meteo weather and Nominatim search, and only when those features are used.
Local storage keys are V3's (`nola*`). Rebuild: see `tests/e2e.py` and the replacement list in the git history.

## Honesty & privacy
- Demo data is the V3 research dataset (Oct 2026); hours change, always verify with the venue. Price tiers are estimates.
- The landing page makes no third-party requests, uses no analytics or cookies. Chat answers and the unlock flag stay in `localStorage` (`spunfor.trip`, `spunfor.unlock`).
- The demo app only calls OpenStreetMap, open-meteo and Nominatim when those features are used (same as V3).

## Testing
`python3 -m http.server 8433 --bind 127.0.0.1` in this folder, then `python3 tests/e2e.py [screenshot-dir]` (Playwright + system Chrome). Covers chat, promo `goat`, bad promo, declined / non-test / approved test cards, the demo tabs and key V3 features, the theme picker, dark mode, the help tour, a personal-data check, reduced motion; asserts no JS errors, no horizontal scroll and WCAG AA text contrast at 390 and 1280.
