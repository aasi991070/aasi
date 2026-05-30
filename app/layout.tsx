import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { BRAND_NAME, BRAND_TAGLINE, BRAND_LOGO_PATH } from "@/constants";
import { getSiteSettings } from "@/lib/queries/settings";
import { Providers } from "./providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
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
      <body className={`${inter.variable} ${GeistSans.variable}`}>
        <Providers initialMonochrome={settings.monochrome_enabled}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
