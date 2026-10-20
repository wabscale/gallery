import pytest
from datetime import datetime, timezone, timedelta
from app.utils.helpers import slugify, format_file_size, to_utc_iso


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

