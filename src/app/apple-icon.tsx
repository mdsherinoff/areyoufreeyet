import { ImageResponse } from "next/og";

// Home-screen icon: the "Overlap" mark — two schedules, shared free time in maroon.
// Full-bleed square; iOS applies its own rounded mask.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#f6e7ec",
        }}
      >
        <svg width="150" height="150" viewBox="1 1 30 30">
          <circle cx="12" cy="16" r="8.5" fill="#d9a0b0" />
          <circle cx="20" cy="16" r="8.5" fill="#d9a0b0" />
          <path
            d="M16 8.5A8.5 8.5 0 0 1 16 23.5A8.5 8.5 0 0 1 16 8.5Z"
            fill="#8a1538"
          />
        </svg>
      </div>
    ),
    { ...size },
  );
}
