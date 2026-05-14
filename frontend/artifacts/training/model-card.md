# WeatherML Model Card

## Overview

WeatherML benchmarks next-day maximum temperature models using historical daily weather data.

## Training Data

- Source: [Open-Meteo Historical Weather API](https://archive-api.open-meteo.com/v1/archive)
- City: Hyderabad, Telangana, India
- Date range: 2024-05-08 to 2026-05-08
- Rows: 730
- Train rows: 584
- Test rows: 146
- Target: `next_day_temperature_2m_max_celsius`

## Best Model

- Model: Persistence
- MAE: 0.73°C
- RMSE: 1.0°C
- R²: 0.94
- Score: 95.6

## Benchmarks

| Model | MAE °C | RMSE °C | R² | Score |
| --- | ---: | ---: | ---: | ---: |
| Persistence | 0.73 | 1.0 | 0.94 | 95.6 |
| Ridge Regression | 0.76 | 0.98 | 0.943 | 95.4 |
| Hybrid Ensemble | 0.79 | 1.0 | 0.94 | 95.3 |
| Seasonal Baseline | 1.93 | 2.38 | 0.659 | 88.4 |

## Feature Weights

| Feature | Ridge weight |
| --- | ---: |
| previous_mean_temp | 1.0179 |
| previous_max_temp | 0.2088 |
| previous_min_temp | -0.3386 |
| previous_precipitation | 0.0131 |
| previous_wind_speed | 0.0381 |
| previous_wind_gust | -0.0367 |
| day_of_year_sin | 0.5887 |
| day_of_year_cos | 0.0464 |

## Notes

This registry is a benchmark artifact for explainability and portfolio review. It is not a safety-critical weather warning system.
