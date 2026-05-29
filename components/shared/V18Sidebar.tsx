"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { NavItem } from "@/constants";
import { useUiStore } from "@/hooks/useUiStore";
import { cn } from "@/lib/utils/cn";

interface V18SidebarProps {
  navItems: NavItem[];
  brandLabel?: string;
  brandHref?: string;
}

export function V18Sidebar({
  navItems,
  brandLabel = "Aasi",
  brandHref = "/",
}: V18SidebarProps) {
  const pathname = usePathname();
  const { sidebarOpen } = useUiStore();

  const sections = navItems.reduce<string[]>((acc, item) => {
    if (item.section && !acc.includes(item.section)) acc.push(item.section);
    return acc;
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <aside
      className={cn(
        "v18-sidebar fixed left-0 top-0 z-40 flex h-screen flex-col transition-all duration-200 ease-in-out",
        sidebarOpen ? "w-60" : "w-16"
      )}
    >
      <div className="flex h-16 items-center px-4">
        <Link
          href={brandHref}
          className={cn(
            "font-geist font-semibold text-white transition-opacity",
            sidebarOpen ? "text-lg" : "text-sm"
          )}
        >
          {sidebarOpen ? brandLabel : brandLabel.charAt(0)}
        </Link>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section}>
            {sidebarOpen && (
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
                        className={cn(
                          "flex items-center gap-3 rounded-full px-3 py-2.5 text-sm text-white/80 transition-colors hover:text-white",
                          active && "bg-white/20 text-white",
                          !sidebarOpen && "justify-center px-2"
                        )}
                        title={!sidebarOpen ? item.label : undefined}
                      >
                        <Icon className="size-5 shrink-0" strokeWidth={1.5} />
                        {sidebarOpen && <span>{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
            </ul>
          </div>
        ))}
      </nav>
    </aside>
  );
}
