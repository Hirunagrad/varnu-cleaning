import { getSchedule, getScheduleData, getCurrentUser, getSundayUser } from "@/app/actions";
import PlannerForm from "./PlannerForm";
import { getISOWeek, getYear, addDays } from "date-fns";

export default async function PlannerPage() {
  const currentUser = await getCurrentUser();
  if (!currentUser) return null;

  const now = new Date();
  // By default, let's plan for the upcoming week (or current if they are doing it mid-week).
  // Usually, Sunday planning is for next week. If today is Sunday, we plan next week.
  const isSunday = now.getDay() === 0;
  const targetDate = isSunday ? addDays(now, 1) : now;
  
  const year = getYear(targetDate);
  const week = getISOWeek(targetDate);

  const data = await getScheduleData(year, week);
  const upcomingSundayUser = await getSundayUser(targetDate);
  
  // Handle missing data or legacy data (before we added plannedBy wrapper)
  let initialSchedule: any = {};
  let plannedBy = null;

  if (data) {
    if ("assignments" in data) {
      initialSchedule = data.assignments || {};
      plannedBy = data.plannedBy || null;
    } else {
      initialSchedule = data; // Legacy format
    }
  }

  return (
    <PlannerForm 
      initialSchedule={initialSchedule} 
      plannedBy={plannedBy}
      currentUser={currentUser}
      year={year} 
      week={week} 
      upcomingSundayUser={upcomingSundayUser}
    />
  );
}
