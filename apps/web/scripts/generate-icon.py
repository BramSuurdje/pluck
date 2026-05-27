#!/usr/bin/env python3
"""Generate Pluck favicons and PWA icons (primary background, white letter)."""

import urllib.request
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / "scripts" / "assets"
PUBLIC = ROOT / "public"
FONT_PATH = ASSETS / "LeckerliOne.ttf"
FONT_URL = (
    "https://fonts.gstatic.com/s/leckerlione/v21/"
    "V8mCoQH8VCsNttEnxnGQ-1itLZxcBtItFw.ttf"
)

# oklch(0.505 0.213 27.518) — matches packages/ui globals.css --primary
PRIMARY = "#bf000f"
LETTER = "#ffffff"


def squircle_mask(size: int) -> Image.Image:
    """macOS-style squircle (superellipse, n=5)."""
    mask = Image.new("L", (size, size), 0)
    pixels = mask.load()
    center = (size - 1) / 2
    scale = size / 2
    exponent = 5.0
    xs = [abs((x - center) / scale) ** exponent for x in range(size)]

    for y in range(size):
        ny = abs((y - center) / scale) ** exponent
        for x in range(size):
            if xs[x] + ny <= 1.0:
                pixels[x, y] = 255

    return mask


def render_icon(size: int) -> Image.Image:
    ASSETS.mkdir(parents=True, exist_ok=True)
    if not FONT_PATH.exists():
        urllib.request.urlretrieve(FONT_URL, FONT_PATH)

    img = Image.new("RGBA", (size, size), PRIMARY)
    draw = ImageDraw.Draw(img)
    font_size = int(size * 0.49)
    font = ImageFont.truetype(str(FONT_PATH), font_size)

    text = "P"
    bbox = draw.textbbox((0, 0), text, font=font)
    x = (size - (bbox[2] - bbox[0])) / 2 - bbox[0]
    y = (size - (bbox[3] - bbox[1])) / 2 - bbox[1]
    draw.text((x, y), text, font=font, fill=LETTER)

    img.putalpha(squircle_mask(size))
    return img


def main() -> None:
    PUBLIC.mkdir(parents=True, exist_ok=True)

    master = render_icon(512)
    outputs = {
        "android-chrome-512x512.png": 512,
        "android-chrome-192x192.png": 192,
        "apple-touch-icon.png": 180,
        "favicon-32x32.png": 32,
        "favicon-16x16.png": 16,
    }

    for name, px in outputs.items():
        path = PUBLIC / name
        resized = master.resize((px, px), Image.Resampling.LANCZOS)
        resized.save(path, "PNG")
        print(path)

    ico_sizes = [16, 32, 48]
    ico_images = [
        master.resize((px, px), Image.Resampling.LANCZOS) for px in ico_sizes
    ]
    ico_path = PUBLIC / "favicon.ico"
    ico_images[0].save(
        ico_path,
        format="ICO",
        sizes=[(px, px) for px in ico_sizes],
        append_images=ico_images[1:],
    )
    print(ico_path)


if __name__ == "__main__":
    main()
