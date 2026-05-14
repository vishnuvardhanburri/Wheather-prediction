# Historical Training Pipeline

WeatherML includes a real historical benchmark pipeline for the AIML layer.

## What It Does

1. Resolves a city with Open-Meteo geocoding.
2. Pulls daily historical weather from the Open-Meteo Historical Weather API.
3. Builds next-day high-temperature features from previous-day temperature, precipitation, wind, gust, and seasonal signals.
4. Splits rows into train/test sets.
5. Evaluates:
   - Seasonal Baseline
   - Persistence
   - Ridge Regression
   - Hybrid Ensemble
6. Writes `backend/aiml/model_registry.json`.

## Run

```bash
python3 backend/aiml/training_pipeline.py --city Hyderabad --days 730
```

## Output

The generated registry includes:

- training city and region
- date range
- row counts
- feature list
- ridge-regression feature weights
- MAE, RMSE, R², and score for each model

The API exposes this through:

```bash
curl "http://127.0.0.1:4173/api/model-registry"
```

The Models page reads the same registry through `/api/predict`.
