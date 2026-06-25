export type User = "Chamin" | "Tharindu" | "Hiruna";

export type DayOfWeek = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday" | "Sunday";

export type Schedule = {
  [key in DayOfWeek]?: User;
};

export type ScheduleData = {
  assignments: Schedule;
  plannedBy: User;
};

export type HistoryRecord = {
  id: string;
  date: string; // YYYY-MM-DD
  user: User;
  chores: string;
  completedAt: string; // ISO String
};

export type SwapRequest = {
  id: string;
  date: string; // YYYY-MM-DD
  fromUser: User;
  toUser: User;
  status: "pending" | "approved" | "denied";
  createdAt: string; // ISO String
};
