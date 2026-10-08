import {
  geocodeToronto,
  getRoadRestrictions,
  restrictionsNear,
  restrictionToItem,
  streetNameForPermits,
  permitsOnStreet,
} from "@/lib/toronto";

export const dynamic = "force-dynamic";

const OTHER_CITIES = [
  "mississauga", "brampton", "vaughan", "markham", "richmond hill", "oakville",
  "burlington", "hamilton", "ottawa", "montreal", "vancouver", "calgary",
  "scarborough-north", "etobicoke-north",
];

function classifyAddress(input) {
  const a = input.trim();
  if (!a) return { error: "Please enter your street address so we can look up your street." };
  const lower = a.toLowerCase();
  if (OTHER_CITIES.some((c) => lower.includes(c))) {
    return { error: "We only cover Toronto for now. Try an address inside the city." };
  }
  const hasNumber = /\d/.test(a);
  const hasStreetWord = /\b(st|street|ave|avenue|rd|road|dr|drive|blvd|boulevard|cres|crescent|lane|way|place|ct|court|terr|terrace)\b/i.test(a);
  if (!hasNumber || !hasStreetWord) {
    return {
      error: "That does not look like a full address. Try something like 2843 Dundas St W.",
    };
  }
  return { ok: true };
}

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const address = (searchParams.get("address") || "").trim();

  const check = classifyAddress(address);
  if (check.error) {
    return Response.json({ ok: false, error: check.error }, { status: 400 });
  }

  let geo;
  try {
    geo = await geocodeToronto(address);
  } catch (e) {
    return Response.json(
      { ok: false, error: "Address lookup is temporarily unavailable. Please try again in a minute." },
      { status: 502 }
    );
  }
  if (!geo) {
    return Response.json(
      { ok: false, error: "We could not find that address in Toronto. Check the spelling and try again." },
      { status: 404 }
    );
  }

  let restrictions = [];
  let permits = [];
  let upstreamError = null;
  try {
    const rows = await getRoadRestrictions();
    restrictions = restrictionsNear(rows, geo.lat, geo.lon, 500).map(restrictionToItem);
  } catch (e) {
    upstreamError = "road restrictions";
  }
  try {
    const streetName = streetNameForPermits(address);
    permits = await permitsOnStreet(streetName, 8);
  } catch (e) {
    upstreamError = upstreamError ? upstreamError + " and permits" : "permits";
  }

  return Response.json({
    ok: true,
    address,
    geocoded: {
      display: geo.display,
      lat: geo.lat,
      lon: geo.lon,
    },
    items: [...restrictions, ...permits],
    counts: { restrictions: restrictions.length, permits: permits.length },
    upstreamError,
    fetchedAt: new Date().toISOString(),
  });
}
