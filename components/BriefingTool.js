"use client";

import { useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  Construction,
  HardHat,
  Loader2,
  Mail,
  MapPin,
  RotateCcw,
  Search,
  XCircle,
} from "lucide-react";

const ICONS = { construction: Construction, "hard-hat": HardHat };

function EmptyError({ message }) {
  return (
    <div className="form-error" role="alert">
      <AlertCircle size={20} style={{ flex: "none", marginTop: 2 }} />
      <span>{message}</span>
    </div>
  );
}

export default function BriefingTool() {
  const [address, setAddress] = useState("");
  const [state, setState] = useState("idle"); // idle | loading | error | result
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [email, setEmail] = useState("");
  const [emailState, setEmailState] = useState("idle"); // idle | loading | done | error
  const [emailError, setEmailError] = useState("");
  const abortRef = useRef(null);

  async function runLookup(value) {
    const v = (value ?? address).trim();
    if (abortRef.current) abortRef.current.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setState("loading");
    setError("");
    setData(null);
    try {
      const res = await fetch(`/api/briefing?address=${encodeURIComponent(v)}`, {
        signal: ctrl.signal,
      });
      const json = await res.json();
      if (!res.ok || !json.ok) {
        setState("error");
        setError(json.error || "Something went wrong. Please try again.");
        return;
      }
      setData(json);
      setState("result");
    } catch (e) {
      if (e.name === "AbortError") return;
      setState("error");
      setError("Could not reach the lookup service. Check your connection and try again.");
    }
  }

  function reset() {
    if (abortRef.current) abortRef.current.abort();
    setAddress("");
    setState("idle");
    setError("");
    setData(null);
    setEmail("");
    setEmailState("idle");
    setEmailError("");
  }

  async function subscribe(e) {
    e.preventDefault();
    const v = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) {
      setEmailState("error");
      setEmailError("That email address does not look right.");
      return;
    }
    setEmailState("loading");
    setEmailError("");
    try {
      const res = await fetch("/api/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: v, address: data?.address || "" }),
      });
      const json = await res.json();
      if (!res.ok || !json.ok) throw new Error(json.error || "failed");
      setEmailState("done");
    } catch {
      setEmailState("error");
      setEmailError("Could not save your email. Please try again.");
    }
  }

  return (
    <div className="briefing-card" id="lookup">
      <p className="briefing-label">
        <MapPin size={16} style={{ verticalAlign: "-3px", marginRight: 6 }} />
        Enter your Toronto address
      </p>
      <form
        className="addr-form"
        onSubmit={(e) => {
          e.preventDefault();
          runLookup();
        }}
      >
        <input
          className="addr-input"
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="2843 Dundas St W"
          aria-label="Your Toronto street address"
          aria-invalid={state === "error"}
          autoComplete="street-address"
        />
        <button className="btn btn-primary" type="submit" disabled={state === "loading"}>
          {state === "loading" ? (
            <>
              <Loader2 size={18} className="spin" style={{ border: "none", animation: "spin 0.8s linear infinite" }} />
              Checking...
            </>
          ) : (
            <>
              <Search size={18} /> Check my street
            </>
          )}
        </button>
      </form>
      {state !== "result" && (
        <p className="form-hint">
          Not sure what to type?{" "}
          <button
            type="button"
            onClick={() => {
              setAddress("2843 Dundas St W, Toronto");
              runLookup("2843 Dundas St W, Toronto");
            }}
          >
            Try an example address
          </button>
        </p>
      )}
      {state === "error" && <EmptyError message={error} />}

      {state === "result" && data && (
        <div className="result-panel" aria-live="polite">
          <div className="result-head">
            <div>
              <h3 className="result-title">What&apos;s near {data.address.split(",")[0]}</h3>
              <p className="result-geo">
                Matched to {data.geocoded.display.split(",").slice(0, 2).join(",")}
              </p>
            </div>
            <span className="live-chip">
              <span className="live-dot" /> Live city data
            </span>
          </div>

          {data.items.length === 0 ? (
            <div className="quiet-box">
              <CheckCircle2 size={28} color="#15803d" />
              <p>
                All quiet near your address. No current road restrictions within 500 metres
                and no recent permits on your street in the city&apos;s open data.
              </p>
            </div>
          ) : (
            <ul className="result-list">
              {data.items.map((item) => {
                const Icon = ICONS[item.icon] || Construction;
                return (
                  <li className="result-item" key={item.id}>
                    <span className={`item-tile ${item.tile}`} aria-hidden="true">
                      <Icon size={22} />
                    </span>
                    <div className="item-body">
                      <p className="item-title">{item.title}</p>
                      <p className="item-desc">{item.description}</p>
                      <div className="item-meta">
                        <span className="meta-pill">{item.date}</span>
                        <span className="meta-pill">{item.matchNote}</span>
                        <a
                          className="meta-src"
                          href={item.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Source: {item.source}
                        </a>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          {data.upstreamError && (
            <p className="upstream-note">
              <XCircle size={15} style={{ verticalAlign: "-2px", marginRight: 6 }} />
              The city&apos;s {data.upstreamError} feed did not respond just now, so those
              results are missing. Everything else above is live.
            </p>
          )}

          {emailState === "done" ? (
            <div className="email-done" role="status">
              <CheckCircle2 size={20} style={{ flex: "none", marginTop: 2 }} />
              <span>
                You&apos;re on the list. We&apos;ll email you when new work is scheduled
                near {data.address.split(",")[0]}.
              </span>
            </div>
          ) : (
            <form className="email-row" onSubmit={subscribe}>
              <input
                className="addr-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                aria-label="Email for weekly briefing"
              />
              <button className="btn btn-ghost" type="submit" disabled={emailState === "loading"}>
                {emailState === "loading" ? (
                  "Saving..."
                ) : (
                  <>
                    <Mail size={17} /> Email me updates
                  </>
                )}
              </button>
            </form>
          )}
          {emailState === "error" && <EmptyError message={emailError} />}

          <div className="result-actions">
            <button className="btn btn-ghost" type="button" onClick={reset}>
              <RotateCcw size={16} /> Use a different address
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
