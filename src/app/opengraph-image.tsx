import { ImageResponse } from "next/og";

export const alt = "Calibre: psychological assessment for HR teams";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The preview shown when the site is shared, in the Calibre palette: paper, ink and one cobalt
// accent. The built-in font has no Cyrillic, so it stays in English.
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 80, background: "#f6f4ef", color: "#1a1c21" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="88" height="88" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="7" fill="#1a1c21" />
            <path d="M22.9 10.2 A9 9 0 1 0 22.9 21.8" fill="none" stroke="#f6f4ef" strokeWidth="3" />
            <rect x="20.5" y="14.6" width="6" height="2.8" rx="0.6" fill="#8e9dff" />
          </svg>
          <div style={{ fontSize: 56, fontWeight: 600, letterSpacing: -1 }}>Calibre</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 28, borderTop: "3px solid #1a1c21", paddingTop: 36 }}>
          <div style={{ fontSize: 68, fontWeight: 600, lineHeight: 1.1, maxWidth: 980, letterSpacing: -1.5 }}>Assessment your people can trust</div>
          <div style={{ fontSize: 32, color: "#5a5e67", maxWidth: 960 }}>Validated tests and questionnaires for HR teams, scored the moment someone finishes.</div>
        </div>
      </div>
    ),
    size
  );
}
