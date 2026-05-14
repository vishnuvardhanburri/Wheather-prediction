const fallbackModels = [
  { model: "Decision Tree", accuracy: 84, mae: 2.8 },
  { model: "KNN", accuracy: 78, mae: 3.4 },
  { model: "Logistic Regression", accuracy: 73, mae: 3.9 },
  { model: "Gradient Boosting", accuracy: 89, mae: 2.1 },
];

const fallbackFeatures = [
  { feature: "Humidity", value: 86 },
  { feature: "Pressure", value: 78 },
  { feature: "Wind speed", value: 63 },
  { feature: "Rain probability", value: 61 },
  { feature: "Daily range", value: 54 },
];

const params = new URLSearchParams(window.location.search);
const initialCity = params.get("city") || "Hyderabad";
const input = document.getElementById("cityInput");
const resultsPanel = document.getElementById("searchResults");
let lastPrediction = null;

if (input) input.value = initialCity;
applyTheme(localStorage.getItem("weatherml:theme") || "dark");
installThemeSwitch();

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function setWidth(id, value) {
  const node = document.getElementById(id);
  if (node) node.style.width = value;
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  localStorage.setItem("weatherml:theme", theme);
}

function installThemeSwitch() {
  const topbar = document.querySelector(".topbar");
  if (!topbar || document.getElementById("themeSwitch")) return;
  const button = document.createElement("button");
  button.id = "themeSwitch";
  button.className = "theme-switch";
  button.type = "button";
  button.textContent = "Theme";
  button.addEventListener("click", () => {
    const themes = ["dark", "light", "satellite"];
    const current = document.documentElement.dataset.theme || "dark";
    applyTheme(themes[(themes.indexOf(current) + 1) % themes.length]);
  });
  topbar.appendChild(button);
}

function iconClassFor(day) {
  if (day.rain > 58 || day.weatherCode >= 61) return "weather-rain";
  if ([1, 2, 3, 45, 48].includes(day.weatherCode)) return "weather-cloud";
  return "weather-clear";
}

async function predict(city) {
  const response = await fetch(`/api/predict?city=${encodeURIComponent(city)}`);
  const payload = await response.json();
  if (!response.ok || payload.error) {
    throw new Error(payload.message || "Prediction service failed");
  }
  return payload;
}

async function searchPlaces(query) {
  if (!resultsPanel || query.trim().length < 2) {
    if (resultsPanel) resultsPanel.hidden = true;
    return;
  }
  const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
  const payload = await response.json();
  const results = payload.results || [];
  resultsPanel.innerHTML = results
    .map(
      (place) => `
        <button class="search-option" type="button" data-place="${place.name}">
          <span><strong>${place.name}</strong><span>${place.region}</span></span>
          <small>${place.country || "Place"}</small>
        </button>
      `,
    )
    .join("");
  resultsPanel.hidden = results.length === 0;
}

function cityUrl(page, city) {
  return `/${page}?city=${encodeURIComponent(city || initialCity)}`;
}

function refreshPageLinks(city) {
  document.querySelectorAll("[data-city-link]").forEach((link) => {
    const page = link.getAttribute("data-city-link");
    link.setAttribute("href", cityUrl(page, city));
  });
  const forecastLink = document.getElementById("forecastLink");
  const modelsLink = document.getElementById("modelsLink");
  if (forecastLink) forecastLink.href = cityUrl("forecast.html", city);
  if (modelsLink) modelsLink.href = cityUrl("models.html", city);
}

function renderPrediction(data) {
  lastPrediction = data;
  const profile = data.profile;
  const current = data.current;
  const forecast = data.forecast;

  setText("cityName", profile.city);
  setText("region", `${profile.region} · ${Number(profile.latitude).toFixed(3)}, ${Number(profile.longitude).toFixed(3)}`);
  setText("condition", profile.condition);
  const weatherIcon = document.getElementById("weatherIcon");
  if (weatherIcon) weatherIcon.className = `weather-icon ${iconClassFor(current)}`;
  setText("temp", `${current.temperature}°C`);
  setText("rain", `${current.rain}%`);
  setText("humidity", `${current.humidity}%`);
  setText("wind", `${current.wind} km/h`);
  setText("confidence", `${current.confidence}%`);
  setText("decisionBrief", data.summary || "");
  setWidth("confidenceBar", `${current.confidence}%`);

  renderForecast(forecast);
  renderModels(data.models || fallbackModels);
  renderFeatures(data.features || fallbackFeatures);
  renderPipeline(data.pipeline || []);
  renderMeta(data.meta || {});
  renderTrace(current.modelTrace || {});
  renderHourly(data.hourly || []);
  renderAlerts(data.alerts || []);
  renderExplanation(data.explanation || []);
  renderMap(profile, current);
  renderFavorites();
  renderTimeline(data.hourly || []);
  refreshPageLinks(profile.city);
}

function renderForecast(forecast) {
  const chart = document.getElementById("tempChart");
  if (chart) {
    const maxTemp = Math.max(...forecast.map((day) => day.temperatureMax || day.temperature));
    chart.innerHTML = forecast
      .map((day) => {
        const tempHeight = Math.max(16, Math.round(((day.temperatureMax || day.temperature) / maxTemp) * 100));
        const rainHeight = Math.max(10, day.rain);
        return `
          <div class="chart-col">
            <div class="chart-value">${day.temperatureMax}°</div>
            <div class="chart-bar" style="height:${tempHeight}%"></div>
            <div class="chart-rain" style="height:${rainHeight}%"></div>
            <span class="chart-label">${day.day === "Today" ? "Today" : day.date.slice(5)}</span>
          </div>
        `;
      })
      .join("");
  }

  const list = document.getElementById("forecastList");
  if (list) {
    list.innerHTML = forecast
      .map(
        (day) => `
          <article class="forecast-day">
            <header><span>${day.day === "Today" ? "Today" : day.date}</span><span>${day.condition}</span></header>
            <strong>${day.temperatureMax}° / ${day.temperatureMin}°</strong>
            <p>${day.rain}% rain · ${day.confidence}% confidence · ${day.pressure} hPa</p>
          </article>
        `,
      )
      .join("");
  }
}

function renderModels(models) {
  const node = document.getElementById("modelList");
  if (!node) return;
  node.innerHTML = models
    .map(
      (item) => `
        <div class="score-row">
          <header><strong>${item.model}</strong><span>MAE ${item.mae}°C</span></header>
          <div class="bar"><i style="width:${item.accuracy}%"></i></div>
        </div>
      `,
    )
    .join("");
}

function renderFeatures(features) {
  const node = document.getElementById("featureList");
  if (!node) return;
  node.innerHTML = features
    .map(
      (item) => `
        <div class="score-row">
          <header><strong>${item.feature}</strong><span>${item.value}%</span></header>
          <div class="bar"><i style="width:${item.value}%"></i></div>
        </div>
      `,
    )
    .join("");
}

function renderTrace(trace) {
  const node = document.getElementById("traceGrid");
  if (!node) return;
  node.innerHTML = Object.entries(trace)
    .map(
      ([name, value]) => `
        <div class="trace-card">
          <span>${name}</span>
          <strong>${value}°C</strong>
        </div>
      `,
    )
    .join("");
}

function renderHourly(hourly) {
  const node = document.getElementById("hourlyGrid");
  if (!node) return;
  node.innerHTML = hourly
    .map(
      (hour) => `
        <article class="hour-card">
          <strong>${hour.hour}</strong>
          <span>${hour.condition}</span>
          <div>${hour.temperature}°C</div>
          <p>${hour.rain}% rain · ${hour.wind} km/h · ${hour.humidity}% RH</p>
        </article>
      `,
    )
    .join("");
}

function renderTimeline(hourly) {
  const node = document.getElementById("timelineTrack");
  if (!node) return;
  node.innerHTML = hourly
    .slice(0, 12)
    .map((hour, index) => {
      const sky = hour.rain > 55 ? "rain" : hour.weatherCode === 0 ? "clear" : "cloud";
      return `
        <article class="timeline-card timeline-${sky}" style="--delay:${index}">
          <strong>${hour.hour}</strong>
          <span>${hour.condition}</span>
          <div>${hour.temperature}°C</div>
          <p>${hour.rain}% rain · ${hour.gust} km/h gusts</p>
        </article>
      `;
    })
    .join("");
}

function renderAlerts(alerts) {
  const node = document.getElementById("alertsGrid");
  if (!node) return;
  node.innerHTML = alerts
    .map(
      (alert) => `
        <article class="alert-card alert-${alert.level.toLowerCase()}">
          <span>${alert.level}</span>
          <h3>${alert.title}</h3>
          <p>${alert.detail}</p>
        </article>
      `,
    )
    .join("");
}

function renderExplanation(items) {
  const node = document.getElementById("explanationGrid");
  if (!node) return;
  node.innerHTML = items
    .map(
      (item) => `
        <article class="explain-card">
          <span>${item.signal}</span>
          <strong>${item.value}</strong>
          <p>${item.impact}</p>
        </article>
      `,
    )
    .join("");
}

function renderMap(profile, current) {
  const link = document.getElementById("osmLink");
  if (link) {
    link.href = `https://www.openstreetmap.org/?mlat=${profile.latitude}&mlon=${profile.longitude}#map=10/${profile.latitude}/${profile.longitude}`;
  }
  const marker = document.querySelector(".map-marker");
  if (marker) {
    const lon = Number(profile.longitude);
    const lat = Number(profile.latitude);
    marker.style.left = `${Math.max(8, Math.min(92, ((lon + 180) / 360) * 100))}%`;
    marker.style.top = `${Math.max(8, Math.min(92, ((90 - lat) / 180) * 100))}%`;
    marker.querySelector("span").textContent = `${current.temperature}°`;
  }
}

function renderPipeline(pipeline) {
  const node = document.getElementById("pipelineStatus");
  if (!node) return;
  node.innerHTML = pipeline
    .map(
      (item) => `
        <div class="status-row">
          <span>${item.status}</span>
          <div>
            <strong>${item.step}</strong>
            <p>${item.detail}</p>
          </div>
        </div>
      `,
    )
    .join("");
}

function renderMeta(meta) {
  setText("engineName", meta.engine || "WeatherEnsemble-v2");
  setText("latency", `${meta.latency_ms || 48} ms`);
  setText("sla", meta.health || "Live");
}

function favoriteKey() {
  return "weatherml:favorites";
}

function getFavorites() {
  try {
    return JSON.parse(localStorage.getItem(favoriteKey()) || "[]");
  } catch {
    return [];
  }
}

function saveFavorite() {
  if (!lastPrediction) return;
  const city = lastPrediction.profile.city;
  const next = [city, ...getFavorites().filter((item) => item !== city)].slice(0, 8);
  localStorage.setItem(favoriteKey(), JSON.stringify(next));
  renderFavorites();
}

function renderFavorites() {
  const node = document.getElementById("favoritesList");
  if (!node) return;
  const favorites = getFavorites();
  node.innerHTML = favorites.length
    ? favorites.map((city) => `<a class="favorite-chip" href="${cityUrl("forecast.html", city)}">${city}</a>`).join("")
    : `<span class="favorite-empty">No saved favorites yet.</span>`;
}

function downloadJson() {
  if (!lastPrediction) return;
  const blob = new Blob([JSON.stringify(lastPrediction, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${lastPrediction.profile.city.toLowerCase().replaceAll(" ", "-")}-weather-report.json`;
  link.click();
  URL.revokeObjectURL(url);
}

function speakBrief() {
  const text = lastPrediction?.summary;
  if (!text || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}

function shareCard() {
  if (!lastPrediction) return;
  const { profile, current, summary } = lastPrediction;
  const canvas = document.createElement("canvas");
  canvas.width = 1200;
  canvas.height = 630;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 1200, 630);
  gradient.addColorStop(0, "#07111f");
  gradient.addColorStop(1, "#0e7490");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 1200, 630);
  ctx.fillStyle = "rgba(255,255,255,.1)";
  for (let i = 0; i < 9; i++) ctx.fillRect(90 + i * 120, 80, 1, 470);
  ctx.fillStyle = "#ffffff";
  ctx.font = "800 62px system-ui";
  ctx.fillText(profile.city, 70, 120);
  ctx.font = "500 30px system-ui";
  ctx.fillStyle = "#bae6fd";
  ctx.fillText(profile.region, 70, 168);
  ctx.font = "900 128px system-ui";
  ctx.fillStyle = "#ffffff";
  ctx.fillText(`${current.temperature}°C`, 70, 330);
  ctx.font = "700 36px system-ui";
  ctx.fillText(current.condition, 70, 390);
  ctx.font = "600 28px system-ui";
  ctx.fillStyle = "#dff7ff";
  wrapCanvasText(ctx, summary, 70, 470, 980, 36);
  ctx.font = "700 24px system-ui";
  ctx.fillStyle = "#9ff6c8";
  ctx.fillText("Developed by Vishnu Vardhan Burri · WeatherML", 70, 575);
  const link = document.createElement("a");
  link.download = `${profile.city.toLowerCase().replaceAll(" ", "-")}-weather-card.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = String(text || "").split(" ");
  let line = "";
  for (const word of words) {
    const next = `${line}${word} `;
    if (ctx.measureText(next).width > maxWidth && line) {
      ctx.fillText(line, x, y);
      line = `${word} `;
      y += lineHeight;
    } else {
      line = next;
    }
  }
  ctx.fillText(line, x, y);
}

function targetPageForSubmit() {
  const path = window.location.pathname;
  if (path.endsWith("/models.html")) return "models.html";
  if (path.endsWith("/pipeline.html")) return "pipeline.html";
  if (path.endsWith("/hourly.html")) return "hourly.html";
  if (path.endsWith("/alerts.html")) return "alerts.html";
  if (path.endsWith("/map.html")) return "map.html";
  if (path.endsWith("/explanation.html")) return "explanation.html";
  if (path.endsWith("/report.html")) return "report.html";
  if (path.endsWith("/timeline.html")) return "timeline.html";
  if (path.endsWith("/favorites.html")) return "favorites.html";
  if (path.endsWith("/compare.html")) return "compare.html";
  return "forecast.html";
}

async function renderComparePage() {
  const grid = document.getElementById("compareGrid");
  if (!grid) return;
  const a = document.getElementById("compareA").value || "Hyderabad";
  const b = document.getElementById("compareB").value || "Visakhapatnam";
  document.body.classList.add("is-loading");
  try {
    const [left, right] = await Promise.all([predict(a), predict(b)]);
    grid.innerHTML = [left, right].map(compareCard).join("");
  } finally {
    document.body.classList.remove("is-loading");
  }
}

function compareCard(data) {
  const c = data.current;
  return `
    <article class="current-card compare-card">
      <p class="muted">${data.profile.region}</p>
      <h2>${data.profile.city}</h2>
      <p class="condition">${data.summary}</p>
      <div class="metric-grid">
        <div class="metric"><span>Temp</span><strong>${c.temperature}°C</strong></div>
        <div class="metric"><span>Rain</span><strong>${c.rain}%</strong></div>
        <div class="metric"><span>Wind</span><strong>${c.wind} km/h</strong></div>
        <div class="metric"><span>Confidence</span><strong>${c.confidence}%</strong></div>
      </div>
      <a class="action-link primary" href="${cityUrl("forecast.html", data.profile.city)}">Open forecast</a>
    </article>
  `;
}

async function renderFavoritesDashboard() {
  const node = document.getElementById("favoritesDashboard");
  if (!node) return;
  const favorites = getFavorites();
  if (!favorites.length) {
    node.innerHTML = `<article class="panel"><h2>No favorites yet</h2><p class="muted">Open a forecast and save a place to build this dashboard.</p></article>`;
    return;
  }
  const rows = await Promise.all(favorites.map((city) => predict(city).catch(() => null)));
  node.innerHTML = rows.filter(Boolean).map(compareCard).join("");
}

async function submit(city) {
  const clean = city.trim() || "Hyderabad";
  document.body.classList.add("is-loading");
  try {
    const data = await predict(clean);
    renderPrediction(data);
    const target = targetPageForSubmit();
    if (target === "favorites.html") {
      saveFavorite();
      renderFavoritesDashboard();
    }
    if (window.location.pathname === "/" || window.location.pathname.endsWith("/index.html")) {
      window.location.href = cityUrl(target, data.profile.city);
    } else {
      history.replaceState(null, "", cityUrl(target, data.profile.city));
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to run prediction.";
    const errorBox = document.getElementById("errorBox");
    if (errorBox) {
      errorBox.textContent = message;
      errorBox.hidden = false;
    } else {
      alert(message);
    }
  } finally {
    document.body.classList.remove("is-loading");
  }
}

document.getElementById("searchForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  submit(input?.value || initialCity);
});

document.getElementById("saveFavorite")?.addEventListener("click", saveFavorite);
document.getElementById("downloadJson")?.addEventListener("click", downloadJson);
document.getElementById("printReport")?.addEventListener("click", () => window.print());
document.getElementById("speakBrief")?.addEventListener("click", speakBrief);
document.getElementById("shareCard")?.addEventListener("click", shareCard);
document.getElementById("compareForm")?.addEventListener("submit", (event) => {
  event.preventDefault();
  renderComparePage();
});

let searchTimer;
input?.addEventListener("input", () => {
  window.clearTimeout(searchTimer);
  searchTimer = window.setTimeout(() => searchPlaces(input.value), 180);
});

resultsPanel?.addEventListener("click", (event) => {
  const option = event.target.closest(".search-option");
  if (!option) return;
  const place = option.getAttribute("data-place") || "";
  if (input) input.value = place;
  resultsPanel.hidden = true;
  submit(place);
});

document.addEventListener("click", (event) => {
  if (!resultsPanel || !input) return;
  if (event.target === input || resultsPanel.contains(event.target)) return;
  resultsPanel.hidden = true;
});

refreshPageLinks(initialCity);
if (window.location.pathname.endsWith("/compare.html")) {
  renderComparePage();
} else if (window.location.pathname.endsWith("/favorites.html")) {
  renderFavoritesDashboard();
} else if (!window.location.pathname.endsWith("/index.html") && window.location.pathname !== "/") {
  submit(initialCity);
} else {
  predict(initialCity).then(renderPrediction).catch(() => {});
}
