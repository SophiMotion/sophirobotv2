# SophiStudio — SophiRobot

Current skeleton: **Assembly_V2_Appearance mounting .step**, 551 source bodies, with 13 retained Appearance 2 covers (564 bodies on V1; 547 on V2). See [mounting model notes](docs/mounting-model.md) for current dimensions and mappings. Historical model notes below describe earlier versions. This version includes motor housings, bearings, joint brackets, head hardware and grippers. Default overall height is 1875.75 mm. The revised left shoulder bracket places both arm tubes at the same height.

## Run

Extract the package and double-click **Launch Website.cmd**, then open http://127.0.0.1:5173/ on the same computer. Requires Node.js 22.12+; the launcher also detects the Codex bundled runtime. Keep the server running. Restart it after reboot. Do not open dist/index.html as a file URL.

## Controls

Base, Wheels, Body and Limbs expose dimensions. Tube diameter/wall and arm/leg cut lengths apply to both sides. Arm L, Arm R, Leg L and Leg R retain independent poses and Fixed/Movable modes. Fixed locks the current pose; Reset selected limb returns only that limb to zero. Header Reset restores default dimensions and all limbs to zero Fixed mode. L=+X and R=−X when facing +Y.

Arms retain lift −180–180°, swing −100–40°, twist −90–90°, elbow 0–135°. Legs have hip lift ±90° and reversed knee bend 0–135°. Model 4 has no separate hip-swing shaft; that control is no longer offered. The former structural-sheet mounting plates are absent, so their configuration field stays read-only at 5 mm. There are 20 editable dimensions plus this retained field.

Motor covers stay with the corresponding motor housings; output brackets, tubes and grippers follow the downstream joint. Head hardware follows total height. Head movement is controlled in the Head tab. Each hand has wrist rotation (−90° to +90°) and clamping (0° to 45°) controls in its Arm L/R panel. These are provisional preview limits, not verified hardware limits. Zero preserves the original STEP pose; increasing clamping closes the driven jaw toward the fixed jaw. Jaw overlap is possible near 45°; collision stops are not simulated. Fixed mode and Reset apply to the hand as well. Saved configurations include both angles; older configurations default missing hand angles to zero. Top metal cover hides both base cover bodies, changing the visible count from 507 to 505. Grid, edges, axes, bounding dimensions, camera presets, Fit, component selection, measurement and viewport PNG export remain available.

Save configuration stores dimensions, all four poses/modes and the source hash. Load requires a matching model 4 file; older source configurations are rejected. There is no automatic persistence on page reload. examples/default-configuration.json is included.

## Development

```powershell
pnpm install --frozen-lockfile
pnpm test
pnpm build
pnpm start
```

Use pnpm dev while editing; stop the production server first because both use port 5173. Production serves dist and needs a rebuild after source edits. TypeScript, Three.js and Vite are used with native HTML/CSS. The lockfile pins resolved dependencies.

To reconvert the packaged source:

```powershell
node scripts/convert.cjs "source-model/Assembly_V2_website_new platform .step"
pnpm test
pnpm build
```

A different STEP requires reinspection and new mappings. Defaults preserve source vertices. Modified geometry is a mesh preview, not native CAD feature reconstruction. Joint axes are inferred, angle ranges are preview limits, and collision/strength/fit are not solved. Covers and adapters stay rigid when tube sizes change, so their fit is not automatically redesigned. Native parametric STEP export is unavailable.

## Verification and provenance

122 current-source tests pass, covering all 507 bodies, dimensions, covers, attached grippers, rigid hardware, resized pivots, independent movement and reversed knees. Strict TypeScript and production build pass. Offline geometry previews are in docs/evidence/model-v4-neutral.png and model-v4-posed.png. These are geometry checks, not browser screenshots. Browser UI automation was unavailable due to the previously reported browser policy block.

See docs/model-v4.md for mappings and limitations. Earlier model documents and the dated September 29 manual package describe historical snapshots. The current ZIP contains source, dist, original model 4 STEP, converted model, configuration example and tests.

Camera presets: Front looks from the negative Y side; Rear looks from the positive Y side (the previous Front direction). This changes the camera only; limb assignments and joint directions remain the same.

## Motor specification selection

Open Motors, choose Shoulder, Knee, Elbow or Wrist, then select the left and right motor options independently. Each side offers Current motor, Option A and Option B; all start as unspecified placeholders. Expand Edit selected specification to enter a name, motor type, rated torque (N·m), speed (rpm), voltage (V) and gear ratio. Leave unknown specifications blank. Edits belong to that side and option. Shoulder choices describe both lift/swing motors on their side; Wrist refers to rotation, not clamping.

Selections and all editable options are included in Save configuration and restored by Load configuration. Older files initialize unspecified motors. Reset clears selections and placeholder edits along with dimensions and poses. This catalog is descriptive only: it does not modify geometry, movements, joint limits or motor suitability.

Base drive motor options are available directly below the dimensions on the Base tab. Base L and Base R each provide Current motor, Option A and Option B with editable specifications, independent selection, save/load and reset. Older catalogs without base motor fields receive unspecified defaults. These selections do not change the assembly or movement.

## Export via Fusion 360

The sidebar export button opens the Fusion handoff workflow. Download the companion script ZIP and export request; run the script in Fusion with the original parametric robot design active. Native parameter mappings must be verified before use. The default mode applies dimensions and keeps the current Fusion pose; website pose mode additionally requires all 18 driving angle parameter mappings, including the head. Motor choices remain JSON metadata. The native document is not saved, and original parameter expressions are restored after the temporary export update.

See public/fusion/README.md for installation, mappings, units, pose handling and limitations. The helper uses supported Autodesk parameter-update and STEP-export APIs. 100 TypeScript tests and 10 Python tests pass; native Fusion export is not yet verified because the original .f3d/.f3z robot design has not been provided. Browser visual verification remains blocked.

## Direct STEP download

Download STEP in the sidebar generates a .step file directly in a Web Worker. It captures the dimensions, joint pose and top-cover visibility at click time. Progress, cancellation and a persistent Save STEP file link are provided. It needs no Fusion installation. Motor specification selections do not change geometry.

The file uses AP214 manifold surface representations with explicit planar triangular faces, with source component names and mm units. It is a faceted surface model, not the original smooth solid CAD or a Fusion feature history. No simplification is applied; near-zero-area triangles are skipped. A 504-part export with covers hidden generated 888,746 faces in 3.6 seconds locally and was 343,517,288 bytes (about 328 MiB). Large files can take substantial memory and time in CAD. The Fusion pathway remains available for native solid output.

Verification: all 100 TypeScript tests pass. Full model generation succeeds. A representative four-part export containing resized geometry and posed grippers was independently reimported with OpenCascade, preserving 21,436 triangles and dimensions/pose bounds within 0.001 mm. Full-model reimport and actual browser download were not verified; browser automation remains blocked. Reproduce with node scripts/verify-step-export.cjs (sample CAD round trip) or add --full (full generation).

## Head rotation and tilt

The Head tab provides independent Fixed/Movable modes, rotation −90°..90°, tilt −30°..30°, numeric inputs, sliders and Reset head. Zero is the original STEP pose. Positive tilt looks up toward the front (−Y). These are provisional, non-collision-checked limits. The neutral total height parameter still describes the unposed assembly; the measured envelope follows the pose.

Rotation uses a Z shaft through (0,−20,1787); tilt uses an X shaft through (0,−20,1824.75), translated by the total-height delta. Neck mounting and motor housing remain fixed; output shaft hardware, upper neck, tilt motor and covers rotate together; output bracket 265 additionally tilts. Bearing races and internal drive motion are not independently simulated. src/head.ts lists the source-body stages.

Configuration JSON includes head.pose and head.movable. Older files initialize a fixed neutral head. Direct STEP export uses the same head matrix as the viewer. Fusion website-pose export now uses request version 2 and requires head_rotation/head_tilt driving native parameters as well; older helper scripts reject the new format rather than silently omitting head movement. The Fusion-pose mode keeps the native pose as before.

100 TypeScript and 10 Python tests pass. Offline geometry previews were reviewed in docs/evidence/model-v4-head-movement.png. A five-component posed STEP sample including head output was reimported with OpenCascade (24,000 triangles) with bounds matching within 0.001 mm. These checks are not browser UI verification.

## Bill of materials (CNY)

Bill of materials is in the top project navigation, outside the parameter tabs. It opens bom.html in a separate window (or a browser tab if popup windows are blocked). The page is independently built by Vite and served alongside the configurator. It needs no 3D model download.

Opening the BOM captures the current dimensions and selected motor descriptions. The snapshot is transferred through a unique local-storage key, consumed into the new window session; edits do not affect the configurator. Directly opening bom.html uses the default examples. Each new opening is a fresh estimate, not a live synchronized procurement list. Materials, quantities and prices are illustrative and editable. There are 38 example rows across 7 categories; initial total ¥31,720 CNY. Shoulder choices have quantity two per side (lift/swing). Other motors, mechanical hardware and electronics use example specifications, not a certified model-derived bill. Tax, shipping and assembly are excluded.

Whole-number quantities and prices with two decimal places are validated. Calculations use integer fen. Category filters leave the overall total unchanged. Reset examples restores the opening configuration. Edits remain in the window until closed; Download CSV exports UTF-8 BOM-marked CNY data with spreadsheet formula protection. examples/SophiRobot-BOM-CNY.csv is included.

Validation: 100 TypeScript tests and production multi-page build pass. Local HTTP verifies both pages and their assets. Browser UI visual verification remains blocked.

The table supports keyword search across parts and materials, category filters, collapsible groups with subtotals, and quantity stepper buttons. Search and collapsed groups never change the full estimate or CSV contents. Inline messages identify invalid quantity and price fields. Reset examples offers a one-level Undo that restores edits and numeric drafts. Desktop column headings and the overall total stay visible while scrolling; narrow screens show stacked part cards.

Walking preview: use Play walk above the parameter fields to animate alternating legs and opposite arm swings in place. Speed choices are 0.5x, 1x and 1.5x. Stop walk restores the exact configured limb pose and Fixed/Movable settings are retained. Configuration edits, save/export actions, measurements and snapshots stop the preview first. Hiding the page also stops playback. Wrists, clamps, head and the AGV base stay unchanged. This is a joint animation, not a balanced gait or ground-contact simulation. During playback, dimension readouts retain the configured pose values.

Wave and say hi: the Animation previews section includes a 4.8-second right-arm greeting. It raises the arm, oscillates the shoulder and wrist, then returns smoothly to the saved pose. Legs and the opposite arm remain unchanged. A viewport caption reads Hi! I am SophiRobot; optional browser speech says the greeting when supported. Voice greeting can be disabled. Starting a different animation stops the current one, and Stop, editing or hiding the page restores the configured pose. Browser audio and rendered motion require visual/manual verification.

Three additional Animation previews: Welcome opens both arms; Reach forward extends both arms ahead; Celebrate raises both arms with a gentle repeated motion. Each lasts four seconds at 1x and supports the speed selector. Clicking the active button stops it; selecting another switches previews. Each returns to the saved pose and preserves legs, wrists and clamps. Joint range and pose restoration tests pass; rendered motion has not been visually verified.

Language settings: the top-right selector switches between English and Simplified Chinese without reloading or changing configuration values. The choice is stored locally and shared with the BOM window. Interface labels, parameter help, dynamic animation text and source notes are translated. User-entered material/specification fields, technical identifiers, source part names and exported configuration data remain unchanged. BOM search accepts English or Chinese part names. The optional voice greeting follows the selected language, subject to browser voice availability. Browser visual verification remains unavailable.

Current STEP update: see docs/new-platform.md. Previous model-v4 images and notes are historical.

Two base versions are now available in Base → Base model. See docs/base-versions.md for measured defaults and export behavior.

## Appearance assembly
The configurator now uses Assembly_V2_Appearance_2 .step for the upper robot and thirteen outer covers. Appearance controls independently hide the head, chest, hip, shoulder, upper/lower arm and thigh/lower-leg covers. Hidden covers are excluded from faceted STEP exports; native Fusion exports retain the full CAD assembly.

Defaults: upper arm 120 mm, lower arm 200 mm, thigh 320 mm, lower leg 320 mm; shoulder span 350 mm, hip span 320 mm, hip position 880 mm, covered head top 1810 mm above the source ground reference. V1 preserves all 539 source bodies at defaults. V2 combines the same upper robot with the existing enclosed-wheel platform (522 bodies). Source tube axes have small CAD alignment offsets; nominal lengths are rounded millimeter dimensions.

The stored preview meshes normalize mechanical parts to the existing kinematic reference; deformation restores source geometry at the new defaults. The head cover extends 82.25 mm beyond the mechanism reference top. V2 asset identity is SHA-256 of appearance STEP bytes followed by V2 platform STEP bytes. The thirteen cover meshes retain their supplied source coordinates and use their own deformation rules. Changing cover dimensions is a mesh preview, not a CAD feature rebuild or a collision check.

The revised source splits each thigh tube into two solids. Both solids share the same thigh sizing and hip motion. Upper-arm shells follow the elbow-side motor housing; forearm and leg shells resize along their corresponding tube attachments. Black-and-white material styling is retained.

## GitHub Pages

Live website: https://sophimotion.github.io/sophirobotv2/

Pushing to `main` runs `.github/workflows/pages.yml`: install dependencies, run tests, build with Vite, and deploy `dist` to GitHub Pages. The workflow can also be started manually from GitHub Actions. Both model variants, the quotation workbook, and Fusion helper downloads are included. Relative asset paths support the `/SophiRobot/` URL and local hosting.

