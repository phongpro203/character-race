"""
Turn the AI-generated run-cycle sheets (4x2 grid, white background) into
horizontal 8-frame sprite strips used by the race lanes.

Usage: python3 scripts/make-run-sprites.py
Input:  art/run-sheets/character-01.png ... character-12.png
Output: src/assets/characters/run/character-01.webp ... (8 frames x 256px)

All frames of one character share the same scale and vertical crop, so the
natural up/down bounce of the run cycle is kept. Horizontally each frame is
centred on its alpha centroid, which stops the body from sliding back and
forth while the limbs swing.
"""
import importlib.util
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
IN_DIR = ROOT / "art/run-sheets"
OUT_DIR = ROOT / "src/assets/characters/run"
COLS, ROWS = 4, 2
FRAME = 256
PADDING = 6

# reuse the flood-fill background removal from the portrait cropper
_spec = importlib.util.spec_from_file_location("crop", ROOT / "scripts/crop-characters.py")
_crop = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(_crop)


def is_background(rgb):
    # these sheets are pure white with no drop shadow, so stay strict: white
    # robot / panda / armour parts must not be eaten through a gap in the outline
    lo, hi = min(rgb), max(rgb)
    return lo >= 238 and hi - lo <= 14


def alpha_mask(img):
    return img.getchannel("A").point(lambda a: 255 if a > 20 else 0)


def centroid_x(mask):
    w, h = mask.size
    cols = [0] * w
    data = mask.getdata()
    for i, v in enumerate(data):
        if v:
            cols[i % w] += 1
    total = sum(cols)
    return sum(x * c for x, c in enumerate(cols)) / total


def build_strip(sheet_path):
    sheet = Image.open(sheet_path).convert("RGBA")
    cw, ch = sheet.width / COLS, sheet.height / ROWS
    frames = []
    for row in range(ROWS):
        for col in range(COLS):
            box = (round(col * cw), round(row * ch), round((col + 1) * cw), round((row + 1) * ch))
            frames.append(_crop.remove_background(sheet.crop(box), is_background))

    # shared crop: union of vertical extents, widest half-width around each centroid
    infos = []
    top, bottom, half = 10**9, 0, 0
    for f in frames:
        m = alpha_mask(f)
        x0, y0, x1, y1 = m.getbbox()
        cx = centroid_x(m)
        infos.append(cx)
        top, bottom = min(top, y0), max(bottom, y1)
        half = max(half, cx - x0, x1 - cx)

    side = max(bottom - top, half * 2) + PADDING * 2
    strip = Image.new("RGBA", (FRAME * len(frames), FRAME), (0, 0, 0, 0))
    for i, (f, cx) in enumerate(zip(frames, infos)):
        # feet of the lowest frame land PADDING px above the bottom edge
        left = cx - side / 2
        upper = bottom + PADDING - side
        cell = f.crop((round(left), round(upper), round(left + side), round(upper + side)))
        strip.paste(cell.resize((FRAME, FRAME), Image.LANCZOS), (i * FRAME, 0))
    return strip


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for path in sorted(IN_DIR.glob("character-*.png")):
        strip = build_strip(path)
        out = OUT_DIR / (path.stem + ".webp")
        strip.save(out, "WEBP", quality=88, method=6)
        print("saved", out.relative_to(ROOT), f"{out.stat().st_size // 1024} KB")


if __name__ == "__main__":
    main()
