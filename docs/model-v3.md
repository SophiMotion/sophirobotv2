# Model 3 mapping

Source: Assembly testing website 3.step. SHA-256: 1cc9ae068179757355fcaf17a3f9aff47fe3d1c5ba6bf6429cf6319da90e0524. 556 bodies. Neutral bounds: 850 × 900 × 1659.249696 mm. Bodies 0–31 and 34–207 match model 2 coordinates; hip bodies 32–33 now extend to X ±200 (400 mm overall).

L=+X, R=−X, facing +Y. Source-based local deformations precede hierarchical joint matrices. Right-side transforms are mirrored about X=0. Equal L/R angles therefore produce mirrored movement. Each limb has independent pose/mode state.

| Limb | Source bodies | Joint ownership |
|---|---|---|
| Arm L | 34–221 | First housing 34–97 fixed; lift carries 98+; swing carries 162+; twist carries 185+; elbow carries 207–221 |
| Arm R | 290–466, 539–553 | First housing 290–353 fixed; lift carries 354+; swing carries 418+; twist carries 443–466 and 539–553; elbow carries 539–553 |
| Leg L | 222–289 | Hip swing housing 222–243 fixed; swing carries 244–289; hip lift carries 266–289; knee carries 289 |
| Leg R | 467–538, 554–555 | Hip swing housing 467–490 fixed; swing carries remaining leg bodies; hip lift carries 515–538 and 554–555; knee carries 555 |

Leg shaft lines (left): Y through X=179,Z=1024; X through Y=0,Z=968; knee X through Y=0,Z=652. X coordinates follow half hip-span delta; Z follows base deck and hip-position deltas. Arms retain model 2 shaft lines and user-requested shoulder limits. No wrist motion is added: distal HX assemblies follow their lower-arm tubes.

Tube IDs: 162,207,266,289,418,539,554,555. All have 50 mm OD and 2 mm radial wall. Arm lengths 200/300 mm; leg lengths default to 250/250 mm. Eight tube walls resize radially from immutable geometry. Both wrist assemblies translate with upper/lower arm cut-length changes. Motors remain rigid. The legs follow hip span and hip position without responding to arm-length edits.

Default and reset angles are zero. Leg preview limits: hip swing ±45°, hip lift ±90°, knee 0–135°. Arm limits: lift 0–360°, swing −100–40°, twist ±90°, elbow 0–135°. These are preview kinematics inferred from solids, not native joints or verified mechanical stops. Missing adapters, collisions and strength are not solved. Neutral leg clearance requires hip position ≥ 703 + (thigh length − 250) + (lower leg length − 250) mm.

Model 2 documents and evidence are historical. Current verification: verification-v3.md.

Knee direction update: positive knee angles rotate toward negative Y at neutral hip pose, on both legs. The displayed 0–135° range and neutral zero are unchanged. Saved nonzero knee angles now use this reversed direction.

Leg cut lengths are now configurable (100–500 mm each), shared by L/R. Thigh anchors at Z=933; knee axis Z=652 minus thigh-length delta; lower tube top Z=617 minus thigh-length delta. Hip placement offsets apply afterward. Motors translate rigidly. Saved configs carry both values; older model-3 configs missing these new fields load source defaults of 250 mm.
