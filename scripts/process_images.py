#!/usr/bin/env python3
"""Process raw UI art in public/icons/ and write web-ready PNGs to public/icons/.

Usage:
    python scripts/process_images.py                 # process new/changed images
    python scripts/process_images.py --force         # ignore the cache
    python scripts/process_images.py btn-join        # files whose name contains the text
    python scripts/process_images.py -r '^btn-.*\\.png$'   # files whose name matches a regex

Each source is hashed together with its rule; unchanged images are skipped.
"""

import argparse
import hashlib
import json
import re
import sys
from collections import deque
from pathlib import Path

try:
    import numpy as np
    from PIL import Image
except ImportError:
    sys.exit("Missing dependencies. Run: npm run images:setup")

ROOT = Path(__file__).resolve().parent.parent
SRC_DIR = ROOT / "public" / "icons"
OUT_DIR = ROOT / "public" / "icons"
CACHE_FILE = ROOT / "public" / "icons" / ".image-cache.json"

# Bump when the processing logic changes so cached results are rebuilt.
SCRIPT_VERSION = 2

# Per-file rules. Files not listed use "auto".
#   auto          trim transparent margins if the image has transparency, else copy as is
#   trim          trim transparent margins
#   copy          copy unchanged
#   crop_nonwhite crop to the non-white content (opaque image on a white background)
#   clear_corners make the dark outer background transparent (flood fill from the corners), then trim
#   crop_box      crop to a fixed (left, top, right, bottom) box
RULES: dict[str, dict] = {
    "title-featured_elixyrs.png": {"mode": "crop_nonwhite", "threshold": 200},
    "footer-message.png": {"mode": "crop_box", "box": [30, 240, 1510, 760]},
    "btn-bpi.png": {"mode": "clear_corners", "tolerance": 40},
    "btn-gcash.png": {"mode": "clear_corners", "tolerance": 40},
    "btn-join.png": {"mode": "clear_corners", "tolerance": 40},
    "btn-download_qr_login.png": {"mode": "clear_corners", "tolerance": 80},
    "title-form-pass.png": {"mode": "clear_corners", "tolerance": 40},
    # Dark panels meant to sit on the form's dark background; keep as designed.
    "title-form-payment.png": {"mode": "copy"},
    "title-form-pop.png": {"mode": "copy"},
    "title-form-total.png": {"mode": "copy"},
}


def trim_alpha(im: Image.Image, threshold: int = 10) -> Image.Image:
    alpha = np.array(im)[:, :, 3]
    ys, xs = np.where(alpha > threshold)
    if not len(xs):
        return im
    return im.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))


def clear_corners(im: Image.Image, tolerance: int) -> Image.Image:
    arr = np.array(im).astype(int)
    h, w, _ = arr.shape
    seen = np.zeros((h, w), bool)
    queue: deque = deque()
    for y, x in ((0, 0), (0, w - 1), (h - 1, 0), (h - 1, w - 1)):
        queue.append((y, x, arr[y, x, :3].copy()))
        seen[y, x] = True
    while queue:
        y, x, ref = queue.popleft()
        arr[y, x, 3] = 0
        for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not seen[ny, nx]:
                if np.abs(arr[ny, nx, :3] - ref).sum() <= tolerance:
                    seen[ny, nx] = True
                    queue.append((ny, nx, ref))
    return Image.fromarray(arr.astype(np.uint8))


def crop_nonwhite(im: Image.Image, threshold: int) -> Image.Image:
    rgb = np.array(im)[:, :, :3]
    ys, xs = np.where(rgb.min(axis=2) < threshold)
    if not len(xs):
        return im
    return im.crop((int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1))


def has_transparency(im: Image.Image) -> bool:
    return int(np.array(im)[:, :, 3].min()) < 200


def process(path: Path, rule: dict) -> Image.Image:
    im = Image.open(path).convert("RGBA")
    mode = rule.get("mode", "auto")
    if mode == "auto":
        mode = "trim" if has_transparency(im) else "copy"
    if mode == "copy":
        return im
    if mode == "trim":
        return trim_alpha(im)
    if mode == "crop_nonwhite":
        return crop_nonwhite(im, rule.get("threshold", 200))
    if mode == "clear_corners":
        return trim_alpha(clear_corners(im, rule.get("tolerance", 40)))
    if mode == "crop_box":
        return im.crop(tuple(rule["box"]))
    raise ValueError(f"Unknown mode {mode!r} for {path.name}")


def cache_key(path: Path, rule: dict) -> str:
    h = hashlib.sha256()
    h.update(path.read_bytes())
    h.update(json.dumps(rule, sort_keys=True).encode())
    h.update(str(SCRIPT_VERSION).encode())
    return h.hexdigest()


def load_cache() -> dict:
    try:
        return json.loads(CACHE_FILE.read_text())
    except (FileNotFoundError, json.JSONDecodeError):
        return {}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("names", nargs="*", help="only process files whose name contains one of these")
    parser.add_argument("-r", "--regex", action="store_true", help="treat names as regular expressions (re.search)")
    parser.add_argument("--force", action="store_true", help="ignore the cache and reprocess everything")
    args = parser.parse_args()

    try:
        patterns = [re.compile(n) for n in args.names] if args.regex else []
    except re.error as e:
        parser.error(f"invalid regex: {e}")

    def selected(name: str) -> bool:
        if not args.names:
            return True
        if args.regex:
            return any(p.search(name) for p in patterns)
        return any(n in name for n in args.names)

    sources = sorted(p for p in SRC_DIR.glob("*.png") if selected(p.name))
    if not sources:
        print(f"No matching images in {SRC_DIR.relative_to(ROOT)}")
        return 0

    cache = load_cache()
    OUT_DIR.mkdir(exist_ok=True)
    done = skipped = 0

    for src in sources:
        rule = RULES.get(src.name, {"mode": "auto"})
        key = cache_key(src, rule)
        out = OUT_DIR / src.name
        if not args.force and cache.get(src.name) == key and out.exists():
            skipped += 1
            print(f"  skip   {src.name}")
            continue
        before = Image.open(src).size
        result = process(src, rule)
        result.save(out, optimize=True)
        cache[src.name] = key
        done += 1
        print(f"  done   {src.name}  {before[0]}x{before[1]} -> {result.size[0]}x{result.size[1]}  [{rule.get('mode', 'auto')}]")

    CACHE_FILE.write_text(json.dumps(cache, indent=2, sort_keys=True) + "\n")
    print(f"{done} processed, {skipped} cached")
    return 0


if __name__ == "__main__":
    sys.exit(main())
