import { fetchCalendarToday, type CalendarEvent } from "../api";

let cache: CalendarEvent[] | null = null;

export async function renderCalendarWidget(container: HTMLElement, userId: string) {
  cache = null;
  container.innerHTML = skeleton();
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

  const newHtml = eventsHtml(events, userId);
  const oldHtml = cache !== null ? eventsHtml(cache, userId) : null;

  if (newHtml !== oldHtml) {
    const list = container.querySelector<HTMLElement>("#cal-list");
    if (list) list.innerHTML = newHtml;
  }
  cache = events;
}

function skeleton(): string {
  return `
    <h2 class="text-lg font-semibold mb-4 text-text" style="font-family:'Montserrat',sans-serif">
      Today
    </h2>
    <ul id="cal-list" class="flex flex-col gap-1"></ul>
  `;
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
    return `
      <li class="flex items-start gap-3 py-2 border-b border-border last:border-0">
        <span class="text-xs text-muted w-14 flex-shrink-0 pt-0.5 tabular-nums">${time}</span>
        <span class="flex flex-col min-w-0">
          <span class="text-sm text-text leading-snug truncate">${escapeHtml(e.title)}</span>
          <span class="text-xs text-muted truncate">${escapeHtml(e.calendar)}</span>
        </span>
      </li>
    `;
  }).join("");
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
