"use client";

import { useEffect } from "react";
import posthog from "posthog-js";

// phc_ is a write-only client key: safe in client bundles.
const POSTHOG_KEY = process.env.NEXT_PUBLIC_POSTHOG_KEY || "phc_m3ehdW9wd7bi4rbWbkBkvUqeuLqYKC8Bd3hvHLKFGNsv";
const POSTHOG_HOST = process.env.NEXT_PUBLIC_POSTHOG_HOST || "https://us.posthog.com";

export function PosthogProvider({ children }) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.__nshipyard_ph) return;
    window.__nshipyard_ph = true;
    posthog.init(POSTHOG_KEY, {
      api_host: POSTHOG_HOST,
      capture_pageview: "history_change",
      autocapture: true,
      disable_session_recording: false,
      person_profiles: "always",
    });
  }, []);
  return <>{children}</>;
}
