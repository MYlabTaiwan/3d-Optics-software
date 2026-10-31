# OptiPath 3D - Optical CAD & Beam Path Workstation

An interactive, engineering-grade 3D Optical Bench & Beam Path CAD Suite for experimental optics, laser spectroscopy, Raman, and microscopy setups.

---

## 🌟 Advanced Features

### 1. UI Themes: Dark, Dim (Laser-Safe Amber), and Light (CAD)
- **🌙 Dark Mode**: Deep laboratory slate background (`#0e121a`) with glowing laser beam highlights.
- **🟠 Dim Mode**: Laser-safe darkroom amber theme (`#0c0803`) tailored for optical labs conducting sensitive single-photon, Raman, or fluorescence measurements.
- **☀️ Light Mode**: High-contrast, clean technical CAD view for documentation, publications, and grant reports.

### 2. Multi-Level Decks & Automatic Height Leveling
- **Add & Remove Decks**: Build custom elevated bridge breadboards and overhead storage shelves with custom width, length, and elevation heights.
- **Auto-Level Height**: One-click alignment buttons in the Selection Inspector to auto-level any component or deck to:
  - **Beam Axis** ($100.0\text{ mm}$)
  - **Olympus Side Port** ($155.0\text{ mm}$)
  - **Olympus Rear Epi Port** ($215.0\text{ mm}$)
  - **Zeiss Axio Imager Rear Port** ($350.0\text{ mm}$)

### 3. High-Fidelity 3D Microscope CAD Models & Configurable Optical Ports
- **Zeiss Axio Imager A2m / Z2m** (matches the real research microscope from user images):
  - **Dynamic Configurable Ports**:
    - **Top Port**: Toggle between **Laser Coupling In** (laser entry aperture collar + cage mount + glowing target reticle), **Zeiss Axiocam Blue Cube Camera**, or Open Phototube.
    - **Left Side Mount (TV Port)**: Toggle between **Zeiss Axiocam Camera** (horizontal C-mount), **Spectrometer / Fiber Collimator Port**, or Dust Cap.
    - **Rear Port**: Laser / lamphouse illumination coupling port ($Z = 350.0\text{ mm}$).
  - **Overhead Laser Injection**: Direct laser beam down from overhead periscope into top phototube, focus through nosepiece turret to stage, with Raman/fluorescence emission routed through the Left Side Port into the Axiocam camera or spectrometer!
  - **Interactive Port Swapping**: Change ports on-the-fly in the Selection Inspector with 1-click presets: `[Top Laser + Left Cam]` or `[Top Cam + Left Spec]`.
  - **Motorized Control Pods (Axio Imager.Z2m)**:
    - Right-front angled **TFT Touchscreen Docking Console** with illuminated Zeiss blue GUI display.
    - Left-front **Motorized XY/Z Joystick Drive Pod** matching user's laboratory setup.
  - Ergonomic 30° inclined binocular tube with dual eyepieces.
  - **Revolving 6-position objective nosepiece turret** with 5 installed high-NA objectives and standard magnification color rings (yellow 10x, green 20x, blue 50x, white 100x).
  - Circular rotating polarizing stage with coaxial XY drive drop knobs and sub-stage condenser carrier.
  - Pearl-white cast base with **Zeiss deep cobalt blue side panels** and `AXIO` vertical lettering.
- **Olympus IX73 Inverted Research Frame**: Two-deck chassis with left spectrometer camera port ($Z = 155.0\text{ mm}$), rear laser port ($Z = 215.0\text{ mm}$), and tube lens $f = 180\text{ mm}$.
- **Olympus BX53 Upright Frame**: Upright frame with rear lamp/laser coupling port ($Z = 340.0\text{ mm}$) and top phototube port ($Z = 450.0\text{ mm}$).
- **Zeiss Axio Observer Inverted Frame**: Inverted research frame with 60 mm circular dovetail side ($Z = 160.0\text{ mm}$) and rear ports ($Z = 230.0\text{ mm}$).

### 4. Confocal Filter & Pinhole Physics Simulator
- Live analytical calculations based on physical diffraction optics:
  - **Diffraction-limited Airy disk radius**: $r_{\text{Airy}} = 0.61 \frac{\lambda}{\text{NA}}$
  - **1 Airy Unit (1 AU) pinhole diameter**: $d_{\text{Airy, image}} = 2 \cdot r_{\text{Airy}} \cdot M_{\text{total}}$
  - **Optimal commercial Thorlabs pinhole recommendation** (e.g. Ø50µm, Ø25µm, Ø10µm `P50S`).
  - **Lateral resolution**: $\text{FWHM}_{xy} = 0.37 \frac{\lambda}{\text{NA}}$
  - **Axial sectioning depth**: $\text{FWHM}_z = \frac{1.4 \lambda n}{\text{NA}^2}$
  - **Confocal observation volume** in femtoliters ($fL$).
- 1-Click button: **`+ Add 1 AU Pinhole to Table`**.

### 5. Smart Optical Axis Ray-Snap & 4f Conjugate Pairing
- **Ray-Snap**: Placing any mirror, lens, or filter automatically snaps its optical center $(X, Y, Z)$ directly onto the active laser beam vector!
- **4f Telecentric Conjugate Lens Recommendation**: Placing a lens of focal length $f_1$ provides an intelligent suggestion to place the matched conjugate optic or confocal pinhole at distance $d = 2f$ or $f_1 + f_2$.

### 6. Recommended Laboratory Setup Presets
Selectable with 1 click from the header dropdown:
1. **🔬 Confocal Raman + Zeiss Axio Imager**:
   - 532nm Green Laser Collimator $\to$ Laser Clean-up Filter $\to$ Steering Mirror $\to$ Half-Wave Plate (HWP) $\to$ 532nm Raman Dichroic Cube $\to$ 30mm Cage Periscope (100mm to 350mm) $\to$ **Zeiss Axio Imager** $\to$ Confocal Pinhole $\to$ RazorEdge Raman Filter $\to$ **Princeton Instruments IsoPlane Spectrograph & CCD**.
2. **🔭 Confocal PL/Raman + Olympus IX73**:
   - 532nm Laser $\to$ Dichroic Cube $\to$ Cage Periscope (100mm to 155mm) $\to$ **Olympus IX73** $\to$ Confocal Pinhole $\to$ **Andor Shamrock 500i Spectrograph & iXon EMCCD**.
3. **🎯 4f Telecentric Beam Expander & Spatial Filter**:
   - Laser source $\to$ $f=50\text{ mm}$ focusing lens $\to$ Confocal Pinhole at waist $\to$ $f=200\text{ mm}$ collimating lens (4x expansion) $\to$ Kinematic mirror.

### 7. Research Spectrometers & Scientific CCDs
- **Princeton Instruments IsoPlane SCT-320**: Zero-astigmatism imaging spectrograph with micrometer entrance slit.
- **Andor Shamrock 500i**: Research spectrograph with motorized triple grating turret.
- **Andor iXon Ultra 888 EMCCD**: Back-illuminated $-100^\circ\text{C}$ deep-cooled EMCCD camera.
- **Princeton Instruments PIXIS 100B**: High-QE deep-depletion spectroscopic CCD.
- **Zeiss Axiocam**: Signature blue cube Peltier-cooled digital microscope camera head.

### 8. Image Snapshot & 3D Scene Export
- **📸 Snapshot**: 1-Click high-resolution PNG image export of your optical bench design.
- **Export 3D Scene (JSON)**: Full 3D coordinate and component layout export.
- **📋 Thorlabs BOM**: Real-time shopping list with quantities and CSV download for Thorlabs shopping carts.

### 9. CAD Database (STEP, STL, GLTF)
- Located in `optipath3d/catalog/models/` with `cad_index.json` mapping each component to manufacturer CAD download links and geometry files.

---

## 📁 Directory Structure

```
optipath3d/
├── main.py                     # Launcher (Native window or browser fallback)
├── README.md                   # Full documentation & usage guide
├── core/                       # Optical physics & mechanical math engines
│   ├── optics_engine.py        # 3D Ray tracing, Snell's law, Gaussian waist, Jones calculus
│   ├── confocal_engine.py      # Analytical Airy disk, pinhole size, and FWHM resolution
│   ├── post_math.py            # Discrete Thorlabs height math (BA2, PH, TR) & table hole grid check
│   └── bom_generator.py        # Thorlabs Bill of Materials (BOM) & CSV/Markdown exporter
├── catalog/                    # Component database & CAD specifications
│   ├── components.py           # Thorlabs, Olympus, Zeiss, Princeton, Andor parts
│   └── models/
│       └── cad_index.json      # STEP, STL, and GLTF asset specifications & dimensions
├── web/                        # WebGL 3D CAD application (100% self-contained & offline)
│   ├── index.html              # Main workstation interface
│   ├── vendor/                 # Bundled Three.js & Orbit/Transform controls
│   └── static/
│       ├── css/style.css       # Dark, Dim (amber), and Light themes
│       └── js/
│           ├── preview_viewport.js # 3D Component Preview Inspector
│           ├── three_scene.js      # Main 3D optical table, hole grids & deck engine
│           ├── raytracer.js        # Laser ray propagation, dichroics & clipping alerts
│           ├── periscope_wizard.js # 1-Click periscope & cage generator
│           ├── catalog_data.js     # Component specs & dimensions
│           └── app.js              # Application state, presets, and export tools
└── tests/
    └── test_optipath.py        # Automated test suite (All 8 tests passing)
```

---

## 🚀 How to Run

```bash
# 1. Standard Desktop Launch:
python optipath3d/main.py

# 2. Or launch in default web browser:
python optipath3d/main.py --browser

# 3. Run automated tests:
python -m unittest optipath3d.tests.test_optipath -v
```
