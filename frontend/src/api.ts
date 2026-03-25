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
