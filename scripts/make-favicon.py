"""
Build the site icons from character-01 (Racer Boy):
  public/favicon.ico (16/32/48), public/favicon.png (64), public/apple-touch-icon.png (180)
Usage: python3 scripts/make-favicon.py
"""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src/assets/characters/character-01.png"
PUB = ROOT / "public"
S = 512  # draw big, downscale for crisp edges


def badge():
    # purple -> pink diagonal gradient, same as the game background
    grad = Image.new("RGBA", (S, S))
    px = grad.load()
    a, b = (106, 92, 255), (255, 111, 181)
    for y in range(S):
        for x in range(S):
            t = (x + y) / (2 * S)
            px[x, y] = tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3)) + (255,)
    mask = Image.new("L", (S, S), 0)
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, S - 1, S - 1), radius=110, fill=255)
    icon = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    icon.paste(grad, (0, 0), mask)
    ImageDraw.Draw(icon).rounded_rectangle((10, 10, S - 11, S - 11), radius=100, outline=(43, 27, 90, 255), width=22)

    # head + shoulders of the character, so it stays readable at 16px
    char = Image.open(SRC).convert("RGBA")
    w, h = char.size
    head = char.crop((int(w * 0.18), 0, int(w * 0.92), int(h * 0.62)))
    bbox = head.getchannel("A").getbbox()
    head = head.crop(bbox)
    scale = S * 0.88 / max(head.size)
    head = head.resize((round(head.width * scale), round(head.height * scale)), Image.LANCZOS)
    icon.alpha_composite(head, ((S - head.width) // 2, S - head.height - 26))
    return icon


def main():
    icon = badge()
    icon.resize((180, 180), Image.LANCZOS).save(PUB / "apple-touch-icon.png", optimize=True)
    icon.resize((64, 64), Image.LANCZOS).save(PUB / "favicon.png", optimize=True)
    icon.save(PUB / "favicon.ico", sizes=[(16, 16), (32, 32), (48, 48)])
    print("icons written to public/")


if __name__ == "__main__":
    main()
