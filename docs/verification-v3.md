# Model 3 verification — 2026-09-11

Source hash verified against supplied STEP: 1cc9ae068179757355fcaf17a3f9aff47fe3d1c5ba6bf6429cf6319da90e0524. 556 source bodies preserved at defaults. Current mapping is model-v3.md; earlier model 2 documentation is historical.

72 automated tests passed: 39 geometry, 18 arm, 11 four-limb, 4 configuration. Tests check every default vertex, all dimensions, independent limb ownership, mirrored poses, knee pivot continuity, eight tube walls, wrist following cut-length changes, hip attachments, and separate pose/lock serialization. Strict TypeScript and Vite production build passed.

Browser checks against localhost production build:
- Loaded all 556 bodies; dark blue-black theme retained.
- Arm L elbow 70°, Arm R lift 30°, Leg L hip lift 20°/knee 45°, Leg R hip swing 15°/knee 25° simultaneously.
- Locked only Leg R; its fields disabled and pose retained while other limbs remained Movable.
- Reset selected Leg R; Arm L still 70°.
- Saved JSON inspected on disk for all four poses and independent modes, then loaded using browser file chooser after global reset. Right-leg angle 15° and Fixed state restored visibly.
- Invalid knee 999° showed validation and disabled save; global Reset recovered normal zero Fixed poses.
- Cover toggle exercised; all components restored visible.
- Mobile 390×844: four limb buttons and leg numeric/slider controls fit without horizontal clipping.
- Browser warnings/errors: none during checked interactions.

Evidence: evidence/model-v3-neutral.png, evidence/model-v3-posed.png, evidence/model-v3-mobile-controls.png.

Limits: shaft-inferred preview kinematics, provisional leg ranges, no collision or manufacturing solver; missing adapters remain absent. Thigh/lower-leg tube lengths stay at source 250 mm. No wrist articulation is claimed.
Knee reversal verified: regression test failed with old +Y direction and passes with new -Y direction on both legs. 73 tests and production build pass. Browser checked both knees at 90 degrees.
Leg-length update: 78 tests pass; production build passed. Browser resized thighs to 300 mm and lower legs to 275 mm, then bent only left knee to 65 degrees. Tests verify exact cut lengths, rigid knee translation, shared pivot after resizing, combined deck clearance, and old/new configuration loading.
