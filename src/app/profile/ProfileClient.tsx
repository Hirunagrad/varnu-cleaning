"use client";

import { useState, useTransition } from "react";
import { User } from "@/lib/types";
import { changePin, logout } from "@/app/actions";
import { KeyRound, LogOut, CheckCircle2, AlertCircle } from "lucide-react";

export default function ProfileClient({ currentUser }: { currentUser: User }) {
  const [currentPin, setCurrentPin] = useState("");
  const [newPin, setNewPin] = useState("");
  const [confirmPin, setConfirmPin] = useState("");
  const [status, setStatus] = useState<"idle" | "error" | "success">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [isPending, startTransition] = useTransition();

  const handleSave = () => {
    if (newPin !== confirmPin) {
      setStatus("error");
      setErrorMsg("New PINs do not match.");
      return;
    }
    if (newPin.length !== 4 || currentPin.length !== 4) {
      setStatus("error");
      setErrorMsg("PINs must be exactly 4 digits.");
      return;
    }

    startTransition(async () => {
      const success = await changePin(currentPin, newPin);
      if (success) {
        setStatus("success");
        setCurrentPin("");
        setNewPin("");
        setConfirmPin("");
      } else {
        setStatus("error");
        setErrorMsg("Incorrect current PIN.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
            <span className="text-xl font-bold">{currentUser[0]}</span>
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{currentUser}</h2>
            <p className="text-sm text-gray-500">Active Session</p>
          </div>
        </div>

        <button
          onClick={() => startTransition(() => { logout(); })}
          disabled={isPending}
          className="w-full flex items-center justify-center gap-2 bg-red-50 text-red-600 font-bold py-3 rounded-xl hover:bg-red-100 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Log Out
        </button>
      </div>

      <div className="bg-white rounded-[2rem] shadow-sm border border-gray-100 p-6">
        <div className="flex items-center gap-2 mb-6">
          <KeyRound className="w-5 h-5 text-gray-400" />
          <h3 className="text-lg font-bold text-gray-900">Change PIN</h3>
        </div>

        {status === "success" && (
          <div className="mb-4 bg-green-50 text-green-700 p-4 rounded-xl text-sm font-semibold flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5" /> PIN updated successfully!
          </div>
        )}

        {status === "error" && (
          <div className="mb-4 bg-red-50 text-red-600 p-4 rounded-xl text-sm font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5" /> {errorMsg}
          </div>
        )}

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Current PIN</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={currentPin}
              onChange={(e) => { setCurrentPin(e.target.value.replace(/[^0-9]/g, "")); setStatus("idle"); }}
              className="w-full text-2xl tracking-[0.5em] font-bold py-3 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">New PIN</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={newPin}
              onChange={(e) => { setNewPin(e.target.value.replace(/[^0-9]/g, "")); setStatus("idle"); }}
              className="w-full text-2xl tracking-[0.5em] font-bold py-3 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Confirm New PIN</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => { setConfirmPin(e.target.value.replace(/[^0-9]/g, "")); setStatus("idle"); }}
              className="w-full text-2xl tracking-[0.5em] font-bold py-3 px-4 rounded-xl bg-gray-50 border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none transition-all"
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isPending || !currentPin || !newPin || !confirmPin}
            className="mt-2 w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            {isPending ? "Saving..." : "Save New PIN"}
          </button>
        </div>
      </div>
    </div>
  );
}
