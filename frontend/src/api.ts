export interface User {
  id: string;
  name: string;
}

export interface Todo {
  id: string;
  text: string;
  notes: string;
  completed: boolean;
  priority: number;
}

export async function fetchUsers(): Promise<User[]> {
  const res = await fetch("/api/users");
  if (!res.ok) throw new Error("Failed to fetch users");
  return res.json();
}

export async function fetchHabiticaTodos(userId: string): Promise<Todo[]> {
  const res = await fetch(`/api/users/${userId}/habitica/todos`);
  if (!res.ok) throw new Error("Failed to fetch Habitica todos");
  return res.json();
}
