"use client";

import { useState, useTransition } from "react";
import { Schedule, DayOfWeek, User } from "@/lib/types";
import { saveSchedule } from "@/app/actions";
import { CheckCircle2, Lock, Save, Loader2 } from "lucide-react";

const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function PlannerForm({ 
  initialSchedule,
  plannedBy,
  currentUser,
  year,
  week,
  upcomingSundayUser
}: { 
  initialSchedule: Schedule;
  plannedBy: User | null;
  currentUser: User;
  year: number;
  week: number;
  upcomingSundayUser: User;
}) {
  const [schedule, setSchedule] = useState<Schedule>(initialSchedule || {});
  const [isPending, startTransition] = useTransition();

  // Get days claimed by current user in the local state
  const claimedDays = DAYS.filter(day => schedule[day] === currentUser);
  const claimCount = claimedDays.length;

  const toggleDay = (day: DayOfWeek) => {
    setSchedule(prev => {
      const isClaimedByMe = prev[day] === currentUser;
      
      // Unclaiming
      if (isClaimedByMe) {
        const next = { ...prev };
        delete next[day];
        return next;
      }

      // Claiming (only if we haven't hit the 2 day limit)
      if (claimCount < 2) {
        return { ...prev, [day]: currentUser };
      }

      return prev;
    });
  };

  const handleSave = () => {
    if (claimCount !== 2) return;
    startTransition(async () => {
      const res = await saveSchedule(year, week, claimedDays);
      if (res && !res.success) {
        alert(res.error || "Failed to save schedule.");
      }
    });
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-sm mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Plan Next Week</h1>
        <p className="text-gray-500">Pick 2 days for your chores.</p>
        
        {plannedBy && (
          <div className="inline-flex bg-blue-50 text-blue-700 text-xs font-bold px-3 py-1 rounded-full mt-2">
            Last updated by {plannedBy}
          </div>
        )}
      </div>

      <div className="flex justify-between items-center bg-blue-50 p-4 rounded-2xl border border-blue-100">
        <span className="font-bold text-blue-900">Days Claimed</span>
        <div className="flex gap-1">
          {[1, 2].map((i) => (
            <div 
              key={i} 
              className={`w-4 h-4 rounded-full ${i <= claimCount ? 'bg-blue-600' : 'bg-blue-200'}`} 
            />
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {DAYS.map((day) => {
          const assignedTo = schedule[day];
          const isClaimedByMe = assignedTo === currentUser;
          const isClaimedByOther = assignedTo && !isClaimedByMe;
          const isDisabled = (isClaimedByOther) || (!isClaimedByMe && claimCount >= 2);

          return (
            <button
              key={day}
              onClick={() => toggleDay(day)}
              disabled={!!isDisabled}
              className={`
                flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left
                ${isClaimedByMe ? "border-blue-600 bg-blue-50 shadow-[0_0_0_4px_rgba(37,99,235,0.1)]" : ""}
                ${isClaimedByOther ? "border-gray-100 bg-gray-50 opacity-80 cursor-not-allowed" : ""}
                ${!assignedTo && !isDisabled ? "border-gray-200 hover:border-blue-300 hover:bg-gray-50 active:scale-[0.98]" : ""}
                ${!assignedTo && isDisabled ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <div>
                <p className={`font-bold text-lg ${isClaimedByOther ? 'text-gray-400' : 'text-gray-900'}`}>
                  {day}
                </p>
                {isClaimedByOther && (
                  <p className="text-sm font-semibold text-gray-400">Claimed by {assignedTo}</p>
                )}
                {isClaimedByMe && (
                  <p className="text-sm font-semibold text-blue-600">Claimed by you</p>
                )}
                {!assignedTo && (
                  <p className="text-sm font-semibold text-gray-400">Available</p>
                )}
              </div>

              {isClaimedByMe && <CheckCircle2 className="w-6 h-6 text-blue-600" />}
              {isClaimedByOther && <Lock className="w-5 h-5 text-gray-300" />}
            </button>
          );
        })}
      </div>

      <button
        onClick={handleSave}
        disabled={claimCount !== 2 || isPending}
        className="mt-4 w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {isPending ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" /> Saving...
          </>
        ) : (
          <>
            <Save className="w-5 h-5" /> Save My Schedule
          </>
        )}
      </button>

      <div className="mt-4 p-4 bg-gray-50 border border-gray-100 rounded-2xl text-center">
        <p className="text-sm font-medium text-gray-500">
          Note: Sunday washroom duty is automatically assigned to <span className="font-bold text-gray-900">{upcomingSundayUser}</span> this week.
        </p>
      </div>

    </div>
  );
}
