# Model 2 — tube dimensions and arm joints

Source: `D:/ProfabX/Company humanoid/Assembly testing website 2 .step`.

SHA-256: `a8c1c7cb8844e76c1af1f11b3789459f1c785a2740593d330a3fecc862405119`.

The replacement STEP has **208 mesh bodies**, including the original 34 unchanged base/frame bodies, 172 actuator bodies, and two tube bodies. It contains **one arm at +X** and **no leg tubes or opposite arm**. No additional limbs or connector solids have been fabricated.

## Parameters

| Control | Default | Range | Rule |
|---|---:|---:|---|
| Tube diameter | 50 mm | 30–80 mm | Both tube outside radii = diameter / 2 |
| Tube thickness | 2 mm | 1–16 mm | Both inside radii = outside radius − radial wall thickness |
| Upper arm length | 200 mm | 100–500 mm | Upper tube top fixed; lower end, both elbow actuators, and lower arm translate with length change |
| Lower arm length | 300 mm | 100–650 mm | Lower tube top fixed; lower end extends along the tube axis |

Tube inner diameter must remain at least 12 mm. The neutral lower-arm endpoint must remain at least 20 mm above the base deck. These are preview constraints, not manufacturing qualification.

The shared tube settings apply to both supplied tubes. Leg-frame sizing cannot affect absent geometry. The upper tube's source axis is X=330.5, Y=0 with Z=1370…1570. The lower tube shares that axis, with Z=933.4…1233.4. Source mesh vertices have radii of exactly 23 and 25 mm, confirming 2 mm radial walls.

The new neutral envelope is 900 × 850 × approximately **1659.25 mm**, including shoulder actuators. Total-height default is now 1659.25. The beam top stays at 1640, its underside at 1600. A total-height change translates all arm hardware and extends the spine; shoulder-width changes translate the entire arm by half the width change. Actuators never scale. Pose changes can change the displayed overall envelope.

## Joint ownership and axes

STEP does not provide the native Fusion joint tree or mechanical stops. The following is an **inferred preview chain**, based on the actuator shaft orientations in the source. Rotation pivots remain anchored after dimension changes.

| Stage | Neutral shaft line | Fixed/stator bodies | Downstream bodies | Preview range |
|---|---|---|---|---|
| Shoulder lift | X axis through Y=0, Z=1620 | 34–97 | 98–207 | 0…360° |
| Shoulder swing | Y axis through X=330.5, Z=1620 | 98–161, carried by first joint | 162–207 | −100…40° |
| Arm twist | Z axis through X=330.5, Y=0 | 163–184, carried by shoulder joints | 185–207 | −90…90° |
| Elbow bend | X axis through Y=0, Z=1263.4 | 185–206, carried by parent joints | 207 | 0…135° |

IDs are zero-based mesh indices in model-inspection.json. Pose transforms are composed shoulder lift → shoulder swing → twist → elbow. A child rotation is applied before its parent's world transform, so the elbow shaft moves with the arm. Rotation uses rigid matrices; slider movement does not regenerate tube meshes or accumulate vertex deformation.

The source has gaps where shoulder/actuator/tube adapters are absent: e.g. the upper tube ends at Z=1570 while the shoulder actuator envelope reaches about Z=1580.7; the first elbow motor envelope ends at Z=1365 versus upper tube Z=1370; lower tube top Z=1233.4 versus elbow housing minimum Z=1242.4. Those offsets are retained in the joint chain, not repaired by invented components. Increasing tube diameter can require revised adapters.

These ranges are UI limits only. Native joint definitions, drive limits, connector design, full self-collision, strength, and stability are not verified. An allowed pose can intersect another component. Fixed/movable refers to holding/editing a browser pose, not controlling hardware.

## User workflow

1. Open **Arms** to edit tube and arm dimensions.
2. Choose **Movable** to enable the four joint sliders or numeric angles.
3. Choose **Fixed** to freeze the current pose; the angles remain saved.
4. **Reset arm pose** returns angles to zero without changing dimensions.
5. Header **Reset** restores all dimensions and the neutral fixed pose.
6. **Save configuration** includes dimensions, angles, fixed/movable mode, and source SHA. Load rejects configurations from the previous STEP; new-model dimension-only JSON defaults to neutral fixed pose.

The viewport's **Open joints** shortcut reveals the joint controls even if the sidebar is scrolled. Fit handles wider posed envelopes. Existing base parameters, camera controls, cover toggle, selection, measurement, and PNG export remain available. Measurement uses transformed meshes; readouts compute bounds from actual posed vertices.

Shoulder ranges updated to user-specified swing −100°…40° and lift 0°…360°. Zero remains the normal fixed reference pose.
