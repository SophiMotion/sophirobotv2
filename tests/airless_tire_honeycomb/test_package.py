import hashlib
from pathlib import Path
import tempfile
import unittest
import zipfile

from scripts.package_airless_tire_addin import create_archive


ROOT = Path(__file__).resolve().parents[2]
SOURCE = ROOT / "deliverables" / "AirlessTireHoneycomb"


class PackageTests(unittest.TestCase):
    def test_archive_contains_installable_addin_and_excludes_development_files(self):
        with tempfile.TemporaryDirectory() as directory:
            output = Path(directory) / "AirlessTireHoneycomb.zip"
            create_archive(SOURCE, output)
            with zipfile.ZipFile(output) as archive:
                members = archive.namelist()
            required = {
                "AirlessTireHoneycomb/AirlessTireHoneycomb.py",
                "AirlessTireHoneycomb/AirlessTireHoneycomb.manifest",
                "AirlessTireHoneycomb/README.md",
                "AirlessTireHoneycomb/__init__.py",
                "AirlessTireHoneycomb/commands/__init__.py",
                "AirlessTireHoneycomb/commands/airless_tire/__init__.py",
                "AirlessTireHoneycomb/commands/airless_tire/entry.py",
                "AirlessTireHoneycomb/lib/__init__.py",
                "AirlessTireHoneycomb/lib/parameters.py",
                "AirlessTireHoneycomb/lib/stl_analyzer.py",
                "AirlessTireHoneycomb/lib/honeycomb_layout.py",
                "AirlessTireHoneycomb/lib/fusion_builder.py",
            }
            self.assertTrue(required.issubset(members))
            self.assertEqual(len(members), len(set(members)))
            self.assertFalse(any("__pycache__" in name for name in members))
            self.assertFalse(any(name.endswith(".pyc") for name in members))
            self.assertFalse(any("test" in Path(name).name.lower() for name in members))
            self.assertFalse(any(name.lower().endswith(".stl") for name in members))

    def test_archive_is_byte_for_byte_deterministic(self):
        with tempfile.TemporaryDirectory() as directory:
            first = Path(directory) / "first.zip"
            second = Path(directory) / "second.zip"
            create_archive(SOURCE, first)
            create_archive(SOURCE, second)
            first_hash = hashlib.sha256(first.read_bytes()).hexdigest()
            second_hash = hashlib.sha256(second.read_bytes()).hexdigest()
            self.assertEqual(first_hash, second_hash)


if __name__ == "__main__":
    unittest.main()
