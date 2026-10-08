/**
 * Toronto open-data access layer. Everything here hits live city sources,
 * nothing is mocked. Two feeds:
 *
 * 1. Road restrictions: CSV with real lat/lng, filtered by true 500 m
 *    haversine distance. Source refreshes continuously; we cache 6 h.
 * 2. Building permits: CKAN datastore (202k+ active permits). The feed has
 *    no coordinates, only street components, so we match by street name
 *    and label results "on {street}" rather than "within 500 m".
 */

const RR_CSV_URL =
  "https://secure.toronto.ca/opendata/cart/road_restrictions/v3?format=csv";
const CKAN_API = "https://ckan0.cf.opendata.inter.prod-toronto.ca/api/3/action";
const PERMITS_RESOURCE_ID = "6d0229af-bc54-46de-9c2b-26759b01dd05";
const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

// Rough Toronto bounding box, used to sanity-check geocode results.
const TORONTO_BBOX = { minLat: 43.58, maxLat: 43.86, minLon: -79.64, maxLon: -79.115 };

let rrCache = { at: 0, rows: [] };
const RR_TTL_MS = 6 * 3600 * 1000;

let geoCache = new Map();
const GEO_TTL_MS = 3600 * 1000;

export function haversineM(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const a =
    Math.sin(toRad(lat2 - lat1) / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(toRad(lon2 - lon1) / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/** Minimal CSV parser that respects quoted fields.
 *  A quote only opens a quoted field at the very start of a field
 *  (Python csv / RFC 4180 behavior); stray inch-marks mid-field stay literal. */
function parseCSV(text) {
  const rows = [];
  let row = [];
  let field = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += c;
      }
    } else if (c === '"' && field === "") {
      inQuotes = true;
    } else if (c === ",") {
      row.push(field);
      field = "";
    } else if (c === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else if (c === "\r") {
      // skip
    } else {
      field += c;
    }
  }
  if (field !== "" || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

export async function getRoadRestrictions() {
  const now = Date.now();
  if (rrCache.rows.length && now - rrCache.at < RR_TTL_MS) return rrCache.rows;
  const res = await fetch(RR_CSV_URL, { next: { revalidate: 21600 } });
  if (!res.ok) throw new Error(`road restrictions fetch failed: ${res.status}`);
  const text = await res.text();
  const lines = text.split("\n");
  // First line is a human title ("Current road restrictions"), not the header.
  const rows = parseCSV(lines.slice(1).join("\n"));
  const header = rows[0] || [];
  const data = rows.slice(1).map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
  rrCache = { at: now, rows: data };
  return data;
}

export function restrictionsNear(rows, lat, lon, radiusM = 500) {
  const now = Date.now();
  const out = [];
  for (const r of rows) {
    const rlat = parseFloat(r.Latitude);
    const rlon = parseFloat(r.Longitude);
    if (!Number.isFinite(rlat) || !Number.isFinite(rlon)) continue;
    if (r.Expired === "1") continue;
    if (r.EndTime) {
      const end = Number(r.EndTime);
      if (Number.isFinite(end) && end < now - 24 * 3600 * 1000) continue;
    }
    const d = haversineM(lat, lon, rlat, rlon);
    if (d <= radiusM) out.push({ ...r, _distanceM: Math.round(d) });
  }
  out.sort((a, b) => Number(a.StartTime || 0) - Number(b.StartTime || 0));
  return out;
}

function cleanDescription(desc) {
  if (!desc) return "";
  let s = desc.replace(/^(Toronto-TMC|City of Toronto)\s*:\s*/i, "").trim();
  if (s.length > 160) s = s.slice(0, 157).trimEnd() + "...";
  return s;
}

export function fmtDate(epochMs) {
  const n = Number(epochMs);
  if (!Number.isFinite(n) || n <= 0) return "";
  const d = new Date(n);
  const thisYear = new Date().getFullYear();
  const opts = { month: "short", day: "numeric", timeZone: "America/Toronto" };
  if (d.getFullYear() !== thisYear) opts.year = "numeric";
  return d.toLocaleDateString("en-CA", opts);
}

export function restrictionToItem(r) {
  const when = [fmtDate(r.StartTime), fmtDate(r.EndTime)].filter(Boolean).join(" to ");
  return {
    id: `rr-${r.ID}`,
    kind: "restriction",
    icon: "construction",
    tile: "tile-amber",
    title: `Road work: ${r.Road || "nearby street"}`,
    description: cleanDescription(r.Description) || "Road work scheduled on this street. Dates may shift.",
    date: when || "Dates TBA",
    distanceM: r._distanceM,
    matchNote: "within 500 m of your address",
    source: "City of Toronto",
    sourceUrl: "https://open.toronto.ca/dataset/road-restrictions/",
  };
}

/** "2843 Dundas St W" -> "DUNDAS" (the permits feed stores name/type/direction separately). */
export function streetNameForPermits(address) {
  const streetPart = address.split(",")[0].trim().replace(/^\d+\s*[a-zA-Z]?\s+/, "");
  const stop = new Set([
    "ST", "STREET", "AVE", "AVENUE", "RD", "ROAD", "CRES", "CRESCENT", "BLVD",
    "BOULEVARD", "DR", "DRIVE", "LANE", "WAY", "PL", "PLACE", "CRT", "COURT",
    "TERR", "TERRACE", "PKWY", "PARKWAY", "N", "S", "E", "W", "NORTH", "SOUTH", "EAST", "WEST",
  ]);
  const words = streetPart.toUpperCase().split(/\s+/).filter((w) => !stop.has(w));
  return words.join(" ");
}

export async function permitsOnStreet(streetName, limit = 8) {
  if (!streetName) return [];
  // NOTE: we deliberately do NOT sort server-side: CKAN sorts NULL
  // ISSUED_DATE values first on DESC, burying every dated record.
  const params = new URLSearchParams({
    resource_id: PERMITS_RESOURCE_ID,
    filters: JSON.stringify({ STREET_NAME: streetName }),
    limit: "300",
  });
  const res = await fetch(`${CKAN_API}/datastore_search?${params}`, {
    next: { revalidate: 3600 },
  });
  if (!res.ok) throw new Error(`permits fetch failed: ${res.status}`);
  const data = await res.json();
  const records = data?.result?.records || [];
  const dated = records
    .filter((r) => r.ISSUED_DATE)
    .sort((a, b) => String(b.ISSUED_DATE).localeCompare(String(a.ISSUED_DATE)));
  const picked = (dated.length ? dated : records).slice(0, limit);
  return picked.map((r) => {
    const addr = [r.STREET_NUM, r.STREET_NAME, r.STREET_TYPE, r.STREET_DIRECTION]
      .filter((x) => x && String(x).trim())
      .join(" ");
    return {
      id: `bp-${r._id}`,
      kind: "permit",
      icon: "hard-hat",
      tile: "tile-blue",
      title: `Building permit: ${(r.WORK || "work").toLowerCase()}`,
      description: `${toTitle(addr)}: ${(r.DESCRIPTION || "").trim().slice(0, 150) || "Permit authorized."}`,
      date: r.ISSUED_DATE ? `Issued ${r.ISSUED_DATE}` : "Date not listed",
      matchNote: "on your street (matched by street name)",
      source: "City of Toronto",
      sourceUrl: "https://open.toronto.ca/dataset/building-permits-active-permits/",
    };
  });
}

export async function permitsTotal() {
  const params = new URLSearchParams({ resource_id: PERMITS_RESOURCE_ID, limit: "0" });
  const res = await fetch(`${CKAN_API}/datastore_search?${params}`, {
    next: { revalidate: 86400 },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data?.result?.total ?? null;
}

function toTitle(s) {
  return s.toLowerCase().replace(/\w\S*/g, (w) => w[0].toUpperCase() + w.slice(1));
}

/**
 * Geocode with OpenStreetMap Nominatim, restricted to Toronto.
 * Returns { lat, lon, display } or null when nothing in Toronto matches.
 */
export async function geocodeToronto(address) {
  const key = address.trim().toLowerCase();
  const hit = geoCache.get(key);
  if (hit && Date.now() - hit.at < GEO_TTL_MS) return hit.value;

  const params = new URLSearchParams({
    q: address,
    format: "jsonv2",
    countrycodes: "ca",
    addressdetails: "1",
    limit: "3",
    viewbox: "-79.64,43.86,-79.115,43.58",
    bounded: "1",
  });
  const res = await fetch(`${NOMINATIM_URL}?${params}`, {
    headers: { "User-Agent": "my-street/1.0 (Toronto street briefing; contact via site)" },
  });
  if (!res.ok) throw new Error(`geocode failed: ${res.status}`);
  const list = await res.json();
  let found = null;
  for (const r of list || []) {
    const lat = parseFloat(r.lat);
    const lon = parseFloat(r.lon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const inBox =
      lat >= TORONTO_BBOX.minLat && lat <= TORONTO_BBOX.maxLat &&
      lon >= TORONTO_BBOX.minLon && lon <= TORONTO_BBOX.maxLon;
    if (!inBox) continue;
    found = { lat, lon, display: r.display_name };
    break;
  }
  geoCache.set(key, { at: Date.now(), value: found });
  return found;
}
