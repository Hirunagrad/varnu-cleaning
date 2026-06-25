"use client";

import { useState, useTransition } from "react";
import { User } from "@/lib/types";
import { login } from "@/app/actions";
import { KeyRound, ArrowRight } from "lucide-react";

const USERS: User[] = ["Chamin", "Tharindu", "Hiruna"];

export default function Login() {
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleLogin = () => {
    if (!selectedUser || pin.length !== 4) return;
    setError("");
    startTransition(async () => {
      const success = await login(selectedUser, pin);
      if (!success) {
        setError("Invalid PIN. Please try again.");
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gray-50 text-center">
      <div className="max-w-sm w-full bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8">
        
        {!selectedUser ? (
          <>
            <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
              <KeyRound className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Welcome</h1>
            <p className="text-gray-500 mb-8">Who is logging in?</p>
            
            <div className="flex flex-col gap-4">
              {USERS.map((u) => (
                <button
                  key={u}
                  onClick={() => setSelectedUser(u)}
                  className="w-full bg-gray-50 hover:bg-gray-100 text-gray-900 font-bold text-xl py-5 rounded-2xl border border-gray-200 transition-all active:scale-95"
                >
                  {u}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <button 
              onClick={() => { setSelectedUser(null); setPin(""); setError(""); }}
              className="text-sm font-semibold text-gray-400 hover:text-gray-600 mb-6"
            >
              ← Back to Users
            </button>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Enter PIN</h1>
            <p className="text-gray-500 mb-8">Logging in as <span className="font-bold text-blue-600">{selectedUser}</span></p>
            
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                setPin(e.target.value.replace(/[^0-9]/g, ""));
                setError("");
              }}
              placeholder="••••"
              className="w-full text-center text-4xl tracking-[1em] font-bold py-4 rounded-2xl bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all mb-4"
            />

            {error && (
              <p className="text-red-500 text-sm font-semibold mb-4">{error}</p>
            )}

            <button
              onClick={handleLogin}
              disabled={pin.length !== 4 || isPending}
              className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isPending ? "Verifying..." : "Unlock"} <ArrowRight className="w-5 h-5" />
            </button>
          </>
        )}
      </div>
    </div>
  );
}
