# Architecture

WeatherML is a standalone Python AIML weather prediction app. The frontend is static HTML/CSS/JS, while the backend is a Python HTTP server that exposes weather search and prediction APIs.

## System Diagram

```mermaid
flowchart LR
  User["User searches a place"] --> UI["WeatherML frontend"]
  UI --> SearchAPI["/api/search"]
  SearchAPI --> Geo["Open-Meteo Geocoding API"]
  UI --> PredictAPI["/api/predict"]
  PredictAPI --> Geo
  PredictAPI --> Forecast["Open-Meteo Forecast API"]
  Forecast --> Engine["Python AIML scoring engine"]
  Engine --> Explain["Confidence, model trace, feature weights"]
  Explain --> UI
```

## Runtime Flow

1. User enters a city, district, airport, or region.
2. The frontend calls `/api/search?q=<place>` for live location suggestions.
3. On submit, the frontend redirects to `/forecast.html?city=<place>`.
4. `/api/predict?city=<place>` resolves coordinates, fetches forecast data, and runs Python scoring.
5. The dashboard renders current weather, six-day forecast, confidence, model trace, features, and pipeline status.
6. Secondary pages reuse the same `/api/predict` payload to render hourly forecast, alerts, map, explanations, and printable reports.

## Pages

- `index.html`: landing and search entry.
- `forecast.html`: forecast dashboard.
- `hourly.html`: next-24-hour forecast.
- `alerts.html`: rule-based weather risk view.
- `map.html`: coordinate and map handoff.
- `explanation.html`: model explanation signals.
- `report.html`: printable forecast report and JSON export.
- `models.html`: model comparison, feature importance, per-model trace.
- `pipeline.html`: service flow, API/runtime metadata, pipeline status.

## Backend Modules

- `server.py`: HTTP server and API routing.
- `backend/aiml/weather_engine.py`: geocoding, forecast ingest, AIML scoring, model metadata, explainability payload.

## External APIs

- Open-Meteo Geocoding API: resolves place names into coordinates.
- Open-Meteo Forecast API: provides current and six-day weather data.

Both APIs can be used without an API key.
