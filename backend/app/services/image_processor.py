import io
import math
import os
from PIL import Image, ImageDraw, ImageFont

THUMBNAIL_SIZES = {
    'small': (200, 200),
    'medium': (400, 400),
    'large': (800, 800)
}

WATERMARK_POSITIONS = [
    'bottom_right', 'bottom_left', 'top_right', 'top_left',
    'center', 'diagonal_lr', 'diagonal_rl',
]

WATERMARK_FONTS = {
    'dejavu_sans': '/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',
    'times': '/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf',
    'arial': '/usr/share/fonts/truetype/liberation/LiberationSans-Bold.ttf',
    'montserrat': '/usr/share/fonts/truetype/montserrat/Montserrat-Bold.ttf',
    'futura': '/usr/share/fonts/truetype/beteckna/BetecknaGS-Bold.ttf',
    'open_sans': '/usr/share/fonts/truetype/open-sans/OpenSans-Bold.ttf',
    'roboto': '/usr/share/fonts/truetype/roboto/unhinted/RobotoTTF/Roboto-Bold.ttf',
    'lato': '/usr/share/fonts/truetype/lato/Lato-Bold.ttf',
}


def generate_thumbnail(image_path, output_dir, size='medium', quality=85):
    filename = os.path.basename(image_path)
    name, ext = os.path.splitext(filename)
    output_filename = f"{name}_{size}{ext}"
    output_path = os.path.join(output_dir, output_filename)

    if os.path.exists(output_path):
        return output_path

    os.makedirs(output_dir, exist_ok=True)

    with Image.open(image_path) as img:
        img = img.convert('RGB')
        img.thumbnail(THUMBNAIL_SIZES[size], Image.Resampling.LANCZOS)
        img.save(output_path, 'JPEG', quality=quality, optimize=True)

    return output_path


def generate_all_thumbnails(image_path, output_dir, quality=85):
    for size in THUMBNAIL_SIZES:
        generate_thumbnail(image_path, output_dir, size, quality)


def _parse_hex_color(hex_color):
    hex_color = hex_color.lstrip('#')
    if len(hex_color) != 6:
        return (255, 255, 255)
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def _load_font(size, font_name='dejavu_sans'):
    path = WATERMARK_FONTS.get(font_name)
    if path and os.path.exists(path):
        return ImageFont.truetype(path, size)
    fallback = WATERMARK_FONTS['dejavu_sans']
    if os.path.exists(fallback):
        return ImageFont.truetype(fallback, size)
    raise FileNotFoundError("No suitable font found. Install fonts-dejavu-core.")


def _corner_position(img_size, text_size, position, margin=20):
    img_w, img_h = img_size
    tw, th = text_size
    positions = {
        'bottom_right': (img_w - tw - margin, img_h - th - margin),
        'bottom_left': (margin, img_h - th - margin),
        'top_right': (img_w - tw - margin, margin),
        'top_left': (margin, margin),
        'center': ((img_w - tw) // 2, (img_h - th) // 2),
    }
    return positions[position]


def _draw_diagonal(img, text, font, color_rgba, left_to_right=True):
    img_w, img_h = img.size
    bbox = font.getbbox(text)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]

    diagonal = math.sqrt(img_w ** 2 + img_h ** 2)
    txt_layer = Image.new('RGBA', (int(diagonal), th + 20), (0, 0, 0, 0))
    txt_draw = ImageDraw.Draw(txt_layer)

    spacing = tw + max(100, img_w // 8)
    x = 0
    while x < diagonal:
        txt_draw.text((x, 10), text, fill=color_rgba, font=font)
        x += spacing

    angle = math.degrees(math.atan2(img_h, img_w))
    if left_to_right:
        angle = -angle
    else:
        angle = angle

    rotated = txt_layer.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
    paste_x = (img_w - rotated.width) // 2
    paste_y = (img_h - rotated.height) // 2
    img.paste(rotated, (paste_x, paste_y), rotated)


def _load_watermark_image(wm_path, target_size, opacity, scale_factor=0.25):
    ext = os.path.splitext(wm_path)[1].lower()
    if ext == '.svg':
        import cairosvg
        png_data = cairosvg.svg2png(url=wm_path)
        wm = Image.open(io.BytesIO(png_data)).convert('RGBA')
    else:
        wm = Image.open(wm_path).convert('RGBA')

    max_dim = int(min(target_size) * scale_factor)
    wm.thumbnail((max_dim, max_dim), Image.Resampling.LANCZOS)

    alpha = int(255 * (opacity / 100))
    r, g, b, a = wm.split()
    a = a.point(lambda x: min(x, alpha))
    wm = Image.merge('RGBA', (r, g, b, a))
    return wm


def _place_image_diagonal(img, wm, left_to_right=True):
    img_w, img_h = img.size
    wm_w, wm_h = wm.size
    diagonal = math.sqrt(img_w ** 2 + img_h ** 2)

    spacing = wm_w + max(100, img_w // 8)
    strip_width = int(diagonal)
    strip = Image.new('RGBA', (strip_width, wm_h), (0, 0, 0, 0))
    x = 0
    while x < strip_width:
        strip.paste(wm, (x, 0), wm)
        x += spacing

    angle = math.degrees(math.atan2(img_h, img_w))
    if left_to_right:
        angle = -angle

    rotated = strip.rotate(angle, expand=True, resample=Image.Resampling.BICUBIC)
    paste_x = (img_w - rotated.width) // 2
    paste_y = (img_h - rotated.height) // 2
    img.paste(rotated, (paste_x, paste_y), rotated)


def _tile_grid(img, stamp, spacing, angle=0):
    img_w, img_h = img.size
    sw, sh = stamp.size
    gap_x = sw + spacing
    gap_y = sh + spacing
    offset_x = (img_w % gap_x) // 2
    offset_y = (img_h % gap_y) // 2

    if angle == 0:
        layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
        y = offset_y
        while y < img_h:
            x = offset_x
            while x < img_w:
                layer.paste(stamp, (x, y), stamp)
                x += gap_x
            y += gap_y
        return Image.alpha_composite(img, layer)

    diagonal = int(math.sqrt(img_w ** 2 + img_h ** 2))
    layer = Image.new('RGBA', (diagonal, diagonal), (0, 0, 0, 0))
    d_offset_x = (diagonal % gap_x) // 2
    d_offset_y = (diagonal % gap_y) // 2
    y = d_offset_y
    while y < diagonal:
        x = d_offset_x
        while x < diagonal:
            layer.paste(stamp, (x, y), stamp)
            x += gap_x
        y += gap_y
    rotated = layer.rotate(angle, expand=False, resample=Image.Resampling.BICUBIC)
    cx = (rotated.width - img_w) // 2
    cy = (rotated.height - img_h) // 2
    cropped = rotated.crop((cx, cy, cx + img_w, cy + img_h))
    return Image.alpha_composite(img, cropped)


def _make_text_stamp(text, font, color_rgba):
    bbox = font.getbbox(text)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    stamp = Image.new('RGBA', (tw, th), (0, 0, 0, 0))
    draw = ImageDraw.Draw(stamp)
    draw.text((-bbox[0], -bbox[1]), text, fill=color_rgba, font=font)
    return stamp


def apply_watermark(image_path, output_path, text='', opacity=30,
                    position='bottom_right', color='#ffffff',
                    font_name='dejavu_sans', font_size=None,
                    watermark_type='text', watermark_image_path=None,
                    repeat='none', spacing=100, grid_angle=0,
                    quality=95, is_thumbnail=False):
    with Image.open(image_path) as img:
        img = img.convert('RGBA')
        img_w, img_h = img.size

        if not is_thumbnail:
            spacing = int(spacing * min(img_w, img_h) / 400)

        if watermark_type == 'image':
            if watermark_image_path and os.path.exists(watermark_image_path):
                scale = 0.25 if is_thumbnail else 0.4
                wm = _load_watermark_image(watermark_image_path, img.size, opacity, scale_factor=scale)
                if repeat == 'grid':
                    img = _tile_grid(img, wm, spacing, grid_angle)
                elif position in ('diagonal_lr', 'diagonal_rl'):
                    _place_image_diagonal(img, wm, left_to_right=(position == 'diagonal_lr'))
                else:
                    pos = _corner_position(img.size, wm.size, position)
                    img.paste(wm, pos, wm)
        else:
            if font_size is None or font_size <= 0:
                if is_thumbnail:
                    font_size = max(12, int(min(img_w, img_h) * 0.04))
                else:
                    font_size = max(20, int(min(img_w, img_h) * 0.08))
            elif not is_thumbnail:
                font_size = int(font_size * min(img_w, img_h) / 400)
            font = _load_font(font_size, font_name)
            r, g, b = _parse_hex_color(color)
            alpha = int(255 * (opacity / 100))
            color_rgba = (r, g, b, alpha)

            if repeat == 'grid':
                stamp = _make_text_stamp(text, font, color_rgba)
                img = _tile_grid(img, stamp, spacing, grid_angle)
            elif position in ('diagonal_lr', 'diagonal_rl'):
                _draw_diagonal(img, text, font, color_rgba,
                               left_to_right=(position == 'diagonal_lr'))
            else:
                watermark_layer = Image.new('RGBA', img.size, (0, 0, 0, 0))
                draw = ImageDraw.Draw(watermark_layer)
                bbox = draw.textbbox((0, 0), text, font=font)
                text_size = (bbox[2] - bbox[0], bbox[3] - bbox[1])
                pos = _corner_position(img.size, text_size, position)
                draw.text(pos, text, fill=color_rgba, font=font)
                img = Image.alpha_composite(img, watermark_layer)

        img = img.convert('RGB')
        img.save(output_path, 'JPEG', quality=quality, optimize=True)

    return output_path
