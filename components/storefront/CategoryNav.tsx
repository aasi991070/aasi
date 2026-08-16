"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type NavLeaf = {
  id: string;
  label: string;
  href: string;
};

export type NavItem = NavLeaf & {
  children: NavLeaf[];
};

/** Grace period before a hover-opened panel closes, so the pointer can travel
 *  from the trigger down into the panel without it collapsing underneath. */
const HOVER_CLOSE_DELAY_MS = 120;

const topLevelClass =
  "font-sans text-xs uppercase tracking-[0.2em] text-store-ink transition-opacity duration-200 hover:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-store-accent-dark";

const panelLinkClass =
  "font-sans text-sm text-store-ink-muted transition-colors duration-200 hover:text-store-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-store-accent-dark";

export function CategoryNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const baseId = useId();

  const [openId, setOpenId] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const navRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const triggerRefs = useRef(new Map<string, HTMLButtonElement>());
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Pointer activation focuses the trigger before it clicks it, and the focus
   *  handler has already opened the panel by then. Remember the state from
   *  before that happened so the click still reads as a toggle. */
  const openBeforePointer = useRef(false);

  const cancelClose = useCallback(() => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }, []);

  const scheduleClose = useCallback(() => {
    cancelClose();
    closeTimer.current = setTimeout(() => setOpenId(null), HOVER_CLOSE_DELAY_MS);
  }, [cancelClose]);

  useEffect(() => cancelClose, [cancelClose]);

  useEffect(() => {
    setOpenId(null);
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!openId) return;

    const insideNav = (node: EventTarget | null) =>
      node instanceof Node &&
      Boolean(navRef.current?.contains(node) || panelRef.current?.contains(node));

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const trigger = triggerRefs.current.get(openId);
      setOpenId(null);
      trigger?.focus();
    };

    const onFocusIn = (event: FocusEvent) => {
      if (!insideNav(event.target)) setOpenId(null);
    };

    const onPointerDown = (event: PointerEvent) => {
      if (!insideNav(event.target)) setOpenId(null);
    };

    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [openId]);

  const closeMobile = () => setMobileOpen(false);

  const activeItem = items.find((item) => item.id === openId) ?? null;
  const panelId = openId ? `${baseId}-panel-${openId}` : undefined;

  if (items.length === 0) return null;

  return (
    <>
      <nav
        ref={navRef}
        aria-label="Primary"
        className="order-3 hidden md:block"
        onMouseEnter={cancelClose}
        onMouseLeave={scheduleClose}
      >
        <ul className="flex items-center gap-8 lg:gap-10">
          {items.map((item) =>
            item.children.length === 0 ? (
              <li
                key={item.id}
                onMouseEnter={() => {
                  cancelClose();
                  setOpenId(null);
                }}
              >
                <Link href={item.href} className={topLevelClass}>
                  {item.label}
                </Link>
              </li>
            ) : (
              <li
                key={item.id}
                onMouseEnter={() => {
                  cancelClose();
                  setOpenId(item.id);
                }}
              >
                <button
                  type="button"
                  ref={(node) => {
                    if (node) triggerRefs.current.set(item.id, node);
                    else triggerRefs.current.delete(item.id);
                  }}
                  aria-expanded={openId === item.id}
                  aria-controls={openId === item.id ? panelId : undefined}
                  onFocus={() => setOpenId(item.id)}
                  onPointerDown={() => {
                    openBeforePointer.current = openId === item.id;
                  }}
                  onClick={(event) => {
                    // detail === 0 means Enter/Space rather than a real click.
                    const wasOpen =
                      event.detail === 0
                        ? openId === item.id
                        : openBeforePointer.current;
                    setOpenId(wasOpen ? null : item.id);
                  }}
                  className={topLevelClass}
                >
                  {item.label}
                </button>
              </li>
            )
          )}
        </ul>
      </nav>

      {activeItem && (
        <div
          ref={panelRef}
          id={panelId}
          data-mega-panel=""
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className="absolute inset-x-0 top-full hidden border-t border-store-border bg-store-white md:block"
        >
          <div className="mx-auto max-w-7xl px-6 py-10 lg:px-8">
            <Link
              href={activeItem.href}
              className="font-sans text-xs uppercase tracking-[0.2em] text-store-ink transition-colors duration-200 hover:text-store-accent-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-store-accent-dark"
            >
              All {activeItem.label}
            </Link>
            <ul className="mt-6 grid grid-cols-2 gap-x-10 gap-y-3 lg:grid-cols-4">
              {activeItem.children.map((child) => (
                <li key={child.id}>
                  <Link href={child.href} className={panelLinkClass}>
                    {child.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger className={cn(topLevelClass, "order-1 md:hidden")}>
          Menu
        </SheetTrigger>
        <SheetContent
          side="left"
          showCloseButton={false}
          className="w-full max-w-none gap-0 border-r-0 bg-store-white p-0 shadow-none sm:max-w-none"
        >
          <SheetTitle className="sr-only">Main menu</SheetTitle>

          <div className="flex h-20 shrink-0 items-center justify-between border-b border-store-border px-6">
            <span className="font-sans text-xs uppercase tracking-[0.2em] text-store-ink-muted">
              Menu
            </span>
            <SheetClose className={topLevelClass}>Close</SheetClose>
          </div>

          <nav
            aria-label="Primary"
            className="flex-1 overflow-y-auto px-6 pb-16"
          >
            <ul className="divide-y divide-store-border">
              {items.map((item) => {
                const sectionId = `${baseId}-mobile-${item.id}`;
                const expanded = expandedId === item.id;

                if (item.children.length === 0) {
                  return (
                    <li key={item.id}>
                      <Link
                        href={item.href}
                        onClick={closeMobile}
                        className={cn(topLevelClass, "block py-5")}
                      >
                        {item.label}
                      </Link>
                    </li>
                  );
                }

                return (
                  <li key={item.id}>
                    <button
                      type="button"
                      aria-expanded={expanded}
                      aria-controls={sectionId}
                      onClick={() =>
                        setExpandedId((current) =>
                          current === item.id ? null : item.id
                        )
                      }
                      className={cn(
                        topLevelClass,
                        "flex w-full items-center justify-between py-5"
                      )}
                    >
                      {item.label}
                      {expanded ? (
                        <Minus className="size-4" aria-hidden="true" />
                      ) : (
                        <Plus className="size-4" aria-hidden="true" />
                      )}
                    </button>
                    <ul id={sectionId} hidden={!expanded} className="pb-5">
                      <li className="pb-3">
                        <Link
                          href={item.href}
                          onClick={closeMobile}
                          className={panelLinkClass}
                        >
                          All {item.label}
                        </Link>
                      </li>
                      {item.children.map((child) => (
                        <li key={child.id} className="pb-3">
                          <Link
                            href={child.href}
                            onClick={closeMobile}
                            className={panelLinkClass}
                          >
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </li>
                );
              })}
            </ul>

            <Link
              href="/search"
              onClick={closeMobile}
              className={cn(topLevelClass, "mt-10 inline-block")}
            >
              Search
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
