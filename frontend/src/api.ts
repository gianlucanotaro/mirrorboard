export interface User {
  id: string;
  name: string;
}

export interface Habit {
  id: string;
  text: string;
  notes: string;
  up: boolean;
  down: boolean;
  counterUp: number;
  counterDown: number;
  priority: number;
}

export interface Daily {
  id: string;
  text: string;
  notes: string;
  completed: boolean;
  isDue: boolean;
  streak: number;
  priority: number;
}

export interface Todo {
  id: string;
  text: string;
  notes: string;
  completed: boolean;
  priority: number;
}

export interface HabiticaTasks {
  habits: Habit[];
  dailies: Daily[];
  todos: Todo[];
}

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch("/api/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function fetchHabiticaTasks(userId: string): Promise<HabiticaTasks> {
  const res = await fetch(`/api/users/${userId}/habitica/tasks`);
  if (!res.ok) throw new Error("Failed to fetch Habitica tasks");
  return res.json();
}

export interface CalendarEvent {
  id: string;
  title: string;
  calendar: string;
  all_day: boolean;
  start: string;
  end: string;
}

export async function fetchCalendarToday(userId: string): Promise<CalendarEvent[]> {
  const res = await fetch(`/api/users/${userId}/calendar/today`);
  if (res.status === 404) return []; // not connected yet
  if (!res.ok) throw new Error("Failed to fetch calendar events");
  return res.json();
}
