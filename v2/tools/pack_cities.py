"""Pack finished city files from the local collector (spunfor-data) into slim web files for spunfor.me v2.
Photos are hotlinked from Wikimedia Commons (thumbnail URLs) with their credit, so only small JSON is published.
Usage:  py -3 tools/pack_cities.py  (run from the v2 folder)"""
import json, os, re, sys, urllib.parse, pathlib, yaml
SRC = pathlib.Path(os.path.expanduser("~/spunfor-data"))
OUT = pathlib.Path(__file__).resolve().parent.parent / "cities"
OUT.mkdir(exist_ok=True)
KEEP_P = ["id", "n", "c", "a", "d", "walk", "pr", "ph", "ad", "note", "url", "rating", "review_count", "wp_url"]

def thumb(title, width=640):
    name = title.split(":", 1)[1] if ":" in title else title
    return "https://commons.wikimedia.org/wiki/Special:FilePath/" + urllib.parse.quote(name.replace(" ", "_")) + "?width=" + str(width)

def pack(slug):
    f = SRC / "cities" / slug / "trips" / (slug + ".json")
    qa = SRC / "cities" / slug / "qa_report.md"
    if not f.exists() or not qa.exists() or "PASS" not in qa.read_text(encoding="utf-8", errors="ignore"):
        return None
    j = json.loads(f.read_text(encoding="utf-8"))
    photos = {}
    for pid, p in (j.get("photos") or {}).items():
        t = p.get("commons_title")
        if not t: continue
        photos[pid] = {"src": thumb(t), "credit": p.get("attribution_text") or "", "page": p.get("source_url") or ""}
    out = {
        "v": 1, "slug": slug, "built": j.get("generated_at"), "city": j["city"], "sources": j.get("sources", []),
        "CATS": j.get("CATS", {}), "HOODS": j.get("HOODS", []),
        "P": [{k: p.get(k) for k in KEEP_P if p.get(k) not in (None, "", [])} for p in j["P"]],
        "COORD": j.get("COORD", {}),
        "HRS": {k: {"h": v.get("hours"), "t": v.get("hoursText"), "src": v.get("source")} for k, v in (j.get("HRS") or {}).items() if v and v.get("hours")},
        "CHECKS": j.get("CHECKS", []), "weather": j.get("weather"), "sunset": j.get("sunset"), "PHOTOS": photos,
    }
    (OUT / (slug + ".json")).write_text(json.dumps(out, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    return out

seed = yaml.safe_load((SRC / "config" / "cities.yaml").read_text(encoding="utf-8"))["cities"]
index, ready = [], 0
for c in seed:
    done = pack(c["slug"])
    if done: ready += 1
    index.append({"s": c["slug"], "n": c["name"], "st": c.get("state") or "", "c": [round(x, 4) for x in (c.get("center") or [0, 0])], "pop": c.get("population") or 0, "r": 1 if done else 0})
index.sort(key=lambda x: -x["pop"])
# compact rows keep the index small enough for the homepage: [slug, name, state, lat, lon, population in thousands, ready]
rows = [[c["s"], c["n"], c["st"], round(c["c"][0], 3), round(c["c"][1], 3), round((c["pop"] or 0) / 1000, 1), c["r"]] for c in index]
(OUT / "index.json").write_text(json.dumps({"built": __import__("datetime").date.today().isoformat(), "f": ["s", "n", "st", "lat", "lon", "popK", "r"], "rows": rows}, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
print(f"index: {len(index)} cities, {ready} ready")
