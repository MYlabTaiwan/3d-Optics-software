"""
OptiPath 3D - Component Catalog Database
========================================
Comprehensive database of Thorlabs, Olympus, Zeiss, Princeton Instruments,
and Andor parts.
Includes 3D geometry parameters, optical properties, mechanical post defaults,
dimensional specifications, and STEP/STL/CAD metadata references.
"""

from typing import Dict, Any, List

CATALOG: Dict[str, Dict[str, Any]] = {
    # -------------------------------------------------------------------------
    # LASERS & LIGHT SOURCES
    # -------------------------------------------------------------------------
    "F280FC-532": {
        "id": "F280FC-532",
        "name": "532nm Fiber Laser Collimator (Green)",
        "catalog_part": "F280FC-A",
        "vendor": "Thorlabs",
        "category": "Light Sources",
        "description": "Fiber-coupled collimation package for 532 nm laser, Ø2.8mm waist, mounted in CP33 cage plate.",
        "type": "laser_source",
        "wavelength_nm": 532.0,
        "beam_diameter_mm": 2.8,
        "default_height_mm": 100.0,
        "color_hex": "#00FF41",
        "dimensions": {"width": 41.0, "height": 41.0, "length": 55.0},
        "optical_center_offset_mm": 25.4,
        "mount_part": "CP33",
        "post_stack": {"base": "BA2", "post_holder": "PH50", "post": "TR75", "extension_mm": 14.6},
        "cad_file": "models/thorlabs_f280fc.step"
    },
    "HNL100LB": {
        "id": "HNL100LB",
        "name": "HeNe Laser Head 632.8nm (Red)",
        "catalog_part": "HNL100LB",
        "vendor": "Thorlabs",
        "category": "Light Sources",
        "description": "Helium-Neon Gas Laser, 632.8 nm, 10 mW polarized beam, cylindrical tube Ø44.5mm x 350mm.",
        "type": "laser_source",
        "wavelength_nm": 632.8,
        "beam_diameter_mm": 1.2,
        "default_height_mm": 100.0,
        "color_hex": "#FF1E1E",
        "dimensions": {"width": 55.0, "height": 70.0, "length": 350.0},
        "optical_center_offset_mm": 35.0,
        "mount_part": "RCL2",
        "post_stack": {"base": "BA2", "post_holder": "PH50", "post": "TR50", "extension_mm": 5.0},
        "cad_file": "models/thorlabs_hnl100.step"
    },
    "LD-785": {
        "id": "LD-785",
        "name": "785nm Raman Diode Laser Head (NIR)",
        "catalog_part": "LD785-SE400",
        "vendor": "Thorlabs",
        "category": "Light Sources",
        "description": "Narrow-linewidth 785 nm laser module for Raman spectroscopy, integrated isolator and TEC cooler.",
        "type": "laser_source",
        "wavelength_nm": 785.0,
        "beam_diameter_mm": 1.8,
        "default_height_mm": 100.0,
        "color_hex": "#B41414",
        "dimensions": {"width": 60.0, "height": 65.0, "length": 120.0},
        "optical_center_offset_mm": 30.0,
        "mount_part": "DIRECT",
        "post_stack": {"base": "BA2", "post_holder": "PH50", "post": "TR50", "extension_mm": 10.0},
        "cad_file": "models/laser_785nm.step"
    },
    "LD-405": {
        "id": "LD-405",
        "name": "405nm Violet Diode Laser (UV/Violet)",
        "catalog_part": "CPS405",
        "vendor": "Thorlabs",
        "category": "Light Sources",
        "description": "405 nm collimated diode laser module, Ø11mm housing with SM1 external thread adapter.",
        "type": "laser_source",
        "wavelength_nm": 405.0,
        "beam_diameter_mm": 1.5,
        "default_height_mm": 100.0,
        "color_hex": "#7B1FA2",
        "dimensions": {"width": 40.0, "height": 40.0, "length": 80.0},
        "optical_center_offset_mm": 25.4,
        "mount_part": "AD11F",
        "post_stack": {"base": "BA2", "post_holder": "PH50", "post": "TR75", "extension_mm": 14.6},
        "cad_file": "models/thorlabs_cps405.step"
    },

    # -------------------------------------------------------------------------
    # MIRROR MOUNTS & MIRRORS
    # -------------------------------------------------------------------------
    "KM100": {
        "id": "KM100",
        "name": "1in Kinematic Mirror Mount (BB1-E02)",
        "catalog_part": "KM100",
        "vendor": "Thorlabs",
        "category": "Mirrors",
        "description": "Premier kinematic mount for Ø1in (25.4mm) optics, with BB1-E02 broadband dielectric mirror (400-750nm).",
        "type": "mirror",
        "clear_aperture_mm": 21.0,
        "optic_diameter_mm": 25.4,
        "optic_part": "BB1-E02",
        "optic_desc": "Ø1in Broadband Dielectric Mirror (400-750 nm)",
        "default_height_mm": 100.0,
        "optical_center_offset_mm": 25.4,
        "dimensions": {"width": 44.5, "height": 50.8, "length": 25.4},
        "post_stack": {"base": "BA2", "post_holder": "PH50", "post": "TR75", "extension_mm": 14.6},
        "cad_file": "models/thorlabs_km100.step"
    },
    "TRF90": {
        "id": "TRF90",
        "name": "Thorlabs TRF90 Flip Mirror Mount",
        "catalog_part": "TRF90",
        "vendor": "Thorlabs",
        "category": "Mirrors",
        "description": "Kinematic 90° flip mount for Ø1in optics with BB1-E02 mirror. In engaged state, reflects 90° perpendicular; in bypassed state, flips down allowing beam to pass straight horizontally.",
        "type": "flip_mirror",
        "is_flip_mirror": True,
        "flip_state": "engaged",
        "flip_angle_deg": 90.0,
        "clear_aperture_mm": 21.0,
        "optic_diameter_mm": 25.4,
        "optic_part": "BB1-E02",
        "optic_desc": "Ø1in Broadband Dielectric Mirror (400-750 nm)",
        "default_height_mm": 100.0,
        "optical_center_offset_mm": 25.4,
        "dimensions": {"width": 48.0, "height": 55.0, "length": 30.0},
        "post_stack": {"base": "BA2", "post_holder": "PH50", "post": "TR75", "extension_mm": 14.6},
        "cad_file": "models/thorlabs_trf90.step"
    },
    "POLARIS-K1": {
        "id": "POLARIS-K1",
        "name": "Polaris 1in Ultra-Stable Mount (BB1-E02)",
        "catalog_part": "POLARIS-K1",
        "vendor": "Thorlabs",
        "category": "Mirrors",
        "description": "High-stability low-drift kinematic mirror mount for thermally demanding experiments.",
        "type": "mirror",
        "clear_aperture_mm": 21.0,
        "optic_diameter_mm": 25.4,
        "optic_part": "BB1-E02",
        "optic_desc": "Ø1in Broadband Dielectric Mirror (400-750 nm)",
        "default_height_mm": 100.0,
        "optical_center_offset_mm": 25.4,
        "dimensions": {"width": 48.0, "height": 52.0, "length": 28.0},
        "post_stack": {"base": "BA2", "post_holder": "PH50", "post": "TR75", "extension_mm": 14.6},
        "cad_file": "models/thorlabs_polaris_k1.step"
    },
    "KM200": {
        "id": "KM200",
        "name": "2in Kinematic Mirror Mount (BB2-E02)",
        "catalog_part": "KM200",
        "vendor": "Thorlabs",
        "category": "Mirrors",
        "description": "Kinematic mount for Ø2in (50.8mm) optics, with BB2-E02 broadband mirror for large beam paths.",
        "type": "mirror",
        "clear_aperture_mm": 45.0,
        "optic_diameter_mm": 50.8,
        "optic_part": "BB2-E02",
        "optic_desc": "Ø2in Broadband Dielectric Mirror (400-750 nm)",
        "default_height_mm": 125.0,
        "optical_center_offset_mm": 38.1,
        "dimensions": {"width": 72.0, "height": 78.0, "length": 32.0},
        "post_stack": {"base": "BA2", "post_holder": "PH75", "post": "TR75", "extension_mm": 11.9},
        "cad_file": "models/thorlabs_km200.step"
    },

    # -------------------------------------------------------------------------
    # LENSES & CONJUGATE OPTICS
    # -------------------------------------------------------------------------
    "LMR1-AC50": {
        "id": "LMR1-AC50",
        "name": "f=50mm Achromat Lens Mount (LMR1)",
        "catalog_part": "LMR1",
        "vendor": "Thorlabs",
        "category": "Lenses",
        "description": "Ø1in lens mount holding AC254-050-A achromatic doublet lens (f=50mm, AR coated 400-700nm).",
        "type": "lens",
        "focal_length_mm": 50.0,
        "clear_aperture_mm": 22.0,
        "optic_diameter_mm": 25.4,
        "optic_part": "AC254-050-A",
        "optic_desc": "Ø1in Achromatic Doublet, f=50.0mm, ARC 400-700nm",
        "default_height_mm": 100.0,
        "optical_center_offset_mm": 25.4,
        "dimensions": {"width": 38.0, "height": 45.0, "length": 14.0},
        "post_stack": {"base": "BA2", "post_holder": "PH50", "post": "TR75", "extension_mm": 14.6},
        "cad_file": "models/thorlabs_lmr1.step",
        "suggested_conjugate_pairs": ["LMR1-AC50", "LMR1-AC100", "LMR1-AC200"]
    },
    "LMR1-AC100": {
        "id": "LMR1-AC100",
        "name": "f=100mm Achromat Lens Mount (LMR1)",
        "catalog_part": "LMR1",
        "vendor": "Thorlabs",
        "category": "Lenses",
        "description": "Ø1in lens mount holding AC254-100-A achromatic doublet lens (f=100mm, AR coated 400-700nm).",
        "type": "lens",
        "focal_length_mm": 100.0,
        "clear_aperture_mm": 22.0,
        "optic_diameter_mm": 25.4,
        "optic_part": "AC254-100-A",
        "optic_desc": "Ø1in Achromatic Doublet, f=100.0mm, ARC 400-700nm",
        "default_height_mm": 100.0,
        "optical_center_offset_mm": 25.4,
        "dimensions": {"width": 38.0, "height": 45.0, "length": 14.0},
        "post_stack": {"base": "BA2", "post_holder": "PH50", "post": "TR75", "extension_mm": 14.6},
        "cad_file": "models/thorlabs_lmr1.step",
        "suggested_conjugate_pairs": ["LMR1-AC100", "LMR1-AC200", "CONFOCAL-PINHOLE-MPH"]
    },
    "LMR1-AC200": {
        "id": "LMR1-AC200",
        "name": "f=200mm Tube / Relay Lens (LMR1)",
        "catalog_part": "LMR1",
        "vendor": "Thorlabs",
        "category": "Lenses",
        "description": "Ø1in lens mount holding AC254-200-A doublet lens, ideal for microscope tube lens or 4f relay.",
        "type": "lens",
        "focal_length_mm": 200.0,
        "clear_aperture_mm": 22.0,
        "optic_diameter_mm": 25.4,
        "optic_part": "AC254-200-A",
        "optic_desc": "Ø1in Achromatic Doublet, f=200.0mm",
        "default_height_mm": 100.0,
        "optical_center_offset_mm": 25.4,
        "dimensions": {"width": 38.0, "height": 45.0, "length": 14.0},
        "post_stack": {"base": "BA2", "post_holder": "PH50", "post": "TR75", "extension_mm": 14.6},
        "cad_file": "models/thorlabs_lmr1.step"
    },

    # -------------------------------------------------------------------------
    # CONFOCAL PINHOLES & SPECTRAL FILTERS
    # -------------------------------------------------------------------------
    "CONFOCAL-PINHOLE-MPH": {
        "id": "CONFOCAL-PINHOLE-MPH",
        "name": "Confocal Spatial Filter & Pinhole Mount",
        "catalog_part": "MPH16",
        "vendor": "Thorlabs",
        "category": "Confocal & Filters",
        "description": "XY micrometer translation mount with P50S precision Ø50µm pinhole for diffraction-limited confocal optical sectioning.",
        "type": "confocal_pinhole",
        "pinhole_diameter_um": 50.0,
        "clear_aperture_mm": 16.0,
        "default_height_mm": 100.0,
        "optical_center_offset_mm": 25.4,
        "dimensions": {"width": 55.0, "height": 65.0, "length": 35.0},
        "post_stack": {"base": "BA2", "post_holder": "PH50", "post": "TR75", "extension_mm": 14.6},
        "cad_file": "models/thorlabs_mph16.step"
    },
    "RAMAN-EDGE-FILTER": {
        "id": "RAMAN-EDGE-FILTER",
        "name": "532nm RazorEdge Raman Filter in KM100",
        "catalog_part": "LP03-532RE-25",
        "vendor": "Semrock / Thorlabs",
        "category": "Confocal & Filters",
        "description": "Ultra-steep optical edge-pass filter (OD > 6 at 532 nm, edge transition < 90 cm⁻¹) in kinematic mount.",
        "type": "filter_edge",
        "cut_on_wavelength_nm": 535.0,
        "clear_aperture_mm": 22.0,
        "default_height_mm": 100.0,
        "optical_center_offset_mm": 25.4,
        "dimensions": {"width": 44.5, "height": 50.8, "length": 25.4},
        "post_stack": {"base": "BA2", "post_holder": "PH50", "post": "TR75", "extension_mm": 14.6},
        "cad_file": "models/filter_mount.step"
    },
    "LASER-CLEANUP-FILTER": {
        "id": "LASER-CLEANUP-FILTER",
        "name": "532nm MaxLine Laser Clean-up Filter",
        "catalog_part": "LL01-532-12.5",
        "vendor": "Semrock / Thorlabs",
        "category": "Confocal & Filters",
        "description": "Laser line clean-up bandpass filter (532 ± 1.5 nm) to eliminate spontaneous laser plasma emission and fiber background.",
        "type": "filter_bandpass",
        "center_wavelength_nm": 532.0,
        "bandwidth_nm": 3.0,
        "clear_aperture_mm": 11.0,
        "default_height_mm": 100.0,
        "optical_center_offset_mm": 25.4,
        "dimensions": {"width": 38.0, "height": 45.0, "length": 14.0},
        "post_stack": {"base": "BA2", "post_holder": "PH50", "post": "TR75", "extension_mm": 14.6},
        "cad_file": "models/filter_mount.step"
    },

    # -------------------------------------------------------------------------
    # BEAMSPLITTERS & DICHROICS
    # -------------------------------------------------------------------------
    "CCM1-PBS251": {
        "id": "CCM1-PBS251",
        "name": "1in Polarizing Beamsplitter Cube (CCM1)",
        "catalog_part": "CCM1-PBS251",
        "vendor": "Thorlabs",
        "category": "Beamsplitters",
        "description": "30mm cage cube housing 25.4mm polarizing beamsplitter cube (PBS), separates s and p polarization.",
        "type": "beamsplitter_cube",
        "split_ratio": "PBS",
        "clear_aperture_mm": 20.0,
        "default_height_mm": 100.0,
        "optical_center_offset_mm": 25.4,
        "dimensions": {"width": 41.0, "height": 41.0, "length": 41.0},
        "post_stack": {"base": "BA2", "post_holder": "PH50", "post": "TR75", "extension_mm": 14.6},
        "cad_file": "models/thorlabs_ccm1.step"
    },
    "CCM1-BS013": {
        "id": "CCM1-BS013",
        "name": "1in 50:50 Non-Polarizing Beamsplitter Cube",
        "catalog_part": "CCM1-BS013",
        "vendor": "Thorlabs",
        "category": "Beamsplitters",
        "description": "30mm cage cube with 50:50 non-polarizing beamsplitter cube, 400-700nm.",
        "type": "beamsplitter_cube",
        "split_ratio": "50:50",
        "clear_aperture_mm": 20.0,
        "default_height_mm": 100.0,
        "optical_center_offset_mm": 25.4,
        "dimensions": {"width": 41.0, "height": 41.0, "length": 41.0},
        "post_stack": {"base": "BA2", "post_holder": "PH50", "post": "TR75", "extension_mm": 14.6},
        "cad_file": "models/thorlabs_ccm1.step"
    },
    "DICHROIC-CAGE-CUBE": {
        "id": "DICHROIC-CAGE-CUBE",
        "name": "532nm Raman Dichroic Beamsplitter Cube",
        "catalog_part": "C4W-Di02-R532",
        "vendor": "Semrock / Thorlabs",
        "category": "Beamsplitters",
        "description": "30mm cage cube with 45° laser Raman dichroic (reflects 532 nm laser, transmits Raman Stokes 538-800 nm).",
        "type": "dichroic_cube",
        "cut_on_wavelength_nm": 538.0,
        "clear_aperture_mm": 20.0,
        "default_height_mm": 100.0,
        "optical_center_offset_mm": 25.4,
        "dimensions": {"width": 41.0, "height": 41.0, "length": 41.0},
        "post_stack": {"base": "BA2", "post_holder": "PH50", "post": "TR75", "extension_mm": 14.6},
        "cad_file": "models/thorlabs_c4w.step"
    },

    # -------------------------------------------------------------------------
    # POLARIZATION OPTICS
    # -------------------------------------------------------------------------
    "PRM1-HWP": {
        "id": "PRM1-HWP",
        "name": "Half-Wave Plate in Rotation Mount (PRM1)",
        "catalog_part": "PRM1",
        "vendor": "Thorlabs",
        "category": "Polarization",
        "description": "360° precision rotation mount holding WPH10M-532 half-wave plate (HWP) for rotating linear polarization.",
        "type": "waveplate_hwp",
        "retardance": "lambda/2",
        "clear_aperture_mm": 20.0,
        "optic_part": "WPH10M-532",
        "optic_desc": "Ø1in Zero-Order Half-Wave Plate, 532 nm",
        "default_height_mm": 100.0,
        "optical_center_offset_mm": 25.4,
        "dimensions": {"width": 45.0, "height": 55.0, "length": 18.0},
        "post_stack": {"base": "BA2", "post_holder": "PH50", "post": "TR75", "extension_mm": 14.6},
        "cad_file": "models/thorlabs_prm1.step"
    },
    "PRM1-QWP": {
        "id": "PRM1-QWP",
        "name": "Quarter-Wave Plate in Rotation Mount (PRM1)",
        "catalog_part": "PRM1",
        "vendor": "Thorlabs",
        "category": "Polarization",
        "description": "360° precision rotation mount holding WPQ10M-532 quarter-wave plate (QWP) for circular polarization.",
        "type": "waveplate_qwp",
        "retardance": "lambda/4",
        "clear_aperture_mm": 20.0,
        "optic_part": "WPQ10M-532",
        "optic_desc": "Ø1in Zero-Order Quarter-Wave Plate, 532 nm",
        "default_height_mm": 100.0,
        "optical_center_offset_mm": 25.4,
        "dimensions": {"width": 45.0, "height": 55.0, "length": 18.0},
        "post_stack": {"base": "BA2", "post_holder": "PH50", "post": "TR75", "extension_mm": 14.6},
        "cad_file": "models/thorlabs_prm1.step"
    },
    "RSP1-POL": {
        "id": "RSP1-POL",
        "name": "Linear Polarizer in RSP1 Rotation Mount",
        "catalog_part": "RSP1",
        "vendor": "Thorlabs",
        "category": "Polarization",
        "description": "Continuous rotation mount holding LPVISE100-A linear polarizer, extinction ratio >100,000:1.",
        "type": "polarizer",
        "clear_aperture_mm": 21.0,
        "optic_part": "LPVISE100-A",
        "optic_desc": "Ø1in Linear Polarizer with AR Coating 400-700nm",
        "default_height_mm": 100.0,
        "optical_center_offset_mm": 25.4,
        "dimensions": {"width": 42.0, "height": 50.0, "length": 16.0},
        "post_stack": {"base": "BA2", "post_holder": "PH50", "post": "TR75", "extension_mm": 14.6},
        "cad_file": "models/thorlabs_rsp1.step"
    },

    # -------------------------------------------------------------------------
    # APERTURES
    # -------------------------------------------------------------------------
    "SM1D12": {
        "id": "SM1D12",
        "name": "SM1 Lever Iris Diaphragm (Ø0.8-12mm)",
        "catalog_part": "SM1D12",
        "vendor": "Thorlabs",
        "category": "Apertures",
        "description": "SM1-threaded continuously variable iris diaphragm, aperture range Ø0.8mm to Ø12.0mm.",
        "type": "iris",
        "clear_aperture_mm": 12.0,
        "min_aperture_mm": 0.8,
        "default_height_mm": 100.0,
        "optical_center_offset_mm": 25.4,
        "dimensions": {"width": 38.0, "height": 45.0, "length": 12.0},
        "post_stack": {"base": "BA2", "post_holder": "PH50", "post": "TR75", "extension_mm": 14.6},
        "cad_file": "models/thorlabs_sm1d12.step"
    },

    # -------------------------------------------------------------------------
    # PERISCOPES & CAGE SYSTEMS
    # -------------------------------------------------------------------------
    "RS99": {
        "id": "RS99",
        "name": "Thorlabs RS99 Periscope Assembly",
        "catalog_part": "RS99",
        "vendor": "Thorlabs",
        "category": "Periscopes & Cage",
        "description": "Dual-mirror periscope system for raising or lowering laser beams (50mm to 250mm elevation change).",
        "type": "periscope",
        "is_periscope": True,
        "elevation_delta_mm": 100.0,
        "default_height_mm": 100.0,
        "optical_center_offset_mm": 25.4,
        "dimensions": {"width": 50.0, "height": 220.0, "length": 75.0},
        "post_stack": {"base": "BA2", "post_holder": "PH75", "post": "TR150", "extension_mm": 20.0},
        "cad_file": "models/thorlabs_rs99.step"
    },
    "CAGE-PERISCOPE-30": {
        "id": "CAGE-PERISCOPE-30",
        "name": "30mm Cage Periscope (Dual C4W Cubes)",
        "catalog_part": "C4W-PERI",
        "vendor": "Thorlabs",
        "category": "Periscopes & Cage",
        "description": "Enclosed 30mm cage periscope using 2x C4W kinematic mirror cubes connected by 4x ER series cage rods.",
        "type": "cage_periscope",
        "is_cage_system": True,
        "is_periscope": True,
        "cage_standard": "30mm",
        "cage_rods": 4,
        "cage_rod_part": "ER6",
        "cage_plates": 2,
        "cage_plate_part": "C4W",
        "elevation_delta_mm": 115.0,
        "default_height_mm": 100.0,
        "optical_center_offset_mm": 25.4,
        "dimensions": {"width": 45.0, "height": 180.0, "length": 65.0},
        "post_stack": {"base": "BA2", "post_holder": "PH50", "post": "TR75", "extension_mm": 14.6},
        "cad_file": "models/cage_periscope.step"
    },
    "CAGE-SEGMENT-30": {
        "id": "CAGE-SEGMENT-30",
        "name": "30mm Cage System Segment (4x ER6 Rods)",
        "catalog_part": "CP33-CAGE",
        "vendor": "Thorlabs",
        "category": "Periscopes & Cage",
        "description": "Standard 30mm cage segment for rigid coaxial alignment of lenses, irises, and filters along an optical axis.",
        "type": "cage_segment",
        "is_cage_system": True,
        "cage_standard": "30mm",
        "cage_rods": 4,
        "cage_rod_part": "ER6",
        "cage_plates": 2,
        "cage_plate_part": "CP33",
        "default_height_mm": 100.0,
        "optical_center_offset_mm": 25.4,
        "dimensions": {"width": 41.0, "height": 41.0, "length": 152.4},
        "post_stack": {"base": "BA2", "post_holder": "PH50", "post": "TR75", "extension_mm": 14.6},
        "cad_file": "models/cage_segment.step"
    },

    # -------------------------------------------------------------------------
    # COMMERCIAL MICROSCOPES (ZEISS & OLYMPUS)
    # -------------------------------------------------------------------------
    "ZEISS-AXIO-IMG": {
        "id": "ZEISS-AXIO-IMG",
        "name": "Zeiss Axio Imager A2m / Z2m Upright Frame",
        "catalog_part": "430004-9901",
        "vendor": "Zeiss",
        "category": "Microscopes",
        "description": "Research metallurgical/materials upright microscope with configurable optical ports: Top phototube (Laser In or Camera), Left side mount (Camera or Spectrometer), and Rear illumination port.",
        "type": "microscope_frame",
        "microscope_series": "Zeiss Axio Imager",
        "tube_lens_focal_mm": 164.5,
        "port_configuration": {
            "top_port": "laser_in",
            "left_port": "camera",
            "rear_port": "laser_in"
        },
        "ports": {
            "top_port": {"name": "Top Phototube Port (Laser/Cam)", "relative_pos": [0.0, -35.0, 500.0], "vector": [0.0, 0.0, -1.0]},
            "left_port": {"name": "Left Side Mount (Cam/Spectro)", "relative_pos": [-100.0, 0.0, 240.0], "vector": [-1.0, 0.0, 0.0]},
            "rear_epi": {"name": "Rear Laser/Epi Port", "relative_pos": [0.0, -230.0, 350.0], "vector": [0.0, -1.0, 0.0]}
        },
        "objective_turret_center": [0.0, 0.0, 190.0],
        "dimensions": {"width": 310.0, "height": 520.0, "length": 460.0},
        "default_height_mm": 0.0,
        "post_stack": {"base": "DIRECT", "post_holder": None, "post": None},
        "cad_file": "models/zeiss_axio_imager.step"
    },
    "ZEISS-AXIO-OBS": {
        "id": "ZEISS-AXIO-OBS",
        "name": "Zeiss Axio Observer Inverted Frame",
        "catalog_part": "491001-0000",
        "vendor": "Zeiss",
        "category": "Microscopes",
        "description": "Zeiss Axio Observer research inverted microscope frame with 60mm circular dovetail side and rear ports.",
        "type": "microscope_frame",
        "microscope_series": "Zeiss Axio Observer",
        "tube_lens_focal_mm": 164.5,
        "ports": {
            "left_side": {"name": "Left Spectrometer Port", "relative_pos": [-150.0, 0.0, 160.0], "vector": [-1.0, 0.0, 0.0]},
            "rear_epi": {"name": "Rear Laser Port", "relative_pos": [0.0, -295.0, 230.0], "vector": [0.0, -1.0, 0.0]},
            "right_side": {"name": "Right Camera Port", "relative_pos": [150.0, 0.0, 160.0], "vector": [1.0, 0.0, 0.0]}
        },
        "objective_turret_center": [0.0, 0.0, 245.0],
        "dimensions": {"width": 300.0, "height": 560.0, "length": 590.0},
        "default_height_mm": 0.0,
        "post_stack": {"base": "DIRECT", "post_holder": None, "post": None},
        "cad_file": "models/zeiss_axio_observer.step"
    },
    "OLYMPUS-IX73": {
        "id": "OLYMPUS-IX73",
        "name": "Olympus IX73 Inverted Microscope Frame",
        "catalog_part": "IX73P2F",
        "vendor": "Olympus / Evident",
        "category": "Microscopes",
        "description": "Two-deck inverted research microscope frame with side camera port, rear epi-fluorescence port, and infinity optical space.",
        "type": "microscope_frame",
        "microscope_series": "Olympus IX73",
        "tube_lens_focal_mm": 180.0,
        "ports": {
            "left_side": {"name": "Left Camera/Spectro Port", "relative_pos": [-160.0, 0.0, 155.0], "vector": [-1.0, 0.0, 0.0]},
            "rear_epi": {"name": "Rear Epi-Laser Port", "relative_pos": [0.0, -290.0, 215.0], "vector": [0.0, -1.0, 0.0]},
            "right_side": {"name": "Right Camera Port", "relative_pos": [160.0, 0.0, 155.0], "vector": [1.0, 0.0, 0.0]},
            "trinocular": {"name": "Eyepiece Tube", "relative_pos": [0.0, 100.0, 480.0], "vector": [0.0, 0.0, 1.0]}
        },
        "objective_turret_center": [0.0, 0.0, 240.0],
        "dimensions": {"width": 320.0, "height": 540.0, "length": 580.0},
        "default_height_mm": 0.0,
        "post_stack": {"base": "DIRECT", "post_holder": None, "post": None},
        "cad_file": "models/olympus_ix73.step"
    },
    "OLYMPUS-BX53": {
        "id": "OLYMPUS-BX53",
        "name": "Olympus BX53 Upright Microscope Frame",
        "catalog_part": "BX53F",
        "vendor": "Olympus / Evident",
        "category": "Microscopes",
        "description": "Upright research microscope frame with rear lamphouse/laser coupling port and top camera port.",
        "type": "microscope_frame",
        "microscope_series": "Olympus BX53",
        "tube_lens_focal_mm": 180.0,
        "ports": {
            "rear_epi": {"name": "Rear Laser/Lamphouse Port", "relative_pos": [0.0, -220.0, 340.0], "vector": [0.0, -1.0, 0.0]},
            "top_camera": {"name": "Trinocular Top Port", "relative_pos": [0.0, 0.0, 450.0], "vector": [0.0, 0.0, 1.0]}
        },
        "objective_turret_center": [0.0, 0.0, 180.0],
        "dimensions": {"width": 280.0, "height": 480.0, "length": 440.0},
        "default_height_mm": 0.0,
        "post_stack": {"base": "DIRECT", "post_holder": None, "post": None},
        "cad_file": "models/olympus_bx53.step"
    },

    # -------------------------------------------------------------------------
    # SPECTROMETERS & CCD CAMERAS (PRINCETON INSTRUMENTS & ANDOR)
    # -------------------------------------------------------------------------
    "PRINCETON-ISOPLANE": {
        "id": "PRINCETON-ISOPLANE",
        "name": "Princeton Instruments IsoPlane SCT-320",
        "catalog_part": "IsoPlane-SCT320",
        "vendor": "Princeton Instruments",
        "category": "Spectrometers & Detectors",
        "description": "High-throughput imaging spectrograph, zero astigmatism Czerny-Turner design, dual exit ports, input slit height 100 mm.",
        "type": "detector_spectro",
        "focal_length_mm": 320.0,
        "aperture_f_number": 4.6,
        "input_slit_height_mm": 100.0,
        "dimensions": {"width": 380.0, "height": 220.0, "length": 410.0},
        "default_height_mm": 100.0,
        "post_stack": {"base": "DIRECT", "post_holder": None, "post": None},
        "cad_file": "models/princeton_isoplane.step"
    },
    "ANDOR-SHAMROCK": {
        "id": "ANDOR-SHAMROCK",
        "name": "Andor Shamrock 500i Research Spectrograph",
        "catalog_part": "SR-500i-D2",
        "vendor": "Andor Technology",
        "category": "Spectrometers & Detectors",
        "description": "500 mm research spectrograph with motorized dual entrance/exit ports, automated triple grating turret.",
        "type": "detector_spectro",
        "focal_length_mm": 500.0,
        "aperture_f_number": 6.5,
        "input_slit_height_mm": 100.0,
        "dimensions": {"width": 420.0, "height": 240.0, "length": 460.0},
        "default_height_mm": 100.0,
        "post_stack": {"base": "DIRECT", "post_holder": None, "post": None},
        "cad_file": "models/andor_shamrock.step"
    },
    "ANDOR-IXON": {
        "id": "ANDOR-IXON",
        "name": "Andor iXon Ultra 888 Back-Illuminated EMCCD",
        "catalog_part": "DU-888U3-CS0-#BV",
        "vendor": "Andor Technology",
        "category": "Spectrometers & Detectors",
        "description": "1024x1024 EMCCD camera, single photon sensitivity, -100°C vacuum thermoelectric cooling.",
        "type": "camera",
        "sensor_format": "13.3 x 13.3 mm",
        "dimensions": {"width": 115.0, "height": 115.0, "length": 140.0},
        "default_height_mm": 100.0,
        "optical_center_offset_mm": 57.5,
        "post_stack": {"base": "BA2", "post_holder": "PH50", "post": "TR50", "extension_mm": 5.0},
        "cad_file": "models/andor_ixon.step"
    },
    "PIXIS-CCD": {
        "id": "PIXIS-CCD",
        "name": "Princeton Instruments PIXIS 100B Deep-Cooled CCD",
        "catalog_part": "PIXIS-100B",
        "vendor": "Princeton Instruments",
        "category": "Spectrometers & Detectors",
        "description": "1340x100 spectroscopy CCD, ultra-low dark current, deep-depletion silicon for high NIR Raman QE.",
        "type": "camera",
        "sensor_format": "26.8 x 2.0 mm",
        "dimensions": {"width": 110.0, "height": 110.0, "length": 135.0},
        "default_height_mm": 100.0,
        "optical_center_offset_mm": 55.0,
        "post_stack": {"base": "BA2", "post_holder": "PH50", "post": "TR50", "extension_mm": 5.0},
        "cad_file": "models/pixis_ccd.step"
    },
    "ZEISS-AXIOCAM": {
        "id": "ZEISS-AXIOCAM",
        "name": "Zeiss Axiocam Microscope Camera Head",
        "catalog_part": "426560-9010",
        "vendor": "Zeiss",
        "category": "Spectrometers & Detectors",
        "description": "Signature blue cube Zeiss Axiocam color/monochrome digital microscope camera with active Peltier cooling.",
        "type": "camera",
        "clear_aperture_mm": 18.0,
        "dimensions": {"width": 65.0, "height": 65.0, "length": 65.0},
        "default_height_mm": 100.0,
        "optical_center_offset_mm": 32.5,
        "post_stack": {"base": "BA2", "post_holder": "PH50", "post": "TR50", "extension_mm": 5.0},
        "cad_file": "models/zeiss_axiocam.step"
    },

    # -------------------------------------------------------------------------
    # MULTI-LEVEL DECKS & BREADBOARDS
    # -------------------------------------------------------------------------
    "BREADBOARD-BRIDGE-4560": {
        "id": "BREADBOARD-BRIDGE-4560",
        "name": "Elevated Bridge Breadboard (450x600mm)",
        "catalog_part": "PBH4560",
        "vendor": "Thorlabs",
        "category": "Multi-Level Decks",
        "description": "Elevated second-level optical breadboard on 4 rigid damping posts, raises secondary setup 200mm above table.",
        "type": "deck_breadboard",
        "is_deck": True,
        "elevation_mm": 200.0,
        "dimensions": {"width": 450.0, "height": 58.0, "length": 600.0},
        "grid_pitch_mm": 25.0,
        "support_posts": 4,
        "support_post_part": "DP14A",
        "post_stack": {"base": "DIRECT", "post_holder": None, "post": None},
        "cad_file": "models/thorlabs_pbh4560.step"
    },
    "SHELF-OVERHEAD-6090": {
        "id": "SHELF-OVERHEAD-6090",
        "name": "Overhead Instrument Shelf (600x900mm)",
        "catalog_part": "TFA90",
        "vendor": "Thorlabs",
        "category": "Multi-Level Decks",
        "description": "Overhead equipment deck for laser power supplies, chillers, and controllers, mounted on perimeter frame.",
        "type": "overhead_shelf",
        "is_deck": True,
        "elevation_mm": 450.0,
        "dimensions": {"width": 600.0, "height": 40.0, "length": 900.0},
        "grid_pitch_mm": 0.0,
        "support_posts": 4,
        "support_post_part": "PFR90",
        "post_stack": {"base": "DIRECT", "post_holder": None, "post": None},
        "cad_file": "models/overhead_shelf.step"
    }
}


def get_all_categories() -> List[str]:
    """Returns sorted list of distinct categories in the catalog."""
    cats = set(comp["category"] for comp in CATALOG.values())
    order = [
        "Light Sources",
        "Mirrors",
        "Lenses",
        "Confocal & Filters",
        "Beamsplitters",
        "Polarization",
        "Apertures",
        "Periscopes & Cage",
        "Microscopes",
        "Spectrometers & Detectors",
        "Multi-Level Decks"
    ]
    return [c for c in order if c in cats] + sorted(list(cats - set(order)))


def get_components_by_category(category: str) -> List[Dict[str, Any]]:
    """Returns all components belonging to a specific category."""
    return [comp for comp in CATALOG.values() if comp.get("category") == category]


# ---------------------------------------------------------------------------
# Cube base insert library & generated dichroic / clean-up filter parts
# ---------------------------------------------------------------------------
CUBE_INSERT_LIBRARY: Dict[str, Dict[str, Any]] = {
    "NONE": {"label": "Empty cube (no insert)", "part": "C4W", "vendor": "Thorlabs", "mode": "none", "cut": 0.0},
    "DM-R488": {"label": "Di02-R488", "part": "Di02-R488-25x36", "vendor": "Semrock", "mode": "longpass", "cut": 494.0},
    "DM-R532": {"label": "Di02-R532", "part": "Di02-R532-25x36", "vendor": "Semrock", "mode": "longpass", "cut": 538.0},
    "DM-R561": {"label": "Di02-R561", "part": "Di02-R561-25x36", "vendor": "Semrock", "mode": "longpass", "cut": 567.0},
    "DM-R594": {"label": "Di02-R594", "part": "Di02-R594-25x36", "vendor": "Semrock", "mode": "longpass", "cut": 600.0},
    "DM-R635": {"label": "Di02-R635", "part": "Di02-R635-25x36", "vendor": "Semrock", "mode": "longpass", "cut": 641.0},
    "DM-R785": {"label": "Di02-R785", "part": "Di02-R785-25x36", "vendor": "Semrock", "mode": "longpass", "cut": 794.0},
    "DMLP425": {"label": "DMLP425", "part": "DMLP425", "vendor": "Thorlabs", "mode": "longpass", "cut": 425.0},
    "DMLP505": {"label": "DMLP505", "part": "DMLP505", "vendor": "Thorlabs", "mode": "longpass", "cut": 505.0},
    "DMLP550": {"label": "DMLP550", "part": "DMLP550", "vendor": "Thorlabs", "mode": "longpass", "cut": 550.0},
    "DMLP605": {"label": "DMLP605", "part": "DMLP605", "vendor": "Thorlabs", "mode": "longpass", "cut": 605.0},
    "DMSP550": {"label": "DMSP550", "part": "DMSP550", "vendor": "Thorlabs", "mode": "shortpass", "cut": 550.0},
    "DMSP650": {"label": "DMSP650", "part": "DMSP650", "vendor": "Thorlabs", "mode": "shortpass", "cut": 650.0},
}


def dichroic_reflects(mode: str, cut_on_nm: float, wavelength_nm: float) -> bool:
    """Longpass dichroics reflect below cut-on; shortpass dichroics reflect above it."""
    if mode == "none":
        return False
    return wavelength_nm > cut_on_nm if mode == "shortpass" else wavelength_nm < cut_on_nm


def _register_generated_parts() -> None:
    base = CATALOG["DICHROIC-CAGE-CUBE"]
    base["cube_insert_id"] = "DM-R532"
    base["dichroic_mode"] = "longpass"

    CATALOG["CUBE-BASE-30"] = dict(
        base, id="CUBE-BASE-30", name="30mm Cage Cube Base + Swappable Insert",
        catalog_part="C4W + DFM1-style insert", cube_insert_id="DM-R532"
    )

    for key, ins in CUBE_INSERT_LIBRARY.items():
        if key == "DM-R532":
            continue
        pid = "DICHROIC-" + key.replace("DM-", "", 1)
        CATALOG[pid] = dict(
            base, id=pid, name=f"{ins['label']} Dichroic Cube", catalog_part=ins["part"],
            vendor=ins["vendor"], cut_on_wavelength_nm=ins["cut"],
            dichroic_mode=ins["mode"], cube_insert_id=key
        )

    CATALOG["MONO-FIBER-SOURCE"] = dict(
        CATALOG["F280FC-532"], id="MONO-FIBER-SOURCE",
        name="Monochromator Fiber Output + Collimator", catalog_part="SM1FCA + F280FC-A",
        vendor="Princeton Instruments / Thorlabs", wavelength_nm=600.0, tunable=True,
        tunable_range_nm=[350, 900], fiber_coupled=True, color_hex="#ffb000"
    )

    clean = CATALOG["LASER-CLEANUP-FILTER"]
    for wl in (488, 561, 633, 785):
        pid = f"LASER-CLEANUP-{wl}"
        CATALOG[pid] = dict(
            clean, id=pid, name=f"{wl}nm MaxLine Clean-up Filter",
            catalog_part=f"LL01-{wl}-12.5", center_wavelength_nm=float(wl),
            bandwidth_nm=5.0 if wl >= 700 else 3.0
        )


_register_generated_parts()

