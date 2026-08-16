import Link from "next/link";
import {
  BRAND_NAME,
  FOOTER_NAV_GROUPS,
  FOOTER_TAGLINE,
  PAYMENT_METHODS,
  SOCIAL_LINKS,
} from "@/constants";
import { BrandMark } from "@/components/storefront/BrandMark";
import { FooterNewsletter } from "@/components/storefront/FooterNewsletter";
import { getCategoriesByLevel } from "@/lib/queries/categories";

const linkClass =
  "font-sans text-sm text-store-ink-muted transition-colors duration-200 hover:text-store-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-store-accent-dark";

const headingClass =
  "font-sans text-xs uppercase tracking-[0.2em] text-store-ink";

export async function Footer() {
  const shopCategories = await getCategoriesByLevel(1, true);

  return (
    <footer className="border-t border-store-border bg-store-white">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
        <div className="flex flex-col gap-16 md:gap-20">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-2 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-4">
              <BrandMark asLink={false} />
              <p className="mt-4 max-w-xs font-sans text-sm leading-relaxed text-store-ink-muted">
                {FOOTER_TAGLINE}
              </p>
              <FooterNewsletter />
            </div>

            <div className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:col-span-8 lg:grid-cols-4">
              <div>
                <p className={headingClass}>Shop</p>
                <ul className="mt-4 space-y-3">
                  {shopCategories.map((category) => (
                    <li key={category.id}>
                      <Link
                        href={`/category/${category.slug}`}
                        className={linkClass}
                      >
                        {category.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {FOOTER_NAV_GROUPS.map((group) => (
                <div key={group.title}>
                  <p className={headingClass}>{group.title}</p>
                  <ul className="mt-4 space-y-3">
                    {group.links.map((link) => (
                      <li key={link.href}>
                        <Link href={link.href} className={linkClass}>
                          {link.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-8 border-t border-store-border pt-8 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <p className="font-sans text-xs uppercase tracking-[0.2em] text-store-ink-muted">
                Follow
              </p>
              <ul className="flex flex-wrap gap-x-6 gap-y-2">
                {SOCIAL_LINKS.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={linkClass}
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
              <p className="sr-only">Accepted payment methods</p>
              {PAYMENT_METHODS.map((method) => (
                <span
                  key={method.label}
                  aria-hidden="true"
                  className="store-hairline px-3 py-1.5 font-sans text-[0.625rem] uppercase tracking-[0.18em] text-store-ink-muted"
                >
                  {method.label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-store-border px-6 py-6 lg:px-8">
        <p className="text-center font-sans text-xs text-store-ink-muted">
          © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
