"use client";

import { Bell, Menu, PanelLeft } from "lucide-react";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { useUiStore } from "@/hooks/useUiStore";

interface V18TopNavProps {
  brandHref?: string;
}

function getBreadcrumb(pathname: string): string {
  if (pathname.startsWith("/admin/dashboard")) {
    const parts = pathname
      .replace("/admin/dashboard", "")
      .split("/")
      .filter(Boolean);
    if (parts.length === 0) return "Dashboard";
    return parts
      .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      .join(" / ");
  }
  if (pathname === "/") return "Home";
  return pathname.slice(1).charAt(0).toUpperCase() + pathname.slice(2);
}

export function V18TopNav({
  brandHref = "/admin/dashboard",
}: V18TopNavProps) {
  const pathname = usePathname();
  const { toggleSidebar, setMobileNavOpen } = useUiStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-v18-border bg-white px-6 shadow-sm">
      <div className="flex items-center gap-4">
        {/* Two buttons rather than one that branches on viewport width: below
            `lg` the rail is a drawer to open, above it a column to collapse. */}
        <button
          type="button"
          onClick={() => setMobileNavOpen(true)}
          className="rounded-lg p-2 text-v18-muted hover:bg-slate-50 hover:text-v18-heading lg:hidden"
          aria-label="Open navigation"
        >
          <Menu className="size-5" />
        </button>
        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden rounded-lg p-2 text-v18-muted hover:bg-slate-50 hover:text-v18-heading lg:block"
          aria-label="Toggle sidebar"
        >
          <PanelLeft className="size-5" />
        </button>

        <BrandLogo href={brandHref} compact className="hidden sm:inline-flex" />
        <span className="text-sm text-v18-muted">
          {getBreadcrumb(pathname)}
        </span>
      </div>

      <div className="flex items-center gap-4">
        <button
          type="button"
          className="rounded-lg p-2 text-v18-muted hover:bg-slate-50"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
        </button>
        <div className="v18-avatar flex size-9 items-center justify-center rounded-full text-sm font-medium text-white">
          A
        </div>
      </div>
    </header>
  );
}
