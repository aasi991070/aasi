"use client";

import { useEffect } from "react";

/**
 * Last-resort boundary: catches errors thrown by the root layout itself, which
 * the segment-level error.tsx files cannot. It replaces the whole document, so
 * it has to render its own <html> and <body>.
 *
 * Styles are inline on purpose. If the root layout failed, the stylesheet it
 * pulls in may never have loaded, and a class-based fallback would render as
 * unstyled text.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global] application error", {
      digest: error.digest,
      message: error.message,
    });
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2rem",
          backgroundColor: "#faf9f7",
          color: "#1c1917",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, 'Segoe UI', sans-serif",
        }}
      >
        <main style={{ maxWidth: "32rem", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "1.5rem",
              fontWeight: 600,
              letterSpacing: "-0.01em",
              margin: 0,
            }}
          >
            Something went badly wrong
          </h1>
          <p
            style={{
              marginTop: "1rem",
              fontSize: "0.9375rem",
              lineHeight: 1.6,
              color: "#57534e",
            }}
          >
            The site failed to load. This has been logged. Please try again — if
            it keeps happening, come back shortly.
          </p>

          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "2rem",
              minHeight: "2.75rem",
              padding: "0 1.5rem",
              border: "1px solid #1c1917",
              borderRadius: "0.25rem",
              backgroundColor: "#1c1917",
              color: "#faf9f7",
              fontSize: "0.875rem",
              cursor: "pointer",
            }}
          >
            Try again
          </button>

          {error.digest && (
            <p
              style={{
                marginTop: "2rem",
                fontSize: "0.75rem",
                color: "#78716c",
              }}
            >
              Reference: <code>{error.digest}</code>
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
