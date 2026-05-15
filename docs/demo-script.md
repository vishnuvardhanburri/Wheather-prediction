# Demo Script

Use this flow for a viva, portfolio review, or project walkthrough.

## 1. Open The Live App

Open:

```text
https://wheather-prediction.onrender.com/
```

Say:

> This is WeatherML, a live Python AIML weather prediction app deployed on Render.

## 2. Search A City

Search:

```text
Hyderabad
```

Show:

- current weather
- 14-day future forecast
- confidence
- rain chance
- wind and humidity

## 3. Open Models

Open the Models page.

Say:

> This page shows model-style prediction traces, feature importance, and historical benchmark metrics.

## 4. Open Training

Open `/training.html`.

Show:

- training summary
- evaluation metrics
- model card
- predictions CSV
- feature weights CSV

Say:

> The training pipeline creates auditable artifacts, so the ML work can be reviewed instead of only claimed.

## 5. Show API Health

Open:

```text
/api/health
```

Say:

> This endpoint is used for deployment and uptime checks.

## 6. Explain CI Fix

Say:

> The original CI test depended on a live external API and failed when it timed out. I fixed it by using an offline fixture in CI and keeping real API checks for manual/live testing.

## 7. Close With Limitations

Say:

> This is not an official warning system. It is a transparent AIML web app built for learning, portfolio review, and deployment practice.
