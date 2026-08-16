import { Suspense } from "react";
import Link from "next/link";
import { User } from "lucide-react";
import { BrandMark } from "@/components/storefront/BrandMark";
import { CartButton } from "@/components/storefront/CartButton";
import {
  CategoryNav,
  type NavItem,
} from "@/components/storefront/CategoryNav";
import { NavbarShell } from "@/components/storefront/NavbarShell";
import { StorefrontSearch } from "@/components/storefront/StorefrontSearch";
import { getCategoryTree } from "@/lib/queries/categories";
import type { Category } from "@/types";

/** Beyond this the header stops reading as a luxury masthead and starts
 *  wrapping. Anything past it is still reachable from the footer and /search. */
const MAX_TOP_LEVEL = 6;

function toNavItems(tree: Category[]): NavItem[] {
  // buildTree treats any category without a parent_id as a root, so orphaned
  // deeper levels surface alongside real top-level ones. The header only ever
  // shows levels 1 and 2, so filter on level rather than on tree position.
  return tree
    .filter((parent) => parent.level === 1)
    .slice(0, MAX_TOP_LEVEL)
    .map((parent) => ({
      id: parent.id,
      label: parent.name,
      href: `/category/${parent.slug}`,
      children: (parent.children ?? [])
        .filter((child) => child.level === 2)
        .map((child) => ({
          id: child.id,
          label: child.name,
          href: `/category/${parent.slug}/${child.slug}`,
        })),
    }));
}

export async function Navbar() {
  // getCategoryTree(true) is the unstable_cache'd, cookie-free path. Using the
  // request-scoped client here would make every storefront route dynamic and
  // block the ISR work in prompt 15.
  const items = toNavItems(await getCategoryTree(true));

  return (
    <NavbarShell>
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-6 lg:px-8">
        <BrandMark className="order-2 md:order-none" />

        <CategoryNav items={items} />

        <div className="order-4 flex items-center gap-2 sm:gap-4">
          <Suspense fallback={<div className="hidden h-10 w-56 lg:w-64 md:block" />}>
            <StorefrontSearch className="hidden md:block" />
          </Suspense>

          <CartButton />

          {/* TODO(27a): /account is created with customer accounts. */}
          <Link
            href="/account"
            aria-label="Account"
            className="inline-flex min-h-11 min-w-11 items-center justify-center text-store-ink transition-opacity duration-200 hover:opacity-60"
          >
            <User className="size-5" strokeWidth={1.25} aria-hidden="true" />
          </Link>
        </div>
      </div>
    </NavbarShell>
  );
}
