import { ImageResponse } from "next/og";

export const alt = "Prisma: psychological assessment for HR teams";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

// The preview shown when the site is shared. The built-in font has no Cyrillic, so it stays in English.
export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: 80, background: "#f7f8fc", color: "#111827" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
          <svg width="96" height="96" viewBox="0 0 32 32">
            <rect width="32" height="32" rx="9" fill="#364fbf" />
            <path d="M2 18.5 L12.2 16.2" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" opacity="0.9" />
            <path d="M16 7.5 L24.5 23 H7.5 Z" fill="#fff" fillOpacity="0.14" stroke="#fff" strokeWidth="2" strokeLinejoin="round" />
            <path d="M19.6 15.2 L30 11.5" stroke="#fcd34d" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M19.9 16 L30 16" stroke="#6ee7b7" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M19.6 16.8 L30 20.5" stroke="#f9a8d4" strokeWidth="1.6" strokeLinecap="round" />
          </svg>
          <div style={{ fontSize: 56, fontWeight: 700 }}>Prisma</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
          <div style={{ fontSize: 72, fontWeight: 700, lineHeight: 1.1, maxWidth: 960 }}>Understand your people, not just their CVs</div>
          <div style={{ fontSize: 34, color: "#4b5563", maxWidth: 960 }}>Psychological tests and questionnaires for HR teams, scored the moment someone finishes.</div>
        </div>
      </div>
    ),
    size
  );
}
