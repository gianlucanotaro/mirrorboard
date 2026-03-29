import { fetchWeather, type WeatherData } from "../api";

let cache: WeatherData | null = null;
let clockTimer: ReturnType<typeof setTimeout> | null = null;

export async function renderWeatherWidget(container: HTMLElement) {
  cache = null;
  await refresh(container);
  startClock(container);
}

export async function refreshWeatherWidget(container: HTMLElement) {
  await refresh(container);
}

// ─── Live clock ───────────────────────────────────────────────────────────────
// Fires once immediately, then self-schedules to tick at every minute boundary.

function startClock(container: HTMLElement) {
  if (clockTimer !== null) clearTimeout(clockTimer);
  tickClock(container);
  scheduleNextTick(container);
}

function scheduleNextTick(container: HTMLElement) {
  const now = new Date();
  const msUntilNextMinute =
    (60 - now.getSeconds()) * 1000 - now.getMilliseconds() + 50; // +50 ms buffer
  clockTimer = setTimeout(() => {
    tickClock(container);
    scheduleNextTick(container);
  }, msUntilNextMinute);
}

function tickClock(container: HTMLElement) {
  const el = container.querySelector<HTMLElement>("#weather-clock");
  if (el) el.textContent = currentTime();
}

function currentTime(): string {
  return new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
}

// ─── Weather data ─────────────────────────────────────────────────────────────

async function refresh(container: HTMLElement) {
  let data: WeatherData;
  try {
    data = await fetchWeather();
  } catch {
    return;
  }

  const newHtml = weatherHtml(data);
  const oldHtml = cache ? weatherHtml(cache) : null;
  if (newHtml !== oldHtml) {
    container.innerHTML = newHtml;
    startClock(container);
  }
  cache = data;
}

function weatherHtml(d: WeatherData): string {
  return `
    <div class="flex flex-col gap-3 h-full">

      <!-- Clock -->
      <div class="flex items-baseline gap-3 flex-shrink-0">
        <p id="weather-clock"
           class="tabular-nums font-semibold text-text"
           style="font-family:'Montserrat',sans-serif;font-size:2.75rem;line-height:1;">
          ${currentTime()}
        </p>
        <div class="flex flex-col">
          <p class="text-xs text-muted">${new Date().toLocaleDateString([], { weekday: "long" })}</p>
          <p class="text-xs text-muted">${new Date().toLocaleDateString([], { month: "long", day: "numeric" })}</p>
        </div>
      </div>

      <!-- Advice -->
      ${weatherAdvice(d) ? `<p class="text-xs flex-shrink-0" style="color:var(--color-primary);">${weatherAdvice(d)}</p>` : ""}

      <!-- Current conditions -->
      <div class="flex items-start justify-between flex-shrink-0">
        <div>
          <p class="tabular-nums font-semibold text-text"
             style="font-family:'Montserrat',sans-serif;font-size:3rem;line-height:1;">
            ${Math.round(d.current.temperature)}°
          </p>
          <p class="text-sm text-muted mt-1">${d.current.condition}</p>
          <p class="text-xs text-muted">Feels like ${Math.round(d.current.apparent_temperature)}°</p>
        </div>
        <div class="text-right">
          <p style="font-size:2.5rem;line-height:1;">${d.current.icon}</p>
          <p class="text-xs text-muted mt-1">${d.location}</p>
          <p class="text-xs text-muted tabular-nums">↑${Math.round(d.today_high)}° ↓${Math.round(d.today_low)}°</p>
        </div>
      </div>

      <!-- Humidity · Wind · Sunrise · Sunset -->
      <div class="grid grid-cols-4 gap-2 flex-shrink-0 border-t border-border pt-3">
        ${stat("💧", `${d.current.humidity}%`, "Humidity")}
        ${stat("💨", `${Math.round(d.current.wind_speed)} km/h ${d.current.wind_dir}`, "Wind")}
        ${stat("🌅", d.sunrise, "Sunrise")}
        ${stat("🌇", d.sunset, "Sunset")}
      </div>

      <!-- 5-day forecast -->
      <div class="grid grid-cols-5 gap-1 border-t border-border pt-3 flex-shrink-0">
        ${d.forecast.map((f) => `
          <div class="flex flex-col items-center gap-1">
            <p class="text-xs text-muted">${f.date}</p>
            <p style="font-size:1.25rem;line-height:1;">${f.icon}</p>
            <p class="text-xs text-text tabular-nums">↑${Math.round(f.high)}°</p>
            <p class="text-xs text-muted tabular-nums">↓${Math.round(f.low)}°</p>
            <p class="text-xs tabular-nums" style="color:${precipColor(f.precip_prob)};">
              ${f.precip_prob}%
            </p>
          </div>
        `).join("")}
      </div>

    </div>
  `;
}

function stat(icon: string, value: string, label: string): string {
  return `
    <div class="flex flex-col items-center gap-1 text-center">
      <p style="font-size:1rem;line-height:1;">${icon}</p>
      <p class="text-xs font-semibold text-text tabular-nums">${value}</p>
      <p class="text-xs text-muted">${label}</p>
    </div>
  `;
}

function weatherAdvice(d: WeatherData): string {
  const code = d.current.weather_code;
  const feels = d.current.apparent_temperature;
  const wind = d.current.wind_speed;
  const todayPrecip = d.forecast[0]?.precip_prob ?? 0;

  // Thunderstorm
  if (code >= 95) return "⛈️ Thunderstorm likely — stay indoors if you can.";

  // Heavy snow / blizzard
  if (code >= 75 && code <= 77) return "🌨️ Heavy snow — drive carefully.";

  // Any snow
  if ((code >= 71 && code <= 77) || code === 85 || code === 86)
    return "❄️ Snow expected — dress warmly and watch your step.";

  // Freezing rain / sleet
  if (code >= 66 && code <= 67) return "🧊 Freezing rain — roads may be icy.";

  // Rain or drizzle currently
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82))
    return "☂️ Bring an umbrella.";

  // High precip probability even if not raining yet
  if (todayPrecip >= 70) return "🌂 Rain likely later — take an umbrella.";
  if (todayPrecip >= 40) return "🌦️ Chance of rain — maybe pack an umbrella.";

  // Fog
  if (code === 45 || code === 48) return "🌫️ Foggy — allow extra travel time.";

  // Very cold feels-like
  if (feels <= -10) return "🥶 Dangerously cold — cover all exposed skin.";
  if (feels <= 0) return "🧣 Freezing out — bundle up well.";
  if (feels <= 5) return "🧥 Very cold — wear a heavy coat.";

  // Strong wind
  if (wind >= 60) return "💨 Strong winds — secure loose items.";
  if (wind >= 40) return "💨 Windy — hold on to your hat.";

  // Hot
  if (feels >= 35) return "🥵 Very hot — stay hydrated and seek shade.";
  if (feels >= 28) return "☀️ Warm day — stay hydrated.";

  // Nice day
  if (code <= 1 && feels >= 15) return "😎 Lovely day — enjoy being outside.";

  return "";
}

function precipColor(prob: number): string {
  if (prob >= 70) return "#60a5fa"; // blue — likely rain
  if (prob >= 40) return "#93c5fd"; // lighter blue
  return "var(--color-muted)";
}
