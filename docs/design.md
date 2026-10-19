> Current source is model 3, 556 bodies, with independent L/R arms and legs. See [model-v3.md](model-v3.md) for current mappings and [verification-v3.md](verification-v3.md) for checks. Earlier version notes below are historical where superseded.

# ProfabX humanoid configurator

Build a local CAD workstation around the supplied STEP file and the user-requested 19 numeric parameters. The screenshot provides default values. Interpret the two sheet types as thin 2 mm and structural 5 mm, and hip position as vertical height 800 mm. These assumptions are visible in the app.

Architecture: offline OpenCascade conversion preserves all source meshes and records hierarchy and extents. A pure TypeScript parameter module deforms immutable source vertices using component-aware rules. Three.js renders the assembly, with native HTML controls in a Vite app. No backend account or cloud upload. STEP has no native Fusion equations; adjusted geometry is a visualization with documented limitations.

Visual direction: generated full-screen reference in docs/concept.png. User-requested dark blue-black background #070d18, panel #0d1728, pale text and blue accent #62a7ff. Header 72 px; left parameter rail 320 px; wide canvas; compact footer. Sans-serif 13 px controls, 18 px titles. Native numeric rows, tabs, switches and camera segments. Mobile stacks viewport above controls. Actual CAD replaces the concept's illustrative robot.

Workflow: load source mesh, edit one parameter, validate, regenerate from source, display measured extents. Invalid input retains last valid geometry. Base/Wheels/Body/Arms tabs expose all requested parameters; cover visibility, grid, edge toggles, camera presets, fit, reset and JSON save/load support inspection. Show source identity and preview limitations in an information dialog.

Current source: Assembly testing website 2 .step, 208 meshes. Hierarchical joint matrices follow source-based dimensional deformation. See model-v2.md. The generated concept predates the theme and model replacement.
