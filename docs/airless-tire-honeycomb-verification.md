# Airless Tire Honeycomb Fusion Verification

Record the Fusion version, operating system, date, result, and exact error text for every failed item.

## Installation and lifecycle

- [ ] Extract the ZIP and add its top-level folder through **Scripts and Add-Ins > Add-Ins > +**.
- [ ] Start the add-in and confirm **Airless Tire Honeycomb** appears in the Design workspace Utilities/Add-Ins panel.
- [ ] Stop the add-in and confirm its toolbar control disappears.
- [ ] Restart it and confirm no duplicate control appears.

## Reference analysis

- [ ] Analyze `tire airless.stl` as millimetres: 35,636 triangles, approximately 144 mm OD, 60 mm opening, 20 mm width, and 10 suggested sectors.
- [ ] Analyze `tire airless 2.stl` as millimetres: 113,080 triangles, approximately 144 mm OD, 60 mm opening, 20 mm width, and 17 suggested sectors.
- [ ] Change the unit selector and confirm every detected length rescales once from source coordinates.
- [ ] Cancel the file picker and confirm dialog values remain unchanged.

## Generate

- [ ] With defaults, Generate creates a component named **Airless Tire Honeycomb**.
- [ ] The component contains one joined BRep body.
- [ ] The browser/timeline contains rim, tread, rib extrusions, and **Honeycomb Circular Pattern**.
- [ ] The model measures 144 mm OD and 20 mm width.
- [ ] Fusion lists all seven `ATH_*` user parameters with correct units and values.
- [ ] The 10 honeycomb sectors form closed openings and join both rim and tread around 360 degrees.
- [ ] An unrelated component created before generation remains unchanged.

## Update and rollback

- [ ] Update from 10 to 17 cells and confirm the old generated occurrence is replaced by a valid 17-sector component.
- [ ] Update dimensional values and confirm measurements match the dialog.
- [ ] Enter an invalid combination and confirm final execution is disabled with an inline explanation.
- [ ] Force a geometry failure with an extreme but accepted combination; confirm the previous final component remains and no staging component remains.
- [ ] With multiple copied generated components present, confirm Update requires an explicit target.

## Preview and cleanup

- [ ] Enable preview and confirm a temporary preview component appears.
- [ ] Change an input and confirm the prior preview is removed before the new preview appears.
- [ ] Disable preview and confirm no preview component remains.
- [ ] Cancel the command and confirm no preview or staging component remains.
- [ ] Trigger a preview error and confirm the previous final component and unrelated components remain unchanged.

## Recorded result

- Fusion version:
- Operating system:
- Date:
- Passed:
- Failed:
- Notes and exact errors:
