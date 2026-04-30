from datetime import date

from app.seed import normalize_tmdb_movie, parse_release_date


def test_parse_release_date_handles_missing_values():
    assert parse_release_date(None) is None
    assert parse_release_date("") is None


def test_parse_release_date_parses_iso_dates():
    assert parse_release_date("2010-07-16") == date(2010, 7, 16)


def test_normalize_tmdb_movie_keeps_core_fields_and_provider_subset():
    movie = normalize_tmdb_movie(
        {
            "id": 27205,
            "title": "Inception",
            "release_date": "2010-07-16",
            "overview": "Dreams within dreams.",
            "poster_path": None,
            "backdrop_path": None,
            "genres": [{"id": 878, "name": "Science Fiction"}],
            "credits": {"cast": [{"name": f"Actor {i}"} for i in range(12)]},
            "keywords": {"keywords": [{"id": 1, "name": "dream"}]},
            "watch/providers": {
                "results": {
                    "CA": {"flatrate": [{"provider_name": "Crave"}]},
                    "US": {"rent": [{"provider_name": "Apple TV"}]},
                    "GB": {"flatrate": [{"provider_name": "Now TV"}]},
                }
            },
            "images": {
                "posters": [{"file_path": "/poster.jpg"}],
                "backdrops": [{"file_path": "/backdrop.jpg"}],
            },
        }
    )

    assert movie["tmdb_id"] == 27205
    assert movie["title"] == "Inception"
    assert movie["release_date"] == date(2010, 7, 16)
    assert movie["poster_path"] == "/poster.jpg"
    assert movie["backdrop_path"] == "/backdrop.jpg"
    assert len(movie["cast"]) == 10
    assert set(movie["watch_providers"].keys()) == {"CA", "US"}
