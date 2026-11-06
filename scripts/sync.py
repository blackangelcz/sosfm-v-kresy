import hashlib
import json
import os
import re
import shutil
import sys
from pathlib import Path

import pymupdf
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent.parent
SOURCE = Path(os.environ.get("VYKRESY_SOURCE") or Path.home() / "Desktop" / "výkresy")
PDF_OUT = ROOT / "public" / "pdf"
SHEET_OUT = ROOT / "public" / "sheets"
HERO_OUT = ROOT / "public" / "hero"
CATALOG = ROOT / "src" / "data" / "catalog.json"

THUMB_WIDTH = 520
FULL_WIDTH = 1900
PAGE_WIDTH = 1400
WALL_SHEET_HEIGHT = 320
WALL_GAP = 16
WALL_SHEETS_PER_ROW = 16

SECTIONS = [
    ("hřídele", "hridele", "Hřídele"),
    ("šrouby", "srouby", "Šrouby"),
    ("Šrouby oboustranné", "srouby-oboustranne", "Šrouby oboustranné"),
    ("čepy", "cepy", "Čepy"),
    ("šachové figurky", "sachove-figurky", "Šachové figurky"),
    ("frézované desky", "frezovane-desky", "Frézované desky"),
    ("upínky", "upinky", "Upínky"),
    ("zvířátka", "zviratka", "Zvířátka"),
    ("svěrák", "sverak", "Svěrák"),
    ("tvarové díly", "tvarove-dily-soustruh", "Tvarové díly soustruh"),
    ("tvarové díly fréza", "tvarove-dily-freza", "Tvarové díly fréza"),
    ("loga", "loga", "Loga"),
]
MATERIALS = ("MATERIÁLY", "materialy", "Učební materiály")
EXCLUDED_PREFIXES = ("MZ 2026",)
NOISE = {"Bod", "X", "Y", "Dráha", "R", "G1", "G2", "G3", "start", "POZ.", "NÁZEV", "KS", "VÝKRES", "POLOTOVAR", "A", "B", "C", "D", "E", "F"}


def slugify(name):
    table = str.maketrans("áčďéěíňóřšťúůýž", "acdeeinorstuuyz")
    return re.sub(r"[^a-z0-9]+", "-", name.lower().translate(table)).strip("-")


def after(lines, label):
    for index, line in enumerate(lines):
        if line.strip() == label and index + 1 < len(lines):
            return lines[index + 1].strip()
    return ""


def inline(text, pattern):
    match = re.search(pattern, text)
    return match.group(1).strip() if match else ""


def technology(blank):
    if blank.startswith("Ø"):
        return "turning"
    if re.match(r"^\d", blank):
        return "milling"
    return "assembly"


def thread_key(value):
    match = re.match(r"M(\d+)", value)
    return (int(match.group(1)) if match else 0, value)


def parse_sheet(page):
    text = page.get_text()
    lines = [line.strip() for line in text.split("\n") if line.strip()]
    title = after(lines, "Odborný výcvik")
    number = inline(text, r"Výkres č\.\s*(\d+)")
    signed = inline(text, r"Z\. JAKOSTI\n([^\n]+)")
    approved = inline(text, r"\d{1,2}\.\d{1,2}\.\d{4}\n([^\n]+)")
    start = lines.index(title) + 1 if title in lines else 0
    notes = [
        line
        for line in lines[start:]
        if line not in NOISE
        and re.search(r"[A-Za-zÀ-ž]|Ø", line)
        and not re.match(r"^\d+\) R", line)
    ]
    threads = sorted(
        {found for line in notes for found in re.findall(r"\bM\d+(?:x\d+(?:,\d+)?)?\b", line)},
        key=thread_key,
    )
    blank = after(lines, "POLOTOVAR:")
    return {
        "title": title,
        "number": int(number) if number else 0,
        "blank": blank,
        "material": after(lines, "MATERIÁL:"),
        "scale": inline(text, r"MĚŘÍTKO:\s*([^\n]+)"),
        "mass": inline(text, r"HMOTNOST:\s*([^\n]+)"),
        "date": inline(text, r"(\d{1,2}\.\d{1,2}\.\d{4})"),
        "designer": signed,
        "approver": approved,
        "format": "A4",
        "technology": technology(blank),
        "threads": threads,
        "notes": sorted(set(notes)),
    }


def render(page, width, target):
    zoom = width / page.rect.width
    pix = page.get_pixmap(matrix=pymupdf.Matrix(zoom, zoom), alpha=False)
    image = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    image.save(target, "WEBP", quality=82, method=4)
    return image


def versioned(url, source):
    return f"{url}?v={int(source.stat().st_mtime)}"


def sheet_number(meta, path, position):
    if meta["number"]:
        return meta["number"]
    digits = re.findall(r"\d+", path.stem)
    return int(digits[-1]) if digits else position


def is_fresh(target, source):
    return target.exists() and target.stat().st_mtime >= source.stat().st_mtime


def copy_pdf(source, slug, used):
    target = PDF_OUT / slug / source.name
    target.parent.mkdir(parents=True, exist_ok=True)
    if not is_fresh(target, source):
        shutil.copy2(source, target)
    used.add(target)
    return versioned(f"/pdf/{slug}/{source.name}", source)


def sheet_images(page, source, slug, stem, used):
    folder = SHEET_OUT / slug
    folder.mkdir(parents=True, exist_ok=True)
    thumb = folder / f"{stem}.webp"
    full = folder / f"{stem}-full.webp"
    if not is_fresh(thumb, source):
        render(page, THUMB_WIDTH, thumb)
    if not is_fresh(full, source):
        render(page, FULL_WIDTH, full)
    used.update({thumb, full})
    return (
        versioned(f"/sheets/{slug}/{stem}.webp", source),
        versioned(f"/sheets/{slug}/{stem}-full.webp", source),
    )


def page_text(document):
    return [re.sub(r"\s+", " ", document[index].get_text()).strip() for index in range(document.page_count)]


def build_section(folder, slug, label, used, problems):
    directory = SOURCE / folder
    pdfs = sorted(directory.glob("*.pdf"))
    bundles = [path for path in pdfs if path.name.startswith("sada_")]
    singles = [path for path in pdfs if not path.name.startswith("sada_")]
    drawings = []
    single_text = []
    for position, path in enumerate(singles, start=1):
        document = pymupdf.open(path)
        if document.page_count != 1:
            problems.append(f"{path.name}: {document.page_count} stran místo 1")
        meta = parse_sheet(document[0])
        if not meta["title"] or not meta["number"]:
            problems.append(f"{path.name}: nečitelná rozpiska")
        meta["title"] = meta["title"] or path.stem
        meta["number"] = sheet_number(meta, path, position)
        thumb, full = sheet_images(document[0], path, slug, path.stem, used)
        single_text.append(page_text(document)[0])
        drawings.append({
            **meta,
            "id": f"{slug}/{meta['number']}",
            "section": slug,
            "file": path.name,
            "pdf": copy_pdf(path, slug, used),
            "size": path.stat().st_size,
            "pages": [{"thumb": thumb, "full": full}],
        })
        document.close()
    drawings.sort(key=lambda item: item["number"])
    seen = set()
    for item in drawings:
        if item["id"] in seen:
            problems.append(f"{item['file']}: číslo výkresu {item['number']} už v sekci {label} je")
            item["id"] = f"{slug}/{slugify(Path(item['file']).stem)}"
        seen.add(item["id"])
    bundle = None
    if len(bundles) != 1:
        problems.append(f"{folder}: {len(bundles)} souhrnných PDF")
    if bundles:
        path = bundles[0]
        document = pymupdf.open(path)
        if sorted(page_text(document)) != sorted(single_text):
            problems.append(f"{path.name}: strany nesedí na jednotlivé výkresy")
        bundle = {
            "file": path.name,
            "pdf": copy_pdf(path, slug, used),
            "size": path.stat().st_size,
            "pages": document.page_count,
        }
        document.close()
    return {"slug": slug, "label": label, "kind": "drawings", "bundle": bundle, "items": drawings}


def year_manual_heading(page):
    spans = [
        (round(span["size"], 1), span["text"].strip())
        for block in page.get_text("dict")["blocks"]
        for line in block.get("lines", [])
        for span in line["spans"]
        if span["text"].strip()
    ]
    for index, (_, text) in enumerate(spans):
        if re.fullmatch(r"\d\. ročník", text) and index + 1 < len(spans):
            size = spans[index + 1][0]
            heading = []
            for span_size, span_text in spans[index + 1:]:
                if span_size != size:
                    break
                heading.append(span_text)
            return text, " ".join(heading)
    return None


def build_materials(used, problems):
    folder, slug, label = MATERIALS
    items = []
    for path in sorted((SOURCE / folder).glob("*.pdf")):
        document = pymupdf.open(path)
        lines = [line.strip() for line in document[0].get_text().split("\n") if line.strip()]
        title = lines[1] if len(lines) > 1 else path.stem
        subtitle = " ".join(lines[2:4]) if len(lines) > 3 else ""
        year_manual = year_manual_heading(document[0])
        if year_manual:
            title, subtitle = year_manual
        words = set()
        pages = []
        target_dir = SHEET_OUT / slug
        target_dir.mkdir(parents=True, exist_ok=True)
        for index in range(document.page_count):
            page = document[index]
            words.update(re.findall(r"[A-Za-zÀ-ž0-9]{3,}", page.get_text()))
            thumb = target_dir / f"{path.stem}-{index + 1:02d}.webp"
            full = target_dir / f"{path.stem}-{index + 1:02d}-full.webp"
            if not is_fresh(thumb, path):
                render(page, THUMB_WIDTH, thumb)
            if not is_fresh(full, path):
                render(page, PAGE_WIDTH, full)
            used.update({thumb, full})
            pages.append({
                "thumb": versioned(f"/sheets/{slug}/{thumb.name}", path),
                "full": versioned(f"/sheets/{slug}/{full.name}", path),
            })
        items.append({
            "id": f"{slug}/{slugify(path.stem)}",
            "section": slug,
            "title": title,
            "subtitle": subtitle,
            "number": len(items) + 1,
            "file": path.name,
            "pdf": copy_pdf(path, slug, used),
            "size": path.stat().st_size,
            "pages": pages,
            "technology": "material",
            "threads": [],
            "notes": sorted(words),
        })
        document.close()
    if not items:
        problems.append(f"{folder}: žádné materiály")
    return {"slug": slug, "label": label, "kind": "materials", "bundle": None, "items": items}


def blueprint(path):
    image = Image.open(path).convert("L")
    width = round(image.width * WALL_SHEET_HEIGHT / image.height)
    image = image.resize((width, WALL_SHEET_HEIGHT), Image.LANCZOS)
    return ImageOps.colorize(image, black="#dcedfb", white="#0067ac")


def build_wall(sections, used):
    HERO_OUT.mkdir(parents=True, exist_ok=True)
    groups = [section["items"] for section in sections if section["kind"] == "drawings"]
    picked = []
    depth = 0
    while len(picked) < WALL_SHEETS_PER_ROW * 2 and any(depth < len(group) for group in groups):
        picked += [group[depth] for group in groups if depth < len(group)]
        depth += 1
    picked = picked[: WALL_SHEETS_PER_ROW * 2]
    rows = [picked[0::2], picked[1::2]]
    walls = []
    for index, row in enumerate(rows, start=1):
        sheets = [blueprint(ROOT / "public" / item["pages"][0]["thumb"].split("?")[0].lstrip("/")) for item in row]
        width = sum(sheet.width + WALL_GAP for sheet in sheets)
        canvas = Image.new("RGB", (width, WALL_SHEET_HEIGHT), "#0067ac")
        x = 0
        for sheet in sheets:
            canvas.paste(sheet, (x, 0))
            x += sheet.width + WALL_GAP
        target = HERO_OUT / f"wall-{index}.webp"
        canvas.save(target, "WEBP", quality=72, method=6)
        used.add(target)
        walls.append(f"/hero/{target.name}?v={hashlib.md5(target.read_bytes()).hexdigest()[:10]}")
    return walls


def prune(folder, used):
    if not folder.exists():
        return
    for path in folder.rglob("*"):
        if path.is_file() and path not in used:
            path.unlink()
    for path in sorted(folder.rglob("*"), key=lambda entry: len(entry.parts), reverse=True):
        if path.is_dir() and not any(path.iterdir()):
            path.rmdir()


def main():
    if not SOURCE.exists():
        sys.exit(f"Složka {SOURCE} neexistuje")
    used = set()
    problems = []
    known = {entry[0] for entry in SECTIONS} | {MATERIALS[0]}
    entries = [entry for entry in SECTIONS if (SOURCE / entry[0]).is_dir()]
    for directory in sorted(SOURCE.iterdir(), key=lambda path: path.name.lower()):
        if directory.name.startswith(EXCLUDED_PREFIXES):
            continue
        if directory.is_dir() and directory.name not in known and any(directory.glob("*.pdf")):
            entries.append((directory.name, slugify(directory.name), directory.name[:1].upper() + directory.name[1:]))
    sections = [build_section(*entry, used, problems) for entry in entries]
    if (SOURCE / MATERIALS[0]).is_dir():
        sections.append(build_materials(used, problems))
    walls = build_wall(sections, used)
    for folder in (PDF_OUT, SHEET_OUT, HERO_OUT):
        prune(folder, used)
    CATALOG.parent.mkdir(parents=True, exist_ok=True)
    CATALOG.write_text(json.dumps({"sections": sections, "walls": walls}, ensure_ascii=False, indent=1), encoding="utf-8")
    copied = [path for path in used if path.suffix == ".pdf"]
    source_pdfs = [path for path in SOURCE.rglob("*.pdf") if not path.relative_to(SOURCE).parts[0].startswith(EXCLUDED_PREFIXES)]
    print(f"PDF ve zdroji: {len(source_pdfs)}, propojeno: {len(copied)}")
    for section in sections:
        bundle = section["bundle"]
        extra = f" + sada {bundle['pages']} stran" if bundle else ""
        print(f"  {section['label']}: {len(section['items'])}{extra}")
    if len(source_pdfs) != len(copied):
        names = {path.name for path in copied}
        problems.append(f"nepropojené PDF: {[path.name for path in source_pdfs if path.name not in names]}")
    if problems:
        print("PROBLÉMY:")
        for problem in problems:
            print(f"  {problem}")
        sys.exit(3)
    print("Bez problémů.")


if __name__ == "__main__":
    main()
