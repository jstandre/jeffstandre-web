#!/usr/bin/env python3
"""
Rebuild data/federal-campgrounds.json from the Campsite Atlas open data CSV.

Campsite Atlas publishes every campground in the U.S. federal recreation
system (Forest Service, Army Corps, NPS, BLM, Reclamation, Fish & Wildlife),
cleaned from the Recreation.gov RIDB export and released under CC0:
https://github.com/kirkwood-justin/campsite-atlas-data

Usage:
    python3 build_campgrounds.py                 # download the latest CSV
    python3 build_campgrounds.py campgrounds.csv # use a local copy

Zero dependencies (standard library only). Output is written next to the
directory page so the site stays a plain static folder.
"""

import csv
import io
import json
import sys
import urllib.request
from datetime import date
from pathlib import Path

SOURCE_BASE = "https://raw.githubusercontent.com/kirkwood-justin/campsite-atlas-data/main/"
SOURCE_CSV = SOURCE_BASE + "campgrounds.csv"
SOURCE_SNAPSHOT = SOURCE_BASE + "SNAPSHOT.txt"
OUTPUT = Path(__file__).resolve().parent.parent / "data" / "federal-campgrounds.json"

# Bit flags packed into one integer per row to keep the file small.
FLAGS = {
    "reservable": 1,
    "book_url": 2,
    "electric": 4,
    "water": 8,
    "sewer": 16,
    "pets": 32,
    "campfires": 64,
    "confirmed_free": 128,
}

# RIDB agency abbreviations we keep. Rows with no agency are test records.
AGENCIES = {"FS", "USACE", "NPS", "BLM", "BOR", "FWS", "NAVY", "Presidio"}


def read_rows(path=None):
    if path:
        with open(path, newline="", encoding="utf-8") as fh:
            return list(csv.DictReader(fh))
    with urllib.request.urlopen(SOURCE_CSV, timeout=60) as resp:
        text = resp.read().decode("utf-8")
    return list(csv.DictReader(io.StringIO(text)))


def read_snapshot(path=None):
    """Return the upstream retrieval date (e.g. "September 24, 2026"), or ''."""
    try:
        if path:
            snapshot = Path(path).resolve().parent / "SNAPSHOT.txt"
            return snapshot.read_text(encoding="utf-8").strip() if snapshot.exists() else ""
        with urllib.request.urlopen(SOURCE_SNAPSHOT, timeout=30) as resp:
            return resp.read().decode("utf-8").strip()
    except OSError:
        return ""


def to_int(value):
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


def to_coord(value):
    try:
        return round(float(value), 5)
    except (TypeError, ValueError):
        return None


def pack(row):
    flags = 0
    for key, bit in FLAGS.items():
        if key == "book_url":
            if row.get("book_url"):
                flags |= bit
        elif row.get(key) == "True":
            flags |= bit

    nps_url = (row.get("nps_url") or "").strip()
    return [
        row["facility_id"].strip(),
        " ".join(row["name"].split()),
        row["state"].strip().upper(),
        row["agency"].strip(),
        " ".join((row.get("rec_area") or "").split()),
        to_coord(row.get("lat")),
        to_coord(row.get("lon")),
        flags,
        to_int(row.get("total_sites")),
        to_int(row.get("max_rv_length_ft")),
        nps_url,
    ]


def main():
    path = sys.argv[1] if len(sys.argv) > 1 else None
    rows = read_rows(path)
    packed = [pack(r) for r in rows if r.get("agency", "").strip() in AGENCIES]
    packed.sort(key=lambda r: (r[2], r[1].lower()))

    payload = {
        "source": {
            "name": "Campsite Atlas open data (Recreation.gov RIDB)",
            "url": "https://github.com/kirkwood-justin/campsite-atlas-data",
            "license": "CC0 1.0",
            "snapshot": read_snapshot(path),
            "built": date.today().isoformat(),
        },
        "fields": ["id", "name", "state", "agency", "unit", "lat", "lon",
                   "flags", "sites", "maxRv", "npsUrl"],
        "flags": FLAGS,
        "rows": packed,
    }

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as fh:
        json.dump(payload, fh, separators=(",", ":"), ensure_ascii=False)
        fh.write("\n")

    print(f"Wrote {len(packed)} campgrounds to {OUTPUT}")


if __name__ == "__main__":
    main()
