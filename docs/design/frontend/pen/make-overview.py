"""拼接已由Pen导出的PNG；不读取或修改.pen文件。"""
from pathlib import Path
import json
from PIL import Image, ImageDraw, ImageFont

base = Path(__file__).resolve().parents[1]
export_dir = base / "exports"
pages = json.loads((export_dir / "pen-layout-check.json").read_text())["roots"]
font_path = base / "assets/fonts/NotoSansSC.ttf"
font = ImageFont.truetype(str(font_path), 17)
small = ImageFont.truetype(str(font_path), 13)
title = ImageFont.truetype(str(font_path), 30)

def overview(items, columns, cell_width, image_height, filename):
    gap, heading, footer = 22, 76, 44
    rows = (len(items) + columns - 1) // columns
    canvas = Image.new("RGB", (gap + columns * (cell_width + gap),
                                heading + rows * (image_height + footer + gap)), "#101010")
    draw = ImageDraw.Draw(canvas)
    draw.text((gap, 20), "VINYL / UI", font=title, fill="#FFFFFF")
    for i, item in enumerate(items):
        x = gap + (i % columns) * (cell_width + gap)
        y = heading + (i // columns) * (image_height + footer + gap)
        picture = Image.open(export_dir / f"{item['id']}.png").convert("RGB")
        assert picture.size == (item["width"], item["height"]), item
        picture.thumbnail((cell_width, image_height), Image.Resampling.LANCZOS)
        canvas.paste(picture, (x + (cell_width - picture.width) // 2, y))
        label = item["name"].split(" · ")[:2]
        draw.text((x, y + image_height + 10), " / ".join(label), font=small, fill="#BBCBB2")
    canvas.save(export_dir / filename)

overview(pages, 6, 234, 507, "overview.png")
overview([pages[i] for i in [0, 1, 3, 8]], 4, 292, 632, "preview.png")
for start in range(0, 18, 6):
    overview(pages[start:start + 6], 3, 390, 844, f"review-{start // 6 + 1}.png")
print(f"Verified {len(pages)} page dimensions; wrote overview, preview and 3 review sheets")
