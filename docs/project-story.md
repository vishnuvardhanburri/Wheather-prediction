# Project Story

## Why This Project Exists

Weather prediction is a familiar machine-learning idea, but many student projects stop at a notebook, a static dataset, or a basic form. The goal of WeatherML was to turn that idea into a working, deployed web application that someone can open, search, inspect, and explain.

The project was built to answer a practical question:

> Can a Python AIML weather project feel like a real product, while still being simple enough to understand and defend?

## Problem Statement

Build a live weather prediction application that can:

- search real places globally
- fetch current and future forecast data
- show a 14-day future forecast
- provide confidence and explainability signals
- compare model-style outputs
- include a historical training benchmark
- run locally, in Docker, and on Render
- remain understandable for viva, portfolio review, and GitHub inspection

## Data Used

The app uses Open-Meteo data:

- Geocoding API for place search
- Forecast API for live and future forecast data
- Historical Weather API for model benchmark training

No API key is required.

## Model Logic

The live app combines forecast data with a Python scoring layer:

- rain probability affects confidence and alerts
- wind and gust values affect operational risk
- daily temperature range affects uncertainty
- model traces compare multiple simple model families
- historical training benchmarks evaluate next-day maximum temperature prediction

The training pipeline evaluates:

- Seasonal Baseline
- Persistence
- Ridge Regression
- Hybrid Ensemble

Metrics include MAE, RMSE, R², and score.

## What Improved Over Time

The project started as a basic forecast UI idea. It then improved through:

- separating frontend, backend, docs, media, and tests
- adding live APIs instead of static data
- adding Docker and Render deployment
- adding GitHub Actions CI
- fixing CI to avoid external API timeouts
- adding a historical training registry
- adding model card, predictions CSV, and feature weights
- adding mobile PWA behavior
- adding project notes and viva-ready documentation

## Important Limitation

WeatherML is not an official weather warning system. It is a learning, portfolio, and demonstration project that shows how a weather AIML application can be designed, explained, tested, and deployed.

## What I Learned

- How to connect a Python backend to a browser frontend.
- How to consume live weather APIs and shape structured JSON.
- How to build explainability around model-style predictions.
- How to create a training pipeline and model registry.
- How to deploy on Render.
- How to use Docker for repeatable runs.
- How to fix CI failures caused by external API timeouts.
- How to document a project so another person can understand it.
