import { fetchWeather, type WeatherData } from "../api";

let cache: WeatherData | null = null;

export async function renderWeatherWidget(container: HTMLElement) {
  cache = null;
  container.innerHTML = `<p class="text-sm text-muted">Loading weather...</p>`;
  await refresh(container);
}

export async function refreshWeatherWidget(container: HTMLElement) {
  await refresh(container);
}

async function refresh(container: HTMLElement) {
  let data: WeatherData;
  try {
    data = await fetchWeather();
  } catch {
    return;
  }

  const newHtml = weatherHtml(data);
  const oldHtml = cache ? weatherHtml(cache) : null;
  if (newHtml !== oldHtml) container.innerHTML = newHtml;
  cache = data;
}

function weatherHtml(d: WeatherData): string {
  return `
    <div class="flex flex-col gap-4">

      <!-- Current conditions -->
      <div class="flex items-start justify-between">
        <div>
          <p class="text-5xl font-semibold text-text tabular-nums" style="font-family:'Montserrat',sans-serif">
            ${Math.round(d.current.temperature)}°
          </p>
          <p class="text-sm text-muted mt-1">${d.current.condition}</p>
          <p class="text-xs text-muted">Feels like ${Math.round(d.current.apparent_temperature)}°</p>
        </div>
        <div class="text-right">
          <p class="text-4xl">${d.current.icon}</p>
          <p class="text-xs text-muted mt-1">${d.location}</p>
          <p class="text-xs text-muted tabular-nums">↑${Math.round(d.today_high)}° ↓${Math.round(d.today_low)}°</p>
        </div>
      </div>

      <!-- 5-day forecast -->
      <div class="grid grid-cols-5 gap-1 border-t border-border pt-4">
        ${d.forecast.map((f) => `
          <div class="flex flex-col items-center gap-1">
            <p class="text-xs text-muted">${f.date}</p>
            <p class="text-lg">${f.icon}</p>
            <p class="text-xs text-text tabular-nums">↑${Math.round(f.high)}°</p>
            <p class="text-xs text-muted tabular-nums">↓${Math.round(f.low)}°</p>
          </div>
        `).join("")}
      </div>

    </div>
  `;
}
