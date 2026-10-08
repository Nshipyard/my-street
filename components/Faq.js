"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

const FAQS = [
  {
    q: "Is this real city data or a demo?",
    a: "Real. Every result comes from the City of Toronto's open data portal: the live road-restrictions feed for closures and construction, and the active building-permits dataset. Each item links to its source dataset so you can verify it.",
  },
  {
    q: "Why do permits say 'on your street' instead of 'within 500 metres'?",
    a: "The city's permit feed publishes street names but no coordinates, so we match permits by street name. Road restrictions do include coordinates, so those are filtered to a true 500-metre radius around your address.",
  },
  {
    q: "How fresh is the data?",
    a: "Road restrictions refresh continuously from the city's feed and we re-fetch every few hours. Building-permit data is re-pulled hourly and the city updates the underlying dataset daily.",
  },
  {
    q: "What happens when I enter my email?",
    a: "Your email and address are stored on our server so we can notify you about new work near your street. We don't share or sell your information. Actual weekly email delivery is being wired up; signing up now reserves your spot.",
  },
  {
    q: "Does it work outside Toronto?",
    a: "Not yet. The feeds we use are published by the City of Toronto, so addresses in Mississauga, Vaughan, and other nearby cities won't return results.",
  },
];

export default function Faq() {
  const [open, setOpen] = useState(0);
  return (
    <div className="faq">
      {FAQS.map((f, i) => (
        <div className="faq-item" key={i}>
          <button
            className="faq-q"
            aria-expanded={open === i}
            onClick={() => setOpen(open === i ? -1 : i)}
          >
            {f.q}
            <ChevronDown
              size={20}
              style={{
                flex: "none",
                transform: open === i ? "rotate(180deg)" : "none",
                transition: "transform 0.2s",
              }}
            />
          </button>
          {open === i && (
            <div className="faq-a">
              <p>{f.a}</p>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
