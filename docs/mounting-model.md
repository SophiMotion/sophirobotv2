# Mounting skeleton update

Source: `source-model/Assembly_V2_Appearance mounting .step`.

All 551 source bodies are included on V1. V2 substitutes its existing enclosed-wheel platform and retains the updated upper skeleton. Thirteen black/white outer covers are retained from Appearance 2 with their original neutral shapes; this STEP contains no replacement covers. The lower-leg covers have not been redesigned for the longer tubes. Combined totals: V1 564 bodies, V2 547 bodies.

Tube defaults: diameter 50 mm, wall 2 mm, upper arm 120 mm, lower arm 200 mm, thigh 320 mm, lower leg 400 mm. The original split thigh tubes are now single bodies. Existing head, hip and shoulder joint centers are unchanged. Twenty-seven added mounting bodies are mapped explicitly in `src/mounting-parts.json`. Limb collars stay rigid while their positions follow their fraction along the tube. Chest mounts stay rigid and follow torso height/width interpolation. These are preview deformation rules, not a native parametric CAD solve.

Source lower-leg tips are at Z=267.5 mm above the reference plane: 17.5 mm above the 250 mm deck. Preview validation now accepts that source clearance and rejects smaller gaps; this is not a hardware safety certification. Original appearance covers remain optional. Model content hashes include both mounting STEP and retained-cover STEP; V2 also includes the platform STEP. Older saved configurations have different source hashes and must be recreated.

## Reproduce conversion

```powershell
node scripts/inspect-mounting.cjs "source-model/Assembly_V2_Appearance_2 .step" .qa/appearance2
node scripts/inspect-mounting.cjs "source-model/Assembly_V2_Appearance mounting .step"
node scripts/update-mounting-model.cjs
pnpm test
pnpm build
```

The source-to-canonical body map is `scripts/mounting-id-map.json`. The update script checks every default skeleton vertex against the supplied STEP conversion before writing assets. Maximum observed coordinate error: 2.28e-13 mm. Meshes are tessellated with 0.15 mm linear deflection. Joint motion is not collision checked. Browser automation was unavailable; geometry checks and build/test validation were used.
