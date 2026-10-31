/**
 * OptiPath 3D - Component Catalog & Specifications (Client Data)
 * Thorlabs, Olympus, Zeiss, Princeton Instruments, and Andor components.
 */

const COMPONENT_CATALOG = {
    // --- LIGHT SOURCES ---
    "F280FC-532": {
        id: "F280FC-532",
        name: "532nm Fiber Laser Collimator",
        part_no: "F280FC-A",
        vendor: "Thorlabs",
        category: "Light Sources",
        description: "Fiber-coupled collimation package for 532 nm laser, Ø2.8mm waist, mounted in CP33 cage plate.",
        type: "laser_source",
        wavelength_nm: 532.0,
        beam_diameter_mm: 2.8,
        default_height_mm: 100.0,
        color_hex: "#00FF41",
        dimensions: { width: 41, height: 41, length: 55 },
        optical_center_offset: 25.4,
        mount_part: "CP33",
        post_stack: { base: "BA2", post_holder: "PH50", post: "TR75", extension_mm: 14.6 }
    },
    "HNL100LB": {
        id: "HNL100LB",
        name: "HeNe Laser Head 632.8nm",
        part_no: "HNL100LB",
        vendor: "Thorlabs",
        category: "Light Sources",
        description: "Helium-Neon Gas Laser, 632.8 nm, 10 mW polarized beam, cylindrical tube Ø44.5mm x 350mm.",
        type: "laser_source",
        wavelength_nm: 632.8,
        beam_diameter_mm: 1.2,
        default_height_mm: 100.0,
        color_hex: "#FF1E1E",
        dimensions: { width: 55, height: 70, length: 350 },
        optical_center_offset: 35.0,
        mount_part: "RCL2",
        post_stack: { base: "BA2", post_holder: "PH50", post: "TR50", extension_mm: 5.0 }
    },
    "LD-785": {
        id: "LD-785",
        name: "785nm Raman Diode Laser",
        part_no: "LD785-SE400",
        vendor: "Thorlabs",
        category: "Light Sources",
        description: "Narrow-linewidth 785 nm laser module for Raman spectroscopy, integrated isolator and TEC cooler.",
        type: "laser_source",
        wavelength_nm: 785.0,
        beam_diameter_mm: 1.8,
        default_height_mm: 100.0,
        color_hex: "#B41414",
        dimensions: { width: 60, height: 65, length: 120 },
        optical_center_offset: 30.0,
        mount_part: "DIRECT",
        post_stack: { base: "BA2", post_holder: "PH50", post: "TR50", extension_mm: 10.0 }
    },
    "LD-405": {
        id: "LD-405",
        name: "405nm Violet Diode Laser",
        part_no: "CPS405",
        vendor: "Thorlabs",
        category: "Light Sources",
        description: "405 nm collimated diode laser module, Ø11mm housing with SM1 external thread adapter.",
        type: "laser_source",
        wavelength_nm: 405.0,
        beam_diameter_mm: 1.5,
        default_height_mm: 100.0,
        color_hex: "#7B1FA2",
        dimensions: { width: 40, height: 40, length: 80 },
        optical_center_offset: 25.4,
        mount_part: "AD11F",
        post_stack: { base: "BA2", post_holder: "PH50", post: "TR75", extension_mm: 14.6 }
    },

    // --- MIRRORS ---
    "KM100": {
        id: "KM100",
        name: "1in Kinematic Mirror Mount",
        part_no: "KM100",
        vendor: "Thorlabs",
        category: "Mirrors",
        description: "Premier kinematic mount for Ø1in (25.4mm) optics, with BB1-E02 broadband dielectric mirror (400-750nm).",
        type: "mirror",
        clear_aperture_mm: 21.0,
        optic_diameter_mm: 25.4,
        optic_part: "BB1-E02",
        optic_desc: "Ø1in Broadband Dielectric Mirror (400-750 nm)",
        default_height_mm: 100.0,
        optical_center_offset: 25.4,
        dimensions: { width: 44.5, height: 50.8, length: 25.4 },
        post_stack: { base: "BA2", post_holder: "PH50", post: "TR75", extension_mm: 14.6 }
    },
    "TRF90": {
        id: "TRF90",
        name: "Thorlabs TRF90 Flip Mirror Mount",
        part_no: "TRF90",
        vendor: "Thorlabs",
        category: "Mirrors",
        description: "Kinematic 90° flip mount for Ø1in optics with BB1-E02 mirror. In engaged state, reflects 90° perpendicular; in bypassed state, flips down allowing beam to pass straight horizontally.",
        type: "flip_mirror",
        is_flip_mirror: true,
        flip_state: "engaged",
        flip_angle_deg: 90.0,
        clear_aperture_mm: 21.0,
        optic_diameter_mm: 25.4,
        optic_part: "BB1-E02",
        optic_desc: "Ø1in Broadband Dielectric Mirror (400-750 nm)",
        default_height_mm: 100.0,
        optical_center_offset: 25.4,
        dimensions: { width: 48.0, height: 55.0, length: 30.0 },
        post_stack: { base: "BA2", post_holder: "PH50", post: "TR75", extension_mm: 14.6 }
    },
    "POLARIS-K1": {
        id: "POLARIS-K1",
        name: "Polaris 1in Ultra-Stable Mount",
        part_no: "POLARIS-K1",
        vendor: "Thorlabs",
        category: "Mirrors",
        description: "High-stability low-drift kinematic mirror mount for thermally demanding experiments.",
        type: "mirror",
        clear_aperture_mm: 21.0,
        optic_diameter_mm: 25.4,
        optic_part: "BB1-E02",
        optic_desc: "Ø1in Broadband Dielectric Mirror (400-750 nm)",
        default_height_mm: 100.0,
        optical_center_offset: 25.4,
        dimensions: { width: 48.0, height: 52.0, length: 28.0 },
        post_stack: { base: "BA2", post_holder: "PH50", post: "TR75", extension_mm: 14.6 }
    },
    "KM200": {
        id: "KM200",
        name: "2in Kinematic Mirror Mount",
        part_no: "KM200",
        vendor: "Thorlabs",
        category: "Mirrors",
        description: "Kinematic mount for Ø2in (50.8mm) optics, with BB2-E02 broadband mirror for large beam paths.",
        type: "mirror",
        clear_aperture_mm: 45.0,
        optic_diameter_mm: 50.8,
        optic_part: "BB2-E02",
        optic_desc: "Ø2in Broadband Dielectric Mirror (400-750 nm)",
        default_height_mm: 125.0,
        optical_center_offset: 38.1,
        dimensions: { width: 72.0, height: 78.0, length: 32.0 },
        post_stack: { base: "BA2", post_holder: "PH75", post: "TR75", extension_mm: 11.9 }
    },

    // --- LENSES ---
    "LMR1-AC50": {
        id: "LMR1-AC50",
        name: "f=50mm Achromat Lens Mount",
        part_no: "LMR1",
        vendor: "Thorlabs",
        category: "Lenses",
        description: "Ø1in lens mount holding AC254-050-A achromatic doublet lens (f=50mm, AR coated 400-700nm).",
        type: "lens",
        focal_length_mm: 50.0,
        clear_aperture_mm: 22.0,
        optic_diameter_mm: 25.4,
        optic_part: "AC254-050-A",
        optic_desc: "Ø1in Achromatic Doublet, f=50.0mm, ARC 400-700nm",
        default_height_mm: 100.0,
        optical_center_offset: 25.4,
        dimensions: { width: 38.0, height: 45.0, length: 14.0 },
        post_stack: { base: "BA2", post_holder: "PH50", post: "TR75", extension_mm: 14.6 }
    },
    "LMR1-AC100": {
        id: "LMR1-AC100",
        name: "f=100mm Achromat Lens Mount",
        part_no: "LMR1",
        vendor: "Thorlabs",
        category: "Lenses",
        description: "Ø1in lens mount holding AC254-100-A achromatic doublet lens (f=100mm, AR coated 400-700nm).",
        type: "lens",
        focal_length_mm: 100.0,
        clear_aperture_mm: 22.0,
        optic_diameter_mm: 25.4,
        optic_part: "AC254-100-A",
        optic_desc: "Ø1in Achromatic Doublet, f=100.0mm, ARC 400-700nm",
        default_height_mm: 100.0,
        optical_center_offset: 25.4,
        dimensions: { width: 38.0, height: 45.0, length: 14.0 },
        post_stack: { base: "BA2", post_holder: "PH50", post: "TR75", extension_mm: 14.6 }
    },
    "LMR1-AC200": {
        id: "LMR1-AC200",
        name: "f=200mm Tube/Relay Lens",
        part_no: "LMR1",
        vendor: "Thorlabs",
        category: "Lenses",
        description: "Ø1in lens mount holding AC254-200-A doublet lens, ideal for microscope tube lens or 4f relay.",
        type: "lens",
        focal_length_mm: 200.0,
        clear_aperture_mm: 22.0,
        optic_diameter_mm: 25.4,
        optic_part: "AC254-200-A",
        optic_desc: "Ø1in Achromatic Doublet, f=200.0mm",
        default_height_mm: 100.0,
        optical_center_offset: 25.4,
        dimensions: { width: 38.0, height: 45.0, length: 14.0 },
        post_stack: { base: "BA2", post_holder: "PH50", post: "TR75", extension_mm: 14.6 }
    },

    // --- CONFOCAL & FILTERS ---
    "CONFOCAL-PINHOLE-MPH": {
        id: "CONFOCAL-PINHOLE-MPH",
        name: "Confocal Pinhole & Micrometer Mount",
        part_no: "MPH16-P50S",
        vendor: "Thorlabs",
        category: "Confocal & Filters",
        description: "Precision XY micrometer translation mount with interchangeable pinhole (Ø50µm standard for 1 AU confocal sectioning).",
        type: "confocal_pinhole",
        pinhole_diameter_um: 50.0,
        clear_aperture_mm: 16.0,
        default_height_mm: 100.0,
        optical_center_offset: 25.4,
        dimensions: { width: 55.0, height: 65.0, length: 35.0 },
        post_stack: { base: "BA2", post_holder: "PH50", post: "TR75", extension_mm: 14.6 }
    },
    "RAMAN-EDGE-FILTER": {
        id: "RAMAN-EDGE-FILTER",
        name: "532nm RazorEdge Raman Filter",
        part_no: "LP03-532RE-25",
        vendor: "Semrock / Thorlabs",
        category: "Confocal & Filters",
        description: "Ultra-steep Raman edge-pass filter (OD > 6 at 532 nm, transition < 90 cm⁻¹) in KM100 mount.",
        type: "filter_edge",
        cut_on_wavelength_nm: 535.0,
        clear_aperture_mm: 22.0,
        default_height_mm: 100.0,
        optical_center_offset: 25.4,
        dimensions: { width: 44.5, height: 50.8, length: 25.4 },
        post_stack: { base: "BA2", post_holder: "PH50", post: "TR75", extension_mm: 14.6 }
    },
    "LASER-CLEANUP-FILTER": {
        id: "LASER-CLEANUP-FILTER",
        name: "532nm MaxLine Clean-up Filter",
        part_no: "LL01-532-12.5",
        vendor: "Semrock / Thorlabs",
        category: "Confocal & Filters",
        description: "Narrow bandpass laser clean-up filter to reject unwanted plasma/fiber side-bands.",
        type: "filter_bandpass",
        center_wavelength_nm: 532.0,
        bandwidth_nm: 3.0,
        clear_aperture_mm: 11.0,
        default_height_mm: 100.0,
        optical_center_offset: 25.4,
        dimensions: { width: 38.0, height: 45.0, length: 14.0 },
        post_stack: { base: "BA2", post_holder: "PH50", post: "TR75", extension_mm: 14.6 }
    },

    // --- BEAMSPLITTERS ---
    "CCM1-PBS251": {
        id: "CCM1-PBS251",
        name: "1in Polarizing Beamsplitter Cube",
        part_no: "CCM1-PBS251",
        vendor: "Thorlabs",
        category: "Beamsplitters",
        description: "30mm cage cube housing 25.4mm polarizing beamsplitter cube (PBS), separates s and p polarization.",
        type: "beamsplitter_cube",
        split_ratio: "PBS",
        clear_aperture_mm: 20.0,
        default_height_mm: 100.0,
        optical_center_offset: 25.4,
        dimensions: { width: 41.0, height: 41.0, length: 41.0 },
        post_stack: { base: "BA2", post_holder: "PH50", post: "TR75", extension_mm: 14.6 }
    },
    "CCM1-BS013": {
        id: "CCM1-BS013",
        name: "1in 50:50 Beamsplitter Cube",
        part_no: "CCM1-BS013",
        vendor: "Thorlabs",
        category: "Beamsplitters",
        description: "30mm cage cube with 50:50 non-polarizing beamsplitter cube, 400-700nm.",
        type: "beamsplitter_cube",
        split_ratio: "50:50",
        clear_aperture_mm: 20.0,
        default_height_mm: 100.0,
        optical_center_offset: 25.4,
        dimensions: { width: 41.0, height: 41.0, length: 41.0 },
        post_stack: { base: "BA2", post_holder: "PH50", post: "TR75", extension_mm: 14.6 }
    },
    "DICHROIC-CAGE-CUBE": {
        id: "DICHROIC-CAGE-CUBE",
        name: "532nm Raman Dichroic Cube",
        part_no: "C4W-Di02-R532",
        vendor: "Semrock / Thorlabs",
        category: "Beamsplitters",
        description: "30mm cage cube with 45° laser Raman dichroic (reflects 532nm laser, transmits Raman Stokes).",
        type: "dichroic_cube",
        cut_on_wavelength_nm: 538.0,
        clear_aperture_mm: 20.0,
        default_height_mm: 100.0,
        optical_center_offset: 25.4,
        dimensions: { width: 41.0, height: 41.0, length: 41.0 },
        post_stack: { base: "BA2", post_holder: "PH50", post: "TR75", extension_mm: 14.6 }
    },

    // --- POLARIZATION ---
    "PRM1-HWP": {
        id: "PRM1-HWP",
        name: "Half-Wave Plate in Rotation Mount",
        part_no: "PRM1",
        vendor: "Thorlabs",
        category: "Polarization",
        description: "360° precision rotation mount holding WPH10M-532 half-wave plate (HWP) for rotating linear polarization.",
        type: "waveplate_hwp",
        retardance: "lambda/2",
        clear_aperture_mm: 20.0,
        optic_part: "WPH10M-532",
        optic_desc: "Ø1in Zero-Order Half-Wave Plate, 532 nm",
        default_height_mm: 100.0,
        optical_center_offset: 25.4,
        dimensions: { width: 45.0, height: 55.0, length: 18.0 },
        post_stack: { base: "BA2", post_holder: "PH50", post: "TR75", extension_mm: 14.6 }
    },
    "PRM1-QWP": {
        id: "PRM1-QWP",
        name: "Quarter-Wave Plate in Rotation Mount",
        part_no: "PRM1",
        vendor: "Thorlabs",
        category: "Polarization",
        description: "360° precision rotation mount holding WPQ10M-532 quarter-wave plate (QWP) for circular polarization.",
        type: "waveplate_qwp",
        retardance: "lambda/4",
        clear_aperture_mm: 20.0,
        optic_part: "WPQ10M-532",
        optic_desc: "Ø1in Zero-Order Quarter-Wave Plate, 532 nm",
        default_height_mm: 100.0,
        optical_center_offset: 25.4,
        dimensions: { width: 45.0, height: 55.0, length: 18.0 },
        post_stack: { base: "BA2", post_holder: "PH50", post: "TR75", extension_mm: 14.6 }
    },
    "RSP1-POL": {
        id: "RSP1-POL",
        name: "Linear Polarizer in Rotation Mount",
        part_no: "RSP1",
        vendor: "Thorlabs",
        category: "Polarization",
        description: "Continuous rotation mount holding LPVISE100-A linear polarizer, extinction ratio >100,000:1.",
        type: "polarizer",
        clear_aperture_mm: 21.0,
        optic_part: "LPVISE100-A",
        optic_desc: "Ø1in Linear Polarizer with AR Coating 400-700nm",
        default_height_mm: 100.0,
        optical_center_offset: 25.4,
        dimensions: { width: 42.0, height: 50.0, length: 16.0 },
        post_stack: { base: "BA2", post_holder: "PH50", post: "TR75", extension_mm: 14.6 }
    },

    // --- APERTURES ---
    "SM1D12": {
        id: "SM1D12",
        name: "SM1 Iris Diaphragm (Ø0.8-12mm)",
        part_no: "SM1D12",
        vendor: "Thorlabs",
        category: "Apertures",
        description: "SM1-threaded continuously variable iris diaphragm, aperture range Ø0.8mm to Ø12.0mm.",
        type: "iris",
        clear_aperture_mm: 12.0,
        min_aperture_mm: 0.8,
        default_height_mm: 100.0,
        optical_center_offset: 25.4,
        dimensions: { width: 38.0, height: 45.0, length: 12.0 },
        post_stack: { base: "BA2", post_holder: "PH50", post: "TR75", extension_mm: 14.6 }
    },

    // --- PERISCOPES & CAGE ---
    "RS99": {
        id: "RS99",
        name: "Thorlabs RS99 Periscope Assembly",
        part_no: "RS99",
        vendor: "Thorlabs",
        category: "Periscopes & Cage",
        description: "Dual-mirror periscope system for raising or lowering laser beams (50mm to 250mm elevation change).",
        type: "periscope",
        is_periscope: true,
        elevation_delta_mm: 100.0,
        default_height_mm: 100.0,
        optical_center_offset: 25.4,
        dimensions: { width: 50.0, height: 220.0, length: 75.0 },
        post_stack: { base: "BA2", post_holder: "PH75", post: "TR150", extension_mm: 20.0 }
    },
    "CAGE-PERISCOPE-30": {
        id: "CAGE-PERISCOPE-30",
        name: "30mm Cage Periscope (Dual C4W)",
        part_no: "C4W-PERI",
        vendor: "Thorlabs",
        category: "Periscopes & Cage",
        description: "Enclosed 30mm cage periscope using 2x C4W kinematic mirror cubes connected by 4x ER series cage rods.",
        type: "cage_periscope",
        is_cage_system: true,
        is_periscope: true,
        cage_standard: "30mm",
        cage_rods: 4,
        cage_rod_part: "ER6",
        cage_plates: 2,
        cage_plate_part: "C4W",
        elevation_delta_mm: 115.0,
        default_height_mm: 100.0,
        optical_center_offset: 25.4,
        dimensions: { width: 45.0, height: 180.0, length: 65.0 },
        post_stack: { base: "BA2", post_holder: "PH50", post: "TR75", extension_mm: 14.6 }
    },
    "CAGE-SEGMENT-30": {
        id: "CAGE-SEGMENT-30",
        name: "30mm Cage Segment (4x ER6 Rods)",
        part_no: "CP33-CAGE",
        vendor: "Thorlabs",
        category: "Periscopes & Cage",
        description: "Standard 30mm cage segment for rigid coaxial alignment of lenses, irises, and filters along an optical axis.",
        type: "cage_segment",
        is_cage_system: true,
        cage_standard: "30mm",
        cage_rods: 4,
        cage_rod_part: "ER6",
        cage_plates: 2,
        cage_plate_part: "CP33",
        default_height_mm: 100.0,
        optical_center_offset: 25.4,
        dimensions: { width: 41.0, height: 41.0, length: 152.4 },
        post_stack: { base: "BA2", post_holder: "PH50", post: "TR75", extension_mm: 14.6 }
    },

    // --- COMMERCIAL MICROSCOPES ---
    "ZEISS-AXIO-IMG": {
        id: "ZEISS-AXIO-IMG",
        name: "Zeiss Axio Imager A2m / Z2m Upright",
        part_no: "430004-9901",
        vendor: "Zeiss",
        category: "Microscopes",
        description: "Research metallurgical/materials upright microscope with configurable optical ports: Top phototube (Laser In or Camera), Left side mount (Camera or Spectrometer), and Rear illumination port.",
        type: "microscope_frame",
        microscope_series: "Zeiss Axio Imager",
        tube_lens_focal_mm: 164.5,
        port_configuration: {
            top_port: "laser_in",
            left_port: "camera",
            rear_port: "laser_in"
        },
        ports: {
            top_port: { name: "Top Phototube Port (Laser/Cam)", relative_pos: [0.0, -35.0, 500.0], vector: [0.0, 0.0, -1.0] },
            left_port: { name: "Left Side Mount (Cam/Spectro)", relative_pos: [-100.0, 0.0, 240.0], vector: [-1.0, 0.0, 0.0] },
            rear_epi: { name: "Rear Laser/Epi Port", relative_pos: [0.0, -230.0, 350.0], vector: [0.0, -1.0, 0.0] }
        },
        objective_turret_center: [0.0, 0.0, 190.0],
        dimensions: { width: 310.0, height: 520.0, length: 460.0 },
        default_height_mm: 0.0,
        post_stack: { base: "DIRECT", post_holder: null, post: null }
    },
    "ZEISS-AXIO-OBS": {
        id: "ZEISS-AXIO-OBS",
        name: "Zeiss Axio Observer Inverted Frame",
        part_no: "491001-0000",
        vendor: "Zeiss",
        category: "Microscopes",
        description: "Zeiss Axio Observer research inverted microscope frame with 60mm circular dovetail side and rear ports.",
        type: "microscope_frame",
        microscope_series: "Zeiss Axio Observer",
        tube_lens_focal_mm: 164.5,
        ports: {
            left_side: { name: "Left Spectrometer Port", relative_pos: [-150.0, 0.0, 160.0], vector: [-1.0, 0.0, 0.0] },
            rear_epi: { name: "Rear Laser Port", relative_pos: [0.0, -295.0, 230.0], vector: [0.0, -1.0, 0.0] },
            right_side: { name: "Right Camera Port", relative_pos: [150.0, 0.0, 160.0], vector: [1.0, 0.0, 0.0] }
        },
        objective_turret_center: [0.0, 0.0, 245.0],
        dimensions: { width: 300.0, height: 560.0, length: 590.0 },
        default_height_mm: 0.0,
        post_stack: { base: "DIRECT", post_holder: null, post: null }
    },
    "OLYMPUS-IX73": {
        id: "OLYMPUS-IX73",
        name: "Olympus IX73 Inverted Microscope",
        part_no: "IX73P2F",
        vendor: "Olympus / Evident",
        category: "Microscopes",
        description: "Two-deck inverted research microscope frame with side camera port, rear epi-fluorescence port, and infinity optical space.",
        type: "microscope_frame",
        microscope_series: "Olympus IX73",
        tube_lens_focal_mm: 180.0,
        ports: {
            left_side: { name: "Left Camera/Spectro Port", relative_pos: [-160.0, 0.0, 155.0], vector: [-1.0, 0.0, 0.0] },
            rear_epi: { name: "Rear Epi-Laser Port", relative_pos: [0.0, -290.0, 215.0], vector: [0.0, -1.0, 0.0] },
            right_side: { name: "Right Camera Port", relative_pos: [160.0, 0.0, 155.0], vector: [1.0, 0.0, 0.0] },
            trinocular: { name: "Eyepiece Tube", relative_pos: [0.0, 100.0, 480.0], vector: [0.0, 0.0, 1.0] }
        },
        objective_turret_center: [0.0, 0.0, 240.0],
        dimensions: { width: 320.0, height: 540.0, length: 580.0 },
        default_height_mm: 0.0,
        post_stack: { base: "DIRECT", post_holder: null, post: null }
    },
    "OLYMPUS-BX53": {
        id: "OLYMPUS-BX53",
        name: "Olympus BX53 Upright Microscope",
        part_no: "BX53F",
        vendor: "Olympus / Evident",
        category: "Microscopes",
        description: "Upright research microscope frame with rear lamphouse/laser coupling port and top camera port.",
        type: "microscope_frame",
        microscope_series: "Olympus BX53",
        tube_lens_focal_mm: 180.0,
        ports: {
            rear_epi: { name: "Rear Laser/Lamphouse Port", relative_pos: [0.0, -220.0, 340.0], vector: [0.0, -1.0, 0.0] },
            top_camera: { name: "Trinocular Top Port", relative_pos: [0.0, 0.0, 450.0], vector: [0.0, 0.0, 1.0] }
        },
        objective_turret_center: [0.0, 0.0, 180.0],
        dimensions: { width: 280.0, height: 480.0, length: 440.0 },
        default_height_mm: 0.0,
        post_stack: { base: "DIRECT", post_holder: null, post: null }
    },

    // --- SPECTROMETERS & DETECTORS ---
    "PRINCETON-ISOPLANE": {
        id: "PRINCETON-ISOPLANE",
        name: "Princeton Instruments IsoPlane SCT-320",
        part_no: "IsoPlane-SCT320",
        vendor: "Princeton Instruments",
        category: "Spectrometers & Detectors",
        description: "Zero-astigmatism imaging spectrograph, dual exit camera ports, motorized micrometer input slit.",
        type: "detector_spectro",
        focal_length_mm: 320.0,
        input_slit_height_mm: 100.0,
        dimensions: { width: 380.0, height: 220.0, length: 410.0 },
        default_height_mm: 100.0,
        post_stack: { base: "DIRECT", post_holder: null, post: null }
    },
    "ANDOR-SHAMROCK": {
        id: "ANDOR-SHAMROCK",
        name: "Andor Shamrock 500i Research Spectrograph",
        part_no: "SR-500i-D2",
        vendor: "Andor Technology",
        category: "Spectrometers & Detectors",
        description: "500mm research spectrograph with motorized dual entrance/exit ports and triple grating turret.",
        type: "detector_spectro",
        focal_length_mm: 500.0,
        input_slit_height_mm: 100.0,
        dimensions: { width: 420.0, height: 240.0, length: 460.0 },
        default_height_mm: 100.0,
        post_stack: { base: "DIRECT", post_holder: null, post: null }
    },
    "ANDOR-IXON": {
        id: "ANDOR-IXON",
        name: "Andor iXon Ultra 888 EMCCD Camera",
        part_no: "DU-888U3-CS0-#BV",
        vendor: "Andor Technology",
        category: "Spectrometers & Detectors",
        description: "1024x1024 EMCCD camera, single photon sensitivity, -100°C vacuum thermoelectric cooling.",
        type: "camera",
        clear_aperture_mm: 18.0,
        dimensions: { width: 115.0, height: 115.0, length: 140.0 },
        default_height_mm: 100.0,
        optical_center_offset: 57.5,
        post_stack: { base: "BA2", post_holder: "PH50", post: "TR50", extension_mm: 5.0 }
    },
    "PIXIS-CCD": {
        id: "PIXIS-CCD",
        name: "Princeton Instruments PIXIS 100B CCD",
        part_no: "PIXIS-100B",
        vendor: "Princeton Instruments",
        category: "Spectrometers & Detectors",
        description: "1340x100 spectroscopy CCD, ultra-low dark current, deep-depletion silicon for high NIR Raman QE.",
        type: "camera",
        clear_aperture_mm: 20.0,
        dimensions: { width: 110.0, height: 110.0, length: 135.0 },
        default_height_mm: 100.0,
        optical_center_offset: 55.0,
        post_stack: { base: "BA2", post_holder: "PH50", post: "TR50", extension_mm: 5.0 }
    },
    "ZEISS-AXIOCAM": {
        id: "ZEISS-AXIOCAM",
        name: "Zeiss Axiocam Microscope Camera Head",
        part_no: "426560-9010",
        vendor: "Zeiss",
        category: "Spectrometers & Detectors",
        description: "Signature blue cube Zeiss Axiocam color/monochrome digital microscope camera with active Peltier cooling.",
        type: "camera",
        clear_aperture_mm: 18.0,
        dimensions: { width: 65.0, height: 65.0, length: 65.0 },
        default_height_mm: 100.0,
        optical_center_offset: 32.5,
        post_stack: { base: "BA2", post_holder: "PH50", post: "TR50", extension_mm: 5.0 }
    },

    // --- MULTI-LEVEL DECKS ---
    "BREADBOARD-BRIDGE-4560": {
        id: "BREADBOARD-BRIDGE-4560",
        name: "Elevated Bridge Breadboard",
        part_no: "PBH4560",
        vendor: "Thorlabs",
        category: "Multi-Level Decks",
        description: "Elevated second-level optical breadboard on 4 rigid damping posts, raises secondary setup 200mm above table.",
        type: "deck_breadboard",
        is_deck: true,
        elevation_mm: 200.0,
        dimensions: { width: 450.0, height: 58.0, length: 600.0 },
        grid_pitch_mm: 25.0,
        support_posts: 4,
        support_post_part: "DP14A",
        post_stack: { base: "DIRECT", post_holder: null, post: null }
    },
    "SHELF-OVERHEAD-6090": {
        id: "SHELF-OVERHEAD-6090",
        name: "Overhead Instrument Shelf",
        part_no: "TFA90",
        vendor: "Thorlabs",
        category: "Multi-Level Decks",
        description: "Overhead equipment deck for laser power supplies, chillers, and controllers, mounted on perimeter frame.",
        type: "overhead_shelf",
        is_deck: true,
        elevation_mm: 450.0,
        dimensions: { width: 600.0, height: 40.0, length: 900.0 },
        grid_pitch_mm: 0.0,
        support_posts: 4,
        support_post_part: "PFR90",
        post_stack: { base: "DIRECT", post_holder: null, post: null }
    }
};

// ---------------------------------------------------------------------------
// CUBE BASE INSERT LIBRARY
// A 30 mm cage cube base (Thorlabs C4W / DFM1 style) accepts swappable inserts.
// longpass dichroic: reflects wavelengths BELOW cut-on, transmits ABOVE (Raman Stokes).
// shortpass dichroic: transmits wavelengths BELOW cut-on, reflects ABOVE.
// ---------------------------------------------------------------------------
const CUBE_INSERT_LIBRARY = (function () {
    const dm = (label, part, vendor, mode, cut) => ({
        label: label, part_no: part, vendor: vendor, type: "dichroic_cube",
        dichroic_mode: mode, cut_on_wavelength_nm: cut,
        description: `45° ${mode === "longpass" ? "longpass" : "shortpass"} dichroic insert, cut-${mode === "longpass" ? "on" : "off"} ${cut} nm.`
    });
    return {
        "DM-R488":  dm("Di02-R488 (488 laser, LP 494)",  "Di02-R488-25x36", "Semrock", "longpass", 494.0),
        "DM-R532":  dm("Di02-R532 (532 laser, LP 538)",  "Di02-R532-25x36", "Semrock", "longpass", 538.0),
        "DM-R561":  dm("Di02-R561 (561 laser, LP 567)",  "Di02-R561-25x36", "Semrock", "longpass", 567.0),
        "DM-R594":  dm("Di02-R594 (594 laser, LP 600)",  "Di02-R594-25x36", "Semrock", "longpass", 600.0),
        "DM-R635":  dm("Di02-R635 (633 laser, LP 641)",  "Di02-R635-25x36", "Semrock", "longpass", 641.0),
        "DM-R785":  dm("Di02-R785 (785 laser, LP 794)",  "Di02-R785-25x36", "Semrock", "longpass", 794.0),
        "DMLP425":  dm("DMLP425 (LP 425 nm)",            "DMLP425",         "Thorlabs", "longpass", 425.0),
        "DMLP505":  dm("DMLP505 (LP 505 nm)",            "DMLP505",         "Thorlabs", "longpass", 505.0),
        "DMLP550":  dm("DMLP550 (LP 550 nm)",            "DMLP550",         "Thorlabs", "longpass", 550.0),
        "DMLP605":  dm("DMLP605 (LP 605 nm)",            "DMLP605",         "Thorlabs", "longpass", 605.0),
        "DMSP550":  dm("DMSP550 (SP 550 nm)",            "DMSP550",         "Thorlabs", "shortpass", 550.0),
        "DMSP650":  dm("DMSP650 (SP 650 nm)",            "DMSP650",         "Thorlabs", "shortpass", 650.0),
        "NONE":    { label: "Empty cube (no insert)", part_no: "C4W", vendor: "Thorlabs", type: "dichroic_cube",
                      dichroic_mode: "none", description: "Empty 30 mm cube: beam passes straight through, insert removed." },
        "BS-5050":  { label: "50:50 Non-Polarizing BS Cube", part_no: "BS013", vendor: "Thorlabs",
                      type: "beamsplitter_cube", split_ratio: "50:50", description: "50:50 beamsplitter cube insert, 400-700 nm." },
        "BS-PBS":   { label: "Polarizing BS Cube (PBS)", part_no: "PBS251", vendor: "Thorlabs",
                      type: "beamsplitter_cube", split_ratio: "PBS", description: "Polarizing beamsplitter cube insert, 420-680 nm." }
    };
})();

(function registerGeneratedParts() {
    const cubeBase = COMPONENT_CATALOG["DICHROIC-CAGE-CUBE"];
    cubeBase.cube_insert_id = "DM-R532";
    cubeBase.dichroic_mode = "longpass";
    if (COMPONENT_CATALOG["CCM1-PBS251"]) COMPONENT_CATALOG["CCM1-PBS251"].cube_insert_id = "BS-PBS";
    if (COMPONENT_CATALOG["CCM1-BS013"]) COMPONENT_CATALOG["CCM1-BS013"].cube_insert_id = "BS-5050";

    // Empty-looking generic cube base with default swappable insert
    COMPONENT_CATALOG["CUBE-BASE-30"] = Object.assign({}, cubeBase, {
        id: "CUBE-BASE-30",
        name: "30mm Cage Cube Base + Swappable Insert",
        part_no: "C4W + DFM1-style insert",
        vendor: "Thorlabs",
        description: "30 mm cage cube base with top-loading insert slot. Swap dichroic, 50:50 or PBS inserts from the inspector.",
        cube_insert_id: "DM-R532"
    });

    // One catalog card per dichroic insert (pre-fitted into a cube base)
    Object.keys(CUBE_INSERT_LIBRARY).forEach(key => {
        const ins = CUBE_INSERT_LIBRARY[key];
        if (ins.type !== "dichroic_cube" || key === "DM-R532") return;
        const id = "DICHROIC-" + key.replace(/^DM-/, "");
        COMPONENT_CATALOG[id] = Object.assign({}, cubeBase, {
            id: id,
            name: `${ins.label} Cube`,
            part_no: ins.part_no,
            vendor: ins.vendor,
            description: `30mm cage cube base with ${ins.description}`,
            cut_on_wavelength_nm: ins.cut_on_wavelength_nm,
            dichroic_mode: ins.dichroic_mode,
            cube_insert_id: key
        });
    });

    // Fiber-fed tunable monochromator excitation source (SM1 fiber adapter + collimator)
    COMPONENT_CATALOG["MONO-FIBER-SOURCE"] = Object.assign({}, COMPONENT_CATALOG["F280FC-532"], {
        id: "MONO-FIBER-SOURCE",
        name: "Monochromator Fiber Output + Collimator",
        part_no: "SM1FCA + F280FC-A",
        vendor: "Princeton Instruments / Thorlabs",
        description: "Tunable excitation (350-900 nm) from a monochromator, delivered by fiber into an SM1 fiber-mount collimator. Set wavelength in the inspector.",
        wavelength_nm: 600.0,
        tunable: true,
        tunable_range_nm: [350, 900],
        fiber_coupled: true,
        color_hex: "#ffb000"
    });

    // Laser clean-up (MaxLine) filters for other laser lines
    const cleanBase = COMPONENT_CATALOG["LASER-CLEANUP-FILTER"];
    [488, 561, 633, 785].forEach(wl => {
        const id = `LASER-CLEANUP-${wl}`;
        COMPONENT_CATALOG[id] = Object.assign({}, cleanBase, {
            id: id,
            name: `${wl}nm MaxLine Clean-up Filter`,
            part_no: `LL01-${wl}-12.5`,
            center_wavelength_nm: wl * 1.0,
            bandwidth_nm: wl >= 700 ? 5.0 : 3.0
        });
    });
})();

window.CUBE_INSERT_LIBRARY = CUBE_INSERT_LIBRARY;
window.COMPONENT_CATALOG = COMPONENT_CATALOG;
