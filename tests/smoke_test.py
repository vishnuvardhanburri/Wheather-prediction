from pathlib import Path
import sys
from datetime import date, timedelta

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backend.aiml.weather_engine import WeatherEnsemble
from server import FRONTEND_DIR


def sample_forecast_payload():
    start = date(2026, 5, 15)
    days = [(start + timedelta(days=index)).isoformat() for index in range(14)]
    hours = [f"{start.isoformat()}T{hour:02d}:00" for hour in range(24)]
    return {
        "timezone": "Asia/Kolkata",
        "current": {
            "temperature_2m": 31,
            "relative_humidity_2m": 54,
            "pressure_msl": 1006,
            "wind_speed_10m": 9,
            "wind_gusts_10m": 20,
            "weather_code": 3,
        },
        "daily": {
            "time": days,
            "weather_code": [3, 2, 1, 61, 3, 2, 1, 3, 2, 61, 3, 2, 1, 3],
            "temperature_2m_max": [36, 37, 38, 35, 34, 36, 37, 38, 39, 35, 36, 37, 38, 39],
            "temperature_2m_min": [25, 25, 26, 24, 24, 25, 25, 26, 27, 24, 25, 25, 26, 27],
            "precipitation_probability_max": [10, 18, 22, 62, 30, 12, 8, 16, 20, 64, 28, 18, 12, 8],
            "wind_speed_10m_max": [12, 14, 15, 22, 18, 14, 12, 15, 16, 24, 18, 14, 12, 13],
            "wind_gusts_10m_max": [24, 26, 28, 38, 32, 26, 24, 28, 30, 40, 32, 26, 24, 24],
        },
        "hourly": {
            "time": hours,
            "temperature_2m": [28 + (hour % 8) for hour in range(24)],
            "relative_humidity_2m": [55 + (hour % 20) for hour in range(24)],
            "precipitation_probability": [10 + (hour % 6) * 8 for hour in range(24)],
            "weather_code": [3 for _ in range(24)],
            "pressure_msl": [1006 for _ in range(24)],
            "wind_speed_10m": [8 + (hour % 5) for hour in range(24)],
            "wind_gusts_10m": [18 + (hour % 7) for hour in range(24)],
        },
    }


def main():
    engine = WeatherEnsemble()
    engine._resolve_location = lambda city: {
        "name": "Hyderabad",
        "region": "Telangana, India",
        "country": "India",
        "latitude": 17.384,
        "longitude": 78.456,
        "timezone": "Asia/Kolkata",
    }
    engine._fetch_forecast = lambda location: sample_forecast_payload()
    result = engine.predict("Hyderabad")

    assert result["profile"]["city"]
    assert len(result["forecast"]) == 14
    assert result["hourly"]
    assert result["alerts"]
    assert result["explanation"]
    assert result["models"]
    assert result["modelRegistry"]["available"] is True
    assert result["features"]
    assert result["meta"]["engine"] == "WeatherEnsemble-v2"
    assert (FRONTEND_DIR / "index.html").exists()
    assert (FRONTEND_DIR / "manifest.webmanifest").exists()

    print("Smoke test passed")


if __name__ == "__main__":
    main()
