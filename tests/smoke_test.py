from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from backend.aiml.weather_engine import WeatherEnsemble
from server import FRONTEND_DIR


def main():
    engine = WeatherEnsemble()
    result = engine.predict("London")

    assert result["profile"]["city"]
    assert result["forecast"]
    assert result["hourly"]
    assert result["alerts"]
    assert result["explanation"]
    assert result["models"]
    assert result["features"]
    assert result["meta"]["engine"] == "WeatherEnsemble-v2"
    assert (FRONTEND_DIR / "index.html").exists()
    assert (FRONTEND_DIR / "manifest.webmanifest").exists()

    print("Smoke test passed")


if __name__ == "__main__":
    main()
