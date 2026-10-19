> Current source is model 3, 556 bodies, with independent L/R arms and legs. See [model-v3.md](model-v3.md) for current mappings and [verification-v3.md](verification-v3.md) for checks. Earlier version notes below are historical where superseded.

# Implemented geometry rules

The source is Z-up, X-width, Y-length. Defaults preserve original coordinates. All transforms are recomputed from immutable source arrays. No source file is edited.

| Parameter | Affected geometry | Rule |
|---|---|---|
| Base length | Tray, covers | Symmetric Y envelope; preserve spine aperture and wheel-opening centers; change end-ramp position with half-length delta |
| Base width | Tray, covers, transverse frame rails and side uprights | Symmetric X envelope; crossrails extend to inside wall; side supports follow wall with fixed 40 mm profile |
| Base height | Tray, covers, upper base rails, vertical supports, hip | Deck = 50 + height; upper frame rail stays 2 mm below cover underside; vertical supports meet upper/lower rails; hip follows deck |
| Total height | Spine, shoulder | Spine top = total height − 59.25; shoulder translates to meet spine; its section stays 40 mm |
| Wheel base | Drive assemblies, caster assemblies, wheel openings | Front drive moves +Δ/2 in Y; rear caster pivot moves −Δ/2; rigid motor/hub moves with front wheel |
| Wheel track | All wheel assemblies and drive openings | Left/right move −/+ Δ/2 in X; source centers start at ±300 |
| Tire OD | Drive tires, rims, motors and hubs | Axis moves to OD/2; tire radial map has anchors at inner and outer radius; rim outer radius follows tire inner radius, while bore within radius 25 mm stays fixed |
| Tire thickness | Tires and rims | Inner tire radius = (OD − thickness)/2; radial material thickness = thickness/2; hub remains unchanged |
| Thin sheet | Tray, covers, base frame and spine base | Exterior planes stay at Z=50 and Z=50+height; interior planes offset by thickness; lateral wall inner planes follow thickness; frame contacts follow inner planes |
| Structural sheet | Nine spine mounting bodies (12–20) | Each plate thickness scales along its thin axis from its mounting face. Base plate top and side/gusset contact origins follow the new thickness |
| Base angle | Tray and covers | Nominal end-ramp run = ((height − middle)/2)/tan(angle), with source bend-location offset retained; interpolate source Y coordinates to new ramp anchor |
| Middle length | Tray and covers | Set lower ramp endpoint at Z=50+(height−middle)/2 and upper ramp endpoint at Z=50+(height+middle)/2; remap ramp Y run |
| Shoulder length | Shoulder body 26 | Symmetric X scale only; Y/Z cross-section remains 40 mm |
| Hip length | Hip bodies 32–33 | Fixed inner endpoints X=±40; outer endpoints at ±length/2 |
| Hip position | Hip bodies 32–33 | Lower face = 50 + base height + hip position |

## Constraints

All inputs must be finite and in the ranges shown in the UI and README. Additional checks require:

- at least 20 mm available for each end ramp;
- drive opening plus 6 mm margin lies before the end ramp;
- each motor has 81 mm outboard clearance to the wall, plus wall thickness;
- rim diameter ≥70 mm to clear the fixed hub;
- tire has at least 8 mm clearance below the cover;
- at least 80 mm separation between hip and shoulder regions.

Invalid inputs are never silently clamped. The previous valid model remains visible and export is disabled until corrected. The limitations in README and the app's source dialog apply, particularly to bent sheet offsets and absent motor mounting brackets.

## Model 2 arm extension

The current source has 208 bodies and neutral height 1659.25 mm. Tube parameters and four-joint transforms are documented in [model-v2.md](model-v2.md). Shoulder resizing also translates the complete arm by half the length delta.
