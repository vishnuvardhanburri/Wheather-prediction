# Viva Questions

## What is WeatherML?

WeatherML is a live Python AIML weather prediction web app. It searches real places, fetches forecast data, creates a 14-day future forecast, shows confidence/explainability, and includes a historical training benchmark.

## Why did you use Python?

Python is suitable for API work, data processing, and machine-learning style scoring. It also keeps the backend readable for a project review.

## What data source is used?

The project uses Open-Meteo:

- Geocoding API
- Forecast API
- Historical Weather API

## What is MAE?

MAE means Mean Absolute Error. It measures the average absolute difference between predicted and actual values.

## What is RMSE?

RMSE means Root Mean Squared Error. It gives more penalty to larger prediction errors.

## What is R²?

R² measures how much variance in the target is explained by the model. A value closer to 1 is better.

## What is the target variable?

The training target is next-day maximum temperature in Celsius.

## Why add a training pipeline?

The training pipeline makes the AIML part inspectable. It creates model metrics, feature weights, prediction CSV, and a model card.

## Why did GitHub Actions fail earlier?

The smoke test called the live forecast API. The API timed out in GitHub Actions. The fix was to use an offline fixture for CI so tests are stable.

## What is the biggest limitation?

It is not an official weather warning system. It depends on external forecast data and lightweight benchmark models.

## How is it deployed?

It is deployed on Render. The server reads `HOST` and `PORT` from environment variables.

## What would you improve next?

I would add scheduled retraining, multiple-city model registries, model versioning, and stronger validation against observed station data.
