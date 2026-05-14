# Contributing

This project is maintained by Vishnu Vardhan Burri.

## Local Setup

```bash
python3 server.py
```

Open `http://127.0.0.1:4173`.

## Quality Checks

Run these before pushing:

```bash
python3 -m py_compile server.py backend/aiml/weather_engine.py
node --check frontend/script.js
node --check frontend/service-worker.js
python3 tests/smoke_test.py
```

## Project Layout

- `frontend/`: static app pages, CSS, JavaScript, PWA files
- `backend/`: Python AIML scoring and weather ingest
- `media/`: screenshots and README visuals
- `docs/`: architecture, API, and deployment notes
- `tests/`: smoke tests

## Pull Request Standard

- Keep UI pages responsive on mobile and desktop.
- Keep public routes stable, for example `/forecast.html`.
- Update README/docs when behavior or deployment changes.
- Do not commit secrets or API keys.
