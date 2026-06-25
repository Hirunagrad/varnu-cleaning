"use client";

import { useTransition } from "react";
import { logout } from "@/app/actions";
import { LogOut } from "lucide-react";

export default function LogoutButton({ currentUser }: { currentUser: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <button
      onClick={() => startTransition(() => { logout(); })}
      disabled={isPending}
      className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-gray-200 hover:bg-red-50 hover:text-red-600 transition-colors text-sm font-semibold text-gray-700"
    >
      <span className="hidden sm:inline">{currentUser}</span>
      <LogOut className="w-4 h-4" />
    </button>
  );
}
