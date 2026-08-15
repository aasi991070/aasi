"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { ADMIN_NAV_ITEMS } from "@/constants";
import { V18Sidebar } from "@/components/shared/V18Sidebar";
import { V18TopNav } from "@/components/shared/V18TopNav";
import { useUiStore } from "@/hooks/useUiStore";
import { cn } from "@/lib/utils/cn";

const DESKTOP_QUERY = "(min-width: 1024px)";

interface V18ShellProps {
  children: React.ReactNode;
  brandHref?: string;
}

/**
 * Admin CMS chrome. Never use this on the storefront — see
 * `.cursor/rules/v18-design-system.mdc`. The storefront has its own shell in
 * `app/(storefront)/layout.tsx`.
 */
export function V18Shell({
  children,
  brandHref = "/admin/dashboard",
}: V18ShellProps) {
  const pathname = usePathname();
  const { sidebarOpen, setSidebarOpen, mobileNavOpen, setMobileNavOpen } =
    useUiStore();

  // The store defaults to collapsed so SSR matches mobile. Expand once we can
  // actually measure the viewport, and follow the breakpoint afterwards.
  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const sync = () => setSidebarOpen(query.matches);

    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, [setSidebarOpen]);

  // A drawer that survives navigation would cover the page it just opened.
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname, setMobileNavOpen]);

  return (
    <div className="v18-body-gradient min-h-screen">
      <V18Sidebar
        navItems={ADMIN_NAV_ITEMS}
        brandHref={brandHref}
        mobileOpen={mobileNavOpen}
        onMobileOpenChange={setMobileNavOpen}
      />

      {/* No offset below `lg`: the sidebar is an overlay there, not a column. */}
      <div
        className={cn(
          "min-h-screen transition-all duration-200 ease-in-out",
          sidebarOpen ? "lg:ml-60" : "lg:ml-16"
        )}
      >
        <V18TopNav brandHref={brandHref} />
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
