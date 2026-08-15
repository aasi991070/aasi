"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/constants";
import { BrandLogo } from "@/components/shared/BrandLogo";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { useUiStore } from "@/hooks/useUiStore";
import { cn } from "@/lib/utils/cn";

interface V18SidebarProps {
  navItems: NavItem[];
  brandHref?: string;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

function NavList({
  navItems,
  showLabels,
}: {
  navItems: NavItem[];
  showLabels: boolean;
}) {
  const pathname = usePathname();

  const sections = navItems.reduce<string[]>((acc, item) => {
    if (item.section && !acc.includes(item.section)) acc.push(item.section);
    return acc;
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
      {sections.map((section) => (
        <div key={section}>
          {showLabels && (
            <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/50">
              {section}
            </p>
          )}
          <ul className="space-y-1">
            {navItems
              .filter((item) => item.section === section)
              .map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-full px-3 py-2.5 text-sm text-white/80 transition-colors hover:text-white",
                        active && "bg-white/20 text-white",
                        !showLabels && "justify-center px-2"
                      )}
                      title={!showLabels ? item.label : undefined}
                    >
                      <Icon className="size-5 shrink-0" strokeWidth={1.5} />
                      {showLabels && <span>{item.label}</span>}
                    </Link>
                  </li>
                );
              })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function V18Sidebar({
  navItems,
  brandHref = "/admin/dashboard",
  mobileOpen,
  onMobileOpenChange,
}: V18SidebarProps) {
  const { sidebarOpen } = useUiStore();

  return (
    <>
      {/* Below `lg` the rail becomes an overlay. It used to be `fixed w-60`
          unconditionally, which left ~135px of usable width on a 375px phone. */}
      <aside
        className={cn(
          "v18-sidebar fixed left-0 top-0 z-40 hidden h-screen flex-col transition-all duration-200 ease-in-out lg:flex",
          sidebarOpen ? "w-60" : "w-16"
        )}
      >
        <div className="flex h-16 items-center px-3">
          <BrandLogo
            href={brandHref}
            compact={!sidebarOpen}
            variant="sidebar"
            priority
            className={cn(!sidebarOpen && "mx-auto")}
          />
        </div>
        <NavList navItems={navItems} showLabels={sidebarOpen} />
      </aside>

      <Sheet open={mobileOpen} onOpenChange={onMobileOpenChange}>
        <SheetContent
          side="left"
          className="v18-sidebar w-60 border-none p-0 lg:hidden"
        >
          {/* Radix requires an accessible name on every dialog. */}
          <SheetTitle className="sr-only">Admin navigation</SheetTitle>
          <div className="flex h-16 items-center px-3">
            <BrandLogo href={brandHref} variant="sidebar" />
          </div>
          <NavList navItems={navItems} showLabels />
        </SheetContent>
      </Sheet>
    </>
  );
}
