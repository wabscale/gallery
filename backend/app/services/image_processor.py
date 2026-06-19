import os
from PIL import Image, ImageDraw, ImageFont, ImageEnhance

THUMBNAIL_SIZES = {
    'small': (200, 200),
    'medium': (400, 400),
    'large': (800, 800)
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


def apply_watermark(image_path, output_path, text='', opacity=30):
    with Image.open(image_path) as img:
        img = img.convert('RGBA')

        watermark_layer = Image.new('RGBA', img.size, (255, 255, 255, 0))
        draw = ImageDraw.Draw(watermark_layer)

        img_width, img_height = img.size
        font_size = max(20, img_width // 30)

        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", font_size)
        except:
            font = ImageFont.load_default()

        bbox = draw.textbbox((0, 0), text, font=font)
        text_width = bbox[2] - bbox[0]
        text_height = bbox[3] - bbox[1]

        x = img_width - text_width - 20
        y = img_height - text_height - 20

        alpha = int(255 * (opacity / 100))
        draw.text((x, y), text, fill=(255, 255, 255, alpha), font=font)

        watermarked = Image.alpha_composite(img, watermark_layer)
        watermarked = watermarked.convert('RGB')
        watermarked.save(output_path, 'JPEG', quality=95, optimize=True)

    return output_path
