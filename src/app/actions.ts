"use server";

import { kv } from "@/lib/kv";
import { Schedule, ScheduleData, HistoryRecord, SwapRequest, User } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { getISOWeek, getYear, format, parseISO } from "date-fns";
import { encrypt, decrypt } from "@/lib/auth";

// --- Auth / User Actions ---

// Default PINs for seeding
const DEFAULT_PINS: Record<User, string> = {
  Chamin: "1111",
  Tharindu: "2222",
  Hiruna: "3333",
};

export async function login(user: User, pin: string): Promise<boolean> {
  const pinKey = `user:${user}:pin`;
  let storedPin = await kv.get<string>(pinKey);
  
  // Seed PIN if not found
  if (!storedPin) {
    storedPin = DEFAULT_PINS[user];
    await kv.set(pinKey, storedPin);
  }

  if (storedPin === pin) {
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
    const session = await encrypt({ user, expires });
    const cookieStore = await cookies();
    cookieStore.set("session", session, { expires, httpOnly: true, sameSite: "lax" });
    revalidatePath("/");
    return true;
  }
  return false;
}

export async function changePin(currentPin: string, newPin: string): Promise<boolean> {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Unauthorized");

  const pinKey = `user:${currentUser}:pin`;
  let storedPin = await kv.get<string>(pinKey);
  if (!storedPin) storedPin = DEFAULT_PINS[currentUser];

  if (storedPin !== currentPin) {
    return false;
  }

  await kv.set(pinKey, newPin);
  return true;
}

export async function logout(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set("session", "", { expires: new Date(0) });
  revalidatePath("/");
}

export async function getCurrentUser(): Promise<User | null> {
  const cookieStore = await cookies();
  const session = cookieStore.get("session")?.value;
  if (!session) return null;
  
  const decrypted = await decrypt(session);
  if (!decrypted) return null;

  return decrypted.user;
}

// --- Schedule Actions ---

export async function getScheduleData(year: number, week: number): Promise<ScheduleData | null> {
  const key = `schedule:week-${year}-${week}`;
  return kv.get<ScheduleData>(key);
}

export async function getSchedule(year: number, week: number): Promise<Schedule | null> {
  const data = await getScheduleData(year, week);
  return data ? data.assignments : null;
}

export async function saveSchedule(year: number, week: number, selectedDays: (keyof Schedule)[]): Promise<void> {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Unauthorized");

  if (selectedDays.length !== 2) {
    throw new Error("You must select exactly 2 days.");
  }

  const key = `schedule:week-${year}-${week}`;
  const existingData = await getScheduleData(year, week);
  let oldSchedule: Schedule = existingData ? existingData.assignments : {};
  // Handle legacy format fallback if necessary
  if (existingData && !("assignments" in existingData)) {
    oldSchedule = existingData as unknown as Schedule;
  }

  // Verify that the user is not trying to overwrite someone else's day
  for (const day of selectedDays) {
    if (oldSchedule[day] && oldSchedule[day] !== currentUser) {
      throw new Error(`Cannot claim ${day}, it is already assigned to ${oldSchedule[day]}.`);
    }
  }

  const newSchedule: Schedule = { ...oldSchedule };

  // Unclaim any days the current user previously claimed but didn't select this time
  const DAYS: (keyof Schedule)[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  for (const day of DAYS) {
    if (newSchedule[day] === currentUser && !selectedDays.includes(day)) {
      delete newSchedule[day];
    }
  }

  // Claim the newly selected days
  for (const day of selectedDays) {
    newSchedule[day] = currentUser;
  }

  const data: ScheduleData = { assignments: newSchedule, plannedBy: currentUser };
  await kv.set(key, data);
  revalidatePath("/");
  revalidatePath("/planner");
}

export async function getSundayUser(date: Date): Promise<User> {
  const weekNum = getISOWeek(date);
  const users: User[] = ["Chamin", "Tharindu", "Hiruna"];
  // Assure it rotates exactly weekNumber % 3
  const userIndex = weekNum % 3;
  return users[userIndex];
}

// --- History Actions ---

export async function getHistory(): Promise<HistoryRecord[]> {
  const records = await kv.lrange<HistoryRecord>("history:all", 0, 100);
  return records || [];
}

export async function markCompleted(dateStr: string, user: User, chores: string): Promise<void> {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Unauthorized");
  if (currentUser !== user) throw new Error("Unauthorized: You cannot complete someone else's chore.");

  // Strict backend validation: verify the schedule for the given date
  const targetDate = parseISO(dateStr);
  const dayName = format(targetDate, "EEEE") as keyof Schedule | "Sunday";
  const year = getYear(targetDate);
  const week = getISOWeek(targetDate);

  let scheduledUserForToday: User | null = null;
  if (dayName === "Sunday") {
    scheduledUserForToday = await getSundayUser(targetDate);
  } else {
    const schedule = await getSchedule(year, week);
    scheduledUserForToday = schedule ? schedule[dayName] || null : null;
  }

  if (scheduledUserForToday !== currentUser) {
    throw new Error("Unauthorized: You cannot complete someone else's chore.");
  }

  const record: HistoryRecord = {
    id: crypto.randomUUID(),
    date: dateStr,
    user,
    chores,
    completedAt: new Date().toISOString(),
  };
  await kv.lpush("history:all", record);
  revalidatePath("/");
  revalidatePath("/history");
}

export async function getCompletedBy(dateStr: string): Promise<User | null> {
  const records = await getHistory();
  const record = records.find(r => r.date === dateStr);
  return record ? record.user : null;
}

export async function undoCompletion(dateStr: string): Promise<void> {
  const currentUser = await getCurrentUser();
  if (!currentUser) throw new Error("Unauthorized");

  const records = await getHistory();
  const index = records.findIndex(r => r.date === dateStr);
  if (index !== -1) {
    const record = records[index];
    
    // Strict Authorization: only the user who completed it can undo it
    if (record.user !== currentUser) {
      throw new Error("Unauthorized to undo someone else's completion");
    }
    
    records.splice(index, 1);
    await kv.del("history:all");
    // Repopulate in correct order
    for (let i = records.length - 1; i >= 0; i--) {
      await kv.lpush("history:all", records[i]);
    }
    revalidatePath("/");
    revalidatePath("/history");
  }
}

// --- Swap Actions ---

export async function getPendingSwaps(): Promise<SwapRequest[]> {
  const swaps = await kv.lrange<SwapRequest>("swaps:all", 0, -1);
  return (swaps || []).filter(s => s.status === "pending");
}

export async function getFutureAssignedDays(): Promise<{ dateStr: string; dayName: string; chores: string }[]> {
  const currentUser = await getCurrentUser();
  if (!currentUser) return [];

  const futureDays: { dateStr: string; dayName: string; chores: string }[] = [];
  const now = new Date();
  
  // Check next 14 days
  for (let i = 1; i <= 14; i++) {
    const targetDate = new Date();
    targetDate.setDate(now.getDate() + i);
    const dateStr = format(targetDate, "yyyy-MM-dd");
    const dayName = format(targetDate, "EEEE") as keyof Schedule;
    const year = getYear(targetDate);
    const week = getISOWeek(targetDate);

    let assignedUser: User | null = null;
    let chores = "";

    if (dayName === "Sunday") {
      assignedUser = await getSundayUser(targetDate);
      chores = "Washroom + Floor";
    } else {
      const schedule = await getSchedule(year, week);
      assignedUser = schedule ? schedule[dayName] || null : null;
      chores = "Kitchen + Floor";
    }

    if (assignedUser === currentUser) {
      // Also check if completed? Future days shouldn't be completed, but just in case.
      futureDays.push({ dateStr, dayName, chores });
    }
  }

  return futureDays;
}

export async function requestSwap(dateStr: string, fromUser: User, toUser: User): Promise<void> {
  const todayStr = format(new Date(), "yyyy-MM-dd");
  if (dateStr <= todayStr) {
    throw new Error("Can only swap future days.");
  }

  const swap: SwapRequest = {
    id: crypto.randomUUID(),
    date: dateStr,
    fromUser,
    toUser,
    status: "pending",
    createdAt: new Date().toISOString(),
  };
  await kv.lpush("swaps:all", swap);
  revalidatePath("/");
}

export async function respondToSwap(swapId: string, approved: boolean): Promise<void> {
  const swaps = await kv.lrange<SwapRequest>("swaps:all", 0, -1);
  if (!swaps) return;

  const swapIndex = swaps.findIndex(s => s.id === swapId);
  if (swapIndex === -1) return;

  const swap = swaps[swapIndex];
  swap.status = approved ? "approved" : "denied";

  // Rewrite swaps array
  await kv.del("swaps:all");
  // Repopulate (we want to keep them to avoid losing history, but for simplicity, we just put them back)
  // Since lpush puts at the start, we iterate in reverse if we want to maintain order
  for (let i = swaps.length - 1; i >= 0; i--) {
    await kv.lpush("swaps:all", swaps[i]);
  }

  // If approved, update the schedule
  if (approved) {
    const date = parseISO(swap.date);
    const year = getYear(date);
    const week = getISOWeek(date);
    const dayName = format(date, "EEEE") as keyof Schedule;

    if (dayName !== "Sunday") {
      const schedule = await getSchedule(year, week) || {};
      schedule[dayName] = swap.fromUser; // Swap fromUser becomes the one who takes it? Wait.
      // If fromUser requested to swap WITH toUser.
      // So toUser is now taking the shift.
      schedule[dayName] = swap.toUser;
      await saveSchedule(year, week, schedule);
    }
  }

  revalidatePath("/");
}
