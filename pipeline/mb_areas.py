"""On-demand locality rental fetcher for RentVent.

Fetches live rental listings for Bengaluru localities (either all 30 hubs or only those
within --km of --lat/--lng) and writes lightweight per-area JSON shards to:
  web/public/data/areas/<city>/<slug>.json

Usage:
  python3 mb_areas.py                                       # fetch all 30 Bengaluru hubs (~30s)
  python3 mb_areas.py --lat 12.9259 --lng 77.6762 --km 5    # fetch only areas within 5 km of Bellandur
"""
import argparse
import datetime
import json
import math
import pathlib
import re
import statistics
import time
import urllib.parse
import urllib.request

ROOT = pathlib.Path(__file__).parent
WEB_AREAS = ROOT.parent / "web" / "public" / "data" / "areas" / "bangalore"
HIST_PATH = ROOT.parent / "data" / "rent_history" / "bangalore.json"
UA = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36"

BLR_LOCALITIES = [
    ("bellandur", "Bellandur", 12.9259, 77.6762),
    ("hsr-layout", "HSR Layout", 12.9121, 77.6446),
    ("koramangala", "Koramangala", 12.9352, 77.6245),
    ("indira-nagar", "Indiranagar", 12.9784, 77.6408),
    ("whitefield", "Whitefield", 12.9698, 77.7500),
    ("marathahalli", "Marathahalli", 12.9591, 77.6974),
    ("sarjapur-road", "Sarjapur Road", 12.9081, 77.6858),
    ("electronic-city", "Electronic City", 12.8452, 77.6602),
    ("kadubeesanahalli", "Kadubeesanahalli", 12.9378, 77.6952),
    ("haralur-road", "Haralur Road", 12.9012, 77.6578),
    ("mahadevapura", "Mahadevapura", 12.9896, 77.6915),
    ("brookefield", "Brookefield", 12.9655, 77.7176),
    ("btm-layout", "BTM Layout", 12.9166, 77.6101),
    ("jp-nagar", "JP Nagar", 12.9063, 77.5857),
    ("jayanagar", "Jayanagar", 12.9308, 77.5838),
    ("hebbal", "Hebbal", 13.0358, 77.5970),
    ("yelahanka", "Yelahanka", 13.1007, 77.5963),
    ("bannerghatta-road", "Bannerghatta Road", 12.8891, 77.5968),
    ("kanakapura-road", "Kanakapura Road", 12.8855, 77.5528),
    ("kr-puram", "KR Puram", 13.0012, 77.6954),
    ("hoodi", "Hoodi", 12.9922, 77.7159),
    ("kudlu", "Kudlu", 12.8862, 77.6558),
    ("varthur", "Varthur", 12.9389, 77.7412),
    ("panathur", "Panathur", 12.9344, 77.7048),
    ("kasavanahalli", "Kasavanahalli", 12.9069, 77.6754),
    ("domlur", "Domlur", 12.9609, 77.6387),
    ("cv-raman-nagar", "CV Raman Nagar", 12.9855, 77.6639),
    ("hennur", "Hennur", 13.0398, 77.6431),
    ("thanisandra", "Thanisandra", 13.0588, 77.6335),
    ("banashankari", "Banashankari", 12.9255, 77.5468),
]


def haversine_km(lat1, lng1, lat2, lng2):
    r = math.pi / 180
    dlat, dlng = (lat2 - lat1) * r, (lng2 - lng1) * r
    h = math.sin(dlat / 2) ** 2 + math.cos(lat1 * r) * math.cos(lat2 * r) * math.sin(dlng / 2) ** 2
    return 12742 * math.asin(math.sqrt(h))


def parse_coords(item):
    lat, lng = item.get("pmtLat"), item.get("pmtLong")
    if lat and lng and float(lat) > 10 and float(lng) > 70:
        return float(lat), float(lng)
    geo = item.get("ltcoordGeo") or ""
    if isinstance(geo, str) and "," in geo:
        parts = geo.split(",")
        try:
            a, b = float(parts[0]), float(parts[1])
            if a > 10 and b > 70:
                return a, b
        except ValueError:
            pass
    return None, None


def norm_id(slug, name):
    s = re.sub(r"[^a-z0-9]+", "-", str(name).lower()).strip("-")[:42]
    return f"live-{slug}-{s}"


def fetch_slug(slug):
    url = f"https://www.magicbricks.com/flats-for-rent-in-{slug}-bangalore-pppfr"
    req = urllib.request.Request(url, headers={"User-Agent": UA, "Accept": "text/html"})
    html = urllib.request.urlopen(req, timeout=20).read().decode("utf-8", "ignore")
    marker = html.find("window.SERVER_PRELOADED_STATE_")
    if marker < 0:
        return [], 0
    jstart = html.find("{", marker)
    jend = html.find("</script>", jstart)
    if jstart < 0 or jend < 0:
        return [], 0
    raw = html[jstart:jend].strip().rstrip(";")
    state = json.loads(raw)
    items = state.get("searchResult") or []

    grouped = {}
    for it in items:
        lat, lng = parse_coords(it)
        rent = int(it.get("price") or 0)
        bhk_raw = str(it.get("bedroomD") or "")
        bhk = int(re.search(r"\d+", bhk_raw).group(0)) if re.search(r"\d+", bhk_raw) else None
        if not lat or not lng or rent < 4000 or rent > 2000000:
            continue
        raw_name = (it.get("prjname") or "").strip()
        loc = (it.get("lmtDName") or slug.replace("-", " ").title()).strip()
        name = raw_name or f"{f'{bhk} BHK ' if bhk else ''}Flat in {loc}"
        key = (raw_name or f"{loc}-{lat:.3f},{lng:.3f}").lower()
        if key not in grouped:
            grouped[key] = {
                "id": norm_id(slug, raw_name or f"{loc}-{it.get('id', int(lat * 1000))}"),
                "name": name,
                "developer": it.get("devName") or "",
                "locality": loc,
                "lat": round(lat, 6),
                "lng": round(lng, 6),
                "kind": "apartment",
                "status": "Ready To Move",
                "url": f"https://www.magicbricks.com/propertyDetails/{it['url']}" if it.get("url") else url,
                "gmaps": f"https://www.google.com/maps/search/?api=1&query={urllib.parse.quote(name + ' ' + loc + ' Bengaluru')}",
                "amenities": [],
                "amen_facts": {},
                "verified": False,
                "live_fetched": True,
                "by_bhk": {},
                "total_rent": 0,
            }
        g = grouped[key]
        g["total_rent"] += 1
        bk = g["by_bhk"].setdefault(str(bhk or 2), {"rents": [], "sqfts": []})
        bk["rents"].append(rent)
        sqft = int(it.get("caSqFt") or it.get("coveredArea") or it.get("carpetArea") or 0)
        if 200 < sqft < 20000:
            bk["sqfts"].append(sqft)

    societies = []
    for g in grouped.values():
        prices, unit_types = {}, []
        for b, bk in sorted(g["by_bhk"].items()):
            med = round(statistics.median(bk["rents"]))
            prices[b] = {"rent": {"median": med, "min": min(bk["rents"]), "max": max(bk["rents"]), "n": len(bk["rents"])}}
            sz = round(statistics.median(bk["sqfts"])) if bk["sqfts"] else None
            unit_types.append({"label": f"{b} BHK{f' {sz:,}' if sz else ''}", "bhk": int(b), "size_sqft": sz, "bedrooms": [], "rooms_complete": False})
        societies.append({
            "id": g["id"], "name": g["name"], "developer": g["developer"], "locality": g["locality"],
            "lat": g["lat"], "lng": g["lng"], "kind": g["kind"], "status": g["status"],
            "url": g["url"], "gmaps": g["gmaps"], "amenities": [], "amen_facts": {},
            "verified": False, "live_fetched": True, "rent_count": g["total_rent"], "sale_count": 0,
            "prices": prices, "unit_types": unit_types, "nearby": {}, "score": None, "shape": "live",
        })
    return societies, len(items)


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--lat", type=float)
    ap.add_argument("--lng", type=float)
    ap.add_argument("--km", type=float, default=5.0)
    args = ap.parse_args()

    targets = BLR_LOCALITIES
    if args.lat is not None and args.lng is not None:
        targets = [t for t in BLR_LOCALITIES if haversine_km(args.lat, args.lng, t[2], t[3]) <= args.km + 2.5]

    WEB_AREAS.mkdir(parents=True, exist_ok=True)
    hist = json.loads(HIST_PATH.read_text()) if HIST_PATH.exists() else {}
    today = datetime.date.today().isoformat()
    total_socs = 0

    for slug, name, _, _ in targets:
        try:
            socs, raw_n = fetch_slug(slug)
            (WEB_AREAS / f"{slug}.json").write_text(json.dumps({"slug": slug, "name": name, "fetched": today, "raw_count": raw_n, "societies": socs}, separators=(",", ":")))
            for s in socs:
                sh = hist.setdefault(s["id"], {})
                for b, p in s["prices"].items():
                    sh[b] = {"value": p["rent"]["median"], "date": today, "n": p["rent"]["n"]}
            total_socs += len(socs)
            print(f"  {slug}: {len(socs)} societies ({raw_n} live listings)", flush=True)
        except Exception as e:
            print(f"  {slug}: FAILED ({e})", flush=True)
        time.sleep(0.8)

    HIST_PATH.parent.mkdir(parents=True, exist_ok=True)
    HIST_PATH.write_text(json.dumps(hist, separators=(",", ":")))
    print(f"Done: {len(targets)} areas -> {total_socs} area societies written to {WEB_AREAS}")


if __name__ == "__main__":
    main()
