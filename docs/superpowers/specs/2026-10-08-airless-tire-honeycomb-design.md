# Airless Tire Honeycomb Fusion 360 Add-In Design

## Purpose

Build a Fusion 360 Python add-in named **Airless Tire Honeycomb** that analyzes an STL tire reference and generates a new, editable, native Fusion model. The STL is a measurement reference only; imported mesh triangles are not deformed or presented as a parametric solid.

Success means a user can select either supplied STL, review the detected dimensions, change the tire and honeycomb parameters in a Fusion command dialog, and use **Generate** or **Update** to create a valid tire component without modifying unrelated document content.

## Reference Mesh Findings

The supplied binary STL files have these measured properties:

| Reference | Triangle count | Outer diameter | Inner opening | Width | Detected rotational repeat |
| --- | ---: | ---: | ---: | ---: | ---: |
| `tire airless.stl` | 35,636 | 144 mm | 60 mm | 20 mm | 10 sectors |
| `tire airless 2.stl` | 113,080 | 144 mm | 60 mm | 20 mm | 17 sectors |

The repeat values are analyzer suggestions, not immutable facts. STL tessellation and geometric noise can reduce confidence, so the user must be able to override every detected value before generation.

## User Experience

The add-in installs a command named **Airless Tire Honeycomb** in the Design workspace. Its dialog contains three groups.

### Reference Analysis

- **Select STL** opens a file picker for a binary or ASCII STL.
- **Analyze** reads the file without inserting a mesh body into the document.
- A summary reports triangle count, units assumption, outer diameter, opening diameter, width, suggested circumferential cell count, and analysis warnings.
- Detected values populate the editable design inputs but never generate geometry automatically.

Because STL does not encode units, the dialog defaults to millimetres and includes an STL unit selector. Changing the selector rescales the analyzed measurements.

### Tire Parameters

- Outer diameter
- Rim/opening diameter
- Tire width
- Outer tread thickness

Initial values, when no STL has been analyzed, are 144 mm, 60 mm, 20 mm, and 4 mm respectively. The first three defaults are directly measured. The 4 mm tread default corresponds to the prominent approximately 68 mm inner tread radius in the references and remains user-editable.

### Honeycomb Parameters

- Circumferential cell count
- Honeycomb wall thickness
- Honeycomb angle
- Operation: **Generate New** or **Update Existing**
- Live preview toggle

Cell count means the number of repeating sectors around 360 degrees. The generator calculates the number and spacing of staggered radial rows that fit between the rim and tread. The user does not need to manage radial row count.

## Geometry Model

The generator creates native BRep geometry in a component named **Airless Tire Honeycomb**.

1. Create a rim annulus from the opening diameter and a derived rim band thickness.
2. Create the outer tread annulus from the outer diameter and tread thickness.
3. Define the usable web region between the rim and tread.
4. Construct one polar honeycomb sector. Alternating inclined ribs form hexagonal openings; honeycomb angle controls the rib inclination and wall thickness controls rib width.
5. Calculate staggered radial rows that fit the web region while preserving minimum clearances at the rim and tread.
6. Circular-pattern the sector around the tire axis using the circumferential cell count.
7. Extrude the complete planar profile symmetrically to the requested tire width and join the rim, web, and tread into one body.

The model exposes namespaced Fusion user parameters so they remain visible and editable without colliding with parameters from other add-ins:

- `ATH_outerDiameter`
- `ATH_rimDiameter`
- `ATH_tireWidth`
- `ATH_treadThickness`
- `ATH_cellCount`
- `ATH_wallThickness`
- `ATH_honeycombAngle`

Each generated component receives an Autodesk attribute containing the add-in schema version and a stable generated-component identifier.

## Generate and Update Behavior

**Generate New** creates a new component and its parameters. If a generated component already exists, the command asks the user to switch to Update or intentionally create another uniquely numbered component.

**Update Existing** operates only on a component carrying the add-in attribute. Dimensional-only changes update the named parameters and recompute the design. A topology change, including cell count or a calculated radial-row-count change, rebuilds only the add-in-owned sketches and features inside that component. It does not delete or edit unrelated components, bodies, sketches, parameters, or features.

Final changes occur in the command execute event so Fusion groups them into a single undoable transaction. Preview geometry is temporary and is removed when preview is disabled, invalidated, cancelled, or superseded.

## STL Analysis

The analyzer uses only the Python standard library and supports binary and ASCII STL encodings.

1. Validate the file structure and extract triangle vertices.
2. Determine the thin axis from the smallest bounding-box extent; this is the tire width direction.
3. Project vertices onto the other two axes and estimate the wheel center.
4. Compute robust outer and inner radial envelopes, ignoring isolated tessellation outliers.
5. Estimate rotational repeat count by comparing quantized projected geometry across candidate sector rotations.
6. Return values, confidence scores, and warnings through a pure-data result object.

If the tire axis is ambiguous, the analyzer reports the ambiguity and populates only the safe bounding-box values. Low-confidence repeat detection never prevents manual generation.

## Validation and Error Handling

The dialog validates continuously and disables its final action while any hard error exists.

- All lengths must be positive.
- Rim diameter must be smaller than outer diameter.
- Tread thickness must leave a nonempty honeycomb web region.
- Wall thickness must fit the calculated cells and satisfy a configurable geometric tolerance.
- Cell count must be an integer of at least 6 and must not produce self-intersecting ribs.
- Honeycomb angle must stay within a safe range that yields closed cells.
- Tire width must exceed Fusion's modeling tolerance.
- Generate requires an active parametric Fusion design.
- Update requires exactly one selected or discoverable compatible generated component.

Expected validation failures appear inline in the command dialog. Unexpected API or geometry failures are logged with a traceback and shown in a concise error message. A failed generation or update must leave no partial final component.

## Code Structure

The add-in is independent of the existing SophiRobot exporter and lives in a new `AirlessTireHoneycomb` package.

- `AirlessTireHoneycomb.py` and manifest: Fusion lifecycle entry points and metadata.
- `commands/airless_tire/entry.py`: command registration, dialog, event handlers, preview, and execute orchestration.
- `lib/parameters.py`: parameter schema, defaults, units, validation, and derived layout values.
- `lib/stl_analyzer.py`: binary/ASCII STL parsing and measurement inference with no Fusion dependency.
- `lib/honeycomb_layout.py`: pure polar honeycomb layout calculations with no Fusion dependency.
- `lib/fusion_builder.py`: sketches, features, parameters, attributes, generate/update operations, and cleanup.
- `tests/`: host-independent tests for STL parsing, analysis, validation, and layout math.

Fusion API calls remain behind `fusion_builder.py`, allowing most behavior to be tested outside Fusion with ordinary Python.

## Verification

Automated tests will verify:

- Binary and ASCII STL parsing, malformed-file rejection, bounds, and triangle counts.
- Measurements for both supplied references: approximately 144 mm outer diameter, 60 mm opening, and 20 mm width.
- Repeat suggestions of 10 and 17 sectors within documented confidence thresholds.
- Valid and invalid parameter combinations.
- Radial-row calculation, sector closure, wall clearances, and absence of self-intersection across representative limits.
- Stable serialization and namespaced parameter definitions.

Fusion-side acceptance checks will verify:

- Command installation and removal.
- Dialog validation and STL value population.
- Generation of one joined BRep body in the named component.
- Presence and editability of all seven user parameters.
- Successful recompute after dimensional updates.
- Safe topology rebuild after changing cell count.
- Cancel, preview failure, and generation failure leave no partial final geometry.
- Unrelated document objects remain unchanged.

## Scope Boundaries

Version 1 generates a manufacturable geometric starting point but does not perform finite-element analysis, load optimization, material simulation, print-orientation optimization, or automatic matching of every irregular surface detail in an STL. Those capabilities require separate engineering requirements and validation.
