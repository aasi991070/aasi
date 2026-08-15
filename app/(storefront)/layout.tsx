import { Footer } from "@/components/storefront/Footer";
import { Navbar } from "@/components/storefront/Navbar";

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="store-surface flex min-h-screen flex-col">
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:store-btn focus:bg-store-white focus:px-4 focus:py-2 focus:text-xs focus:uppercase focus:tracking-[0.2em]"
      >
        Skip to content
      </a>

      <Navbar />

      {/* Navbar is fixed and 80px tall, so the first section would otherwise
          render underneath it. Prompt 08 rebuilds the navbar as sticky, which
          reserves its own space and makes this offset unnecessary. */}
      <main id="content" className="flex-1 pt-20">
        {children}
      </main>

      <Footer />
    </div>
  );
}
