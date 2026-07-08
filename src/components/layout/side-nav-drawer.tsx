"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useUIStore } from "@/stores/use-ui-store";
import { NAV_ITEMS, APP_NAME } from "@/lib/constants";
import { Icon } from "@/lib/icon-map";

export default function SideNavDrawer() {
  const pathname = usePathname();
  const isOpen = useUIStore((s) => s.isSideNavOpen);
  const closeSideNav = useUIStore((s) => s.closeSideNav);

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <Sheet open={isOpen} onOpenChange={(open) => !open && closeSideNav()}>
      <SheetContent side="left" className="w-[280px] p-0 bg-surface flex flex-col">
        {/* Header */}
        <SheetHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-on-primary">
              <Icon name="store" size={24} />
            </div>
            <div>
              <SheetTitle className="text-headline-md font-bold text-primary">
                {APP_NAME}
              </SheetTitle>
              <p className="text-[12px] text-on-surface-variant opacity-60 uppercase tracking-wider font-bold">
                Kiosk Assistant
              </p>
            </div>
          </div>
        </SheetHeader>

        {/* Navigation */}
        <nav className="flex-1 px-3 mt-4 space-y-1">
          {NAV_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeSideNav}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-body-md font-medium transition-all active:scale-[0.98] ${
                  active
                    ? "bg-secondary-container text-on-secondary-container font-bold"
                    : "text-on-surface-variant hover:bg-surface-container-high"
                }`}
              >
                <Icon
                  name={item.icon}
                  size={24}
                  className={active ? "" : "text-outline"}
                />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
