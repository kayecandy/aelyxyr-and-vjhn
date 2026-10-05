# aelyxyr-and-vjhn


# Image processing script

`scripts/process_images.py` turns the raw UI art in `assets/icons/` into web-ready PNGs in `public/`. It trims empty margins, crops banners, and clears opaque backgrounds, using one rule per file.

## Setup (once)

Requires Python 3.

```bash
npm run images:setup
```

This creates `scripts/.venv` and installs `pillow` and `numpy` from `scripts/requirements.txt`.

## Usage

| Command | What it does |
| --- | --- |
| `npm run images` | Process new or changed images, skip the rest |
| `npm run images:force` | Ignore the cache and reprocess everything |
| `npm run images:only -- <text>` | Reprocess only files whose name contains `<text>` (several allowed) |
| `npm run images:only -- -r '<regex>'` | Reprocess only files whose name matches the regex (`re.search`) |

Examples:

```bash
npm run images:only -- btn-join              # one file
npm run images:only -- btn-bpi btn-gcash     # several files
npm run images:only -- btn-                  # everything containing "btn-"
npm run images:only -- -r '^title-form-'     # regex
npm run images:only -- -r 'bpi|gcash'        # regex alternation
```

`images:only` always bypasses the cache for the files it selects. To filter but still respect the cache, call the script directly: `scripts/.venv/bin/python scripts/process_images.py -r '^btn-'`.

Output keeps the source filename, so `assets/icons/btn-join.png` becomes `public/btn-join.png` and is used on the site as `/btn-join.png`.

## Adding or changing an image

1. Put the original PNG in `assets/icons/`.
2. If it needs special handling, add an entry to `RULES` in `scripts/process_images.py`.
3. Run `npm run images`.

Never edit the files in `public/` that come from this script; they are overwritten on the next run. Change the source or its rule instead.

## Rules

Files without an entry in `RULES` use `auto`.

| Mode | Behavior | Options |
| --- | --- | --- |
| `auto` | Trim transparent margins if the image has transparency, otherwise copy unchanged | none |
| `trim` | Trim transparent margins | none |
| `copy` | Copy unchanged | none |
| `crop_nonwhite` | Crop to the non-white content (opaque art on a white background) | `threshold` (default 200) |
| `clear_corners` | Make the outer background transparent by flood-filling from the four corners, then trim | `tolerance` (default 40; higher removes more similar colors) |
| `crop_box` | Crop to a fixed box | `box`: `[left, top, right, bottom]` in pixels |

Example:

```python
RULES = {
    "btn-join.png": {"mode": "clear_corners", "tolerance": 40},
    "footer-message.png": {"mode": "crop_box", "box": [30, 240, 1510, 760]},
}
```

`clear_corners` only works when the background is a connected area of one color reaching a corner. If the art has gaps in its border, the fill can leak inside; use `copy` for those.

## Caching

Each run stores a hash of the source file, its rule, and `SCRIPT_VERSION` in `assets/.image-cache.json`. An image is skipped when its hash is unchanged and its output file exists.

- Editing a source image or its rule reprocesses it automatically.
- If you change the processing logic in the script, bump `SCRIPT_VERSION` so everything rebuilds, or run `npm run images:force`.
- To clear the cache, delete `assets/.image-cache.json`.

`scripts/.venv/` and `assets/.image-cache.json` are gitignored. Only PNG files are processed.
