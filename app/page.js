import SiteNav from "@/components/SiteNav";
import BriefingTool from "@/components/BriefingTool";
import Faq from "@/components/Faq";
import { getRoadRestrictions, permitsTotal } from "@/lib/toronto";
import {
  BellRing,
  CheckCircle2,
  Database,
  FileText,
  HardHat,
  Construction,
  MapPin,
  RefreshCw,
} from "lucide-react";

export const revalidate = 3600;

function fmt(n) {
  return n == null ? "—" : n.toLocaleString("en-CA");
}

export default async function Page() {
  let restrictionCount = null;
  let permitCount = null;
  try {
    const rows = await getRoadRestrictions();
    restrictionCount = rows.filter((r) => r.Latitude && r.Longitude).length;
  } catch {
    /* counts are decorative; the lookup API reports its own errors */
  }
  try {
    permitCount = await permitsTotal();
  } catch {
    /* same */
  }

  return (
    <>
      <SiteNav />
      <main id="top">
        <header className="hero">
          <div className="wrap">
            <span className="eyebrow">
              <Database size={14} /> Built on Toronto open data
            </span>
            <h1>What&apos;s happening on your street this week?</h1>
            <p className="lede">
              Road work, building permits, and construction notices within 500 metres of
              your front door, pulled live from the City of Toronto&apos;s open data.
              No rumor, no guessing.
            </p>
            <BriefingTool />
          </div>
        </header>

        <section id="how">
          <div className="wrap">
            <div className="sec-head">
              <p className="sec-kicker">How it works</p>
              <h2>Three steps, about ten seconds</h2>
              <p>
                The city already publishes this information. We just connect it to your
                address.
              </p>
            </div>
            <div className="steps">
              <div className="step">
                <span className="step-num">1</span>
                <h3>Enter your address</h3>
                <p>
                  We locate it on the map and draw a 500-metre circle around your home,
                  about a five-minute walk.
                </p>
              </div>
              <div className="step">
                <span className="step-num">2</span>
                <h3>We query live city feeds</h3>
                <p>
                  The road-restrictions feed and the active building-permits dataset are
                  searched for anything touching your circle, right now.
                </p>
              </div>
              <div className="step">
                <span className="step-num">3</span>
                <h3>Get your briefing</h3>
                <p>
                  Each item shows what it is, when it runs, how far away it is, and a
                  link to the source record.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="track" style={{ background: "var(--bg-soft)" }}>
          <div className="wrap">
            <div className="sec-head">
              <p className="sec-kicker">What we track</p>
              <h2>Two live feeds, zero guesswork</h2>
              <p>
                Every number below is read from the city&apos;s open data portal when
                this page loads.
              </p>
            </div>
            <div className="cards">
              <div className="card">
                <span className="card-icon">
                  <Construction size={22} />
                </span>
                <p className="stat">{fmt(restrictionCount)}</p>
                <h3>Road restrictions</h3>
                <p>
                  Closures, lane reductions, and construction zones with real
                  coordinates, filtered to 500 metres around your address.
                </p>
              </div>
              <div className="card">
                <span className="card-icon">
                  <HardHat size={22} />
                </span>
                <p className="stat">{fmt(permitCount)}</p>
                <h3>Active building permits</h3>
                <p>
                  Authorized construction across the city, matched to your street by
                  name. The feed carries no coordinates, so we say so.
                </p>
              </div>
              <div className="card">
                <span className="card-icon">
                  <FileText size={22} />
                </span>
                <h3>Planning notices</h3>
                <p>
                  Development applications and committee-of-adjustment notices are next.
                  The city publishes them as documents, so each one needs
                  address extraction before it can join the map.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section id="sources" className="fresh">
          <div className="wrap fresh-grid">
            <div>
              <p className="sec-kicker">Staying fresh</p>
              <h2 style={{ fontSize: 34, margin: "0 0 12px", letterSpacing: "-0.015em" }}>
                Fresh data is the whole product
              </h2>
              <p style={{ color: "var(--ink-soft)", fontSize: 17, margin: 0 }}>
                A street briefing is only useful if it reflects this week, not last
                year. Here is exactly how each feed stays current.
              </p>
              <ul className="fresh-list">
                <li>
                  <CheckCircle2 size={20} />
                  <span>
                    <strong>Road restrictions</strong> are re-fetched from the city
                    every 6 hours; the feed itself updates continuously.
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={20} />
                  <span>
                    <strong>Building permits</strong> are re-queried hourly from the
                    CKAN datastore; the city refreshes the dataset daily.
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={20} />
                  <span>
                    <strong>Every result</strong> carries its source and date, so you
                    can verify anything we show you.
                  </span>
                </li>
                <li>
                  <CheckCircle2 size={20} />
                  <span>
                    <strong>When a feed fails</strong>, we tell you which one instead
                    of silently showing a partial picture.
                  </span>
                </li>
              </ul>
            </div>
            <div className="card">
              <span className="card-icon">
                <RefreshCw size={22} />
              </span>
              <h3>The freshness contract</h3>
              <p>
                If the city&apos;s data is stale, your briefing says so. We would
                rather show you an honest &ldquo;feed unavailable&rdquo; note than a
                confident-looking answer built on old data.
              </p>
              <p style={{ marginTop: 12 }}>
                Geocoding by <strong>OpenStreetMap Nominatim</strong>. City data via{" "}
                <a
                  href="https://open.toronto.ca"
                  target="_blank"
                  rel="noreferrer"
                >
                  Toronto Open Data
                </a>
                .
              </p>
            </div>
          </div>
        </section>

        <section id="notify">
          <div className="wrap">
            <div className="cta-band">
              <BellRing size={36} style={{ marginBottom: 16 }} />
              <h2>Know before the jackhammers do</h2>
              <p>
                Enter your address above and leave your email. When new road work or
                permits appear near your home, you hear about it first.
              </p>
              <a className="btn btn-primary" href="#lookup">
                <MapPin size={18} /> Check my street
              </a>
            </div>
          </div>
        </section>

        <section id="faq" style={{ paddingTop: 0 }}>
          <div className="wrap">
            <div className="sec-head" style={{ textAlign: "center", margin: "0 auto 36px" }}>
              <p className="sec-kicker">FAQ</p>
              <h2>Questions, answered plainly</h2>
            </div>
            <Faq />
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap foot-inner">
          <span>My Street: a Toronto street briefing built on open data.</span>
          <div className="foot-links">
            <a href="https://open.toronto.ca" target="_blank" rel="noreferrer">
              Toronto Open Data
            </a>
            <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">
              OSM contributors
            </a>
          </div>
        </div>
      </footer>
    </>
  );
}
