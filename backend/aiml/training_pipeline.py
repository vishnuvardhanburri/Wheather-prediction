from __future__ import annotations

import argparse
import csv
import json
import math
import sys
from datetime import date, timedelta
from pathlib import Path
from statistics import mean
from typing import Any

if __package__ in {None, ""}:
    sys.path.insert(0, str(Path(__file__).resolve().parents[2]))

from backend.aiml.weather_engine import GEOCODE_URL, _get_json


ARCHIVE_URL = "https://archive-api.open-meteo.com/v1/archive"
REGISTRY_PATH = Path(__file__).with_name("model_registry.json")
DEFAULT_ARTIFACTS_DIR = Path(__file__).resolve().parents[2] / "frontend" / "artifacts" / "training"
FEATURES = [
    "previous_mean_temp",
    "previous_max_temp",
    "previous_min_temp",
    "previous_precipitation",
    "previous_wind_speed",
    "previous_wind_gust",
    "day_of_year_sin",
    "day_of_year_cos",
]


def resolve_location(city: str) -> dict[str, Any]:
    payload = _get_json(
        GEOCODE_URL,
        {"name": city.strip(), "count": 1, "language": "en", "format": "json"},
    )
    results = payload.get("results", [])
    if not results:
        raise ValueError(f"No matching place found for '{city}'.")
    item = results[0]
    region = ", ".join(part for part in [item.get("admin1"), item.get("country")] if part)
    return {
        "name": item.get("name"),
        "region": region or item.get("country", "Unknown region"),
        "country": item.get("country", ""),
        "latitude": item.get("latitude"),
        "longitude": item.get("longitude"),
        "timezone": item.get("timezone", "auto"),
    }


def fetch_history(location: dict[str, Any], start: date, end: date) -> dict[str, Any]:
    return _get_json(
        ARCHIVE_URL,
        {
            "latitude": location["latitude"],
            "longitude": location["longitude"],
            "start_date": start.isoformat(),
            "end_date": end.isoformat(),
            "daily": [
                "temperature_2m_max",
                "temperature_2m_min",
                "temperature_2m_mean",
                "precipitation_sum",
                "wind_speed_10m_max",
                "wind_gusts_10m_max",
                "weather_code",
            ],
            "timezone": "auto",
        },
        timeout=20,
    )


def build_rows(history: dict[str, Any]) -> list[dict[str, Any]]:
    daily = history.get("daily", {})
    dates = daily.get("time", [])
    max_t = daily.get("temperature_2m_max", [])
    min_t = daily.get("temperature_2m_min", [])
    mean_t = daily.get("temperature_2m_mean", [])
    precip = daily.get("precipitation_sum", [])
    wind = daily.get("wind_speed_10m_max", [])
    gust = daily.get("wind_gusts_10m_max", [])

    rows = []
    for index in range(1, len(dates)):
        if any(
            series[index] is None or series[index - 1] is None
            for series in [max_t, min_t, mean_t, precip, wind, gust]
        ):
            continue
        current_date = date.fromisoformat(dates[index])
        angle = 2 * math.pi * current_date.timetuple().tm_yday / 366
        rows.append(
            {
                "date": dates[index],
                "month": current_date.month,
                "features": [
                    float(mean_t[index - 1]),
                    float(max_t[index - 1]),
                    float(min_t[index - 1]),
                    float(precip[index - 1]),
                    float(wind[index - 1]),
                    float(gust[index - 1]),
                    math.sin(angle),
                    math.cos(angle),
                ],
                "target": float(max_t[index]),
                "previous_max": float(max_t[index - 1]),
            },
        )
    return rows


def split_rows(rows: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], list[dict[str, Any]]]:
    if len(rows) < 60:
        raise ValueError("Need at least 60 historical rows for a meaningful train/test split.")
    split_at = max(1, int(len(rows) * 0.8))
    return rows[:split_at], rows[split_at:]


def metric_summary(actuals: list[float], predictions: list[float]) -> dict[str, float]:
    errors = [prediction - actual for actual, prediction in zip(actuals, predictions)]
    mae = mean(abs(error) for error in errors)
    rmse = math.sqrt(mean(error * error for error in errors))
    actual_mean = mean(actuals)
    ss_res = sum(error * error for error in errors)
    ss_tot = sum((actual - actual_mean) ** 2 for actual in actuals) or 1
    r2 = 1 - ss_res / ss_tot
    score = max(0, min(99, 100 - mae * 6))
    return {
        "mae": round(mae, 2),
        "rmse": round(rmse, 2),
        "r2": round(r2, 3),
        "score": round(score, 1),
    }


def seasonal_baseline(train: list[dict[str, Any]], test: list[dict[str, Any]]) -> list[float]:
    by_month: dict[int, list[float]] = {}
    for row in train:
        by_month.setdefault(row["month"], []).append(row["target"])
    fallback = mean(row["target"] for row in train)
    month_average = {month: mean(values) for month, values in by_month.items()}
    return [month_average.get(row["month"], fallback) for row in test]


def persistence_model(test: list[dict[str, Any]]) -> list[float]:
    return [row["previous_max"] for row in test]


def solve_linear_system(matrix: list[list[float]], vector: list[float]) -> list[float]:
    size = len(vector)
    augmented = [row[:] + [vector[index]] for index, row in enumerate(matrix)]
    for column in range(size):
        pivot = max(range(column, size), key=lambda row: abs(augmented[row][column]))
        augmented[column], augmented[pivot] = augmented[pivot], augmented[column]
        pivot_value = augmented[column][column]
        if abs(pivot_value) < 1e-10:
            continue
        for item in range(column, size + 1):
            augmented[column][item] /= pivot_value
        for row in range(size):
            if row == column:
                continue
            factor = augmented[row][column]
            for item in range(column, size + 1):
                augmented[row][item] -= factor * augmented[column][item]
    return [augmented[row][size] for row in range(size)]


def train_ridge_regression(train: list[dict[str, Any]], regularization: float = 0.25) -> list[float]:
    width = len(FEATURES) + 1
    matrix = [[0.0 for _ in range(width)] for _ in range(width)]
    vector = [0.0 for _ in range(width)]
    for row in train:
        x = [1.0] + row["features"]
        y = row["target"]
        for left in range(width):
            vector[left] += x[left] * y
            for right in range(width):
                matrix[left][right] += x[left] * x[right]
    for index in range(1, width):
        matrix[index][index] += regularization
    return solve_linear_system(matrix, vector)


def predict_linear(weights: list[float], rows: list[dict[str, Any]]) -> list[float]:
    predictions = []
    for row in rows:
        x = [1.0] + row["features"]
        predictions.append(sum(weight * value for weight, value in zip(weights, x)))
    return predictions


def evaluate(rows: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], dict[str, float], list[dict[str, Any]]]:
    train, test = split_rows(rows)
    actuals = [row["target"] for row in test]
    seasonal_predictions = seasonal_baseline(train, test)
    persistence_predictions = persistence_model(test)
    weights = train_ridge_regression(train)
    linear_predictions = predict_linear(weights, test)
    ensemble_predictions = [
        (linear * 0.55 + persistence * 0.3 + seasonal * 0.15)
        for linear, persistence, seasonal in zip(linear_predictions, persistence_predictions, seasonal_predictions)
    ]

    model_rows = [
        {"model": "Seasonal Baseline", **metric_summary(actuals, seasonal_predictions)},
        {"model": "Persistence", **metric_summary(actuals, persistence_predictions)},
        {"model": "Ridge Regression", **metric_summary(actuals, linear_predictions)},
        {"model": "Hybrid Ensemble", **metric_summary(actuals, ensemble_predictions)},
    ]
    model_rows.sort(key=lambda item: item["mae"])
    feature_weights = {name: round(weight, 4) for name, weight in zip(FEATURES, weights[1:])}
    prediction_rows = []
    for index, row in enumerate(test):
        prediction_rows.append(
            {
                "date": row["date"],
                "actual_temperature_max": round(actuals[index], 2),
                "seasonal_baseline": round(seasonal_predictions[index], 2),
                "persistence": round(persistence_predictions[index], 2),
                "ridge_regression": round(linear_predictions[index], 2),
                "hybrid_ensemble": round(ensemble_predictions[index], 2),
                "hybrid_error": round(ensemble_predictions[index] - actuals[index], 2),
            },
        )
    return model_rows, feature_weights, prediction_rows


def build_training_bundle(city: str, days: int) -> tuple[dict[str, Any], list[dict[str, Any]]]:
    end = date.today() - timedelta(days=7)
    start = end - timedelta(days=days)
    location = resolve_location(city)
    history = fetch_history(location, start, end)
    rows = build_rows(history)
    models, feature_weights, prediction_rows = evaluate(rows)
    train_rows, test_rows = split_rows(rows)
    registry = {
        "generated_at": date.today().isoformat(),
        "source": "Open-Meteo Historical Weather API",
        "source_url": "https://archive-api.open-meteo.com/v1/archive",
        "city": location["name"],
        "region": location["region"],
        "target": "next_day_temperature_2m_max_celsius",
        "date_range": {"start": start.isoformat(), "end": end.isoformat()},
        "rows": len(rows),
        "train_rows": len(train_rows),
        "test_rows": len(test_rows),
        "features": FEATURES,
        "feature_weights": feature_weights,
        "models": models,
    }
    return registry, prediction_rows


def build_registry(city: str, days: int) -> dict[str, Any]:
    registry, _ = build_training_bundle(city, days)
    return registry


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    if not rows:
        return
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0].keys()))
        writer.writeheader()
        writer.writerows(rows)


def write_model_card(path: Path, registry: dict[str, Any]) -> None:
    best = registry["models"][0]
    model_rows = "\n".join(
        f"| {item['model']} | {item['mae']} | {item['rmse']} | {item['r2']} | {item['score']} |"
        for item in registry["models"]
    )
    weights = "\n".join(
        f"| {name} | {weight} |"
        for name, weight in registry["feature_weights"].items()
    )
    path.write_text(
        f"""# WeatherML Model Card

## Overview

WeatherML benchmarks next-day maximum temperature models using historical daily weather data.

## Training Data

- Source: [{registry['source']}]({registry['source_url']})
- City: {registry['city']}, {registry['region']}
- Date range: {registry['date_range']['start']} to {registry['date_range']['end']}
- Rows: {registry['rows']}
- Train rows: {registry['train_rows']}
- Test rows: {registry['test_rows']}
- Target: `{registry['target']}`

## Best Model

- Model: {best['model']}
- MAE: {best['mae']}°C
- RMSE: {best['rmse']}°C
- R²: {best['r2']}
- Score: {best['score']}

## Benchmarks

| Model | MAE °C | RMSE °C | R² | Score |
| --- | ---: | ---: | ---: | ---: |
{model_rows}

## Feature Weights

| Feature | Ridge weight |
| --- | ---: |
{weights}

## Notes

This registry is a benchmark artifact for explainability and portfolio review. It is not a safety-critical weather warning system.
""",
        encoding="utf-8",
    )


def write_artifacts(registry: dict[str, Any], prediction_rows: list[dict[str, Any]], artifacts_dir: Path) -> None:
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    write_csv(artifacts_dir / "predictions.csv", prediction_rows)
    write_csv(
        artifacts_dir / "feature_weights.csv",
        [{"feature": name, "weight": weight} for name, weight in registry["feature_weights"].items()],
    )
    (artifacts_dir / "metrics.json").write_text(json.dumps(registry, indent=2), encoding="utf-8")
    write_model_card(artifacts_dir / "model-card.md", registry)


def main() -> None:
    parser = argparse.ArgumentParser(description="Train WeatherML historical model benchmarks.")
    parser.add_argument("--city", default="Hyderabad", help="City used for the training registry.")
    parser.add_argument("--days", type=int, default=730, help="Historical lookback window.")
    parser.add_argument("--output", default=str(REGISTRY_PATH), help="Output model registry JSON path.")
    parser.add_argument("--artifacts-dir", default=str(DEFAULT_ARTIFACTS_DIR), help="Directory for model card and evaluation artifacts.")
    args = parser.parse_args()

    registry, prediction_rows = build_training_bundle(args.city, args.days)
    output = Path(args.output)
    output.write_text(json.dumps(registry, indent=2), encoding="utf-8")
    write_artifacts(registry, prediction_rows, Path(args.artifacts_dir))
    best = registry["models"][0]
    print(
        f"Trained {len(registry['models'])} model benchmarks for {registry['city']} "
        f"({registry['rows']} rows). Best: {best['model']} MAE {best['mae']}°C."
    )


if __name__ == "__main__":
    main()
