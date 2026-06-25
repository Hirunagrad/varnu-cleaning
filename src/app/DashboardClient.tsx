"use client";

import { useState, useTransition } from "react";
import { User, SwapRequest, Schedule, DayOfWeek } from "@/lib/types";
import { markCompleted, undoCompletion, requestSwap, respondToSwap } from "@/app/actions";
import { CheckCircle2, ArrowRightLeft, Check, X, AlertCircle, RotateCcw, Settings, CalendarDays, Bath } from "lucide-react";
import Link from "next/link";

export default function DashboardClient({
  currentUser,
  assignedUser,
  dayName,
  dateStr,
  chores,
  completedBy,
  incomingSwaps,
  futureDays,
  schedule,
  upcomingSundayUser
}: {
  currentUser: User;
  assignedUser: User | null;
  dayName: string;
  dateStr: string;
  chores: string;
  completedBy: User | null;
  incomingSwaps: SwapRequest[];
  futureDays: { dateStr: string; dayName: string; chores: string }[];
  schedule: Schedule;
  upcomingSundayUser: User;
}) {
  const [isPending, startTransition] = useTransition();
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [swapTargetUser, setSwapTargetUser] = useState<User | null>(null);
  const [swapDate, setSwapDate] = useState<string | null>(null);

  const handleMarkCompleted = () => {
    if (!assignedUser) return;
    startTransition(async () => {
      await markCompleted(dateStr, assignedUser, chores);
    });
  };

  const handleUndo = () => {
    startTransition(async () => {
      await undoCompletion(dateStr);
    });
  };

  const handleSwapRequest = () => {
    if (!swapTargetUser || !swapDate) return;
    startTransition(async () => {
      await requestSwap(swapDate, currentUser, swapTargetUser);
      setShowSwapModal(false);
      setSwapTargetUser(null);
      setSwapDate(null);
    });
  };

  const handleSwapResponse = (id: string, approved: boolean) => {
    startTransition(async () => {
      await respondToSwap(id, approved);
    });
  };

  const USERS: User[] = ["Chamin", "Tharindu", "Hiruna"];
  const otherUsers = USERS.filter(u => u !== currentUser);
  const isCompleted = completedBy !== null;

  const DAYS: DayOfWeek[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const myDaysThisWeek = DAYS.filter(day => schedule[day] === currentUser);

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex justify-between items-center px-2 py-4">
        <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">Today</h1>
        <Link href="/profile" className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full transition-colors border border-gray-100">
          <Settings className="w-6 h-6" />
        </Link>
      </div>

      {/* Incoming Swap Requests */}
      {incomingSwaps.length > 0 && (
        <div className="flex flex-col gap-3">
          {incomingSwaps.map(swap => (
            <div key={swap.id} className="bg-orange-50 border border-orange-200 p-4 rounded-3xl shadow-sm flex flex-col gap-3">
              <div className="flex items-center gap-2 text-orange-800 font-semibold">
                <AlertCircle className="w-5 h-5" />
                <span>Swap Request</span>
              </div>
              <p className="text-orange-900 text-sm">
                <strong>{swap.fromUser}</strong> wants to swap with you for today ({dayName}).
              </p>
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handleSwapResponse(swap.id, true)}
                  disabled={isPending}
                  className="flex-1 bg-orange-600 text-white font-semibold py-2 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" /> Approve
                </button>
                <button
                  onClick={() => handleSwapResponse(swap.id, false)}
                  disabled={isPending}
                  className="flex-1 bg-orange-200 text-orange-900 font-semibold py-2 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <X className="w-4 h-4" /> Deny
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white rounded-[2rem] shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 p-8 flex flex-col items-center text-center relative overflow-hidden">
        {/* Top Date */}
        <p className="text-blue-600 font-bold tracking-widest uppercase text-sm mb-2">{dayName}</p>
        
        {/* Assigned User */}
        {assignedUser ? (
          <>
            <h1 className="text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
              {assignedUser}&apos;s Turn
            </h1>
            <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-2xl font-medium mb-8">
              {chores}
            </div>

            {completedBy ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <div className="flex items-center gap-2 text-green-600 font-bold text-xl mb-2">
                  <CheckCircle2 className="w-8 h-8" />
                  Completed by {completedBy}
                </div>
                {currentUser === completedBy && (
                  <button
                    onClick={handleUndo}
                    disabled={isPending}
                    className="flex items-center justify-center gap-2 w-full bg-gray-100 text-gray-600 font-bold text-lg py-4 rounded-2xl shadow-sm active:scale-[0.98] transition-all disabled:opacity-50 hover:bg-gray-200"
                  >
                    <RotateCcw className="w-5 h-5" />
                    {isPending ? "Undoing..." : "Undo Completion"}
                  </button>
                )}
              </div>
            ) : currentUser === assignedUser ? (
              <button
                onClick={handleMarkCompleted}
                disabled={isPending}
                className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isPending ? "Saving..." : "Mark as Completed"} <Check className="w-5 h-5" />
              </button>
            ) : (
              <div className="w-full bg-gray-50 border border-gray-100 text-gray-400 font-semibold text-center py-4 rounded-2xl">
                Waiting for {assignedUser} to complete this.
              </div>
            )}

            {!isCompleted && currentUser === assignedUser && (
              <button
                onClick={() => setShowSwapModal(true)}
                className="mt-6 flex items-center gap-2 text-gray-500 font-semibold hover:text-gray-900 transition-colors"
              >
                <ArrowRightLeft className="w-4 h-4" />
                Request Swap
              </button>
            )}
          </>
        ) : (
          <>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-4">
              No one assigned!
            </h1>
            <p className="text-gray-500 mb-6">Please set the schedule for this week.</p>
          </>
        )}
      </div>

      {/* Quick Overview Sections */}
      <div className="flex flex-col gap-4 mt-2">
        
        {/* My Schedule Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <CalendarDays className="w-5 h-5 text-blue-500" />
            <h3 className="font-bold text-gray-900">My Schedule This Week</h3>
          </div>
          
          {myDaysThisWeek.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {myDaysThisWeek.map(day => (
                <span key={day} className="px-3 py-1 bg-blue-50 text-blue-700 text-sm font-semibold rounded-lg border border-blue-100">
                  {day}
                </span>
              ))}
            </div>
          ) : (
            <div className="bg-orange-50 text-orange-700 p-3 rounded-xl text-sm font-semibold border border-orange-100 flex items-center justify-between">
              <span>You haven't claimed your 2 days yet!</span>
              <Link href="/planner" className="px-3 py-1.5 bg-orange-600 text-white rounded-lg text-xs font-bold hover:bg-orange-700 transition-colors">
                Planner
              </Link>
            </div>
          )}
        </div>

        {/* Sunday Duty Card */}
        {dayName !== "Sunday" && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bath className="w-5 h-5 text-indigo-500" />
                <h3 className="font-bold text-gray-900">This Sunday's Washroom Duty:</h3>
              </div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-700 text-sm font-bold rounded-lg border border-indigo-100">
                {upcomingSundayUser}
              </span>
            </div>
          </div>
        )}

      </div>

      {/* Advanced Swap UI Modal */}
      {showSwapModal && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          <div className="flex justify-between items-center p-4 border-b border-gray-100">
            <h2 className="text-xl font-bold text-gray-900">Request a Swap</h2>
            <button onClick={() => setShowSwapModal(false)} className="p-2 text-gray-400 hover:text-gray-600 bg-gray-50 rounded-full">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-8">
            
            {/* Step 1: Select Date */}
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Step 1: Select a day to give up</h3>
                <p className="text-sm text-gray-500">You can only swap future days assigned to you.</p>
              </div>
              
              {futureDays.length === 0 ? (
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 text-center text-gray-500 text-sm">
                  You have no upcoming days assigned.
                </div>
              ) : (
                <div className="flex flex-col gap-2">
                  {futureDays.map(day => (
                    <button
                      key={day.dateStr}
                      onClick={() => setSwapDate(day.dateStr)}
                      className={`flex justify-between items-center p-4 rounded-xl border-2 transition-all text-left ${swapDate === day.dateStr ? "border-blue-600 bg-blue-50" : "border-gray-100 bg-white"}`}
                    >
                      <div>
                        <p className={`font-bold ${swapDate === day.dateStr ? "text-blue-900" : "text-gray-900"}`}>{day.dayName}</p>
                        <p className={`text-sm ${swapDate === day.dateStr ? "text-blue-600" : "text-gray-500"}`}>{day.dateStr}</p>
                      </div>
                      {swapDate === day.dateStr && <CheckCircle2 className="w-5 h-5 text-blue-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Step 2: Select User */}
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-gray-900 mb-1">Step 2: Select who takes it</h3>
                <p className="text-sm text-gray-500">They will need to approve this request.</p>
              </div>
              
              <div className="flex gap-2">
                {otherUsers.map((u) => (
                  <button
                    key={u}
                    disabled={!swapDate}
                    onClick={() => setSwapTargetUser(u)}
                    className={`flex-1 py-4 rounded-xl border-2 font-bold transition-all disabled:opacity-50 ${swapTargetUser === u ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-100 bg-white text-gray-600"}`}
                  >
                    {u}
                  </button>
                ))}
              </div>
            </div>

          </div>

          <div className="p-4 border-t border-gray-100 bg-gray-50">
            <button
              onClick={handleSwapRequest}
              disabled={!swapTargetUser || !swapDate || isPending}
              className="w-full bg-blue-600 text-white font-bold text-lg py-4 rounded-2xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {isPending ? "Sending Request..." : "Send Request"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
