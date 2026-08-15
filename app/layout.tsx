import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans } from "next/font/google";
import { BRAND_NAME, BRAND_TAGLINE, BRAND_LOGO_PATH } from "@/constants";
import { getSiteSettings } from "@/lib/queries/settings";
import { Providers } from "./providers";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-sans",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-display",
  display: "swap",
});

export const metadata: Metadata = {
  // Without this every Open Graph and canonical URL resolves relative to the
  // deployment host, which breaks link previews on any non-production domain.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: `${BRAND_NAME} — ${BRAND_TAGLINE}`,
    template: `%s | ${BRAND_NAME}`,
  },
  description: `${BRAND_TAGLINE} for the modern wardrobe.`,
  icons: {
    icon: BRAND_LOGO_PATH,
    shortcut: BRAND_LOGO_PATH,
    apple: BRAND_LOGO_PATH,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const settings = await getSiteSettings();

  return (
    <html
      lang="en"
      className={settings.monochrome_enabled ? "monochrome" : undefined}
      data-monochrome={settings.monochrome_enabled ? "true" : "false"}
      suppressHydrationWarning
    >
      <body className={`${dmSans.variable} ${cormorant.variable}`}>
        <Providers initialMonochrome={settings.monochrome_enabled}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
