# Spunfor data registry

Every place Spunfor keeps data, what is in it, and where its backup lives.
Keep this file and the Obsidian note `Projects/Spunfor Data Registry` in step when anything changes.

_Last updated: 2026-10-16_

## 1. City data collector (source of truth for curated cities)

| | |
|---|---|
| Lives on | Will's PC, `C:\Users\willw\spunfor-data\` |
| Backed up to | Private GitHub repo **Luckygoats33/spunfor-data** (code, config, schema, finished city files) |
| Not backed up (rebuildable) | `osm/` raw OpenStreetMap extracts (~30 GB, re-download from Geofabrik), `cache/` HTTP cache, `out/` zips, per-city `raw/`, `work/`, `photos/` |
| City list | `config/cities.yaml`: 20,881 US places (about 6,500 expected to publish a page, about 2,700 a full guide) |
| Finished cities | `cities/<slug>/trips/<slug>.json` + `qa_report.md` (29 passed QA on 2026-10-16) |
| Sources | OpenStreetMap (local Geofabrik index + Nominatim), Wikidata, Wikipedia, Wikimedia Commons, Open-Meteo. No paid APIs; Google Places is off |
| Known issue | Places with no known hours are written as an empty week (`{"mon":[],...}`), which reads as "closed every day". The app treats an all-empty week as unknown; fix at the source |

## 2. Published city files (what the app reads)

| | |
|---|---|
| Lives in | This repo, `v2/cities/<slug>.json` (~50 KB each) and `v2/cities/index.json` (compact rows for every listed place) |
| Built by | `v2/tools/pack_cities.py` from the collector (run it after more cities pass QA) |
| Photos | Not stored here. Hotlinked from Wikimedia Commons with per-photo credit |
| Hosting | GitHub Pages: https://luckygoats33.github.io/spunfor/v2/cities/ |

## 3. Live-built cities (any town without a curated file)

Built inside the visitor's browser from OpenStreetMap (Photon + Nominatim) the first time the app opens,
then cached in that browser's localStorage for 7 days (`sf.live2.<city>@<hotel>`). Nothing is stored on a server.

## 4. Traveler data (on each phone only)

| What | Where | Key |
|---|---|---|
| The trip itself (city, dates, travelers, hotel, flights, likes, style) | The trip link (`?t=` base64 JSON) and localStorage | `sf.lastTrip`, `sf.myTrips` |
| Saves, journal, check-ins, plan, checklist | localStorage, per trip | `sf.<tripId>.saved`, `.visited`, `.plan`, `.checks`, `.myChecks`, `.mustPlaces` |
| Who this phone is, auto check-in, look | localStorage | `sf.me.<tripId>`, `sf.auto.<tripId>`, `sf.mode` |
| Site style choice | localStorage | `sf.siteStyle` |
| Weather cache | localStorage, 3 hours | `sf.wx.<lat,lon>` |

No accounts, no analytics, no server database. Backups: the app's More → Back up this trip (link, file download, restore).
Privacy note: the trip link contains hotel and flight details. "Share without hotel & flights" makes a link without them.

## 5. Planned, not built

- **Firebase (free plan)** for live shared trips (Tara + Emily saves/votes), cloud backup and short private links.
  Not created yet; waiting on Will (2026-10-16: "not yet").

## Related: New Orleans trip app (separate repo)

- Public site Luckygoats33/nola-trip: all data on each phone (localStorage `nola-*` keys); place data built into the page.
- claude.ai artifact version: artifact database with `picks` (group votes) and `logs` (activity log), owner-readable.
