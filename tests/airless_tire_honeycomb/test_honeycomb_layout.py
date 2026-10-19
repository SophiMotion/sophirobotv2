import math
import unittest

from deliverables.AirlessTireHoneycomb.lib.honeycomb_layout import (
    LayoutError,
    Point2D,
    Segment2D,
    calculate_layout,
    thicken_segment,
)
from deliverables.AirlessTireHoneycomb.lib.parameters import TireParameters, derive_geometry


def radius(point):
    return math.hypot(point.x, point.y)


def polygon_area(points):
    return 0.5 * sum(
        first.x * second.y - second.x * first.y
        for first, second in zip(points, points[1:] + points[:1])
    )


class HoneycombLayoutTests(unittest.TestCase):
    def test_default_layout_spans_one_sector_and_joins_both_rings(self):
        params = TireParameters()
        geometry = derive_geometry(params)
        layout = calculate_layout(params)
        self.assertGreaterEqual(layout.row_count, 2)
        self.assertAlmostEqual(layout.sector_angle_rad, 2 * math.pi / 10)
        endpoint_radii = [radius(point) for segment in layout.segments for point in (segment.start, segment.end)]
        self.assertAlmostEqual(min(endpoint_radii), geometry.web_inner_radius_mm)
        self.assertAlmostEqual(max(endpoint_radii), geometry.web_outer_radius_mm)
        self.assertTrue(layout.segments)

    def test_rows_alternate_between_sector_boundaries_and_center(self):
        layout = calculate_layout(TireParameters())
        half = layout.sector_angle_rad / 2.0
        first_two = layout.segments[:2]
        self.assertAlmostEqual(math.atan2(first_two[0].start.y, first_two[0].start.x), -half)
        self.assertAlmostEqual(math.atan2(first_two[1].start.y, first_two[1].start.x), half)
        self.assertAlmostEqual(math.atan2(first_two[0].end.y, first_two[0].end.x), 0.0)
        next_two = layout.segments[2:4]
        self.assertAlmostEqual(math.atan2(next_two[0].start.y, next_two[0].start.x), 0.0)
        self.assertAlmostEqual(math.atan2(next_two[0].end.y, next_two[0].end.x), -half)
        self.assertAlmostEqual(math.atan2(next_two[1].end.y, next_two[1].end.x), half)

    def test_segments_are_unique_and_nonzero(self):
        layout = calculate_layout(TireParameters())
        keys = set()
        for segment in layout.segments:
            self.assertGreater(segment.length, 0.01)
            endpoints = sorted(
                ((round(segment.start.x, 6), round(segment.start.y, 6)),
                 (round(segment.end.x, 6), round(segment.end.y, 6)))
            )
            key = tuple(endpoints)
            self.assertNotIn(key, keys)
            keys.add(key)

    def test_thickened_segment_is_positive_consistently_wound_quad(self):
        polygon = thicken_segment(
            Segment2D(Point2D(2.0, 3.0), Point2D(9.0, 7.0)),
            2.0,
        )
        self.assertEqual(len(polygon.points), 4)
        self.assertGreater(polygon_area(list(polygon.points)), 0.0)
        self.assertAlmostEqual(polygon.area, 2.0 * math.hypot(7.0, 4.0), places=6)

    def test_representative_parameters_make_valid_profiles(self):
        for cell_count in (6, 10, 17, 36):
            for angle in (10.0, 30.0, 80.0):
                with self.subTest(cell_count=cell_count, angle=angle):
                    layout = calculate_layout(
                        TireParameters(cell_count=cell_count, honeycomb_angle_deg=angle)
                    )
                    self.assertGreaterEqual(layout.row_count, 2)
                    self.assertEqual(len(layout.polygons), len(layout.segments))
                    self.assertTrue(all(polygon.area > 0.01 for polygon in layout.polygons))

    def test_angle_changes_automatic_row_density(self):
        shallow = calculate_layout(TireParameters(honeycomb_angle_deg=10.0))
        steep = calculate_layout(TireParameters(honeycomb_angle_deg=80.0))
        self.assertGreater(shallow.row_count, steep.row_count)

    def test_invalid_near_tolerance_geometry_is_rejected_before_layout(self):
        with self.assertRaises(LayoutError) as caught:
            calculate_layout(TireParameters(wall_thickness_mm=0.009))
        self.assertEqual(caught.exception.code, "invalid_parameters")


if __name__ == "__main__":
    unittest.main()
