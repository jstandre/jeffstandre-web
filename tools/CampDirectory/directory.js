/**
 * Camp & Park Directory
 * Searchable directory of Scouting America camps, national parks, state parks,
 * Army Corps of Engineers parks, and other public lands.
 *
 * Bundled data lives in data/*.json. Anything the visitor adds or changes
 * (entries, edits, notes, stars) is kept in localStorage and can be exported
 * as a JSON backup or CSV.
 */

const STORAGE_KEY = 'campDirectory.v1';
const PAGE_SIZE = 60;

const CATEGORIES = {
  scouting: { label: 'Scouting America', short: 'Scouting' },
  nps: { label: 'National Park Service', short: 'National Parks' },
  state: { label: 'State Parks', short: 'State Parks' },
  usace: { label: 'Army Corps of Engineers', short: 'Army Corps' },
  public: { label: 'Other Public Lands', short: 'Public Lands' }
};

const TABS = [
  { key: 'all', label: 'All' },
  { key: 'scouting', label: 'Scouting America' },
  { key: 'nps', label: 'National Parks' },
  { key: 'state', label: 'State Parks' },
  { key: 'usace', label: 'Army Corps' },
  { key: 'public', label: 'Public Lands' },
  { key: 'mine', label: 'My entries' },
  { key: 'starred', label: 'Starred' }
];

const CATEGORY_NOTES = {
  scouting: 'Scouting America\'s national high adventure bases, every approved National Historic Trail, the 99 councils that run those trails, and those councils\' camps. Use <strong>Type</strong> to pick Council Camp, Historic Trail, or Council, or sort by <strong>Managing unit</strong> to group everything by council. Camps for other councils aren\'t bundled yet; add yours with <strong>+ Add entry</strong> or import a CSV. Find any council at <a href="https://beascout.scouting.org/" target="_blank" rel="noopener">beascout.scouting.org</a>.',
  nps: 'All 63 national parks plus every campground in the national park system. Set <strong>Type → National Park</strong> to see only the parks.',
  state: 'Every Texas state park, natural area, and historic site is listed with its address and phone number. Other states are listed as their official park system, with a link to that state\'s full list of parks; add the individual parks you use, or import a list as a CSV.',
  usace: 'Army Corps of Engineers campgrounds from Recreation.gov. Sort by <strong>Managing unit</strong> to see each lake or project\'s campgrounds together.',
  public: 'Campgrounds on national forests and grasslands, BLM land, Reclamation reservoirs, and wildlife refuges, plus the agencies that run them.',
  mine: 'Entries you\'ve added. They\'re saved in this browser only. Use <strong>Export → Backup</strong> to keep a copy.',
  starred: 'Entries you\'ve starred. Stars are saved in this browser.'
};

const AGENCY_NAMES = {
  FS: 'USDA Forest Service',
  USACE: 'U.S. Army Corps of Engineers',
  NPS: 'National Park Service',
  BLM: 'Bureau of Land Management',
  BOR: 'Bureau of Reclamation',
  FWS: 'U.S. Fish and Wildlife Service',
  NAVY: 'U.S. Navy',
  Presidio: 'Presidio Trust'
};

const AMENITIES = [
  { key: 'reservable', label: 'Reservable' },
  { key: 'electric', label: 'Electric hookups' },
  { key: 'water', label: 'Water hookups' },
  { key: 'pets', label: 'Pets allowed' },
  { key: 'campfires', label: 'Campfires allowed' },
  { key: 'free', label: 'Free' }
];

const STATE_NAMES = {
  AL: 'Alabama', AK: 'Alaska', AZ: 'Arizona', AR: 'Arkansas', CA: 'California', CO: 'Colorado',
  CT: 'Connecticut', DE: 'Delaware', DC: 'District of Columbia', FL: 'Florida', GA: 'Georgia',
  HI: 'Hawaii', ID: 'Idaho', IL: 'Illinois', IN: 'Indiana', IA: 'Iowa', KS: 'Kansas', KY: 'Kentucky',
  LA: 'Louisiana', ME: 'Maine', MD: 'Maryland', MA: 'Massachusetts', MI: 'Michigan', MN: 'Minnesota',
  MS: 'Mississippi', MO: 'Missouri', MT: 'Montana', NE: 'Nebraska', NV: 'Nevada', NH: 'New Hampshire',
  NJ: 'New Jersey', NM: 'New Mexico', NY: 'New York', NC: 'North Carolina', ND: 'North Dakota',
  OH: 'Ohio', OK: 'Oklahoma', OR: 'Oregon', PA: 'Pennsylvania', RI: 'Rhode Island',
  SC: 'South Carolina', SD: 'South Dakota', TN: 'Tennessee', TX: 'Texas', UT: 'Utah', VT: 'Vermont',
  VA: 'Virginia', WA: 'Washington', WV: 'West Virginia', WI: 'Wisconsin', WY: 'Wyoming',
  AS: 'American Samoa', GU: 'Guam', MP: 'Northern Mariana Islands', PR: 'Puerto Rico',
  VI: 'U.S. Virgin Islands'
};

// Editable fields, in the order they appear in forms and CSV files.
const EDIT_FIELDS = ['category', 'kind', 'name', 'org', 'unit', 'address', 'city', 'state', 'zip',
  'contact', 'phone', 'email', 'website', 'bookUrl', 'lat', 'lon', 'summary'];

const CSV_COLUMNS = ['name', 'category', 'type', 'organization', 'unit', 'address', 'city', 'state', 'zip',
  'contact', 'phone', 'email', 'website', 'reservations', 'lat', 'lon', 'description', 'notes'];

// CSV header aliases → internal field names.
const CSV_ALIASES = {
  name: 'name', 'camp name': 'name', 'park name': 'name', 'property': 'name',
  category: 'category',
  type: 'kind', kind: 'kind',
  organization: 'org', org: 'org', council: 'org', agency: 'org', operator: 'org',
  unit: 'unit', 'managing unit': 'unit', district: 'unit', 'rec area': 'unit', rec_area: 'unit',
  address: 'address', street: 'address', 'street address': 'address',
  city: 'city', town: 'city',
  state: 'state',
  zip: 'zip', 'zip code': 'zip', zipcode: 'zip', postal: 'zip',
  contact: 'contact', 'contact person': 'contact', 'contact name': 'contact', ranger: 'contact',
  phone: 'phone', telephone: 'phone', 'phone number': 'phone',
  email: 'email', 'e-mail': 'email',
  website: 'website', url: 'website', web: 'website',
  reservations: 'bookUrl', 'reservation link': 'bookUrl', 'booking url': 'bookUrl', bookurl: 'bookUrl',
  lat: 'lat', latitude: 'lat',
  lon: 'lon', lng: 'lon', long: 'lon', longitude: 'lon',
  description: 'summary', summary: 'summary',
  notes: 'notes', 'my notes': 'notes'
};

/* ==========================================================================
   Storage
   ========================================================================== */

function emptyStore() {
  return { entries: [], overrides: {}, notes: {}, favorites: [] };
}

function loadStore() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyStore();
    const parsed = JSON.parse(raw);
    return {
      entries: Array.isArray(parsed.entries) ? parsed.entries : [],
      overrides: isPlainObject(parsed.overrides) ? parsed.overrides : {},
      notes: isPlainObject(parsed.notes) ? parsed.notes : {},
      favorites: Array.isArray(parsed.favorites) ? parsed.favorites : []
    };
  } catch (err) {
    console.warn('Could not read saved directory data:', err);
    return emptyStore();
  }
}

function saveStore() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    return true;
  } catch (err) {
    console.warn('Could not save directory data:', err);
    showToast('This browser wouldn\'t save your changes. Export a backup so you don\'t lose them.');
    return false;
  }
}

const store = loadStore();
let favorites = new Set(store.favorites);

/* ==========================================================================
   Data loading & normalizing
   ========================================================================== */

let baseRecords = [];
let records = [];
let byId = new Map();
let campgroundSource = null;
const dataSources = {};

const ui = {
  category: 'all',
  query: '',
  state: '',
  kind: '',
  sort: 'name',
  amenities: new Set(),
  shown: PAGE_SIZE,
  origin: null,
  results: []
};

async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${url}: ${res.status}`);
  return res.json();
}

// Files whose records are already in directory format, keyed by the source tag
// each record gets (used for the "where this came from" line).
const ENTRY_FILES = {
  curated: 'data/curated.json',
  trails: 'data/scouting-historic-trails.json',
  councilCamps: 'data/scouting-council-camps.json',
  txParks: 'data/texas-state-parks.json'
};

async function loadData() {
  const sourceKeys = Object.keys(ENTRY_FILES);
  const [campgrounds, ...entryFiles] = await Promise.allSettled([
    fetchJson('data/federal-campgrounds.json'),
    ...sourceKeys.map(key => fetchJson(ENTRY_FILES[key]))
  ]);

  const list = [];
  entryFiles.forEach((result, i) => {
    const key = sourceKeys[i];
    if (result.status !== 'fulfilled') {
      console.error(result.reason);
      return;
    }
    dataSources[key] = result.value.source || null;
    result.value.entries.forEach(e => list.push({ ...e, source: key }));
  });

  if (campgrounds.status === 'fulfilled') {
    campgroundSource = campgrounds.value.source;
    const { fields, flags, rows } = campgrounds.value;
    rows.forEach(row => list.push(campgroundRecord(Object.fromEntries(fields.map((f, i) => [f, row[i]])), flags)));
  } else {
    console.error(campgrounds.reason);
  }

  const results = [campgrounds, ...entryFiles];
  const failed = results.filter(r => r.status === 'rejected').length;
  if (failed === results.length) {
    throw new Error('No directory data could be loaded.');
  }
  if (failed) {
    showToast('Part of the directory didn\'t load. Refresh to try again.');
  }

  baseRecords = list;
}

function campgroundRecord(row, flagBits) {
  const has = bit => (row.flags & flagBits[bit]) !== 0;
  const category = row.agency === 'USACE' ? 'usace' : row.agency === 'NPS' ? 'nps' : 'public';
  const bookUrl = has('book_url') ? `https://www.recreation.gov/camping/campgrounds/${row.id}` : '';

  return {
    id: `fc-${row.id}`,
    category,
    kind: 'Campground',
    name: row.name,
    org: AGENCY_NAMES[row.agency] || row.agency,
    unit: row.unit,
    state: row.state,
    lat: row.lat,
    lon: row.lon,
    preciseLocation: row.lat != null,
    website: row.npsUrl || '',
    bookUrl,
    lookupUrl: bookUrl ? '' : `https://www.recreation.gov/search?q=${encodeURIComponent(row.name)}`,
    sites: row.sites,
    maxRv: row.maxRv,
    amenities: {
      reservable: has('reservable'),
      electric: has('electric'),
      water: has('water'),
      sewer: has('sewer'),
      pets: has('pets'),
      campfires: has('campfires'),
      free: has('confirmed_free')
    },
    source: 'campgrounds'
  };
}

/** Merge bundled data with the visitor's own entries and edits. */
function rebuildRecords() {
  const mine = store.entries.map(e => ({ ...e, mine: true, source: 'mine' }));
  records = baseRecords.concat(mine).map(base => {
    const override = store.overrides[base.id];
    const rec = override ? { ...base, ...override, edited: true } : { ...base };
    return finalizeRecord(rec);
  });
  byId = new Map(records.map(r => [r.id, r]));
}

function finalizeRecord(rec) {
  rec.states = String(rec.state || '').toUpperCase().split(/[^A-Z]+/).filter(Boolean);
  rec.lat = toNumber(rec.lat);
  rec.lon = toNumber(rec.lon);
  rec.amenities = rec.amenities || {};
  const note = store.notes[rec.id] || '';
  rec.search = [
    rec.name, rec.org, rec.unit, rec.city, rec.kind, rec.contact, rec.summary, note,
    rec.states.join(' '), rec.states.map(s => STATE_NAMES[s] || '').join(' '),
    CATEGORIES[rec.category]?.label
  ].filter(Boolean).join(' ').toLowerCase();
  return rec;
}

/* ==========================================================================
   Helpers
   ========================================================================== */

const $ = sel => document.querySelector(sel);

function isPlainObject(v) {
  return v !== null && typeof v === 'object' && !Array.isArray(v);
}

function escapeHtml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function toNumber(v) {
  if (v === null || v === undefined || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** Return a safe http(s) URL or '' (adds https:// when the scheme is missing). */
function safeUrl(value) {
  const raw = String(value || '').trim();
  if (!raw) return '';
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    return url.protocol === 'https:' || url.protocol === 'http:' ? url.href : '';
  } catch {
    return '';
  }
}

function telHref(phone) {
  const digits = String(phone || '').replace(/[^\d+]/g, '');
  return digits.length >= 7 ? `tel:${digits}` : '';
}

function mailHref(email) {
  const value = String(email || '').trim();
  return /^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(value) ? `mailto:${value}` : '';
}

function displayHost(url) {
  try {
    return new URL(url).host.replace(/^www\./, '');
  } catch {
    return url;
  }
}

function formatNumber(n) {
  return n.toLocaleString('en-US');
}

function locationLine(rec) {
  const place = [rec.city, rec.states.join(', ')].filter(Boolean).join(', ');
  return [rec.unit, place].filter(Boolean).join(' · ');
}

/** "123 Main St, Springfield, IL 62701" style postal address. */
function postalAddress(rec) {
  const cityState = [rec.city, rec.states.join(', ')].filter(Boolean).join(', ');
  return [rec.address, [cityState, rec.zip].filter(Boolean).join(' ')].filter(Boolean).join(', ');
}

function mapsUrl(rec) {
  if (rec.preciseLocation && rec.lat != null && rec.lon != null) {
    return `https://www.google.com/maps/search/?api=1&query=${rec.lat},${rec.lon}`;
  }
  const parts = rec.kind === 'State Park System' || rec.kind === 'Agency' || rec.kind === 'Reservations'
    ? [] : [rec.name, rec.address, rec.city, rec.states.join(' ')];
  const query = parts.filter(Boolean).join(', ');
  if (query) return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  return '';
}

function distanceMiles(a, b) {
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLon / 2) ** 2;
  return 3958.8 * 2 * Math.asin(Math.sqrt(h));
}

function normalizeState(value) {
  const v = String(value || '').trim();
  if (!v) return '';
  const upper = v.toUpperCase();
  if (STATE_NAMES[upper]) return upper;
  const match = Object.entries(STATE_NAMES).find(([, name]) => name.toLowerCase() === v.toLowerCase());
  return match ? match[0] : upper.slice(0, 2);
}

function normalizeCategory(value, fallback) {
  const v = String(value || '').toLowerCase();
  if (!v) return fallback;
  if (CATEGORIES[v]) return v;
  if (v.includes('scout') || v.includes('bsa') || v.includes('council')) return 'scouting';
  if (v.includes('corps') || v.includes('usace') || v.includes('coe')) return 'usace';
  if (v.includes('state')) return 'state';
  if (v.includes('national park') || v === 'nps' || v.includes('park service')) return 'nps';
  if (v.includes('public') || v.includes('forest') || v.includes('blm') || v.includes('refuge')
    || v.includes('reclamation') || v.includes('federal')) return 'public';
  return fallback;
}

function newId() {
  return `u-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

let toastTimer = null;
function showToast(message) {
  const el = $('#toast');
  el.textContent = message;
  el.hidden = false;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.hidden = true; }, 4200);
}

function downloadFile(filename, text, type) {
  const blob = new Blob([text], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/* ==========================================================================
   Filtering & sorting
   ========================================================================== */

function inCategory(rec, category) {
  if (category === 'all') return true;
  if (category === 'mine') return !!rec.mine;
  if (category === 'starred') return favorites.has(rec.id);
  return rec.category === category;
}

function applyFilters() {
  const terms = ui.query.toLowerCase().split(/\s+/).filter(Boolean);
  const results = records.filter(rec => {
    if (!inCategory(rec, ui.category)) return false;
    if (ui.state && !rec.states.includes(ui.state)) return false;
    if (ui.kind && rec.kind !== ui.kind) return false;
    for (const key of ui.amenities) {
      if (!rec.amenities[key]) return false;
    }
    return terms.every(t => rec.search.includes(t));
  });

  const byName = (a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' });
  if (ui.sort === 'state') {
    results.sort((a, b) => (a.states[0] || 'ZZ').localeCompare(b.states[0] || 'ZZ') || byName(a, b));
  } else if (ui.sort === 'unit') {
    results.sort((a, b) => {
      const ua = a.unit || '￿';
      const ub = b.unit || '￿';
      return ua.localeCompare(ub, 'en', { sensitivity: 'base' }) || byName(a, b);
    });
  } else if (ui.sort === 'distance' && ui.origin) {
    results.forEach(r => {
      r.distance = r.lat != null && r.lon != null ? distanceMiles(ui.origin, r) : Infinity;
    });
    results.sort((a, b) => a.distance - b.distance || byName(a, b));
  } else {
    results.sort(byName);
  }

  ui.results = results;
}

/* ==========================================================================
   Rendering
   ========================================================================== */

function renderTabs() {
  const counts = {};
  TABS.forEach(t => { counts[t.key] = 0; });
  records.forEach(r => {
    counts.all++;
    if (counts[r.category] !== undefined) counts[r.category]++;
    if (r.mine) counts.mine++;
    if (favorites.has(r.id)) counts.starred++;
  });

  $('#category-tabs').innerHTML = TABS.map(t => `
    <button type="button" class="tab${ui.category === t.key ? ' active' : ''}" data-tab="${t.key}"
      aria-pressed="${ui.category === t.key}">
      ${t.key in CATEGORIES ? `<span class="dot dot-${t.key}" aria-hidden="true"></span>` : ''}
      <span>${escapeHtml(t.label)}</span>
      <span class="tab-count">${formatNumber(counts[t.key])}</span>
    </button>
  `).join('');
}

function renderStateOptions() {
  const present = new Set();
  records.forEach(r => r.states.forEach(s => present.add(s)));
  const select = $('#state-filter');
  const options = Object.entries(STATE_NAMES)
    .filter(([code]) => present.has(code))
    .sort((a, b) => a[1].localeCompare(b[1]))
    .map(([code, name]) => `<option value="${code}">${escapeHtml(name)}</option>`);
  select.innerHTML = `<option value="">All states</option>${options.join('')}`;
  if (ui.state && !present.has(ui.state)) ui.state = '';
  select.value = ui.state;
}

function renderKindOptions() {
  const kinds = new Map();
  records.forEach(r => {
    if (inCategory(r, ui.category) && r.kind) kinds.set(r.kind, (kinds.get(r.kind) || 0) + 1);
  });
  if (ui.kind && !kinds.has(ui.kind)) ui.kind = '';
  const select = $('#kind-filter');
  select.innerHTML = '<option value="">All types</option>' + [...kinds.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([kind, n]) => `<option value="${escapeHtml(kind)}">${escapeHtml(kind)} (${formatNumber(n)})</option>`)
    .join('');
  select.value = ui.kind;
}

function renderAmenityFilters() {
  $('#amenity-filters').innerHTML = AMENITIES.map(a => `
    <label class="chip-toggle">
      <input type="checkbox" value="${a.key}" ${ui.amenities.has(a.key) ? 'checked' : ''}>
      <span>${escapeHtml(a.label)}</span>
    </label>
  `).join('');
}

function renderCategoryNote() {
  const note = $('#category-note');
  const html = CATEGORY_NOTES[ui.category];
  note.hidden = !html;
  note.innerHTML = html || '';
}

function amenityTags(rec) {
  const tags = [];
  if (rec.sites) tags.push(`${rec.sites} site${rec.sites === 1 ? '' : 's'}`);
  if (rec.amenities.reservable) tags.push('Reservable');
  else if (rec.kind === 'Campground' && !rec.mine) tags.push('First come, first served');
  if (rec.amenities.electric) tags.push('Electric');
  if (rec.amenities.water) tags.push('Water');
  if (rec.amenities.sewer) tags.push('Sewer');
  if (rec.amenities.pets) tags.push('Pets OK');
  if (rec.amenities.campfires) tags.push('Campfires');
  if (rec.maxRv) tags.push(`RVs to ${rec.maxRv} ft`);
  if (rec.amenities.free) tags.push('Free');
  return tags;
}

function quickLinks(rec) {
  const links = [];
  const tel = telHref(rec.phone);
  if (tel) links.push(`<a class="quick-link" href="${tel}">Call</a>`);
  const mail = mailHref(rec.email);
  if (mail) links.push(`<a class="quick-link" href="${escapeHtml(mail)}">Email</a>`);
  const site = safeUrl(rec.website);
  if (site) links.push(`<a class="quick-link" href="${escapeHtml(site)}" target="_blank" rel="noopener">Website ↗</a>`);
  const book = safeUrl(rec.bookUrl);
  if (book) links.push(`<a class="quick-link" href="${escapeHtml(book)}" target="_blank" rel="noopener">Reserve ↗</a>`);
  const info = safeUrl(rec.infoUrl);
  if (info) links.push(`<a class="quick-link" href="${escapeHtml(info)}" target="_blank" rel="noopener">Trail info ↗</a>`);
  return links.slice(0, 3).join('');
}

function renderCard(rec) {
  const cat = CATEGORIES[rec.category];
  const starred = favorites.has(rec.id);
  const tags = amenityTags(rec);
  const distance = ui.sort === 'distance' && Number.isFinite(rec.distance)
    ? `<span class="entry-distance">${formatNumber(Math.round(rec.distance))} mi</span>` : '';
  const hasNote = !!store.notes[rec.id];

  return `
    <article class="entry" data-id="${escapeHtml(rec.id)}">
      <div class="entry-main">
        <div class="entry-top">
          <span class="cat-badge cat-${escapeHtml(rec.category)}">${escapeHtml(cat ? cat.short : 'Other')}</span>
          <span class="entry-kind">${escapeHtml(rec.kind || '')}</span>
          ${rec.mine ? '<span class="entry-flag">Added by you</span>' : ''}
          ${rec.edited ? '<span class="entry-flag">Edited</span>' : ''}
          ${hasNote ? '<span class="entry-flag">Has notes</span>' : ''}
          ${distance}
        </div>
        <h3 class="entry-name"><button type="button" class="entry-open" data-action="open">${escapeHtml(rec.name)}</button></h3>
        <p class="entry-meta">${escapeHtml(locationLine(rec))}</p>
        ${tags.length ? `<div class="entry-tags">${tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
      </div>
      <div class="entry-actions">
        ${quickLinks(rec)}
        <button type="button" class="star-btn${starred ? ' starred' : ''}" data-action="star"
          aria-pressed="${starred}" aria-label="${starred ? 'Remove star from' : 'Star'} ${escapeHtml(rec.name)}"
          title="${starred ? 'Starred' : 'Star this entry'}">${starred ? '★' : '☆'}</button>
      </div>
    </article>
  `;
}

function renderResults() {
  const total = ui.results.length;
  const visible = ui.results.slice(0, ui.shown);
  const container = $('#results');

  if (!total) {
    const emptyMessage = ui.category === 'mine' && !ui.query
      ? '<strong>You haven\'t added anything yet.</strong><p>Use <em>+ Add entry</em> for a council camp, a state park, or any place you want to keep contact info for.</p>'
      : ui.category === 'starred' && !ui.query
        ? '<strong>No stars yet.</strong><p>Tap ☆ on any entry to keep it here.</p>'
        : '<strong>Nothing matches those filters.</strong><p>Try a shorter search or clear a filter.</p>';
    container.innerHTML = `<div class="empty-state">${emptyMessage}</div>`;
  } else {
    let lastGroup = null;
    container.innerHTML = visible.map(rec => {
      let header = '';
      if (ui.sort === 'unit' || ui.sort === 'state') {
        const group = ui.sort === 'unit'
          ? (rec.unit || 'No managing unit listed')
          : (STATE_NAMES[rec.states[0]] || 'No state listed');
        if (group !== lastGroup) {
          header = `<h2 class="group-header">${escapeHtml(group)}</h2>`;
          lastGroup = group;
        }
      }
      return header + renderCard(rec);
    }).join('');
  }

  $('#results-count').textContent = total
    ? `Showing ${formatNumber(visible.length)} of ${formatNumber(total)} ${total === 1 ? 'entry' : 'entries'}`
    : 'No entries';
  $('#show-more').hidden = visible.length >= total;
  $('#show-more').textContent = `Show ${formatNumber(Math.min(PAGE_SIZE, total - visible.length))} more`;
  $('#clear-filters').hidden = !(ui.query || ui.state || ui.kind || ui.amenities.size);
}

function refresh({ resetPage = true } = {}) {
  if (resetPage) ui.shown = PAGE_SIZE;
  applyFilters();
  renderResults();
}

function refreshAll() {
  rebuildRecords();
  renderTabs();
  renderStateOptions();
  renderKindOptions();
  refresh({ resetPage: false });
}

/* ==========================================================================
   Details dialog
   ========================================================================== */

let openId = null;

function detailRow(label, valueHtml) {
  if (!valueHtml) return '';
  return `<div class="detail-row"><dt>${escapeHtml(label)}</dt><dd>${valueHtml}</dd></div>`;
}

function linkHtml(url, text) {
  const safe = safeUrl(url);
  if (!safe) return '';
  return `<a href="${escapeHtml(safe)}" target="_blank" rel="noopener">${escapeHtml(text || displayHost(safe))} ↗</a>`;
}

function sourceLine(rec) {
  if (rec.mine) return 'Added by you. Saved in this browser.';
  if (rec.source === 'campgrounds') {
    const src = campgroundSource;
    const when = src && (src.snapshot || src.built);
    return `From Campsite Atlas open data, which is cleaned from the Recreation.gov RIDB${when ? ` (snapshot ${when})` : ''}.`;
  }
  if (rec.source === 'councilCamps') {
    return 'Found by web search of council camp pages in September 2026. Confirm details with the council before you go.';
  }
  if (rec.source === 'txParks') {
    return 'From each park\'s Texas Parks and Wildlife page, found by web search in September 2026. Confirm hours and fees with the park.';
  }
  if (rec.source === 'trails') {
    const src = dataSources.trails;
    const updated = src && src.updated ? ` (updated ${src.updated})` : '';
    return `From Scouting America's National Historic Trails list${updated}. Confirm details with the council.`;
  }
  return 'From this directory\'s curated list. Confirm details on the official website.';
}

function openDetail(id, { updateHash = true } = {}) {
  const rec = byId.get(id);
  if (!rec) return;
  openId = id;
  const cat = CATEGORIES[rec.category];
  const starred = favorites.has(rec.id);
  const tags = amenityTags(rec);
  const place = rec.address || rec.city || rec.zip ? postalAddress(rec) : '';
  const tel = telHref(rec.phone);
  const mail = mailHref(rec.email);
  const maps = mapsUrl(rec);
  const coords = rec.lat != null && rec.lon != null
    ? `<span class="mono">${rec.lat.toFixed(4)}, ${rec.lon.toFixed(4)}</span>${rec.preciseLocation ? '' : ' <span class="muted">(approximate)</span>'}`
    : '';

  let contactHint = '';
  if (!rec.phone && !rec.email) {
    if (rec.bookUrl || rec.lookupUrl) {
      contactHint = 'Phone number and managing office are listed on the Recreation.gov page.';
    } else if (rec.contactUrl) {
      contactHint = 'Phone numbers and email are on the official contact page.';
    } else if (rec.website) {
      contactHint = 'Contact details are on the official website.';
    }
  }

  $('#detail-body').innerHTML = `
    <div class="modal-head">
      <div>
        <div class="entry-top">
          <span class="cat-badge cat-${escapeHtml(rec.category)}">${escapeHtml(cat ? cat.label : 'Other')}</span>
          <span class="entry-kind">${escapeHtml(rec.kind || '')}</span>
        </div>
        <h2 class="modal-title" id="detail-title">${escapeHtml(rec.name)}</h2>
        ${locationLine(rec) ? `<p class="entry-meta">${escapeHtml(locationLine(rec))}</p>` : ''}
      </div>
      <button type="button" class="icon-btn" data-close aria-label="Close">×</button>
    </div>

    ${rec.summary ? `<p class="detail-summary">${escapeHtml(rec.summary)}</p>` : ''}
    ${tags.length ? `<div class="entry-tags">${tags.map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}

    <dl class="detail-list">
      ${detailRow('Organization', escapeHtml(rec.org))}
      ${detailRow('Managing unit', escapeHtml(rec.unit))}
      ${detailRow('Contact', escapeHtml(rec.contact))}
      ${detailRow('Phone', tel ? `<a href="${tel}">${escapeHtml(rec.phone)}</a>` : escapeHtml(rec.phone))}
      ${detailRow('Email', mail ? `<a href="${escapeHtml(mail)}">${escapeHtml(rec.email)}</a>` : escapeHtml(rec.email))}
      ${detailRow('Website', linkHtml(rec.website))}
      ${detailRow('Contact page', linkHtml(rec.contactUrl, 'Official contact page'))}
      ${detailRow('Reservations', linkHtml(rec.bookUrl, 'Recreation.gov'))}
      ${detailRow('Look it up', linkHtml(rec.lookupUrl, 'Search Recreation.gov'))}
      ${detailRow('Trail details', linkHtml(rec.infoUrl))}
      ${detailRow('Address', escapeHtml(place))}
      ${detailRow('Coordinates', coords)}
    </dl>
    ${contactHint ? `<p class="muted detail-hint">${escapeHtml(contactHint)}</p>` : ''}

    <label class="field notes-field">
      <span class="field-label">Your notes</span>
      <textarea id="detail-notes" rows="4" placeholder="Gate codes, the ranger you talked to, site numbers you like, reservation dates…">${escapeHtml(store.notes[rec.id] || '')}</textarea>
      <span class="field-hint" id="notes-status">Saved automatically in this browser.</span>
    </label>

    <div class="modal-actions detail-actions">
      <button type="button" class="btn${starred ? ' btn-starred' : ''}" data-detail="star" aria-pressed="${starred}">${starred ? '★ Starred' : '☆ Star'}</button>
      ${maps ? `<a class="btn" href="${escapeHtml(maps)}" target="_blank" rel="noopener">Open in Maps ↗</a>` : ''}
      <button type="button" class="btn" data-detail="copy">Copy details</button>
      <button type="button" class="btn" data-detail="edit">${rec.mine ? 'Edit' : 'Edit contact info'}</button>
      ${rec.mine ? '<button type="button" class="btn btn-danger" data-detail="delete">Delete</button>' : ''}
      ${rec.edited ? '<button type="button" class="btn" data-detail="reset">Undo my edits</button>' : ''}
    </div>

    <p class="detail-source">${escapeHtml(sourceLine(rec))}</p>
  `;

  const dialog = $('#detail-dialog');
  if (!dialog.open) dialog.showModal();
  if (updateHash) history.replaceState(null, '', `#entry=${encodeURIComponent(id)}`);
}

function closeDetail() {
  const dialog = $('#detail-dialog');
  if (dialog.open) dialog.close();
}

function detailText(rec) {
  const lines = [
    rec.name,
    [rec.kind, CATEGORIES[rec.category]?.label].filter(Boolean).join(' · '),
    rec.org, rec.unit,
    postalAddress(rec),
    rec.contact && `Contact: ${rec.contact}`,
    rec.phone && `Phone: ${rec.phone}`,
    rec.email && `Email: ${rec.email}`,
    safeUrl(rec.website) && `Website: ${safeUrl(rec.website)}`,
    safeUrl(rec.contactUrl) && `Contact page: ${safeUrl(rec.contactUrl)}`,
    safeUrl(rec.bookUrl) && `Reservations: ${safeUrl(rec.bookUrl)}`,
    safeUrl(rec.infoUrl) && `Trail details: ${safeUrl(rec.infoUrl)}`,
    rec.lat != null && rec.lon != null && `Coordinates: ${rec.lat}, ${rec.lon}`,
    store.notes[rec.id] && `Notes: ${store.notes[rec.id]}`
  ];
  return lines.filter(Boolean).join('\n');
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  }
}

/* ==========================================================================
   Stars & notes
   ========================================================================== */

function toggleStar(id) {
  if (favorites.has(id)) favorites.delete(id);
  else favorites.add(id);
  store.favorites = [...favorites];
  saveStore();
  renderTabs();
  if (ui.category === 'starred') refresh({ resetPage: false });
  else renderResults();
}

let notesTimer = null;
let pendingNote = null;

function saveNote(id, text) {
  pendingNote = { id, text };
  clearTimeout(notesTimer);
  notesTimer = setTimeout(flushNote, 400);
}

/** Write any note still waiting on the debounce timer. */
function flushNote() {
  clearTimeout(notesTimer);
  if (!pendingNote) return;
  const { id, text } = pendingNote;
  pendingNote = null;
  if (text.trim()) store.notes[id] = text;
  else delete store.notes[id];
  if (saveStore()) {
    const status = $('#notes-status');
    if (status && openId === id) status.textContent = 'Saved.';
  }
  const rec = byId.get(id);
  if (rec) finalizeRecord(rec);
  renderResults();
}

/* ==========================================================================
   Add / edit
   ========================================================================== */

let editingId = null;

function fillSelect(select, options, value) {
  select.innerHTML = options.map(([v, label]) => `<option value="${escapeHtml(v)}">${escapeHtml(label)}</option>`).join('');
  select.value = value;
}

function stateOptions() {
  return [['', '—'], ...Object.entries(STATE_NAMES).sort((a, b) => a[1].localeCompare(b[1]))];
}

function openEditor(id = null) {
  editingId = id;
  const form = $('#edit-form');
  const rec = id ? byId.get(id) : null;
  const isBase = rec && !rec.mine;
  const defaultCategory = CATEGORIES[ui.category] ? ui.category : 'scouting';

  form.reset();
  fillSelect(form.elements.category, Object.entries(CATEGORIES).map(([k, c]) => [k, c.label]),
    rec ? rec.category : defaultCategory);
  fillSelect(form.elements.state, stateOptions(), rec ? (rec.states[0] || '') : (ui.state || ''));

  if (rec) {
    EDIT_FIELDS.forEach(field => {
      if (field === 'category' || field === 'state') return;
      const value = rec[field];
      form.elements[field].value = value === null || value === undefined ? '' : value;
    });
    // Multi-state entries (e.g. Yellowstone) keep their full list unless the state is changed.
    form.elements.state.dataset.original = rec.state || '';
  } else {
    form.elements.state.dataset.original = '';
  }

  form.elements.category.disabled = !!isBase;
  form.elements.kind.disabled = !!isBase;
  $('#edit-title').textContent = !rec ? 'Add entry' : isBase ? 'Edit contact info' : 'Edit entry';
  $('#edit-help').textContent = isBase
    ? 'Your changes are saved in this browser and shown in place of the bundled details. You can undo them any time.'
    : 'Add any camp, park, or office you want to keep contact info for. Only the name is required.';
  $('#edit-error').textContent = '';
  $('#edit-submit').textContent = rec ? 'Save changes' : 'Add entry';

  closeDetail();
  $('#edit-dialog').showModal();
  form.elements.name.focus();
}

function readForm(form) {
  const data = {};
  EDIT_FIELDS.forEach(field => {
    const el = form.elements[field];
    data[field] = typeof el.value === 'string' ? el.value.trim() : el.value;
  });
  const originalState = form.elements.state.dataset.original;
  if (originalState && normalizeState(originalState.split(/[^A-Za-z]+/)[0]) === data.state) {
    data.state = originalState;
  }
  return data;
}

function validateEntry(data) {
  if (!data.name) return 'Please add a name.';
  if (data.website && !safeUrl(data.website)) return 'The website needs to be a web address (https://…).';
  if (data.bookUrl && !safeUrl(data.bookUrl)) return 'The reservations link needs to be a web address (https://…).';
  if (data.email && !mailHref(data.email)) return 'That email address doesn\'t look right.';
  const lat = toNumber(data.lat);
  const lon = toNumber(data.lon);
  if (data.lat && (lat === null || lat < -90 || lat > 90)) return 'Latitude should be a number between -90 and 90.';
  if (data.lon && (lon === null || lon < -180 || lon > 180)) return 'Longitude should be a number between -180 and 180.';
  if ((data.lat && !data.lon) || (!data.lat && data.lon)) return 'Add both latitude and longitude, or leave both blank.';
  return '';
}

function cleanEntry(data) {
  const entry = {};
  EDIT_FIELDS.forEach(field => {
    let value = data[field];
    if (value === undefined || value === null || value === '') return;
    if (field === 'website' || field === 'bookUrl') value = safeUrl(value);
    if (field === 'lat' || field === 'lon') value = toNumber(value);
    if (value !== '' && value !== null) entry[field] = value;
  });
  if (entry.lat != null && entry.lon != null) entry.preciseLocation = true;
  return entry;
}

function saveEditor(event) {
  event.preventDefault();
  const form = $('#edit-form');
  const data = readForm(form);
  const error = validateEntry(data);
  if (error) {
    $('#edit-error').textContent = error;
    return;
  }
  const clean = cleanEntry(data);
  const rec = editingId ? byId.get(editingId) : null;

  if (rec && !rec.mine) {
    // Store only the fields that differ from the bundled record.
    const base = baseRecords.find(b => b.id === rec.id) || {};
    const override = {};
    EDIT_FIELDS.forEach(field => {
      if (field === 'category' || field === 'kind') return;
      const next = clean[field] ?? '';
      const orig = base[field] ?? '';
      if (String(next) !== String(orig)) override[field] = next;
    });
    if (override.lat !== undefined || override.lon !== undefined) {
      override.preciseLocation = clean.lat != null && clean.lon != null;
    }
    if (Object.keys(override).length) store.overrides[rec.id] = override;
    else delete store.overrides[rec.id];
  } else if (rec) {
    const idx = store.entries.findIndex(e => e.id === rec.id);
    if (idx >= 0) {
      const { created } = store.entries[idx];
      store.entries[idx] = { id: rec.id, ...clean, created, updated: new Date().toISOString() };
    }
  } else {
    store.entries.push({ id: newId(), ...clean, created: new Date().toISOString() });
  }

  saveStore();
  $('#edit-dialog').close();
  refreshAll();
  const id = rec ? rec.id : store.entries[store.entries.length - 1].id;
  showToast(rec ? 'Saved.' : `Added “${clean.name}”.`);
  openDetail(id);
}

function deleteEntry(id) {
  const rec = byId.get(id);
  if (!rec || !rec.mine) return;
  if (!confirm(`Delete “${rec.name}”? This can't be undone unless you have a backup.`)) return;
  store.entries = store.entries.filter(e => e.id !== id);
  delete store.notes[id];
  favorites.delete(id);
  store.favorites = [...favorites];
  saveStore();
  closeDetail();
  refreshAll();
  showToast('Deleted.');
}

function resetEdits(id) {
  delete store.overrides[id];
  saveStore();
  refreshAll();
  openDetail(id);
  showToast('Restored the original details.');
}

/* ==========================================================================
   CSV
   ========================================================================== */

function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;
  const src = text.replace(/^﻿/, '');

  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (inQuotes) {
      if (ch === '"') {
        if (src[i + 1] === '"') { field += '"'; i++; }
        else inQuotes = false;
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field); field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && src[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some(v => v.trim() !== '')) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some(v => v.trim() !== '')) rows.push(row);
  return rows;
}

function csvCell(value) {
  let s = value === null || value === undefined ? '' : String(value);
  // Keep spreadsheet apps from treating a cell as a formula.
  if (/^[=+\-@\t\r]/.test(s) && !/^-?\d+(\.\d+)?$/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function toCsv(rows) {
  return rows.map(r => r.map(csvCell).join(',')).join('\r\n') + '\r\n';
}

function importCsv(text, fallbackCategory) {
  const rows = parseCsv(text);
  if (rows.length < 2) return { changed: false, added: 0, skipped: 0, message: 'That CSV has no rows under the header.' };

  const header = rows[0].map(h => CSV_ALIASES[h.trim().toLowerCase()] || null);
  if (!header.includes('name')) {
    return { changed: false, added: 0, skipped: 0, message: 'The CSV needs a “name” column. Export → Blank import template has the right headers.' };
  }

  let added = 0;
  let skipped = 0;
  const problems = [];
  rows.slice(1).forEach((cells, i) => {
    const data = {};
    header.forEach((field, col) => {
      if (field) data[field] = (cells[col] || '').trim();
    });
    data.category = normalizeCategory(data.category, fallbackCategory);
    data.state = normalizeState(data.state);
    const error = validateEntry(data);
    if (error) {
      skipped++;
      if (problems.length < 3) problems.push(`Row ${i + 2}: ${error}`);
      return;
    }
    const entry = { id: newId(), ...cleanEntry(data), created: new Date().toISOString() };
    store.entries.push(entry);
    if (data.notes) store.notes[entry.id] = data.notes;
    added++;
  });

  return { changed: added > 0, added, skipped, message: problems.join(' ') };
}

function importBackup(json) {
  if (!json || json.app !== 'camp-directory') {
    return { changed: false, added: 0, skipped: 0, message: 'That JSON file isn\'t a backup from this directory.' };
  }
  const entries = Array.isArray(json.entries) ? json.entries : [];
  let added = 0;
  let updated = 0;
  entries.forEach(e => {
    if (!isPlainObject(e) || !e.name) return;
    const entry = { ...cleanEntry({ ...e, category: normalizeCategory(e.category, 'public') }) };
    entry.id = typeof e.id === 'string' && e.id.startsWith('u-') ? e.id : newId();
    ['created', 'updated'].forEach(k => { if (typeof e[k] === 'string') entry[k] = e[k]; });
    const idx = store.entries.findIndex(x => x.id === entry.id);
    if (idx >= 0) { store.entries[idx] = entry; updated++; }
    else { store.entries.push(entry); added++; }
  });

  let edits = 0;
  let notes = 0;
  let stars = 0;
  if (isPlainObject(json.overrides)) {
    Object.entries(json.overrides).forEach(([id, o]) => {
      if (isPlainObject(o)) { store.overrides[id] = cleanOverride(o); edits++; }
    });
  }
  if (isPlainObject(json.notes)) {
    Object.entries(json.notes).forEach(([id, note]) => {
      if (typeof note === 'string' && note.trim()) { store.notes[id] = note; notes++; }
    });
  }
  if (Array.isArray(json.favorites)) {
    json.favorites.forEach(id => {
      if (typeof id === 'string' && !favorites.has(id)) { favorites.add(id); stars++; }
    });
    store.favorites = [...favorites];
  }

  const changed = added + updated + edits + notes + stars > 0;
  return {
    changed,
    backup: true,
    added: added + updated,
    skipped: 0,
    message: changed
      ? `Backup restored: ${added} new and ${updated} updated entries, ${edits} edited listings, ${notes} notes, ${stars} new stars.`
      : 'That backup is empty.'
  };
}

function cleanOverride(o) {
  const out = {};
  EDIT_FIELDS.forEach(field => {
    if (field === 'category' || field === 'kind' || !(field in o)) return;
    let value = o[field];
    if (field === 'website' || field === 'bookUrl') value = value ? safeUrl(value) : '';
    else if (field === 'lat' || field === 'lon') value = toNumber(value);
    else value = value === null || value === undefined ? '' : String(value);
    out[field] = value;
  });
  if ('preciseLocation' in o) out.preciseLocation = !!o.preciseLocation;
  return out;
}

async function handleImportFile(file) {
  const result = $('#import-result');
  if (!file) return;
  if (file.size > 20 * 1024 * 1024) {
    result.textContent = 'That file is larger than 20 MB. Split it into smaller files.';
    return;
  }
  const text = await file.text();
  const fallback = $('#import-category').value;
  let outcome;
  if (/\.json$/i.test(file.name) || text.trim().startsWith('{')) {
    try {
      outcome = importBackup(JSON.parse(text));
    } catch {
      outcome = { changed: false, added: 0, skipped: 0, message: 'That JSON file couldn\'t be read.' };
    }
  } else {
    outcome = importCsv(text, fallback);
  }

  if (outcome.changed) {
    saveStore();
    refreshAll();
  }
  let summary = '';
  if (outcome.backup) {
    summary = '';
  } else if (outcome.added) {
    summary = `Imported ${formatNumber(outcome.added)} ${outcome.added === 1 ? 'entry' : 'entries'}${outcome.skipped ? `, skipped ${outcome.skipped}` : ''}.`;
  } else if (!outcome.changed) {
    summary = 'Nothing was imported.';
  }
  result.textContent = [summary, outcome.message].filter(Boolean).join(' ');
  $('#import-file').value = '';
}

/* ==========================================================================
   Export
   ========================================================================== */

function exportBackup() {
  const payload = {
    app: 'camp-directory',
    version: 1,
    exported: new Date().toISOString(),
    entries: store.entries,
    overrides: store.overrides,
    notes: store.notes,
    favorites: [...favorites]
  };
  const stamp = new Date().toISOString().slice(0, 10);
  downloadFile(`camp-directory-backup-${stamp}.json`, JSON.stringify(payload, null, 2), 'application/json');
  showToast('Backup downloaded.');
}

function exportResultsCsv() {
  const header = ['id', 'category', 'type', 'name', 'organization', 'unit', 'address', 'city', 'state', 'zip',
    'contact', 'phone', 'email', 'website', 'contact_page', 'reservations', 'more_info', 'lat', 'lon', 'description', 'notes', 'starred'];
  const rows = ui.results.map(r => [
    r.id, CATEGORIES[r.category]?.label || r.category, r.kind, r.name, r.org, r.unit, r.address, r.city,
    r.states.join(', '), r.zip, r.contact, r.phone, r.email, safeUrl(r.website), safeUrl(r.contactUrl),
    safeUrl(r.bookUrl), safeUrl(r.infoUrl || r.lookupUrl), r.lat, r.lon, r.summary, store.notes[r.id] || '',
    favorites.has(r.id) ? 'yes' : ''
  ]);
  const stamp = new Date().toISOString().slice(0, 10);
  downloadFile(`camp-directory-${ui.category}-${stamp}.csv`, toCsv([header, ...rows]), 'text/csv');
  showToast(`Downloaded ${formatNumber(rows.length)} rows.`);
}

function exportTemplate() {
  downloadFile('camp-directory-import-template.csv', toCsv([CSV_COLUMNS]), 'text/csv');
}

/* ==========================================================================
   Location
   ========================================================================== */

function requestLocation() {
  if (!navigator.geolocation) {
    showToast('This browser can\'t share your location.');
    return Promise.resolve(null);
  }
  $('#results-count').textContent = 'Finding your location…';
  return new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
      () => {
        showToast('Couldn\'t get your location, so results are sorted by name.');
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: 15000, maximumAge: 600000 }
    );
  });
}

/* ==========================================================================
   Events
   ========================================================================== */

function setCategory(key) {
  ui.category = key;
  renderTabs();
  renderKindOptions();
  renderCategoryNote();
  refresh();
}

function clearFilters() {
  ui.query = '';
  ui.state = '';
  ui.kind = '';
  ui.amenities.clear();
  $('#search').value = '';
  $('#state-filter').value = '';
  renderKindOptions();
  renderAmenityFilters();
  refresh();
}

function bindEvents() {
  $('#category-tabs').addEventListener('click', e => {
    const tab = e.target.closest('[data-tab]');
    if (tab) setCategory(tab.dataset.tab);
  });

  let searchTimer = null;
  $('#search').addEventListener('input', e => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      ui.query = e.target.value.trim();
      refresh();
    }, 150);
  });

  $('#state-filter').addEventListener('change', e => {
    ui.state = e.target.value;
    refresh();
  });

  $('#kind-filter').addEventListener('change', e => {
    ui.kind = e.target.value;
    refresh();
  });

  $('#sort').addEventListener('change', async e => {
    ui.sort = e.target.value;
    if (ui.sort === 'distance' && !ui.origin) {
      ui.origin = await requestLocation();
      if (!ui.origin) {
        ui.sort = 'name';
        e.target.value = 'name';
      }
    }
    refresh();
  });

  $('#amenity-filters').addEventListener('change', e => {
    if (e.target.type !== 'checkbox') return;
    if (e.target.checked) ui.amenities.add(e.target.value);
    else ui.amenities.delete(e.target.value);
    refresh();
  });

  $('#clear-filters').addEventListener('click', clearFilters);

  $('#show-more').addEventListener('click', () => {
    ui.shown += PAGE_SIZE;
    renderResults();
  });

  $('#results').addEventListener('click', e => {
    const card = e.target.closest('.entry');
    if (!card) return;
    const action = e.target.closest('[data-action]')?.dataset.action;
    if (action === 'star') toggleStar(card.dataset.id);
    else if (action === 'open') openDetail(card.dataset.id);
  });

  // Details dialog
  const detail = $('#detail-dialog');
  detail.addEventListener('click', async e => {
    if (e.target === detail || e.target.closest('[data-close]')) {
      closeDetail();
      return;
    }
    const action = e.target.closest('[data-detail]')?.dataset.detail;
    if (!action || !openId) return;
    flushNote();
    if (action === 'star') {
      toggleStar(openId);
      openDetail(openId, { updateHash: false });
    } else if (action === 'copy') {
      const ok = await copyText(detailText(byId.get(openId)));
      showToast(ok ? 'Copied to clipboard.' : 'Couldn\'t copy. Select the text instead.');
    } else if (action === 'edit') {
      openEditor(openId);
    } else if (action === 'delete') {
      deleteEntry(openId);
    } else if (action === 'reset') {
      resetEdits(openId);
    }
  });
  detail.addEventListener('input', e => {
    if (e.target.id === 'detail-notes') {
      $('#notes-status').textContent = 'Saving…';
      saveNote(openId, e.target.value);
    }
  });
  detail.addEventListener('close', () => {
    flushNote();
    // `close` fires asynchronously; ignore it if another entry has already been opened.
    if (detail.open) return;
    openId = null;
    if (location.hash.startsWith('#entry=')) history.replaceState(null, '', location.pathname + location.search);
  });

  // Add / edit
  $('#add-btn').addEventListener('click', () => openEditor());
  $('#edit-form').addEventListener('submit', saveEditor);

  // Import
  $('#import-btn').addEventListener('click', () => {
    fillSelect($('#import-category'), Object.entries(CATEGORIES).map(([k, c]) => [k, c.label]),
      CATEGORIES[ui.category] ? ui.category : 'scouting');
    $('#import-result').textContent = '';
    $('#import-dialog').showModal();
  });
  $('#import-file').addEventListener('change', e => handleImportFile(e.target.files[0]));
  const drop = $('#file-drop');
  ['dragenter', 'dragover'].forEach(type => drop.addEventListener(type, e => {
    e.preventDefault();
    drop.classList.add('dragging');
  }));
  ['dragleave', 'drop'].forEach(type => drop.addEventListener(type, () => drop.classList.remove('dragging')));
  drop.addEventListener('drop', e => {
    e.preventDefault();
    handleImportFile(e.dataTransfer.files[0]);
  });

  // Shared close buttons and backdrop clicks for the form dialogs
  ['#edit-dialog', '#import-dialog'].forEach(sel => {
    const dialog = $(sel);
    dialog.addEventListener('click', e => {
      if (e.target === dialog || e.target.closest('[data-close]')) dialog.close();
    });
  });

  // Export menu
  const menu = $('#export-menu');
  menu.addEventListener('click', e => {
    const kind = e.target.closest('[data-export]')?.dataset.export;
    if (!kind) return;
    menu.open = false;
    if (kind === 'backup') exportBackup();
    else if (kind === 'csv') exportResultsCsv();
    else if (kind === 'template') exportTemplate();
  });
  document.addEventListener('click', e => {
    if (menu.open && !menu.contains(e.target)) menu.open = false;
  });

  // Keep tabs in sync if the data changes in another tab
  window.addEventListener('storage', e => {
    if (e.key !== STORAGE_KEY) return;
    Object.assign(store, loadStore());
    favorites = new Set(store.favorites);
    refreshAll();
  });

  window.addEventListener('hashchange', openFromHash);
}

function openFromHash() {
  const match = location.hash.match(/^#entry=(.+)$/);
  if (match) openDetail(decodeURIComponent(match[1]), { updateHash: false });
}

/* ==========================================================================
   Init
   ========================================================================== */

async function init() {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  bindEvents();
  renderAmenityFilters();
  renderCategoryNote();

  try {
    await loadData();
  } catch (err) {
    console.error(err);
    $('#results-count').textContent = '';
    $('#results').innerHTML = `
      <div class="empty-state">
        <strong>The directory couldn't load.</strong>
        <p>Check your connection and refresh. If you opened this file directly from disk, serve the folder over HTTP instead.</p>
      </div>`;
  }

  if (campgroundSource) {
    const count = baseRecords.filter(r => r.source === 'campgrounds').length;
    $('#campground-count').textContent = `all ${formatNumber(count)} campgrounds`;
    if (campgroundSource.snapshot) {
      $('#campground-date').textContent = campgroundSource.snapshot;
    } else if (campgroundSource.built) {
      const date = new Date(`${campgroundSource.built}T00:00:00`);
      $('#campground-date').textContent = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }
  }

  refreshAll();
  openFromHash();
}

document.addEventListener('DOMContentLoaded', init);
