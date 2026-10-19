import unittest

from deliverables.AirlessTireHoneycomb.lib.fusion_builder import (
    ATTRIBUTE_GROUP,
    BuildError,
    GeneratedTarget,
    build_recipe,
    cleanup_owned_preview,
    find_generated_targets,
    generate_tire,
    update_tire,
)
from deliverables.AirlessTireHoneycomb.lib.parameters import TireParameters


class FakeAttribute:
    def __init__(self, value):
        self.value = value


class FakeAttributes:
    def __init__(self):
        self.values = {}

    def add(self, group, key, value):
        self.values[(group, key)] = str(value)
        return FakeAttribute(str(value))

    def itemByName(self, group, key):
        value = self.values.get((group, key))
        return FakeAttribute(value) if value is not None else None


class FakeComponent:
    def __init__(self, name="Component"):
        self.name = name
        self.attributes = FakeAttributes()
        self.geometry = None
        self.parameter_expressions = {}


class FakeDesign:
    def __init__(self, components=()):
        self.allComponents = list(components)
        self.user_parameter_expressions = {}


class MemoryWriter:
    def __init__(self, design, fail_build=False):
        self.design = design
        self.fail_build = fail_build

    def create_component(self, name):
        component = FakeComponent(name)
        self.design.allComponents.append(component)
        return component

    def write_parameters(self, component, expressions):
        previous = dict(self.design.user_parameter_expressions)
        self.design.user_parameter_expressions = dict(expressions)
        component.parameter_expressions = dict(expressions)
        return previous

    def restore_parameters(self, previous):
        self.design.user_parameter_expressions = dict(previous)

    def build_geometry(self, component, recipe):
        if self.fail_build:
            raise RuntimeError("extrusion failed")
        component.geometry = {
            "body_count": 1,
            "rim": (recipe.rim_inner_radius_mm, recipe.rim_outer_radius_mm),
            "tread": (recipe.tread_inner_radius_mm, recipe.outer_radius_mm),
            "rib_profiles": len(recipe.layout.polygons),
            "pattern_count": recipe.pattern_count,
            "pattern_angle_deg": 360.0,
        }

    def mark_component(self, component, identifier, state):
        component.attributes.add(ATTRIBUTE_GROUP, "schemaVersion", "1")
        component.attributes.add(ATTRIBUTE_GROUP, "identifier", identifier)
        component.attributes.add(ATTRIBUTE_GROUP, "state", state)

    def replace_component(self, old_component, new_component):
        self.design.allComponents.remove(old_component)
        new_component.name = "Airless Tire Honeycomb"

    def delete_component(self, component):
        if component in self.design.allComponents:
            self.design.allComponents.remove(component)


class FusionBuilderTests(unittest.TestCase):
    def test_recipe_has_seven_parameters_and_native_pattern_contract(self):
        recipe = build_recipe(TireParameters())
        self.assertEqual(
            recipe.parameter_expressions,
            {
                "ATH_outerDiameter": "144 mm",
                "ATH_rimDiameter": "60 mm",
                "ATH_tireWidth": "20 mm",
                "ATH_treadThickness": "4 mm",
                "ATH_cellCount": "10",
                "ATH_wallThickness": "2 mm",
                "ATH_honeycombAngle": "30 deg",
            },
        )
        self.assertEqual(recipe.pattern_count, 10)
        self.assertEqual(recipe.rim_inner_radius_mm, 30.0)
        self.assertEqual(recipe.rim_outer_radius_mm, 34.0)
        self.assertEqual(recipe.tread_inner_radius_mm, 68.0)
        self.assertEqual(recipe.outer_radius_mm, 72.0)
        self.assertTrue(recipe.layout.polygons)

    def test_finds_only_supported_final_generated_components(self):
        valid = FakeComponent("Airless Tire Honeycomb")
        valid.attributes.add(ATTRIBUTE_GROUP, "schemaVersion", "1")
        valid.attributes.add(ATTRIBUTE_GROUP, "identifier", "abc")
        valid.attributes.add(ATTRIBUTE_GROUP, "state", "final")
        preview = FakeComponent("Preview")
        preview.attributes.add(ATTRIBUTE_GROUP, "schemaVersion", "1")
        preview.attributes.add(ATTRIBUTE_GROUP, "identifier", "preview")
        preview.attributes.add(ATTRIBUTE_GROUP, "state", "preview")
        unsupported = FakeComponent("Old")
        unsupported.attributes.add(ATTRIBUTE_GROUP, "schemaVersion", "0")
        unrelated = FakeComponent("Unrelated")
        design = FakeDesign((valid, preview, unsupported, unrelated))
        targets = find_generated_targets(design)
        self.assertEqual(len(targets), 1)
        self.assertIs(targets[0].component, valid)
        self.assertEqual(targets[0].identifier, "abc")

    def test_generate_creates_one_owned_joined_result(self):
        design = FakeDesign()
        writer = MemoryWriter(design)
        target = generate_tire(design, TireParameters(), writer=writer)
        self.assertEqual(target.component.name, "Airless Tire Honeycomb")
        self.assertEqual(target.component.geometry["body_count"], 1)
        self.assertEqual(target.component.geometry["pattern_count"], 10)
        self.assertEqual(target.component.geometry["pattern_angle_deg"], 360.0)
        self.assertEqual(len(target.component.parameter_expressions), 7)
        self.assertEqual(find_generated_targets(design), (target,))

    def test_generate_refuses_second_final_component(self):
        design = FakeDesign()
        writer = MemoryWriter(design)
        generate_tire(design, TireParameters(), writer=writer)
        with self.assertRaises(BuildError) as caught:
            generate_tire(design, TireParameters(), writer=writer)
        self.assertEqual(caught.exception.code, "target_exists")

    def test_failed_generate_removes_partial_component(self):
        design = FakeDesign()
        writer = MemoryWriter(design, fail_build=True)
        with self.assertRaisesRegex(RuntimeError, "extrusion failed"):
            generate_tire(design, TireParameters(), writer=writer)
        self.assertEqual(design.allComponents, [])

    def test_update_replaces_target_only_after_staging_succeeds(self):
        design = FakeDesign()
        writer = MemoryWriter(design)
        original = generate_tire(design, TireParameters(), writer=writer)
        updated = update_tire(
            original,
            TireParameters(cell_count=17, wall_thickness_mm=1.5),
            writer=writer,
        )
        self.assertNotIn(original.component, design.allComponents)
        self.assertIn(updated.component, design.allComponents)
        self.assertEqual(updated.identifier, original.identifier)
        self.assertEqual(updated.component.geometry["pattern_count"], 17)

    def test_failed_update_preserves_old_target_and_parameters(self):
        design = FakeDesign()
        good_writer = MemoryWriter(design)
        original = generate_tire(design, TireParameters(), writer=good_writer)
        previous_parameters = dict(design.user_parameter_expressions)
        bad_writer = MemoryWriter(design, fail_build=True)
        with self.assertRaisesRegex(RuntimeError, "extrusion failed"):
            update_tire(original, TireParameters(cell_count=17), writer=bad_writer)
        self.assertIn(original.component, design.allComponents)
        self.assertEqual(design.user_parameter_expressions, previous_parameters)
        self.assertEqual(find_generated_targets(design), (original,))

    def test_cleanup_removes_only_owned_previews(self):
        final = FakeComponent("Final")
        final.attributes.add(ATTRIBUTE_GROUP, "schemaVersion", "1")
        final.attributes.add(ATTRIBUTE_GROUP, "identifier", "final")
        final.attributes.add(ATTRIBUTE_GROUP, "state", "final")
        preview = FakeComponent("Preview")
        preview.attributes.add(ATTRIBUTE_GROUP, "schemaVersion", "1")
        preview.attributes.add(ATTRIBUTE_GROUP, "identifier", "preview")
        preview.attributes.add(ATTRIBUTE_GROUP, "state", "preview")
        unrelated = FakeComponent("Unrelated")
        design = FakeDesign((final, preview, unrelated))
        writer = MemoryWriter(design)
        cleanup_owned_preview(design, writer=writer)
        self.assertEqual(design.allComponents, [final, unrelated])

    def test_generated_target_equality_uses_design_component_and_identifier(self):
        design = FakeDesign()
        component = FakeComponent()
        self.assertEqual(
            GeneratedTarget(design, component, "id"),
            GeneratedTarget(design, component, "id"),
        )


if __name__ == "__main__":
    unittest.main()
