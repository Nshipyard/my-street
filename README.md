# My Street

**What's Happening on My Street?** A Toronto street briefing built on the city's open data. Type an address, get the real road work and building permits near your home.

## What is real here

- **Geocoding**: OpenStreetMap Nominatim, restricted to Toronto's bounding box.
- **Road restrictions**: the City of Toronto's live road-restrictions feed (`secure.toronto.ca/opendata/cart/road_restrictions/v3`), filtered by true 500 m haversine distance. Re-fetched every 6 hours.
- **Building permits**: the CKAN datastore for *Building Permits - Active Permits* (200k+ records), matched by street name. The feed has no coordinates, so results are honestly labeled "on your street", not "within 500 m". Re-queried hourly; the city refreshes daily.
- **Email signup**: addresses are stored in `data/subscribers.json` on the server. Real persistence; weekly email delivery still needs an email provider (Resend/Postmark) wired to that list.

Nothing is mocked. If a feed fails, the UI says which one.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Data sources

- Road restrictions: https://open.toronto.ca/dataset/road-restrictions/
- Building permits: https://open.toronto.ca/dataset/building-permits-active-permits/
- Geocoding: https://nominatim.openstreetmap.org (usage policy: 1 req/s, attribution required)

## Roadmap

- Planning notices (development applications, Committee of Adjustment) need address extraction from city documents before they can join the map.
- Weekly email delivery via an email provider, reading `data/subscribers.json`.
