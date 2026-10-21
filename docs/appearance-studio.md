# Appearance Studio

Open **Appearance Studio ↗** from the main navigation. It requests a separate window; browsers may use a new tab depending on their settings. Direct route: `appearance.html`.

1. Choose the V1 or V2 reference skeleton. It uses the current default dimensions in a neutral pose, with the built-in outer covers hidden.
2. Upload one or more `.stl`, `.step`, or `.stp` files. Files are read locally; there is no upload server.
3. Select a filename, then adjust X/Y/Z position (mm), X/Y/Z rotation (degrees, XYZ order), and uniform scale. Transforms are relative to the original file origin and preserve original CAD coordinates on import. STL has no standard unit metadata: millimeters are assumed; use scale 1000 for meter-based files or 25.4 for inches. STEP converts declared units to millimeters.
4. Use Center on robot for a rough alignment, Reset transform to restore the imported coordinates, and Fit all to reframe. Toggle individual files or the skeleton, adjust opacity and appearance color, or remove a file.

Imports live only in the current window. Reloading or closing clears them. They do not modify the configurator, attach to animated joints, or change STEP exports from the configurator. This is a static visual fitting workspace, without collision detection or automatic fitting.

Limits: 50 MB per file, 20 files, 150 MB combined original file sizes, 2 million triangles per file and 4 million uploaded triangles total. STEP conversion times out after 180 seconds. Cancel terminates the active converter and keeps already loaded files. Invalid or cancelled files do not replace previous imports.

STL parsing uses Three.js STLLoader in a module worker. STEP uses a classic worker and locally bundled occt-import-js 0.0.23 JS/WASM under `public/vendor/occt`, with both upstream licenses. Conversion uses millimeters, 0.3 mm tessellation deflection and 0.4 radians angular deflection. Workers transfer typed mesh buffers and are terminated after each import. Removed preview objects release their GPU geometry and material resources.

Validation: ASCII and binary STL, invalid/oversized file handling, numeric transforms, and the shipped STEP worker + JS/WASM evaluated in a browser-style worker environment. Production build and automated tests are checked. Rendered browser interaction testing is unavailable in this workspace.
