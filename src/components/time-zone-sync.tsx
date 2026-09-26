"use client";

import { syncTimeZone } from "@/actions/account/account-actions";
import { useEffect } from "react";

const KEY = "calibre-time-zone";

// Sends the browser's time zone once per browser session, or when it changes.
export function TimeZoneSync() {
  useEffect(() => {
    const zone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    try {
      if (!zone || sessionStorage.getItem(KEY) === zone) return;
      sessionStorage.setItem(KEY, zone);
    } catch {
      // Storage can be blocked; sending again is harmless.
    }
    void syncTimeZone(zone).catch(() => undefined);
  }, []);
  return null;
}
