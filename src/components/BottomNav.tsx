"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, CalendarDays, History } from "lucide-react";
import { cn } from "@/lib/utils";

export default function BottomNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Today", href: "/", icon: Home },
    { name: "Planner", href: "/planner", icon: CalendarDays },
    { name: "History", href: "/history", icon: History },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl border-t border-gray-100 pb-safe shadow-[0_-4px_24px_rgba(0,0,0,0.04)]">
      <div className="flex items-center justify-around h-16 sm:h-20 max-w-md mx-auto px-6">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center w-16 h-full gap-1 transition-all duration-200",
                isActive ? "text-blue-600 scale-105" : "text-gray-400 hover:text-gray-600"
              )}
            >
              <Icon strokeWidth={isActive ? 2.5 : 2} className={cn("w-6 h-6", isActive ? "text-blue-600" : "text-gray-400")} />
              <span className={cn("text-[10px] font-semibold tracking-wide", isActive ? "opacity-100" : "opacity-0 transition-opacity")}>
                {item.name}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
