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
  color: string;
  all_day: boolean;
  start: string;
  end: string;
}

export async function fetchCalendarToday(userId: string): Promise<CalendarEvent[]> {
  const res = await fetch(`/api/users/${userId}/calendar/today`);
  if (!res.ok) return []; // not connected, expired token, or other error — show connect prompt
  return res.json();
}

export interface WeatherCurrent {
  temperature: number;
  apparent_temperature: number;
  weather_code: number;
  condition: string;
  icon: string;
  humidity: number;
  wind_speed: number;
  wind_dir: string;
}

export interface WeatherForecastDay {
  date: string;
  icon: string;
  high: number;
  low: number;
  precip_prob: number;
}

export interface WeatherData {
  location: string;
  current: WeatherCurrent;
  today_high: number;
  today_low: number;
  sunrise: string;
  sunset: string;
  forecast: WeatherForecastDay[];
}

export async function fetchWeather(): Promise<WeatherData> {
  const res = await fetch("/api/weather");
  if (!res.ok) throw new Error("Failed to fetch weather");
  return res.json();
}
