# Deployment Notes

This project runs anywhere Python 3 is available because it uses only the standard library.

Live demo:

```text
https://wheather-prediction.onrender.com/
```

## Local

```bash
python3 server.py
```

Open:

```text
http://127.0.0.1:4173
```

## LAN Demo

Run with `HOST=0.0.0.0`:

```bash
HOST=0.0.0.0 PORT=4173 python3 server.py
```

Then open the machine IP from another device on the same network.

## Production Direction

For a real deployment, put the Python API behind:

- Nginx or Caddy for TLS and compression
- systemd, Docker, or a process manager
- request logging and uptime monitoring
- cache for repeated geocoding lookups
- environment-controlled host/port

## Render

Render web services must bind to `0.0.0.0` and use the `PORT` environment variable. This app already supports that.

Current live Render URL:

```text
https://wheather-prediction.onrender.com/
```

Settings:

```text
Build command: pip install -r requirements.txt
Start command: python3 server.py
Environment: HOST=0.0.0.0
```

## Railway

Railway also provides a `PORT` variable and expects the app to listen on `0.0.0.0:$PORT`.

Settings:

```text
Start command: python3 server.py
Environment: HOST=0.0.0.0
```

The current version is intentionally dependency-light for demo, review, and portfolio use.
