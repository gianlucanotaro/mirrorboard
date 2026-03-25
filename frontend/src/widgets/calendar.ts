import { fetchCalendarToday, type CalendarEvent } from "../api";

let cache: CalendarEvent[] | null = null;

export async function renderCalendarWidget(container: HTMLElement, userId: string) {
  cache = null;
  container.innerHTML = `
    <h2 class="text-lg font-semibold mb-4 text-text" style="font-family:'Montserrat',sans-serif">Today</h2>
    <div class="flex gap-4 h-full">
      <ul id="cal-list" class="flex flex-col flex-1 min-w-0"></ul>
      <ul id="cal-legend" class="flex flex-col gap-2 flex-shrink-0"></ul>
    </div>
  `;
  await refresh(container, userId);
}

export async function refreshCalendarWidget(container: HTMLElement, userId: string) {
  await refresh(container, userId);
}

async function refresh(container: HTMLElement, userId: string) {
  let events: CalendarEvent[];
  try {
    events = await fetchCalendarToday(userId);
  } catch {
    return;
  }

  const newEvents = eventsHtml(events, userId);
  const newLegend = legendHtml(events);
  const oldEvents = cache !== null ? eventsHtml(cache, userId) : null;
  const oldLegend = cache !== null ? legendHtml(cache) : null;

  const listEl = container.querySelector<HTMLElement>("#cal-list");
  const legendEl = container.querySelector<HTMLElement>("#cal-legend");

  if (newEvents !== oldEvents && listEl) listEl.innerHTML = newEvents;
  if (newLegend !== oldLegend && legendEl) legendEl.innerHTML = newLegend;

  cache = events;
}

function eventsHtml(events: CalendarEvent[], userId: string): string {
  if (events.length === 0) {
    return `
      <li class="flex flex-col gap-3">
        <p class="text-sm text-muted">No events today.</p>
        <a href="/api/users/${userId}/auth/google"
           class="text-sm text-primary underline underline-offset-2">
          Connect Google Calendar
        </a>
      </li>
    `;
  }

  return events.map((e) => {
    const time = e.all_day ? "All day" : formatTime(e.start);
    const color = e.color || "#4a4a4a";
    return `
      <li class="flex items-start gap-2 py-2 border-b border-border last:border-0 min-w-0">
        <span class="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
              style="background-color:${color}"></span>
        <span class="text-xs text-muted w-12 flex-shrink-0 pt-0.5 tabular-nums">${time}</span>
        <span class="text-sm text-text leading-snug truncate">${escapeHtml(e.title)}</span>
      </li>
    `;
  }).join("");
}

function legendHtml(events: CalendarEvent[]): string {
  // Deduplicate calendars, preserving order of first appearance
  const seen = new Map<string, string>(); // name → color
  for (const e of events) {
    if (!seen.has(e.calendar)) seen.set(e.calendar, e.color || "#4a4a4a");
  }

  return Array.from(seen.entries()).map(([name, color]) => `
    <li class="flex items-center gap-1.5 whitespace-nowrap">
      <span class="w-2 h-2 rounded-full flex-shrink-0"
            style="background-color:${color}"></span>
      <span class="text-xs text-muted">${escapeHtml(name)}</span>
    </li>
  `).join("");
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
