# Security Policy

## Supported Version

The `main` branch is the active supported version.

## Reporting A Vulnerability

Please report security issues privately to the repository owner instead of
opening a public issue. Include:

- affected route or file
- steps to reproduce
- expected impact
- screenshots or logs if available

## Security Notes

- The app does not require API keys for the current Open-Meteo integration.
- Server responses include basic browser safety headers.
- `/api/health` is available for deployment uptime checks.
- `/api/predict` and `/api/search` return JSON and avoid exposing stack traces.
