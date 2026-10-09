"use client";

import { useState } from "react";
import { Menu, X, MapPin } from "lucide-react";

export default function SiteNav() {
  const [open, setOpen] = useState(false);
  const links = [
    { href: "#how", label: "How it works" },
    { href: "#track", label: "What we track" },
    { href: "#sources", label: "Data sources" },
    { href: "#faq", label: "FAQ" },
  ];
  return (
    <nav className="nav">
      <div className="wrap nav-inner">
        <a className="brand display" href="#top">
          <span className="brand-mark">
            <MapPin size={18} />
          </span>
          My Street
          <span className="brand-badge">Toronto</span>
        </a>
        <button
          className="nav-toggle"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
        <div className={`nav-links${open ? " open" : ""}`}>
          {links.map((l) => (
            <a key={l.href} href={l.href} className="nav-link" onClick={() => setOpen(false)}>
              {l.label}
            </a>
          ))}
          <a href="#lookup" className="btn btn-primary" onClick={() => setOpen(false)}>
            Check my street
          </a>
        </div>
      </div>
    </nav>
  );
}
