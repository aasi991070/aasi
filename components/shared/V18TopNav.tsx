"use client";

import { Bell, Menu, Search } from "lucide-react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { useUiStore } from "@/hooks/useUiStore";
import { cn } from "@/lib/utils/cn";

interface V18TopNavProps {
  brandLabel?: string;
  brandHref?: string;
  showAdminLink?: boolean;
}

function getBreadcrumb(pathname: string): string {
  if (pathname === "/") return "Home";
  if (pathname.startsWith("/admin/dashboard")) {
    const parts = pathname.replace("/admin/dashboard", "").split("/").filter(Boolean);
    if (parts.length === 0) return "Dashboard";
    return parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join(" / ");
  }
  if (pathname.startsWith("/category/")) {
    return pathname.replace("/category/", "").split("/").map((s) =>
      s.charAt(0).toUpperCase() + s.slice(1)
    ).join(" / ");
  }
  if (pathname.startsWith("/product/")) return "Product";
  return pathname.slice(1).charAt(0).toUpperCase() + pathname.slice(2);
}

export function V18TopNav({
  brandLabel = "Aasi",
  brandHref = "/",
  showAdminLink = true,
}: V18TopNavProps) {
  const pathname = usePathname();
  const { sidebarOpen, toggleSidebar } = useUiStore();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-v18-border bg-white px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={toggleSidebar}
          className="rounded-lg p-2 text-v18-muted hover:bg-slate-50 hover:text-v18-heading"
          aria-label="Toggle sidebar"
        >
          <Menu className="size-5" />
        </button>
        <Link
          href={brandHref}
          className="hidden text-sm font-semibold text-v18-primary sm:block"
        >
          {brandLabel}
        </Link>
        <span className="text-sm text-v18-muted">{getBreadcrumb(pathname)}</span>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-v18-muted" />
          <Input
            placeholder="Search..."
            className="h-9 w-64 rounded-[var(--radius-v18-input)] border-v18-border pl-9"
          />
        </div>
        <button
          type="button"
          className="rounded-lg p-2 text-v18-muted hover:bg-slate-50"
          aria-label="Notifications"
        >
          <Bell className="size-5" />
        </button>
        {showAdminLink && !pathname.startsWith("/admin") && (
          <Link
            href="/admin/dashboard"
            className="hidden text-xs font-medium text-v18-primary hover:underline sm:block"
          >
            Admin
          </Link>
        )}
        <div
          className={cn(
            "v18-avatar flex size-9 items-center justify-center rounded-full text-sm font-medium text-white"
          )}
        >
          A
        </div>
      </div>
    </header>
  );
}
