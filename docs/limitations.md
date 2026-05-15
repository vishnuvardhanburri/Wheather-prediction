# Limitations

WeatherML is intentionally transparent about what it can and cannot do.

## Not An Official Weather Warning System

The app should not be used for safety-critical decisions. Alerts are rule-based signals built for learning and demonstration.

## Forecast Depends On External Data

Live weather and forecast values come from Open-Meteo. If the provider is slow, unreachable, or changes its response shape, the live forecast can be affected.

## Model Benchmark Scope

The historical training pipeline currently benchmarks one configured city at a time. The included registry is trained for Hyderabad using a two-year historical window.

## Lightweight ML By Design

The training pipeline uses standard-library Python and transparent formulas so the project is easy to run and explain. It does not use heavyweight libraries such as scikit-learn in the current version.

## Accuracy Is Contextual

MAE, RMSE, and R² are calculated on a held-out historical split. These metrics are useful for review, but they do not guarantee future real-world performance across every location.

## Future Improvements

- train separate registries for multiple cities
- add scheduled retraining
- store model runs with version IDs
- add real station observations for validation
- add richer geospatial maps
- add anomaly detection for sudden weather changes
