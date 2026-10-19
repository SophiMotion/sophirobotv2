import unittest

from deliverables.AirlessTireHoneycomb.commands.airless_tire.entry import (
    CommandError,
    analyze_reference,
    analysis_summary,
    apply_analysis,
    execute_model_operation,
    initial_values,
    parameters_from_mapping,
    resolve_update_target,
    run_preview_operation,
    validate_mapping,
)
from deliverables.AirlessTireHoneycomb.lib.fusion_builder import GeneratedTarget
from deliverables.AirlessTireHoneycomb.lib.parameters import TireParameters
from deliverables.AirlessTireHoneycomb.lib.stl_analyzer import AnalysisWarning, StlAnalysis


class FakeComponent:
    pass


class CommandControllerTests(unittest.TestCase):
    def test_initial_values_round_trip_to_default_parameters(self):
        values = initial_values()
        self.assertEqual(parameters_from_mapping(values), TireParameters())
        self.assertEqual(validate_mapping(values), ())

    def test_invalid_mapping_returns_inline_validation_issues(self):
        values = initial_values()
        values["rim_diameter_mm"] = 200.0
        self.assertIn("rim_not_smaller", {issue.code for issue in validate_mapping(values)})

    def test_high_confidence_analysis_populates_dimensions_and_cell_count(self):
        values = initial_values()
        analysis = StlAnalysis(
            encoding="binary",
            triangle_count=113080,
            thin_axis=2,
            outer_diameter_mm=144.0,
            opening_diameter_mm=60.0,
            width_mm=20.0,
            repeat_count=17,
            repeat_confidence=0.56,
            warnings=(),
        )
        updated = apply_analysis(values, analysis)
        self.assertEqual(updated["outer_diameter_mm"], 144.0)
        self.assertEqual(updated["rim_diameter_mm"], 60.0)
        self.assertEqual(updated["width_mm"], 20.0)
        self.assertEqual(updated["cell_count"], 17)
        self.assertEqual(values["cell_count"], 10)

    def test_low_confidence_analysis_keeps_manual_cell_count(self):
        values = initial_values()
        values["cell_count"] = 12
        analysis = StlAnalysis(
            encoding="ascii",
            triangle_count=2,
            thin_axis=2,
            outer_diameter_mm=100.0,
            opening_diameter_mm=40.0,
            width_mm=15.0,
            repeat_count=None,
            repeat_confidence=0.2,
            warnings=(AnalysisWarning("low_repeat_confidence", "Enter manually."),),
        )
        self.assertEqual(apply_analysis(values, analysis)["cell_count"], 12)

    def test_unit_change_reanalyzes_original_path_without_cumulative_scaling(self):
        calls = []

        def analyzer(path, unit_name):
            calls.append((path, unit_name))
            scale = 25.4 if unit_name == "Inch" else 1.0
            return StlAnalysis(
                encoding="binary",
                triangle_count=1,
                thin_axis=2,
                outer_diameter_mm=144.0 * scale,
                opening_diameter_mm=60.0 * scale,
                width_mm=20.0 * scale,
                repeat_count=10,
                repeat_confidence=1.0,
                warnings=(),
            )

        first = analyze_reference(initial_values(), "source.stl", "Inch", analyzer)
        second = analyze_reference(first[0], "source.stl", "Millimeter", analyzer)
        self.assertEqual(calls, [("source.stl", "Inch"), ("source.stl", "Millimeter")])
        self.assertEqual(first[0]["outer_diameter_mm"], 3657.6)
        self.assertEqual(second[0]["outer_diameter_mm"], 144.0)

    def test_analysis_summary_reports_units_dimensions_repeat_and_warning(self):
        analysis = StlAnalysis(
            encoding="binary",
            triangle_count=80,
            thin_axis=1,
            outer_diameter_mm=144.0,
            opening_diameter_mm=60.0,
            width_mm=20.0,
            repeat_count=10,
            repeat_confidence=0.75,
            warnings=(AnalysisWarning("notice", "Verify the result."),),
        )
        summary = analysis_summary(analysis, "Millimeter")
        self.assertIn("80 triangles", summary)
        self.assertIn("144 mm OD", summary)
        self.assertIn("60 mm opening", summary)
        self.assertIn("20 mm wide", summary)
        self.assertIn("10 sectors", summary)
        self.assertIn("Verify the result.", summary)

    def test_resolve_update_target_requires_selection_when_multiple_exist(self):
        design = object()
        targets = (
            GeneratedTarget(design, FakeComponent(), "one"),
            GeneratedTarget(design, FakeComponent(), "two"),
        )
        with self.assertRaises(CommandError) as caught:
            resolve_update_target(targets)
        self.assertEqual(caught.exception.code, "update_target_ambiguous")
        self.assertEqual(resolve_update_target(targets, "two"), targets[1])

    def test_execute_routes_generate_and_update_with_current_parameters(self):
        design = object()
        params = TireParameters(cell_count=17)
        generated = object()
        calls = []

        def generate(design_arg, params_arg, preview=False):
            calls.append(("generate", design_arg, params_arg, preview))
            return generated

        result = execute_model_operation(
            design,
            params,
            "generate",
            (),
            preview=True,
            generate_fn=generate,
        )
        self.assertIs(result, generated)
        self.assertEqual(calls, [("generate", design, params, True)])

        target = GeneratedTarget(design, FakeComponent(), "target")
        updated = object()

        def update(target_arg, params_arg, preview=False):
            calls.append(("update", target_arg, params_arg, preview))
            return updated

        result = execute_model_operation(
            design,
            params,
            "update",
            (target,),
            target_identifier="target",
            update_fn=update,
        )
        self.assertIs(result, updated)
        self.assertEqual(calls[-1], ("update", target, params, False))

    def test_execute_rejects_unknown_operation(self):
        with self.assertRaises(CommandError) as caught:
            execute_model_operation(object(), TireParameters(), "erase", ())
        self.assertEqual(caught.exception.code, "operation_unknown")

    def test_preview_failure_cleans_before_and_after_action(self):
        design = object()
        events = []

        def cleanup(design_arg):
            events.append(("cleanup", design_arg))

        def action():
            events.append(("action", design))
            raise RuntimeError("preview failed")

        with self.assertRaisesRegex(RuntimeError, "preview failed"):
            run_preview_operation(design, action, cleanup_fn=cleanup)
        self.assertEqual(
            events,
            [("cleanup", design), ("action", design), ("cleanup", design)],
        )


if __name__ == "__main__":
    unittest.main()
