import { Footer } from "@/components/storefront/Footer";
import { Navbar } from "@/components/storefront/Navbar";
import { AppToaster } from "@/components/shared/AppToaster";
import { LiveRegion } from "@/components/shared/LiveRegion";
import { CartProvider } from "@/components/providers/CartProvider";
import { MonochromeProvider } from "@/components/providers/MonochromeProvider";
import { getServerCart } from "@/lib/cart/server";
import { getSiteSettings } from "@/lib/queries/settings";

export default async function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, initialCart] = await Promise.all([
    getSiteSettings(),
    getServerCart(),
  ]);

  return (
    <MonochromeProvider
      initialMonochrome={settings.monochrome_enabled}
      className="store-surface flex min-h-screen flex-col"
    >
      <CartProvider initialCart={initialCart}>
        <AppToaster />

        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-none focus:border focus:border-store-ink focus:bg-store-white focus:px-4 focus:py-2 focus:font-sans focus:text-xs focus:uppercase focus:tracking-[0.2em] focus:text-store-ink"
        >
          Skip to content
        </a>

        <LiveRegion />
        <Navbar />

        <main id="content" className="flex-1">
          {children}
        </main>

        <Footer />
      </CartProvider>
    </MonochromeProvider>
  );
}
