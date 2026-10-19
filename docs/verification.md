# Verification — 11 September 2026

## Automated checks

- `pnpm test`: **39 passed**, 2 test files.
- `pnpm build`: strict TypeScript and Vite production build **passed**, no build warnings.
- Source SHA-256 rechecked against disk: **unchanged**, `99cd9e87fb3e15f0092ad10fbe9032a0b31c750b282411ad9509ab56c3ad6b58`.
- 34 mesh bodies, 26,658 vertices, 25,740 triangles. Converted model JSON: 1,482,719 bytes.
- All original double-precision mesh coordinates preserved at defaults. Float32 GPU conversion error tested below 0.001 mm. This is mesh-preservation accuracy, not tessellation accuracy against analytic STEP surfaces (conversion deflection is 0.15 mm).

Tests cover all 15 parameter effects, numerical and relational validation, exact defaults, symmetric drive translations, rigid motors/hubs, fixed rim bore, grounded drive tires, shoulder/spine and hip/spine contacts, lower/upper frame contacts, structural mounting-plate contacts, horizontal cover thickness, noncumulative changes, and model-specific JSON validation.

## Browser checks

Used the **Codex in-app browser**, through its browser automation and screenshot APIs. No Playwright fallback was needed. Production URL: `http://127.0.0.1:5173/`.

| Check | Result |
|---|---|
| Correct title and meaningful content | Passed |
| 34 source meshes loaded | Passed |
| No framework error overlay | Passed |
| Browser error/warning log | Empty in checked final session |
| Every numeric input | All 15 produced a valid updated configuration |
| Combined parameter change | 1000 × 900 base, 220 height, 1800 total, 540 wheelbase, 620 track, 180 tire OD, 30 tire thickness, 3/6 sheets, 35° angle, 120 middle, 550 shoulder, 400 hip, 900 hip position rendered with covers off |
| Invalid value | Base length 0 showed range error, retained 900 mm model, disabled Save |
| Cover switch | 34 → 32 visible bodies; interior frame and mounting gussets visible |
| Quick cover button | Updated both button and sidebar switch state |
| Camera presets | ISO, Top, Front, Side and Fit exercised |
| Surface measurement | Two tray points in Top view produced 310.27 mm and a visible connecting line |
| JSON export | File reached Downloads and parsed successfully; source hash/default length verified |
| JSON import | Local test configuration changed length to 1000 mm and reported success |
| PNG export | Preview file reached Downloads, 243,274 bytes |
| Source notes dialog | Opened and closed successfully |
| Mobile | 390 × 844 CSS viewport; inputs edited successfully; no horizontal overflow |

IAB's download event wait timed out although the JSON file was actually saved. The downloaded file was independently read and validated on disk. Import succeeded through the browser file chooser.

## Visual inspection

Reference: [generated interface concept](concept.png). Final screenshots: [desktop](evidence/desktop.png), [mobile](evidence/mobile.png), [combined configuration with cover hidden](evidence/configured.png). The concept and final screenshots were opened with `view_image` in the same inspection pass.

Desktop was inspected at 1280 × 720 and 1280 × 900. A 1536 × 1024 CSS viewport was also inspected, but the IAB capture was capped/cropped at 1366 pixels wide by the host; 1280 × 900 was used for complete desktop screenshot evidence. Mobile used 390 × 844 (375 pixels of content plus scrollbar). Temporary viewport override was reset after testing.

| Comparison point | Reference and render assessment | Resolution |
|---|---|---|
| Composition | Header, left control rail, large CAD canvas, bottom readouts and status footer preserved | Native responsive layout implemented |
| Typography | Clear sans-serif hierarchy, restrained labels and numeric fields | Explicit typography on controls; system Segoe UI fallback keeps the build offline |
| Palette | Graphite panels, light neutral text, orange selections/switches | Tokens matched; grid opacity reduced for legibility |
| Controls | Base/Wheels/Body tabs, numeric rows, cover switch, camera segments | Implemented as working native DOM controls |
| CAD asset | Concept robot was illustrative and differs substantially from the supplied model | Actual STEP geometry takes precedence; no invented external wheels, vents, or robot frame parts |
| Content | User parameter names and units retained; derived dimensions and source notes added for clarity | Height corrected to measured 1640 mm; wheel track corrected to measured 600 mm, with explanation |
| Responsive behavior | Same design system on phone | Canvas stacks above parameters; header buttons remain inside viewport |
| Interaction state | Concept does not specify error/import/measurement states | Added matching status, validation, measurement and source-dialog surfaces |

Above-the-fold copy audit: core headings and field labels match the concept. Intentional additions are Load configuration, viewport inspection tools, component count, source filename, and interaction hints; these support the implemented workflow. Measured height is 1640 rather than the concept's illustrative 1600. No marketing content was added.

The interface was visually compared against the chosen design direction. It is deliberately **not a pixel-identical reproduction**: the original CAD, measured dimensions, working tool controls, and offline system font supersede illustrative details. No clipping or overlapping primary controls remained at the verified desktop/mobile sizes. The sidebar scrolls at short desktop heights; the cover shortcut keeps the key requested toggle in reach.

## Limits of verification

This is not a full manufacturing, collision, load, or stability validation. The source lacks drive-to-frame bracket bodies and native CAD joints. Those attachments cannot be verified or recreated from this STEP alone. Wheel assemblies remain internally aligned but require mounting review after changes. Bent-sheet interpolation is a preview approximation, not a native solid offset. Original caster ground gap of 0.0063 mm is preserved. See README and parameter-rules.md.

Only the in-app Chromium browser was tested; other browsers and physical touch devices were not independently tested. Deployment is local only.

## Theme update
User-requested dark blue-black theme applied to panels, canvas, grid, dialogs, inputs, blue control accents, selection and measurement highlights, and favicon. Strict TypeScript and production build passed; updated desktop browser screenshot checked at 1280 x 720. Current theme evidence: evidence/dark-blue-theme.png. Earlier concept and screenshots above document the original graphite/orange design.

