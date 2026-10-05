#!/usr/bin/env -S bash -c 'exec "$(dirname "$0")/.venv/bin/python3" "$0" "$@"'
"""
Preview the downloadable QR card with your chosen positions.

Usage:
    python scripts/card_preview.py

Output: /tmp/card_preview.png  (opens automatically on Mac)

Tweak the values in the CARD section below, then re-run.
"""

from pathlib import Path
import qrcode
from PIL import Image, ImageDraw, ImageFont

# ─── TWEAK THESE ──────────────────────────────────────────────────────────────

# Dummy content shown in the preview
USERNAME = "TEST23"
SECRET   = "aB3dE6fG9hJ2kL5mN8pQ1rS4tU7vW0xY"

# Card positions  (template is 1023 × 1537 px)
QR_X    = 430   # left edge of the QR box
QR_Y    = 712   # top edge of the QR box
QR_SIZE = 147   # side length of the QR box

NAME_Y   = 930  # vertical centre of the username text
SECRET_Y = 1000 # vertical centre of the first secret line

CX = 511        # horizontal centre (don't change unless the template changes)

# Font sizes
NAME_FONT_SIZE   = 38
SECRET_FONT_SIZE = 20
SECRET_LINE_GAP  = 26   # pixels between wrapped secret lines
SECRET_MAX_CHARS = 38   # wrap secret at this many characters per line

# ─── DON'T NEED TO TOUCH BELOW HERE ──────────────────────────────────────────

ROOT     = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "public" / "qr-login-full.png"
OUT      = Path("/tmp/card_preview.png")

def load_font(paths: list[str], size: int) -> ImageFont.FreeTypeFont:
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except OSError:
            pass
    return ImageFont.load_default()

NAME_FONT = load_font([
    "/System/Library/Fonts/Supplemental/Georgia Bold.ttf",
    "/System/Library/Fonts/Georgia.ttf",
], NAME_FONT_SIZE)

SECRET_FONT = load_font([
    "/System/Library/Fonts/Supplemental/Courier New Bold.ttf",
    "/System/Library/Fonts/Supplemental/Courier New.ttf",
    "/System/Library/Fonts/Courier New.ttf",
], SECRET_FONT_SIZE)

img  = Image.open(TEMPLATE).convert("RGBA")
draw = ImageDraw.Draw(img)

# Generate and paste a real QR code
qr_img = qrcode.make(SECRET).convert("RGBA").resize((QR_SIZE, QR_SIZE), Image.LANCZOS)
draw.rectangle([QR_X, QR_Y, QR_X + QR_SIZE, QR_Y + QR_SIZE], fill=(255, 255, 255, 255))
img.paste(qr_img, (QR_X, QR_Y))

# Username
draw.text((CX, NAME_Y), USERNAME.upper(), font=NAME_FONT,
          fill=(255, 232, 176, 255), anchor="mm")

# Secret (wrapped)
lines = [SECRET[i:i + SECRET_MAX_CHARS] for i in range(0, len(SECRET), SECRET_MAX_CHARS)]
for idx, line in enumerate(lines):
    draw.text((CX, SECRET_Y + idx * SECRET_LINE_GAP), line, font=SECRET_FONT,
              fill=(255, 210, 140, 220), anchor="mm")

img.save(OUT)
print(f"Saved → {OUT}")

# Open automatically on macOS
import subprocess, sys
if sys.platform == "darwin":
    subprocess.run(["open", str(OUT)])
