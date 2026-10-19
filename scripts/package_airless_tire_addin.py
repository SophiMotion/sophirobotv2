"""Create a deterministic installable ZIP for Airless Tire Honeycomb."""

from __future__ import annotations

from pathlib import Path
import zipfile


EXCLUDED_PARTS = {"__pycache__", ".pytest_cache", ".git"}
EXCLUDED_SUFFIXES = {".pyc", ".pyo", ".stl"}
FIXED_TIMESTAMP = (2026, 1, 1, 0, 0, 0)


def _included(path: Path) -> bool:
    if any(part in EXCLUDED_PARTS for part in path.parts):
        return False
    if path.suffix.lower() in EXCLUDED_SUFFIXES:
        return False
    return not path.name.lower().startswith("test")


def create_archive(source: str | Path, output: str | Path) -> Path:
    source_path = Path(source).resolve()
    output_path = Path(output).resolve()
    if not source_path.is_dir():
        raise FileNotFoundError(f"Add-in source directory not found: {source_path}")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    files = sorted(
        path for path in source_path.rglob("*") if path.is_file() and _included(path)
    )
    with zipfile.ZipFile(output_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        for path in files:
            relative = path.relative_to(source_path)
            archive_name = (Path(source_path.name) / relative).as_posix()
            info = zipfile.ZipInfo(archive_name, FIXED_TIMESTAMP)
            info.compress_type = zipfile.ZIP_DEFLATED
            info.external_attr = 0o100644 << 16
            archive.writestr(info, path.read_bytes(), compress_type=zipfile.ZIP_DEFLATED, compresslevel=9)
    return output_path


def main() -> None:
    root = Path(__file__).resolve().parents[1]
    source = root / "deliverables" / "AirlessTireHoneycomb"
    output = root / "deliverables" / "AirlessTireHoneycomb.zip"
    created = create_archive(source, output)
    print(created)


if __name__ == "__main__":
    main()

