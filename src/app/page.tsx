import { 
  getCurrentUser, 
  getSchedule, 
  getSundayUser,
  getCompletedBy,
  getPendingSwaps,
  getFutureAssignedDays
} from "@/app/actions";
import { format, getISOWeek, getYear } from "date-fns";
import { DayOfWeek, Schedule, User } from "@/lib/types";
import DashboardClient from "./DashboardClient";
import Login from "@/components/Login";

export default async function Home() {
  const currentUser = await getCurrentUser();
  
  if (!currentUser) {
    return <Login />;
  }

  const now = new Date();
  const dayName = format(now, "EEEE") as DayOfWeek;
  const dateStr = format(now, "yyyy-MM-dd");
  const year = getYear(now);
  const week = getISOWeek(now);

  const isSunday = dayName === "Sunday";
  const chores = isSunday ? "Washroom + Floor" : "Kitchen + Floor";
  
  const schedule: Schedule = await getSchedule(year, week) || {};
  const upcomingSundayUser = await getSundayUser(now);
  
  let assignedUser: User | null = null;
  if (isSunday) {
    assignedUser = upcomingSundayUser;
  } else {
    assignedUser = schedule[dayName] || null;
  }

  const completedBy = await getCompletedBy(dateStr);
  const pendingSwaps = await getPendingSwaps();
  
  // Swaps targeted at the current user
  const incomingSwaps = pendingSwaps.filter(s => s.toUser === currentUser);

  const futureDays = await getFutureAssignedDays();

  return (
    <div className="p-6 pb-24 min-h-screen flex flex-col">
      <DashboardClient 
        currentUser={currentUser}
        assignedUser={assignedUser}
        dayName={dayName}
        dateStr={dateStr}
        chores={chores}
        completedBy={completedBy}
        incomingSwaps={incomingSwaps}
        futureDays={futureDays}
        schedule={schedule}
        upcomingSundayUser={upcomingSundayUser}
      />
    </div>
  );
}
