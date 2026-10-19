import unittest

from deliverables.AirlessTireHoneycomb.lib.parameters import (
    TireParameters,
    default_parameters,
    derive_geometry,
    scale_from_stl_unit,
    validate_parameters,
)


class ParameterTests(unittest.TestCase):
    def test_defaults_derive_reference_dimensions(self):
        params = default_parameters()
        self.assertEqual(
            params,
            TireParameters(
                outer_diameter_mm=144.0,
                rim_diameter_mm=60.0,
                width_mm=20.0,
                tread_thickness_mm=4.0,
                cell_count=10,
                wall_thickness_mm=2.0,
                honeycomb_angle_deg=30.0,
            ),
        )
        geometry = derive_geometry(params)
        self.assertEqual(geometry.outer_radius_mm, 72.0)
        self.assertEqual(geometry.rim_radius_mm, 30.0)
        self.assertEqual(geometry.tread_inner_radius_mm, 68.0)
        self.assertEqual(geometry.rim_band_thickness_mm, 4.0)
        self.assertEqual(geometry.web_inner_radius_mm, 34.0)
        self.assertEqual(geometry.web_outer_radius_mm, 68.0)
        self.assertEqual(geometry.web_span_mm, 34.0)

    def test_rim_band_grows_with_wall_thickness(self):
        params = TireParameters(wall_thickness_mm=3.0)
        self.assertEqual(derive_geometry(params).rim_band_thickness_mm, 6.0)

    def test_valid_defaults_have_no_issues(self):
        self.assertEqual(validate_parameters(default_parameters()), ())

    def test_invalid_parameter_combinations_report_stable_codes(self):
        cases = (
            (TireParameters(outer_diameter_mm=0), "nonpositive_length"),
            (TireParameters(rim_diameter_mm=144), "rim_not_smaller"),
            (TireParameters(tread_thickness_mm=38), "empty_web"),
            (TireParameters(cell_count=5), "cell_count_range"),
            (TireParameters(cell_count=10.5), "cell_count_integer"),
            (TireParameters(honeycomb_angle_deg=9), "angle_range"),
            (TireParameters(honeycomb_angle_deg=81), "angle_range"),
            (TireParameters(wall_thickness_mm=0.009), "below_tolerance"),
            (TireParameters(width_mm=0.009), "below_tolerance"),
            (TireParameters(cell_count=60, wall_thickness_mm=10), "wall_too_thick"),
        )
        for params, expected_code in cases:
            with self.subTest(expected_code=expected_code, params=params):
                codes = {issue.code for issue in validate_parameters(params)}
                self.assertIn(expected_code, codes)

    def test_stl_unit_scales_are_explicit(self):
        expected = {
            "Millimeter": 1.0,
            "Centimeter": 10.0,
            "Meter": 1000.0,
            "Inch": 25.4,
            "Foot": 304.8,
        }
        for name, scale in expected.items():
            with self.subTest(name=name):
                self.assertEqual(scale_from_stl_unit(name), scale)

    def test_unknown_stl_unit_is_rejected(self):
        with self.assertRaisesRegex(ValueError, "Unsupported STL unit"):
            scale_from_stl_unit("Parsec")


if __name__ == "__main__":
    unittest.main()
