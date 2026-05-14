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

if (input) input.value = initialCity;

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function setWidth(id, value) {
  const node = document.getElementById(id);
  if (node) node.style.width = value;
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
  setWidth("confidenceBar", `${current.confidence}%`);

  renderForecast(forecast);
  renderModels(data.models || fallbackModels);
  renderFeatures(data.features || fallbackFeatures);
  renderPipeline(data.pipeline || []);
  renderMeta(data.meta || {});
  renderTrace(current.modelTrace || {});
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

function targetPageForSubmit() {
  const path = window.location.pathname;
  if (path.endsWith("/models.html")) return "models.html";
  if (path.endsWith("/pipeline.html")) return "pipeline.html";
  return "forecast.html";
}

async function submit(city) {
  const clean = city.trim() || "Hyderabad";
  document.body.classList.add("is-loading");
  try {
    const data = await predict(clean);
    renderPrediction(data);
    const target = targetPageForSubmit();
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
if (!window.location.pathname.endsWith("/index.html") && window.location.pathname !== "/") {
  submit(initialCity);
} else {
  predict(initialCity).then(renderPrediction).catch(() => {});
}
