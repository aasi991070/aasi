"use client";

import {
  ADMIN_NAV_ITEMS,
  STOREFRONT_NAV_ITEMS,
  type NavItem,
} from "@/constants";
import { V18Sidebar } from "@/components/shared/V18Sidebar";
import { V18TopNav } from "@/components/shared/V18TopNav";
import { useUiStore } from "@/hooks/useUiStore";
import { cn } from "@/lib/utils/cn";

interface V18ShellProps {
  children: React.ReactNode;
  variant: "storefront" | "admin";
  brandLabel?: string;
  brandHref?: string;
  showAdminLink?: boolean;
}

export function V18Shell({
  children,
  variant,
  brandLabel,
  brandHref,
  showAdminLink,
}: V18ShellProps) {
  const { sidebarOpen } = useUiStore();
  const navItems: NavItem[] =
    variant === "admin" ? ADMIN_NAV_ITEMS : STOREFRONT_NAV_ITEMS;

  const resolvedBrandLabel =
    brandLabel ?? (variant === "admin" ? "Atelier CMS" : "Atelier");
  const resolvedBrandHref =
    brandHref ?? (variant === "admin" ? "/admin/dashboard" : "/");
  const resolvedShowAdminLink =
    showAdminLink ?? variant === "storefront";

  return (
    <div className="v18-body-gradient min-h-screen">
      <V18Sidebar
        navItems={navItems}
        brandLabel={resolvedBrandLabel}
        brandHref={resolvedBrandHref}
      />
      <div
        className={cn(
          "min-h-screen transition-all duration-200 ease-in-out",
          sidebarOpen ? "ml-60" : "ml-16"
        )}
      >
        <V18TopNav
          brandLabel={resolvedBrandLabel}
          brandHref={resolvedBrandHref}
          showAdminLink={resolvedShowAdminLink}
        />
        <main className="p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
