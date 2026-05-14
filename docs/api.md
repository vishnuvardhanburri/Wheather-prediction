# API Reference

Base URL for local development:

```text
http://127.0.0.1:4173
```

Live base URL:

```text
https://wheather-prediction.onrender.com
```

## Search Places

```http
GET /api/search?q=Visakhapatnam
```

Returns matching locations from live geocoding:

```json
{
  "results": [
    {
      "name": "Visakhapatnam",
      "region": "Andhra Pradesh, India",
      "country": "India",
      "latitude": 17.68009,
      "longitude": 83.20161,
      "timezone": "Asia/Kolkata"
    }
  ]
}
```

## Predict Weather

```http
GET /api/predict?city=Visakhapatnam
```

Returns the resolved location, current forecast, six-day forecast, model scores, feature importance, pipeline status, and runtime metadata.

Key response sections:

- `profile`: resolved place, region, country, coordinates, timezone.
- `current`: current model-scored weather snapshot.
- `forecast`: six-day forecast.
- `hourly`: next 24 hours of temperature, rain probability, wind, humidity, pressure, and weather code.
- `alerts`: rule-based weather alerts.
- `explanation`: plain-language model explanation signals.
- `models`: model leaderboard.
- `features`: feature importance.
- `pipeline`: backend flow status.
- `meta`: engine, latency, health, source, cache TTL, and source unit system.

## Health Check

```http
GET /api/health
```

Returns a deployment-friendly service check:

```json
{
  "ok": true,
  "service": "WeatherML",
  "version": "1.0.0",
  "frontend": "frontend",
  "engine": "WeatherEnsemble-v2"
}
```

## Error Shape

```json
{
  "error": true,
  "message": "No matching place found for '...'."
}
```
