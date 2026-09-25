# Camp & Park Directory

A searchable directory of Scouting America camps, national parks, state parks, Army Corps of Engineers parks, and other public lands. It's plain HTML, CSS, and JavaScript with no build step, so it runs as a static folder on GitHub Pages.

Live at `https://jeffstandre.com/tools/CampDirectory/`.

## What it does

- **Browse by category**: Scouting America (including every approved National Historic Trail), National Parks, State Parks, Army Corps, and Public Lands, plus *My entries* and *Starred*.
- **Search and filter** by name, lake, forest, council, city, state, type, or your own notes. Filter campgrounds by amenities (reservable, electric, water, pets, campfires, free).
- **Sort** by name, state, managing unit (for example, every campground on one Corps lake together), or distance from you.
- **Keep your own info**: add entries (like local council camps or state parks), fix or fill in contact details on any listing, write notes, and star places.
- **Import and export**: import CSV spreadsheets or a JSON backup; export a backup, the current results as CSV, or a blank import template.

Your additions, edits, notes, and stars are saved in the browser's `localStorage`. They don't leave your device unless you export them.

## Data

| File | Contents | Source |
|---|---|---|
| `data/federal-campgrounds.json` | Every campground in the federal recreation system (Army Corps, Forest Service, NPS, BLM, Reclamation, Fish & Wildlife) | [Campsite Atlas open data](https://github.com/kirkwood-justin/campsite-atlas-data), cleaned from the Recreation.gov RIDB export (CC0) |
| `data/curated.json` | All 63 national parks, the official park agency for all 50 states, Scouting America's national high adventure bases and national office, and the federal land agencies | Curated list with links to each official website |
| `data/scouting-historic-trails.json` | All 220 approved National Historic Trails and the 99 councils that run them, with council headquarters and websites | Scouting America's National Historic Trails list (PDF, updated August 2026), linked from [scouting.org/outdoor-programs/camping](https://www.scouting.org/outdoor-programs/camping/) |

The historic trails list was converted from the PDF with a script, then checked by hand. Spelling in council, city, and trail names was corrected (for example, "Flordia" and "Patroits Path"). Approval and renewal notes, trail links, and one phone number were moved into their own fields. Trails outside their council's home state are filed under the trail's state (for example, the National Capital Area Council's Fredericksburg and Manassas trails are under Virginia). The PDF's totals say 221 trails, but it lists 220: Southwest Florida Council is marked as having two trails and names only one.

What's **not** bundled yet: individual state parks and local council camps. No open, complete dataset for either was available when this was built. Each state park system entry links to that state's full park list, and the Scouting America tab points to the council locator. Add these places yourself or import a CSV.

Contact details change. Confirm phone numbers, hours, and fees with the managing office before a trip.

### Refreshing the campground data

```bash
python3 scripts/build_campgrounds.py            # downloads the latest CSV
python3 scripts/build_campgrounds.py file.csv   # or use a local copy
```

The script uses only the Python standard library. It packs amenity flags into one integer per row to keep the file small (about 150 KB gzipped).

## CSV import format

The first row holds the column names. Only `name` is required:

```
name, category, type, organization, unit, address, city, state, zip, contact, phone, email, website, reservations, lat, lon, description, notes
```

`category` can be `scouting`, `national park`, `state park`, `army corps`, or `public lands`. Rows without one use the category you pick in the import dialog. `state` can be a two-letter code or a full name.

## Running locally

The page loads its data with `fetch`, so serve the repo over HTTP instead of opening the file directly:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/tools/CampDirectory/
```
