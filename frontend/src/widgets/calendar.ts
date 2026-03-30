import { fetchCalendarToday, type CalendarEvent } from "../api";
import {
  CALENDAR_START_HOUR,
  CALENDAR_END_HOUR,
  CALENDAR_MIN_ROW_HEIGHT,
  CALENDAR_LABEL_WIDTH,
  CALENDAR_LABEL_GAP,
  CALENDAR_EVENT_GAP,
} from "../config";

const HOURS = Array.from(
  { length: CALENDAR_END_HOUR - CALENDAR_START_HOUR },
  (_, i) => CALENDAR_START_HOUR + i,
);

interface TimedEvent extends CalendarEvent {
  startMin: number; // minutes from midnight
  endMin: number;
  col: number;
  totalCols: number;
}

let cache: CalendarEvent[] | null = null;

export async function renderCalendarWidget(container: HTMLElement, userId: string) {
  cache = null;
  container.innerHTML = `
    <div style="display:flex;flex-direction:column;height:100%;gap:10px;">
      <div style="display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
        <h2 style="font-family:'Montserrat',sans-serif;font-size:1.125rem;font-weight:600;color:var(--color-text);margin:0;">
          Today
        </h2>
        <span style="font-size:11px;color:var(--color-muted);">${todayLabel()}</span>
      </div>
      <div id="cal-allday" style="flex-shrink:0;"></div>
      <div id="cal-grid" style="flex:1;position:relative;overflow:hidden;min-height:0;"></div>
    </div>
  `;

  await refreshGrid(container, userId);
}

export async function refreshCalendarWidget(container: HTMLElement, userId: string) {
  await refreshGrid(container, userId);
}

async function refreshGrid(container: HTMLElement, userId: string) {
  let events: CalendarEvent[];
  try {
    events = await fetchCalendarToday(userId);
  } catch {
    return;
  }

  const grid = container.querySelector<HTMLElement>("#cal-grid");
  const allday = container.querySelector<HTMLElement>("#cal-allday");
  if (!grid || !allday) return;

  const availH = grid.clientHeight || 400;
  const hourHeight = Math.max(
    Math.floor(availH / (CALENDAR_END_HOUR - CALENDAR_START_HOUR)),
    CALENDAR_MIN_ROW_HEIGHT,
  );

  const newGrid = buildGrid(events, hourHeight);
  const newAllDay = buildAllDay(events, userId);
  const oldGrid = cache ? buildGrid(cache, hourHeight) : null;
  const oldAllDay = cache ? buildAllDay(cache, userId) : null;

  if (newGrid !== oldGrid) grid.innerHTML = newGrid;
  if (newAllDay !== oldAllDay) allday.innerHTML = newAllDay;

  cache = events;
}

// ─── All-day section ─────────────────────────────────────────────────────────

function buildAllDay(events: CalendarEvent[], userId: string): string {
  if (events.length === 0) {
    return `
      <p style="font-size:0.875rem;color:var(--color-muted);margin:0 0 4px;">No events today.</p>
      <a href="/api/users/${userId}/auth/google"
         style="font-size:0.875rem;color:var(--color-primary);text-decoration:underline;">
        Connect Google Calendar
      </a>
    `;
  }

  const allDay = events.filter((e) => e.all_day);
  if (allDay.length === 0) return "";

  return `<div style="display:flex;flex-wrap:wrap;gap:4px;">${allDay
    .map(
      (e) => `
    <span style="
      font-size:10px;font-weight:600;padding:2px 8px;border-radius:99px;
      background-color:${e.color || "var(--color-primary)"};
      color:#0d0d0d;white-space:nowrap;
    ">${escapeHtml(e.title)}</span>
  `
    )
    .join("")}</div>`;
}

// ─── Time grid ────────────────────────────────────────────────────────────────

function buildGrid(events: CalendarEvent[], hourHeight: number): string {
  const timed = positionEvents(events.filter((e) => !e.all_day));

  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();
  const showNow = currentMin >= CALENDAR_START_HOUR * 60 && currentMin < CALENDAR_END_HOUR * 60;
  const nowTop = ((currentMin - CALENDAR_START_HOUR * 60) / 60) * hourHeight;

  const hourLines = HOURS.map((h) => {
    const top = (h - CALENDAR_START_HOUR) * hourHeight;
    return `
      <div style="position:absolute;top:${top}px;left:0;right:0;pointer-events:none;">
        <span style="
          position:absolute;left:0;top:-7px;width:${CALENDAR_LABEL_WIDTH}px;
          font-size:9px;color:var(--color-muted);text-align:right;
          padding-right:4px;line-height:1;font-family:'Open Sans',sans-serif;
        ">${h < 10 ? "0" + h : h}:00</span>
        <div style="
          position:absolute;left:${CALENDAR_LABEL_WIDTH + CALENDAR_LABEL_GAP}px;right:0;top:0;
          height:1px;background:var(--color-border);
        "></div>
      </div>
    `;
  }).join("");

  const nowLine = showNow
    ? `
    <div style="position:absolute;top:${nowTop}px;left:${CALENDAR_LABEL_WIDTH}px;right:0;z-index:10;pointer-events:none;">
      <div style="position:absolute;left:4px;right:0;top:-1px;height:2px;background:#ef4444;border-radius:1px;"></div>
      <div style="position:absolute;left:0;top:-3px;width:6px;height:6px;border-radius:50%;background:#ef4444;"></div>
    </div>
  `
    : "";

  const eventBlocks = timed
    .map((e) => {
      const startMin = Math.max(e.startMin, CALENDAR_START_HOUR * 60);
      const endMin = Math.min(e.endMin, CALENDAR_END_HOUR * 60);
      if (startMin >= endMin) return "";

      const top = ((startMin - CALENDAR_START_HOUR * 60) / 60) * hourHeight;
      const height = Math.max(((endMin - startMin) / 60) * hourHeight, 18);
      const leftPct = (e.col / e.totalCols) * 100;
      const widthPct = (1 / e.totalCols) * 100;
      const color = e.color || "var(--color-primary)";
      const showTitle = height >= 16;
      const showTime = height >= 28;

      return `
        <div style="
          position:absolute;
          top:${top}px;
          height:${height}px;
          left:calc(${leftPct}% + ${CALENDAR_EVENT_GAP}px);
          width:calc(${widthPct}% - ${CALENDAR_EVENT_GAP * 2}px);
          background-color:${color}28;
          border-left:2px solid ${color};
          border-radius:0 3px 3px 0;
          padding:2px 5px;
          overflow:hidden;
          box-sizing:border-box;
        ">
          ${showTitle ? `<p style="font-size:10px;font-weight:600;color:var(--color-text);line-height:1.3;margin:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${escapeHtml(e.title)}</p>` : ""}
          ${showTime ? `<p style="font-size:9px;color:var(--color-muted);line-height:1;margin:0;">${formatTime(e.start)}</p>` : ""}
        </div>
      `;
    })
    .join("");

  return `
    ${hourLines}
    ${nowLine}
    <div style="position:absolute;top:0;left:${CALENDAR_LABEL_WIDTH + CALENDAR_LABEL_GAP}px;right:0;bottom:0;">
      ${eventBlocks}
    </div>
  `;
}

// ─── Overlap algorithm ───────────────────────────────────────────────────────

function positionEvents(events: CalendarEvent[]): TimedEvent[] {
  const timed: TimedEvent[] = events
    .map((e) => ({
      ...e,
      startMin: isoToMinutes(e.start),
      endMin: isoToMinutes(e.end),
      col: 0,
      totalCols: 1,
    }))
    .sort((a, b) => a.startMin - b.startMin);

  // Greedy column assignment
  const colEnds: number[] = [];
  for (const e of timed) {
    let col = 0;
    while (col < colEnds.length && colEnds[col] > e.startMin) col++;
    e.col = col;
    colEnds[col] = e.endMin;
  }

  // For each event, find the max columns needed across all events it overlaps with
  for (const e of timed) {
    const overlapping = timed.filter(
      (o) => o.startMin < e.endMin && o.endMin > e.startMin
    );
    e.totalCols = Math.max(...overlapping.map((o) => o.col + 1));
  }

  return timed;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function isoToMinutes(iso: string): number {
  try {
    const d = new Date(iso);
    return d.getHours() * 60 + d.getMinutes();
  } catch {
    return 0;
  }
}

function todayLabel(): string {
  return new Date().toLocaleDateString([], {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
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
