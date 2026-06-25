"use client";

import { useTransition } from "react";
import { User } from "@/lib/types";
import { setCurrentUser } from "@/app/actions";

export default function UserSwitcher({ currentUser }: { currentUser: User }) {
  const [isPending, startTransition] = useTransition();

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newUser = e.target.value as User;
    startTransition(() => {
      setCurrentUser(newUser);
    });
  };

  return (
    <div className="fixed top-4 right-4 z-50 flex items-center gap-2 bg-white/80 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm border border-gray-200">
      <span className="text-xs font-medium text-gray-500">View as:</span>
      <select
        value={currentUser}
        onChange={handleUserChange}
        disabled={isPending}
        className="text-sm font-semibold text-gray-900 bg-transparent outline-none cursor-pointer appearance-none"
      >
        <option value="Chamin">Chamin</option>
        <option value="Tharindu">Tharindu</option>
        <option value="Hiruna">Hiruna</option>
      </select>
    </div>
  );
}
