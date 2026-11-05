from __future__ import annotations

import argparse
import json
import math
import zipfile
from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageDraw


def remove_checkerboard(image: np.ndarray) -> np.ndarray:
    """Remove only checker pixels connected to the image border; preserve interior art."""
    bgr = image[:, :, :3]
    alpha = image[:, :, 3] if image.shape[2] == 4 else np.full(image.shape[:2], 255, np.uint8)
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    # The supplied sheets use a pale, low-saturation checkerboard.
    candidate = ((hsv[:, :, 1] < 52) & (hsv[:, :, 2] > 150) & (alpha > 0)).astype(np.uint8)
    candidate = cv2.morphologyEx(candidate, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    flood = np.zeros((candidate.shape[0] + 2, candidate.shape[1] + 2), np.uint8)
    mask = np.zeros_like(candidate)
    border_points = [(x, 0) for x in range(candidate.shape[1])] + [(x, candidate.shape[0] - 1) for x in range(candidate.shape[1])]
    border_points += [(0, y) for y in range(candidate.shape[0])] + [(candidate.shape[1] - 1, y) for y in range(candidate.shape[0])]
    for x, y in border_points:
        if candidate[y, x] and not flood[y + 1, x + 1]:
            cv2.floodFill(candidate, flood, (x, y), 2, loDiff=0, upDiff=0, flags=8 | (255 << 8))
    mask[candidate == 2] = 255
    result = image.copy()
    result[:, :, 3] = np.where(mask > 0, 0, alpha).astype(np.uint8)
    return result


def split_components(rgba: np.ndarray, padding: int) -> list[tuple[int, int, int, int, np.ndarray]]:
    alpha = rgba[:, :, 3]
    binary = (alpha > 12).astype(np.uint8) * 255
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8))
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    components = []
    height, width = alpha.shape
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        if w * h < 80 or w < 8 or h < 8:
            continue
        x0, y0 = max(0, x - padding), max(0, y - padding)
        x1, y1 = min(width, x + w + padding), min(height, y + h + padding)
        crop = rgba[y0:y1, x0:x1].copy()
        components.append((x0, y0, x1 - x0, y1 - y0, crop))
    return sorted(components, key=lambda item: (item[1], item[0]))


def category_for(rect: tuple[int, int, int, int], width: int, height: int) -> str:
    x, y, w, h = rect
    center_y = y + h / 2
    if center_y < height * 0.43:
        return "player"
    if center_y < height * 0.72:
        return "enemies"
    return "props"


def write_contact_sheet(files: list[tuple[str, Path]], output: Path) -> None:
    thumb_w, thumb_h = 160, 160
    columns = 6
    rows = max(1, math.ceil(len(files) / columns))
    sheet = Image.new("RGBA", (columns * thumb_w, rows * (thumb_h + 24)), (36, 40, 48, 255))
    draw = ImageDraw.Draw(sheet)
    for index, (name, path) in enumerate(files):
        image = Image.open(path).convert("RGBA")
        image.thumbnail((thumb_w - 20, thumb_h - 20), Image.Resampling.NEAREST)
        x = (index % columns) * thumb_w + (thumb_w - image.width) // 2
        y = (index // columns) * (thumb_h + 24) + (thumb_h - image.height) // 2
        sheet.alpha_composite(image, (x, y))
        draw.text(((index % columns) * thumb_w + 4, (index // columns) * (thumb_h + 24) + thumb_h + 3), name, fill="white")
    sheet.save(output)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("--output", type=Path, default=Path("game-assets"))
    parser.add_argument("--padding", type=int, default=6)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    source = cv2.imread(str(args.source), cv2.IMREAD_UNCHANGED)
    if source is None:
        raise SystemExit(f"Could not read {args.source}")
    if source.shape[2] == 3:
        source = cv2.cvtColor(source, cv2.COLOR_BGR2RGBA)
    else:
        source = cv2.cvtColor(source, cv2.COLOR_BGRA2RGBA)
    cleaned = remove_checkerboard(source)
    rgba = cleaned
    height, width = rgba.shape[:2]
    components = split_components(rgba, args.padding)
    metadata = []
    contact_files = []
    counters = {"player": 0, "npc": 0, "enemies": 0, "bosses": 0, "props": 0}
    for index, (x, y, w, h, crop) in enumerate(components, 1):
        category = category_for((x, y, w, h), width, height)
        counters[category] += 1
        filename = f"{category}_{counters[category]:03d}.png"
        category_dir = args.output / category
        category_dir.mkdir(exist_ok=True)
        path = category_dir / filename
        Image.fromarray(crop, "RGBA").save(path, optimize=True)
        contact_files.append((filename, path))
        metadata.append({"filename": str(path.relative_to(args.output)), "category": category, "x": x, "y": y, "width": w, "height": h})
    (args.output / "metadata.json").write_text(json.dumps(metadata, ensure_ascii=False, indent=2), encoding="utf-8")
    write_contact_sheet(contact_files, args.output / "contact-sheet.png")
    with zipfile.ZipFile(args.output.with_suffix(".zip"), "w", zipfile.ZIP_DEFLATED) as archive:
        for file in args.output.rglob("*"):
            if file.is_file():
                archive.write(file, file.relative_to(args.output.parent))
    print(f"Extracted {len(metadata)} assets to {args.output}")


if __name__ == "__main__":
    main()
