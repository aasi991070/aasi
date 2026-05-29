import Link from "next/link";
import { BrandMark } from "./BrandMark";

export function Footer() {
  return (
    <footer className="border-t border-store-border bg-store-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-8 px-6 py-20 lg:flex-row lg:justify-between lg:px-8">
        <div>
          <BrandMark asLink={false} />
          <p className="mt-4 max-w-xs font-sans text-sm text-store-ink-muted">
            Luxury minimal clothing crafted for the modern wardrobe.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-12 sm:grid-cols-3">
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-store-ink">
              Shop
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href="/category/mens" className="text-sm text-store-ink-muted hover:text-store-ink">
                  Men
                </Link>
              </li>
              <li>
                <Link href="/category/womens" className="text-sm text-store-ink-muted hover:text-store-ink">
                  Women
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-store-ink">
              Company
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <span className="text-sm text-store-ink-muted">About</span>
              </li>
              <li>
                <span className="text-sm text-store-ink-muted">Contact</span>
              </li>
            </ul>
          </div>
          <div>
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-store-ink">
              Legal
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <span className="text-sm text-store-ink-muted">Privacy</span>
              </li>
              <li>
                <span className="text-sm text-store-ink-muted">Terms</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
      <div className="border-t border-store-border px-6 py-6 lg:px-8">
        <p className="text-center font-sans text-xs text-store-ink-muted">
          © {new Date().getFullYear()} Aasi. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
