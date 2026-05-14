# Quality Checklist

Use this before demos, submissions, or deployment updates.

## Product

- Search works for a real city.
- Forecast displays a 14-day future window.
- Forecast, Hourly, Alerts, Map, Models, Pipeline, Report, Compare, Timeline, Favorites, and About pages load.
- Mobile bottom navigation is visible below 560px.
- Metric/imperial unit switch updates cards, charts, text, and report surfaces.
- Live demo link points to `https://wheather-prediction.onrender.com/`.

## Backend

- `/api/health` returns `ok: true`.
- `/api/model-registry` returns generated training metrics.
- `/training.html` loads training metrics and artifact links.
- `/api/search?q=Hyderabad` returns location results.
- `/api/predict?city=Hyderabad` returns forecast, hourly, alerts, explanation, models, features, pipeline, and meta sections.

## Deployment

- Render start command is `python3 server.py`.
- Render environment includes `HOST=0.0.0.0`.
- Docker build and run succeed.

## Verification

```bash
python3 -m py_compile server.py backend/aiml/weather_engine.py
node --check frontend/script.js
node --check frontend/service-worker.js
python3 tests/smoke_test.py
docker build -t weatherml .
```
