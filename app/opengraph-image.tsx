import { ImageResponse } from "next/og";
import { BRAND_NAME, BRAND_TAGLINE } from "@/constants";

export const runtime = "edge";
export const alt = `${BRAND_NAME} — ${BRAND_TAGLINE}`;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Matches `--color-store-surface` in app/globals.css. */
const STORE_SURFACE = "#fafaf8";
const STORE_INK = "#1a1a1a";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: "flex",
          height: "100%",
          width: "100%",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: STORE_SURFACE,
          color: STORE_INK,
        }}
      >
        <div
          style={{
            fontSize: 96,
            fontWeight: 400,
            letterSpacing: "0.08em",
            textTransform: "uppercase",
          }}
        >
          {BRAND_NAME}
        </div>
        <div
          style={{
            marginTop: 24,
            fontSize: 32,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "#666",
          }}
        >
          {BRAND_TAGLINE}
        </div>
      </div>
    ),
    { ...size }
  );
}
