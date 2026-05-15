# Testing Report

## Summary

WeatherML was tested locally, through Docker, through GitHub Actions, and through the live Render deployment.

## Manual Test Cases

| Area | Test | Result |
| --- | --- | --- |
| Search | Search Hyderabad | Passed |
| Search | Search Visakhapatnam | Passed |
| Forecast | Load 14-day forecast | Passed |
| Models | Show leaderboard and registry | Passed |
| Training | Show training page and artifact links | Passed |
| API | `/api/health` returns `ok: true` | Passed |
| API | `/api/model-registry` returns metrics | Passed |
| Mobile | Bottom navigation visible | Passed |
| Docker | Build image and run container | Passed |
| Render | Live deployment opens | Passed |
| CI | GitHub Actions smoke test | Fixed to run offline |

## CI Issue Found And Fixed

The first smoke test called the live forecast API. In GitHub Actions, the external API timed out and failed the workflow.

Fix:

- replaced live API dependency in `tests/smoke_test.py` with an offline forecast fixture
- kept real live API checks as local/manual tests
- kept syntax checks for Python and frontend JavaScript

This makes CI stable while preserving real-world testing separately.

## Commands Used

```bash
python3 -m py_compile server.py backend/aiml/weather_engine.py backend/aiml/training_pipeline.py
node --check frontend/script.js
node --check frontend/service-worker.js
python3 tests/smoke_test.py
docker build -t weatherml .
```

## Live URLs Checked

- `https://wheather-prediction.onrender.com/`
- `https://wheather-prediction.onrender.com/api/health`
- `https://wheather-prediction.onrender.com/training.html`
