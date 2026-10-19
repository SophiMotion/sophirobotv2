import math
from pathlib import Path
import struct
import tempfile
import unittest

from deliverables.AirlessTireHoneycomb.lib.stl_analyzer import (
    StlAnalysisError,
    analyze_stl,
    analyze_triangles,
    detect_stl_encoding,
)


REFERENCE_1 = Path(r"D:\ProfabX\Company humanoid\tire airless.stl")
REFERENCE_2 = Path(r"D:\ProfabX\Company humanoid\tire airless 2.stl")


def annulus_triangles(cell_count=10, center=(0.0, 0.0, 0.0), width=20.0, axis=2):
    cx, cy, cz = center
    triangles = []
    for index in range(cell_count):
        a0 = 2.0 * math.pi * index / cell_count
        a1 = 2.0 * math.pi * (index + 1) / cell_count
        planar = [
            (72.0 * math.cos(a0), 72.0 * math.sin(a0)),
            (72.0 * math.cos(a1), 72.0 * math.sin(a1)),
            (30.0 * math.cos(a0), 30.0 * math.sin(a0)),
            (30.0 * math.cos(a1), 30.0 * math.sin(a1)),
        ]

        def point(pair, depth):
            values = [pair[0] + cx, pair[1] + cy, depth + cz]
            if axis == 0:
                values = [values[2], values[0], values[1]]
            elif axis == 1:
                values = [values[0], values[2], values[1]]
            return tuple(values)

        front = [point(pair, -width / 2.0) for pair in planar]
        back = [point(pair, width / 2.0) for pair in planar]
        triangles.extend(
            [
                (front[0], front[1], front[2]),
                (front[1], front[3], front[2]),
                (back[0], back[2], back[1]),
                (back[1], back[2], back[3]),
                (front[0], back[0], front[1]),
                (front[1], back[0], back[1]),
                (front[2], front[3], back[2]),
                (front[3], back[3], back[2]),
            ]
        )
    return triangles


def binary_stl(triangles, header=b"binary test"):
    data = bytearray(header.ljust(80, b"\0")[:80])
    data.extend(struct.pack("<I", len(triangles)))
    for triangle in triangles:
        data.extend(struct.pack("<fff", 0.0, 0.0, 1.0))
        for point in triangle:
            data.extend(struct.pack("<fff", *point))
        data.extend(b"\0\0")
    return bytes(data)


def ascii_stl(triangles):
    lines = ["solid annulus"]
    for triangle in triangles:
        lines.extend(["facet normal 0 0 1", "outer loop"])
        lines.extend(f"vertex {x} {y} {z}" for x, y, z in triangle)
        lines.extend(["endloop", "endfacet"])
    lines.append("endsolid annulus")
    return "\n".join(lines).encode("ascii")


class StlParsingTests(unittest.TestCase):
    def write_temp(self, payload):
        handle = tempfile.NamedTemporaryFile(suffix=".stl", delete=False)
        handle.write(payload)
        handle.close()
        self.addCleanup(Path(handle.name).unlink, missing_ok=True)
        return Path(handle.name)

    def test_detects_binary_by_length_even_when_header_starts_with_solid(self):
        path = self.write_temp(binary_stl(annulus_triangles(), b"solid deceptive"))
        self.assertEqual(detect_stl_encoding(path), "binary")
        self.assertEqual(analyze_stl(path).triangle_count, 80)

    def test_parses_ascii_stl(self):
        path = self.write_temp(ascii_stl(annulus_triangles()))
        self.assertEqual(detect_stl_encoding(path), "ascii")
        result = analyze_stl(path)
        self.assertEqual(result.encoding, "ascii")
        self.assertEqual(result.triangle_count, 80)

    def test_rejects_truncated_binary_stl(self):
        payload = binary_stl(annulus_triangles())[:-10]
        path = self.write_temp(payload)
        with self.assertRaises(StlAnalysisError) as caught:
            analyze_stl(path)
        self.assertIn(caught.exception.code, {"malformed_ascii", "unrecognized_stl"})

    def test_rejects_malformed_ascii_stl(self):
        path = self.write_temp(b"solid broken\nfacet normal 0 0 1\nendsolid")
        with self.assertRaises(StlAnalysisError) as caught:
            analyze_stl(path)
        self.assertEqual(caught.exception.code, "malformed_ascii")


class StlMeasurementTests(unittest.TestCase):
    def test_measurement_is_translation_and_axis_invariant(self):
        for axis in (0, 1, 2):
            with self.subTest(axis=axis):
                result = analyze_triangles(
                    annulus_triangles(10, center=(123.0, -45.0, 8.0), axis=axis)
                )
                self.assertAlmostEqual(result.outer_diameter_mm, 144.0, delta=0.2)
                self.assertAlmostEqual(result.opening_diameter_mm, 60.0, delta=0.2)
                self.assertAlmostEqual(result.width_mm, 20.0, delta=0.01)
                self.assertEqual(result.repeat_count, 10)
                self.assertGreaterEqual(result.repeat_confidence, 0.45)

    def test_unit_scale_applies_to_all_dimensions(self):
        result = analyze_triangles(annulus_triangles(), unit_scale=25.4)
        self.assertAlmostEqual(result.outer_diameter_mm, 3657.6, delta=0.2)
        self.assertAlmostEqual(result.opening_diameter_mm, 1524.0, delta=0.2)
        self.assertAlmostEqual(result.width_mm, 508.0, delta=0.01)

    def test_ambiguous_axis_returns_warning(self):
        triangles = [
            ((0, 0, 0), (10, 0, 0), (0, 10, 0)),
            ((0, 0, 10), (10, 0, 10), (0, 10, 10)),
        ]
        result = analyze_triangles(triangles)
        self.assertIn("ambiguous_axis", {warning.code for warning in result.warnings})

    def test_low_confidence_geometry_has_no_repeat_suggestion(self):
        triangles = [
            ((0, 0, 0), (20, 1, 0), (3, 17, 0)),
            ((0, 0, 2), (9, 4, 2), (2, 13, 2)),
        ]
        result = analyze_triangles(triangles)
        self.assertIsNone(result.repeat_count)
        self.assertIn("low_repeat_confidence", {warning.code for warning in result.warnings})

    @unittest.skipUnless(REFERENCE_1.exists(), "first supplied STL is unavailable")
    def test_first_supplied_reference(self):
        result = analyze_stl(REFERENCE_1)
        self.assertEqual(result.triangle_count, 35636)
        self.assertAlmostEqual(result.outer_diameter_mm, 144.0, delta=0.2)
        self.assertAlmostEqual(result.opening_diameter_mm, 60.0, delta=0.2)
        self.assertAlmostEqual(result.width_mm, 20.0, delta=0.01)
        self.assertEqual(result.repeat_count, 10)

    @unittest.skipUnless(REFERENCE_2.exists(), "second supplied STL is unavailable")
    def test_second_supplied_reference(self):
        result = analyze_stl(REFERENCE_2)
        self.assertEqual(result.triangle_count, 113080)
        self.assertAlmostEqual(result.outer_diameter_mm, 144.0, delta=0.2)
        self.assertAlmostEqual(result.opening_diameter_mm, 60.0, delta=0.2)
        self.assertAlmostEqual(result.width_mm, 20.0, delta=0.01)
        self.assertEqual(result.repeat_count, 17)


if __name__ == "__main__":
    unittest.main()
