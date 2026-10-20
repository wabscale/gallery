import pytest
from datetime import datetime, timezone, timedelta
from app.utils.helpers import (
    slugify, format_file_size, to_utc_iso, resolve_timezone, count_by_local_day, local_weekday_hour_heatmap
)


def test_slugify():
    assert slugify('My Gallery Name') == 'my-gallery-name'
    assert slugify('Hello World!') == 'hello-world'
    assert slugify('Test  Multiple   Spaces') == 'test-multiple-spaces'


def test_format_file_size():
    assert format_file_size(0) == '0.00 B'
    assert format_file_size(1024) == '1.00 KB'
    assert format_file_size(1048576) == '1.00 MB'
    assert format_file_size(1073741824) == '1.00 GB'


def test_to_utc_iso_marks_naive_values_as_utc():
    assert to_utc_iso(datetime(2026, 10, 20, 14, 30, 0)) == '2026-10-20T14:30:00+00:00'


def test_to_utc_iso_converts_aware_values_to_utc():
    eastern = timezone(timedelta(hours=-4))
    assert to_utc_iso(datetime(2026, 10, 20, 10, 30, tzinfo=eastern)) == '2026-10-20T14:30:00+00:00'


def test_to_utc_iso_passes_through_none():
    assert to_utc_iso(None) is None


def test_resolve_timezone():
    assert resolve_timezone('America/New_York') is not None
    assert resolve_timezone('Not/AZone') is None
    assert resolve_timezone('') is None


def test_count_by_local_day_uses_viewer_timezone():
    # 02:30 UTC on Oct 21 is still the evening of Oct 20 in New York
    stamps = [datetime(2026, 10, 21, 2, 30), datetime(2026, 10, 21, 15, 0)]
    assert count_by_local_day(stamps, resolve_timezone('UTC')) == [{'date': '2026-10-21', 'count': 2}]
    assert count_by_local_day(stamps, resolve_timezone('America/New_York')) == [
        {'date': '2026-10-20', 'count': 1},
        {'date': '2026-10-21', 'count': 1},
    ]


def test_local_heatmap_rows_start_on_monday():
    # 2026-10-19 is a Monday; 14:00 UTC is 10:00 in New York (EDT)
    heatmap = local_weekday_hour_heatmap([datetime(2026, 10, 19, 14, 0)], resolve_timezone('America/New_York'))
    assert heatmap[0][10] == 1
    assert sum(map(sum, heatmap)) == 1
