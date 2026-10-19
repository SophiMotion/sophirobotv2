# Model 2 verification — 2026-09-11

Source: Assembly testing website 2 .step. SHA-256 a8c1c7cb8844e76c1af1f11b3789459f1c785a2740593d330a3fecc862405119; verified again after implementation. 208 bodies, 224860 vertices. The first 34 bodies match the previous source vertex-for-vertex.

## Automated checks

59 tests passed across geometry (39), arm geometry/kinematics/import (16), and configuration (4). Strict TypeScript and Vite production build passed. Tests cover source identity at defaults, all 19 dimensions, hollow-tube radii, cut lengths, rigid actuators, joint ownership and pivot continuity, range validation and pose serialization.

## Production browser checks

- New 208-body assembly loads with no browser warnings/errors.
- Four tube fields changed to 60 mm diameter, 3 mm wall, 260 mm upper and 400 mm lower while posed.
- All four joints exercised; chain moves with its parents. Keyboard slider adjustment updates its numeric field.
- Fixed mode disables angles and retains exactly the selected pose/envelope; Movable unlocks them.
- Invalid tube wall and 999-degree elbow input show validation and disable saving while retaining the last valid geometry.
- Saved JSON inspected on disk: 19 dimensions, matching source hash, four angles and mode. Loaded this actual downloaded configuration through the browser file chooser; values, angles and Movable mode restored.
- Reset restores 50/2/200/300 and neutral Fixed mode. Cover toggle changes visible count 208 to 206 and back.
- Desktop and 390 × 844 mobile preview inspected. Mobile canvas reserves space for camera controls/readouts. Joint shortcut opens its controls.

Evidence: evidence/model-v2-neutral.png, evidence/model-v2-posed.png, evidence/model-v2-mobile.png.

## Limits

Only one arm and two hollow tubes exist in the supplied STEP; no leg tubes or opposite arm. Shaft-based inferred joints are preview kinematics, not imported CAD joints or verified mechanical limits. No collision or strength solver. Missing source adapter geometry remains missing. See model-v2.md for mapping details. Earlier verification.md records the prior 34-body model and is historical.

Shoulder-range update: 61 tests pass, including endpoint rejection and 360-degree return to neutral. Production build passed. Browser accepted lift 360 and swing -100/40; reset restored normal Fixed pose.
