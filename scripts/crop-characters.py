"""
Crop the 4x3 character sheet into 12 transparent PNGs.

Usage: python3 scripts/crop-characters.py [path/to/sheet.png]
Output: src/assets/characters/character-01.png ... character-12.png

Background removal: flood-fill from the cell border through near-white /
light-gray pixels (page background + drop shadow). White areas *inside* a
character are enclosed by dark outlines, so they are not reached and stay opaque.
"""
import sys
from collections import deque
from pathlib import Path

from PIL import Image, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SHEET = Path(sys.argv[1]) if len(sys.argv) > 1 else ROOT / "src/assets/characters-sheet.png"
OUT_DIR = ROOT / "src/assets/characters"
COLS, ROWS = 4, 3
OUT_SIZE = 256
PADDING = 8


def is_background(rgb):
    r, g, b = rgb
    lo, hi = min(r, g, b), max(r, g, b)
    # near-white or pale bluish-gray shadow, low saturation
    return lo >= 175 and hi - lo <= 42 and b >= r - 4


def remove_background(cell, is_bg=is_background):
    rgb = cell.convert("RGB")
    w, h = rgb.size
    px = rgb.load()
    mask = Image.new("L", (w, h), 255)
    m = mask.load()
    queue = deque()
    for x in range(w):
        queue.extend([(x, 0), (x, h - 1)])
    for y in range(h):
        queue.extend([(0, y), (w - 1, y)])
    while queue:
        x, y = queue.popleft()
        if m[x, y] == 0 or not is_bg(px[x, y]):
            continue
        m[x, y] = 0
        if x > 0: queue.append((x - 1, y))
        if x < w - 1: queue.append((x + 1, y))
        if y > 0: queue.append((x, y - 1))
        if y < h - 1: queue.append((x, y + 1))
    # soften the cut edge slightly
    mask = mask.filter(ImageFilter.GaussianBlur(0.8))
    out = cell.convert("RGBA")
    out.putalpha(mask)
    return out


def fit_square(img):
    bbox = img.getchannel("A").point(lambda a: 255 if a > 20 else 0).getbbox()
    if bbox:
        img = img.crop(bbox)
    side = max(img.size) + PADDING * 2
    canvas = Image.new("RGBA", (side, side), (0, 0, 0, 0))
    # bottom-align so feet sit on the same baseline across characters
    canvas.paste(img, ((side - img.width) // 2, side - img.height - PADDING), img)
    return canvas.resize((OUT_SIZE, OUT_SIZE), Image.LANCZOS)


def main():
    sheet = Image.open(SHEET)
    cw, ch = sheet.width / COLS, sheet.height / ROWS
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for row in range(ROWS):
        for col in range(COLS):
            idx = row * COLS + col + 1
            box = (round(col * cw), round(row * ch), round((col + 1) * cw), round((row + 1) * ch))
            sprite = fit_square(remove_background(sheet.crop(box)))
            path = OUT_DIR / f"character-{idx:02d}.png"
            sprite.save(path, optimize=True)
            print("saved", path.relative_to(ROOT))


if __name__ == "__main__":
    main()
