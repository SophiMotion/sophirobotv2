# Airless Tire Honeycomb Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an installable Fusion 360 Python add-in named Airless Tire Honeycomb that analyzes STL references and generates or updates a native parametric honeycomb tire.

**Architecture:** Keep STL parsing, parameter validation, and polar honeycomb layout independent of Fusion so they can be tested with standard Python. A thin Fusion adapter owns command events, user parameters, sketches, extrusions, circular patterns, generated-component attributes, preview cleanup, and update transactions.

**Tech Stack:** Python 3 standard library, Autodesk Fusion 360 `adsk.core` and `adsk.fusion` APIs, `unittest`, Fusion add-in manifest, and standard-library ZIP packaging.

**Spec:** `docs/superpowers/specs/2026-10-08-airless-tire-honeycomb-design.md`

## Global Constraints

- The command, add-in, and generated component are named **Airless Tire Honeycomb**.
- Use only the Python standard library outside Fusion; do not add runtime packages.
- Analyze binary and ASCII STL without inserting a mesh body into the active document.
- Treat STL units as millimetres by default and let the user select a different unit scale.
- Expose exactly the seven namespaced user parameters specified in the design.
- Generate one joined BRep body from native sketches, extrusions, and circular patterns.
- Update only components carrying the add-in's versioned ownership attribute.
- A failed, cancelled, or superseded operation must leave no partial final geometry.
- Do not modify the existing `public/fusion/SophiRobotExport` implementation.

## Review Focus

- A binary STL whose 80-byte header begins with `solid` must still be detected as binary when its byte length matches its triangle count; Task 2 pins this behavior.
- STL coordinates with a large translation from the origin must produce the same dimensions and repeat suggestion as centered geometry; Task 2 pins translation invariance.
- Parameter combinations near Fusion's tolerance must fail validation instead of creating sliver profiles; Task 1 pins the 0.01 mm minimum feature threshold.
- Multiple generated components must make Update require an explicit target instead of editing an arbitrary one; Task 4 pins target selection.
- A preview exception or command cancellation must invoke owned-preview cleanup without deleting a previously generated component; Task 5 pins lifecycle cleanup.

---

## File Map

- `deliverables/AirlessTireHoneycomb/AirlessTireHoneycomb.py`: add-in `run` and `stop` entry points.
- `deliverables/AirlessTireHoneycomb/AirlessTireHoneycomb.manifest`: Fusion metadata.
- `deliverables/AirlessTireHoneycomb/__init__.py`: package marker.
- `deliverables/AirlessTireHoneycomb/commands/airless_tire/entry.py`: toolbar command, dialog inputs, event handlers, preview, execute, and cleanup.
- `deliverables/AirlessTireHoneycomb/lib/parameters.py`: immutable parameter schema, defaults, unit conversion, derived radii, and validation.
- `deliverables/AirlessTireHoneycomb/lib/stl_analyzer.py`: binary/ASCII parser, axis inference, radial measurements, and repeat estimation.
- `deliverables/AirlessTireHoneycomb/lib/honeycomb_layout.py`: Fusion-independent polar rib layout and thickened rib polygons.
- `deliverables/AirlessTireHoneycomb/lib/fusion_builder.py`: Fusion user parameters, sketches, features, ownership attributes, generate/update, and rollback-safe cleanup.
- `deliverables/AirlessTireHoneycomb/README.md`: installation, controls, STL unit warning, workflow, and limitations.
- `tests/airless_tire_honeycomb/`: host-independent unit tests and Fusion stubs.
- `scripts/package_airless_tire_addin.py`: deterministic creation of `deliverables/AirlessTireHoneycomb.zip`.

### Task 1: Parameter Contract and Validation

**Files:**
- Create: `deliverables/AirlessTireHoneycomb/__init__.py`
- Create: `deliverables/AirlessTireHoneycomb/lib/__init__.py`
- Create: `deliverables/AirlessTireHoneycomb/lib/parameters.py`
- Create: `tests/airless_tire_honeycomb/__init__.py`
- Create: `tests/airless_tire_honeycomb/test_parameters.py`

**Interfaces:**
- Consumes: no project interface.
- Produces: `TireParameters`, `DerivedGeometry`, `ValidationIssue`, `default_parameters()`, `derive_geometry(params)`, `validate_parameters(params)`, and `scale_from_stl_unit(unit_name)`.

- [ ] **Step 1: Write failing default and derivation tests**

  Assert defaults of 144 mm outer diameter, 60 mm rim diameter, 20 mm width, 4 mm tread, 10 cells, 2 mm wall, and 30 degrees; assert outer radius 72 mm, rim radius 30 mm, tread inner radius 68 mm, derived rim band `max(4 mm, 2 * wall)`, and a positive web span.

- [ ] **Step 2: Run the focused tests and verify failure**

  Run: `python -m unittest tests.airless_tire_honeycomb.test_parameters -v`

  Expected: FAIL because `lib.parameters` does not exist.

- [ ] **Step 3: Implement immutable parameter and derived-geometry types**

  Add `@dataclass(frozen=True)` types. `TireParameters` fields are `outer_diameter_mm`, `rim_diameter_mm`, `width_mm`, `tread_thickness_mm`, `cell_count`, `wall_thickness_mm`, and `honeycomb_angle_deg`. `derive_geometry(params: TireParameters) -> DerivedGeometry` returns all radii, rim-band thickness, web bounds, and web span.

- [ ] **Step 4: Run the focused tests and verify pass**

  Run: `python -m unittest tests.airless_tire_honeycomb.test_parameters -v`

  Expected: PASS for defaults and derived geometry.

- [ ] **Step 5: Write failing validation and unit-scale tests**

  Cover nonpositive lengths, rim not smaller than outer diameter, empty web span, noninteger or fewer than 6 cells, wall too thick for a sector, angles outside 10–80 degrees, features below 0.01 mm, and unit scales for millimetres, centimetres, metres, inches, and feet.

- [ ] **Step 6: Implement validation and unit scaling**

  Implement `validate_parameters(params: TireParameters) -> tuple[ValidationIssue, ...]` with stable issue codes and `scale_from_stl_unit(unit_name: str) -> float` with an explicit supported-unit map.

- [ ] **Step 7: Run tests and commit**

  Run: `python -m unittest tests.airless_tire_honeycomb.test_parameters -v`

  Expected: all Task 1 tests PASS.

  Commit: `git commit -m "feat: define airless tire parameter contract"`

### Task 2: STL Reference Analyzer

**Files:**
- Create: `deliverables/AirlessTireHoneycomb/lib/stl_analyzer.py`
- Create: `tests/airless_tire_honeycomb/test_stl_analyzer.py`

**Interfaces:**
- Consumes: `scale_from_stl_unit(unit_name: str) -> float` from Task 1.
- Produces: `StlAnalysis`, `AnalysisWarning`, `analyze_stl(path, unit_name='Millimeter')`, `analyze_triangles(triangles, unit_scale=1.0)`, and `detect_stl_encoding(path)`.

- [ ] **Step 1: Write failing parser tests**

  Use temporary fixtures for a valid binary STL, a binary STL whose header starts with `solid`, a valid ASCII STL, truncated binary content, and malformed ASCII content. Assert encoding, triangle count, and stable error codes.

- [ ] **Step 2: Run parser tests and verify failure**

  Run: `python -m unittest tests.airless_tire_honeycomb.test_stl_analyzer.StlParsingTests -v`

  Expected: FAIL because the analyzer does not exist.

- [ ] **Step 3: Implement streaming binary and ASCII parsing**

  `detect_stl_encoding(path: Path) -> str` must prefer the binary length check `84 + triangle_count * 50 == file_size` over header text. Parsing yields triangle triples without loading duplicate vertex objects for the entire file.

- [ ] **Step 4: Run parser tests and verify pass**

  Run the command from Step 2; expected: PASS.

- [ ] **Step 5: Write failing measurement tests against both supplied references**

  When the two external files are present, assert 35,636 and 113,080 triangles, approximately 144 mm outer diameter, 60 mm opening, 20 mm width, and repeat suggestions 10 and 17. Also test a translated synthetic tire, a rotated thin axis, unit scaling, low-confidence symmetry, and ambiguous-axis warnings.

- [ ] **Step 6: Implement robust measurement and repeat inference**

  `analyze_triangles(...) -> StlAnalysis` selects the smallest bounding extent as width, estimates the projected center from robust min/max midpoints, uses quantized radial percentiles for inner/outer envelopes, and scores candidate rotations from 6 through 60 sectors. Return the best suggestion only above the documented 0.45 overlap confidence; otherwise return `None` plus a warning.

- [ ] **Step 7: Run analyzer tests and commit**

  Run: `python -m unittest tests.airless_tire_honeycomb.test_stl_analyzer -v`

  Expected: all tests PASS; external-reference tests skip with a clear reason only when those exact files are unavailable.

  Commit: `git commit -m "feat: analyze airless tire STL references"`

### Task 3: Polar Honeycomb Layout

**Files:**
- Create: `deliverables/AirlessTireHoneycomb/lib/honeycomb_layout.py`
- Create: `tests/airless_tire_honeycomb/test_honeycomb_layout.py`

**Interfaces:**
- Consumes: `TireParameters`, `DerivedGeometry`, `derive_geometry`, and `validate_parameters` from Task 1.
- Produces: `Point2D`, `Segment2D`, `RibPolygon`, `HoneycombLayout`, `calculate_layout(params)`, and `thicken_segment(segment, thickness_mm)`.

- [ ] **Step 1: Write failing row and node-layout tests**

  Assert the default layout fits at least two staggered radial rows, spans exactly one `360 / cell_count` sector, joins both the rim band and tread, alternates row phase by half a sector, and produces no duplicate zero-length segments.

- [ ] **Step 2: Run layout tests and verify failure**

  Run: `python -m unittest tests.airless_tire_honeycomb.test_honeycomb_layout -v`

  Expected: FAIL because layout types and functions do not exist.

- [ ] **Step 3: Implement sector layout calculations**

  `calculate_layout(params: TireParameters) -> HoneycombLayout` derives the largest row count that preserves wall-thickness clearance, creates alternating inclined rib segments using the requested angle, clips endpoints to the web radii, and includes explicit rim/tread overlap equal to half the wall thickness for reliable joins.

- [ ] **Step 4: Run row-layout tests and verify pass**

  Run the command from Step 2; expected: PASS for row and segment assertions.

- [ ] **Step 5: Write failing polygon and pathological-input tests**

  Assert each thickened segment produces a consistently wound nonzero-area quadrilateral; sector-boundary polygons stay inside their angular span; representative cell counts 6, 10, 17, 36 and angles 10, 30, 80 degrees have no self-intersecting polygons. Assert near-tolerance inputs fail before layout.

- [ ] **Step 6: Implement segment thickening and intersection checks**

  `thicken_segment(segment: Segment2D, thickness_mm: float) -> RibPolygon` offsets by the normalized perpendicular. `calculate_layout` rejects intersections other than shared intended endpoints with a stable `LayoutError` code.

- [ ] **Step 7: Run layout tests and commit**

  Run: `python -m unittest tests.airless_tire_honeycomb.test_honeycomb_layout -v`

  Expected: all Task 3 tests PASS.

  Commit: `git commit -m "feat: calculate parametric honeycomb sectors"`

### Task 4: Fusion Geometry Builder

**Files:**
- Create: `deliverables/AirlessTireHoneycomb/lib/fusion_builder.py`
- Create: `tests/airless_tire_honeycomb/fusion_stubs.py`
- Create: `tests/airless_tire_honeycomb/test_fusion_builder.py`

**Interfaces:**
- Consumes: `TireParameters` and parameter-name constants from Task 1; `HoneycombLayout` and `calculate_layout` from Task 3.
- Produces: `GeneratedTarget`, `find_generated_targets(design)`, `generate_tire(design, params, preview=False)`, `update_tire(target, params, preview=False)`, and `cleanup_owned_preview(design)`.

- [ ] **Step 1: Write failing ownership and target-discovery tests with Fusion stubs**

  Assert only components with attribute group `AirlessTireHoneycomb`, key `schemaVersion`, and supported value `1` are returned. Assert zero targets reports not-found and more than one target requires explicit selection rather than choosing the first.

- [ ] **Step 2: Run builder tests and verify failure**

  Run: `python -m unittest tests.airless_tire_honeycomb.test_fusion_builder -v`

  Expected: FAIL because builder interfaces do not exist.

- [ ] **Step 3: Implement guarded imports, ownership, and seven user parameters**

  Keep `adsk` imports behind a clear runtime guard so host-independent tests can import the module. Create/update exactly `ATH_outerDiameter`, `ATH_rimDiameter`, `ATH_tireWidth`, `ATH_treadThickness`, `ATH_cellCount`, `ATH_wallThickness`, and `ATH_honeycombAngle` with millimetre, unitless, or degree expressions as appropriate.

- [ ] **Step 4: Write failing build-sequence tests**

  Using call-recording stubs, assert generate creates a named component, rim sketch/extrusion, tread sketch/extrusion, sector-rib sketch/extrusion, a full-angle circular pattern with `ATH_cellCount`, one joined result body, and ownership metadata. Assert topology-changing update removes only owned generated features and rebuilds them.

- [ ] **Step 5: Implement native Fusion build and update operations**

  Use sketch circles for rim and tread annuli, closed quadrilateral profiles from `RibPolygon`, symmetric width extrusions, `JoinFeatureOperation`, and `CircularPatternFeatures` around the component Z axis. Tag every owned sketch and feature. For topology updates, build a new tagged feature set and body inside the same component, then remove the prior owned feature set only after the replacement body succeeds; retain and restore prior parameter expressions if staging fails. Cleanup may delete only tagged preview or staging entities inside the target component.

- [ ] **Step 6: Write and implement rollback-cleanup tests**

  Make a stub extrusion throw midway. Assert `generate_tire` removes the newly created owned component; `update_tire` removes its staging entities, restores prior parameter expressions, and leaves the prior final body discoverable; and `cleanup_owned_preview` never deletes non-preview or unrelated components.

- [ ] **Step 7: Run builder tests and commit**

  Run: `python -m unittest tests.airless_tire_honeycomb.test_fusion_builder -v`

  Expected: all Task 4 tests PASS.

  Commit: `git commit -m "feat: build native Fusion honeycomb tire"`

### Task 5: Fusion Command Dialog and Lifecycle

**Files:**
- Create: `deliverables/AirlessTireHoneycomb/commands/__init__.py`
- Create: `deliverables/AirlessTireHoneycomb/commands/airless_tire/__init__.py`
- Create: `deliverables/AirlessTireHoneycomb/commands/airless_tire/entry.py`
- Create: `deliverables/AirlessTireHoneycomb/AirlessTireHoneycomb.py`
- Create: `deliverables/AirlessTireHoneycomb/AirlessTireHoneycomb.manifest`
- Create: `tests/airless_tire_honeycomb/test_command_controller.py`

**Interfaces:**
- Consumes: parameter defaults and validation from Task 1, `analyze_stl` from Task 2, and builder operations from Task 4.
- Produces: Fusion `run(context)` and `stop(context)` entry points plus an Airless Tire Honeycomb toolbar command in `FusionSolidEnvironment` / `SolidScriptsAddinsPanel`.

- [ ] **Step 1: Write failing controller tests for dialog state**

  With command-input stubs, assert the three groups and all specified inputs exist, validation disables final execution for hard issues, Analyze populates dimensions and cell-count suggestion, unit changes rescale analyzed values, and low-confidence repeat analysis leaves the manual cell count unchanged.

- [ ] **Step 2: Run controller tests and verify failure**

  Run: `python -m unittest tests.airless_tire_honeycomb.test_command_controller -v`

  Expected: FAIL because the command controller does not exist.

- [ ] **Step 3: Implement command registration and dialog events**

  Register stable IDs, retain Python handler references, create Reference Analysis, Tire Parameters, and Honeycomb Parameters groups, and connect `inputChanged`, `validateInputs`, `executePreview`, `execute`, and `destroy` handlers. The manifest uses type `addin`, version `1.0.0`, Windows/macOS support, and startup enabled.

- [ ] **Step 4: Write failing Generate/Update orchestration tests**

  Assert Generate passes current values to `generate_tire`; Update requires one explicit target when several exist; analysis never generates geometry; execution errors produce concise dialog text and a detailed application log entry.

- [ ] **Step 5: Implement execute and preview orchestration**

  Preview uses `preview=True`, cleans prior owned preview first, and always cleans on exception/destroy. Execute validates again and calls only the selected operation. Cancellation and preview failure invoke cleanup without touching a prior final target.

- [ ] **Step 6: Run command tests and commit**

  Run: `python -m unittest tests.airless_tire_honeycomb.test_command_controller -v`

  Expected: all Task 5 tests PASS.

  Commit: `git commit -m "feat: add Airless Tire Honeycomb Fusion command"`

### Task 6: Packaging, Documentation, and Acceptance Verification

**Files:**
- Create: `deliverables/AirlessTireHoneycomb/README.md`
- Create: `scripts/package_airless_tire_addin.py`
- Create: `tests/airless_tire_honeycomb/test_package.py`
- Create: `docs/airless-tire-honeycomb-verification.md`
- Create: `deliverables/AirlessTireHoneycomb.zip`

**Interfaces:**
- Consumes: the completed add-in package from Tasks 1–5.
- Produces: an installable ZIP and a repeatable Fusion acceptance checklist.

- [ ] **Step 1: Write failing package-content tests**

  Assert the package script creates a ZIP with one top-level `AirlessTireHoneycomb/` directory, manifest and entry point at that level, every required Python module, README, and no `__pycache__`, `.pyc`, tests, or source STL files.

- [ ] **Step 2: Run package tests and verify failure**

  Run: `python -m unittest tests.airless_tire_honeycomb.test_package -v`

  Expected: FAIL because the packaging script and documentation do not exist.

- [ ] **Step 3: Implement deterministic packaging and user documentation**

  The packaging script sorts members and fixes ZIP timestamps. README instructions cover Fusion's Scripts and Add-Ins folder workflow, toolbar location, STL unit choice, Analyze, Generate, Update, all parameter meanings, the measured reference values, and version-1 engineering limitations.

- [ ] **Step 4: Create the Fusion acceptance checklist**

  Include installation/removal, both supplied STL analyses, generation, all seven parameter checks, 10-to-17 cell topology update, recompute, preview/cancel cleanup, failure rollback, joined-body count, and proof that an unrelated component remains unchanged.

- [ ] **Step 5: Run the complete host-independent suite**

  Run: `python -m unittest discover -s tests/airless_tire_honeycomb -t . -v`

  Expected: all tests PASS with no unexpected skips; only Fusion-host acceptance remains manual.

- [ ] **Step 6: Build and inspect the ZIP**

  Run: `python scripts/package_airless_tire_addin.py`

  Expected: `deliverables/AirlessTireHoneycomb.zip` is created and the package test reports every expected member exactly once.

- [ ] **Step 7: Perform or clearly defer Fusion-host acceptance**

  Run the checklist in Fusion 360 when the application is available. Record Fusion version, pass/fail for every item, and screenshots or exact error text for failures. If Fusion is unavailable, mark these checks **not run** rather than claiming they passed.

- [ ] **Step 8: Commit the final deliverable**

  Commit: `git commit -m "docs: package Airless Tire Honeycomb add-in"`

