# Two selectable mobile platforms

Use Base → Base model to choose V2 (wheel is hiding inside) or V1 (wheel is outside). The selection is remembered locally. Both options expose the same base and wheel parameter controls; each retains its edited dimensions during the current session. Upper-body dimensions, motor selections, joint poses and visibility settings are shared. Reset restores the selected platform's defaults.

V2 (wheel is hiding inside): 507 bodies, two drive wheels, two casters and two top covers. Default tray length 900 mm, width 850 mm, height 200 mm, wheel base 500 mm, track 600 mm, tire OD 150 mm, tire diameter difference 20 mm, sheet thickness 2 mm.

V1 (wheel is outside): all 524 source bodies, four wheels and one top cover. Default main tray length 1000 mm, outer platform width 700 mm, tray height 200 mm, wheel base 600 mm, track 606 mm, tire OD 190 mm, tire diameter difference 50 mm, sheet thickness 3 mm. Cover overhang adds 3 mm per end, giving a source overall length of 1006 mm. Source tray bottom Z49 and wheel axle Z99 are preserved; the imported tires have approximately 4 mm ground clearance. Upper robot geometry is identical to the current new-platform source.

Old-platform geometry has a separate deformation mapping. Its base angle and middle-length controls are mesh-based folded-sheet previews, not reconstructed native CAD bends. Base angle and middle-length use the shared 30-degree / 100-mm reference convention because STEP lacks driving parameter history. The source is exactly preserved at defaults. Structural sheet remains read-only because the imported designs have no separately adjustable structural-sheet mount.

The old source keeps its original body IDs in sourceId and uses stable application joint IDs: source 0→11, 1→22, 2→23, 3→24, 4–485→25–506. The 38 platform bodies use source ID + 1000. No source body is dropped.

Saved configuration JSON includes baseVersion and the selected source SHA-256. Loading a configuration automatically loads its matching platform; conflicting source/version combinations are rejected. Direct STEP export fetches the selected model and respects its cover setting and pose. Each platform has a corresponding Fusion helper ZIP/schema; the dialog supplies the matching download. Native Fusion mappings still require review against the user's design.

BOM example base wheel and cover quantities reflect the selection; prices/materials remain examples. Both selections are translated into Simplified Chinese. Switching stops animation and pending exports, disposes the old displayed meshes and restores the configured pose on the replacement model.

Verification: all existing tests plus old-source coordinate preservation, all four wheel transforms, cover visibility in STEP export, each base-size control, configuration identity, per-base parameter retention, and BOM examples. Offline geometry images are in docs/evidence/old-platform-neutral.png and old-platform-posed.png. Browser visual interaction remains unverified due to policy restrictions.
