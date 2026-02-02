import pytest
from app.utils.helpers import slugify, format_file_size


def test_slugify():
    assert slugify('My Gallery Name') == 'my-gallery-name'
    assert slugify('Hello World!') == 'hello-world'
    assert slugify('Test  Multiple   Spaces') == 'test-multiple-spaces'


def test_format_file_size():
    assert format_file_size(0) == '0.00 B'
    assert format_file_size(1024) == '1.00 KB'
    assert format_file_size(1048576) == '1.00 MB'
    assert format_file_size(1073741824) == '1.00 GB'
