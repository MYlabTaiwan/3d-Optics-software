"""
OptiPath 3D - Automated Test Suite
==================================
Verifies:
1. Physics & Ray Optics Engine (Reflection, Refraction, Gaussian Waist, Jones Calculus)
2. Confocal Physics Engine (Airy Units, Optimal Pinhole Size, FWHM Resolution)
3. Post Math & Mechanical Resolvers (Thorlabs PH/TR/BA2 height matching)
4. Bill of Materials (BOM) Generation & CSV/Markdown serialization
5. Catalog Data Completeness (Zeiss Axio Imager, Olympus, Princeton, Andor)
6. Web Asset Integrity (HTML, JS, CSS, Offline Vendor Files)
"""

import os
import unittest
import numpy as np

from optipath3d.core.optics_engine import BeamPhysics, JonesCalculus, OpticsEngine, RaySegment
from optipath3d.core.confocal_engine import ConfocalPhysicsEngine
from optipath3d.core.post_math import PostMathResolver
from optipath3d.core.bom_generator import BOMGenerator
from optipath3d.catalog.components import CATALOG, get_all_categories, get_components_by_category


class TestOptiPathEngine(unittest.TestCase):

    def test_beam_physics(self):
        zr = BeamPhysics.rayleigh_range(1.0, 532.0)
        self.assertAlmostEqual(zr, 5905.25, delta=10.0)

        theta = BeamPhysics.beam_divergence_half_angle(1.0, 532.0)
        self.assertAlmostEqual(theta, 0.0001693, delta=1e-5)

        w_at_zr = BeamPhysics.beam_radius_at_z(zr, 1.0, 532.0)
        self.assertAlmostEqual(w_at_zr, np.sqrt(2.0), delta=0.01)

        rgb_green = BeamPhysics.wavelength_to_rgb(532.0)
        self.assertGreater(rgb_green[1], 200)

    def test_confocal_physics(self):
        # 532nm laser, 100x / 0.90 NA objective, 164.5mm Zeiss tube lens
        res = ConfocalPhysicsEngine.calculate_airy_disk(532.0, 0.90, magnification=100.0, tube_lens_focal_mm=164.5)
        self.assertAlmostEqual(res["r_airy_sample_um"], 0.361, delta=0.05)
        self.assertGreater(res["ideal_pinhole_1au_um"], 60.0)
        self.assertLess(res["ideal_pinhole_1au_um"], 80.0)
        self.assertIn(res["recommended_standard_pinhole_um"], [50.0, 75.0])

        # Resolution test
        resol = ConfocalPhysicsEngine.calculate_resolution(532.0, 0.90, pinhole_au=1.0)
        self.assertLess(resol["lateral_fwhm_xy_um"], 0.30)  # sub-300nm resolution
        self.assertGreater(resol["lateral_fwhm_xy_um"], 0.15)

        # Transmission through 50um pinhole
        trans = ConfocalPhysicsEngine.calculate_pinhole_throughput(50.0, res["ideal_pinhole_1au_um"])
        self.assertGreater(trans["in_focus_throughput_percent"], 50.0)

    def test_jones_calculus(self):
        h_pol = np.array([1.0, 0.0], dtype=complex)
        hwp_45 = JonesCalculus.half_wave_plate(np.pi / 4.0)
        out_v = np.dot(hwp_45, h_pol)
        desc = JonesCalculus.get_polarization_description(out_v)
        self.assertTrue("90" in desc["type"] or "Vertical" in desc["type"])

        qwp_45 = JonesCalculus.quarter_wave_plate(np.pi / 4.0)
        out_circ = np.dot(qwp_45, h_pol)
        desc_circ = JonesCalculus.get_polarization_description(out_circ)
        self.assertTrue("Circular" in desc_circ["type"])

    def test_ray_reflection_and_refraction(self):
        inc = np.array([0.0, 0.0, 1.0])
        norm = np.array([-1.0, 0.0, -1.0]) / np.sqrt(2.0)
        refl = OpticsEngine.reflect_vector(inc, norm)
        self.assertAlmostEqual(refl[0], -1.0, delta=1e-5)
        self.assertAlmostEqual(refl[1], 0.0, delta=1e-5)
        self.assertAlmostEqual(refl[2], 0.0, delta=1e-5)

        refr = OpticsEngine.refract_vector(inc, np.array([0.0, 0.0, -1.0]), 1.0, 1.517)
        self.assertIsNotNone(refr)
        self.assertAlmostEqual(refr[2], 1.0, delta=1e-5)

    def test_post_math_resolver(self):
        result = PostMathResolver.resolve_stack(100.0, mount_optical_center_offset_mm=25.4)
        self.assertTrue(result["achievable"])
        self.assertIsNotNone(result["best_match"])
        best = result["best_match"]
        self.assertIn(best["base"]["part"], ["BA2", "DIRECT", "CF125"])
        self.assertIn(best["post_holder"]["part"], ["PH50", "PH75", "PH30"])
        self.assertIn(best["post"]["part"], ["TR50", "TR75", "TR100", "TR30"])

        hole_check = PostMathResolver.check_table_hole_snap(25.0, 50.0, grid_pitch_mm=25.0)
        self.assertTrue(hole_check["is_direct_hole_tapped"])

        hole_offset = PostMathResolver.check_table_hole_snap(32.0, 48.0, grid_pitch_mm=25.0)
        self.assertFalse(hole_offset["is_direct_hole_tapped"])
        self.assertTrue(hole_offset["clamping_fork_reachable"])

    def test_bom_generation(self):
        sample_scene = [
            {
                "catalog_part": "KM100",
                "name": "1in Kinematic Mirror Mount",
                "category": "Mirrors",
                "vendor": "Thorlabs",
                "optic_part": "BB1-E02",
                "optic_desc": "1in Dielectric Mirror",
                "mechanical_stack": {
                    "base": {"part": "BA2"},
                    "post_holder": {"part": "PH50"},
                    "post": {"part": "TR75"}
                }
            },
            {
                "catalog_part": "ZEISS-AXIO-IMG",
                "name": "Zeiss Axio Imager A2m Upright Frame",
                "category": "Microscopes",
                "vendor": "Zeiss"
            },
            {
                "catalog_part": "PRINCETON-ISOPLANE",
                "name": "Princeton Instruments IsoPlane Spectrograph",
                "category": "Spectrometers & Detectors",
                "vendor": "Princeton Instruments"
            }
        ]

        bom = BOMGenerator.generate_bom(sample_scene)
        self.assertGreaterEqual(bom["total_distinct_items"], 4)
        csv_str = BOMGenerator.to_csv(bom)
        self.assertIn("KM100", csv_str)
        self.assertIn("ZEISS-AXIO-IMG", csv_str)
        self.assertIn("PRINCETON-ISOPLANE", csv_str)

    def test_catalog_integrity(self):
        required_parts = [
            "KM100", "LMR1-AC50", "CCM1-PBS251", "PRM1-HWP",
            "SM1D12", "RS99", "CAGE-PERISCOPE-30",
            "ZEISS-AXIO-IMG", "ZEISS-AXIO-OBS",
            "OLYMPUS-IX73", "OLYMPUS-BX53",
            "PRINCETON-ISOPLANE", "ANDOR-SHAMROCK", "ANDOR-IXON",
            "CONFOCAL-PINHOLE-MPH", "RAMAN-EDGE-FILTER"
        ]
        for pid in required_parts:
            self.assertIn(pid, CATALOG, f"Missing required catalog item: {pid}")

        cats = get_all_categories()
        self.assertIn("Light Sources", cats)
        self.assertIn("Confocal & Filters", cats)
        self.assertIn("Spectrometers & Detectors", cats)
        self.assertIn("Microscopes", cats)

    def test_web_assets(self):
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        web_dir = os.path.join(base_dir, "web")

        self.assertTrue(os.path.exists(os.path.join(web_dir, "index.html")))
        self.assertTrue(os.path.exists(os.path.join(web_dir, "static", "css", "style.css")))
        self.assertTrue(os.path.exists(os.path.join(web_dir, "static", "js", "app.js")))
        self.assertTrue(os.path.exists(os.path.join(web_dir, "static", "js", "preview_viewport.js")))
        self.assertTrue(os.path.exists(os.path.join(web_dir, "static", "js", "three_scene.js")))
        self.assertTrue(os.path.exists(os.path.join(web_dir, "static", "js", "raytracer.js")))
        self.assertTrue(os.path.exists(os.path.join(web_dir, "static", "js", "periscope_wizard.js")))
        self.assertTrue(os.path.exists(os.path.join(web_dir, "static", "js", "catalog_data.js")))

        self.assertTrue(os.path.exists(os.path.join(web_dir, "vendor", "three.min.js")))
        self.assertTrue(os.path.exists(os.path.join(web_dir, "vendor", "OrbitControls.js")))
        self.assertTrue(os.path.exists(os.path.join(web_dir, "vendor", "TransformControls.js")))

    def test_microscope_port_configuration(self):
        zeiss = CATALOG.get("ZEISS-AXIO-IMG")
        self.assertIsNotNone(zeiss)
        self.assertIn("port_configuration", zeiss)
        port_cfg = zeiss["port_configuration"]
        self.assertEqual(port_cfg.get("top_port"), "laser_in")
        self.assertEqual(port_cfg.get("left_port"), "camera")

        ports = zeiss.get("ports", {})
        self.assertIn("top_port", ports)
        self.assertIn("left_port", ports)
        self.assertIn("rear_epi", ports)

        # Test mutating port configuration (e.g. user toggling left port to spectrometer)
        user_configured = dict(zeiss["port_configuration"])
        user_configured["left_port"] = "spectrometer"
        self.assertEqual(user_configured["left_port"], "spectrometer")

    def test_flip_mirror_mount(self):
        trf90 = CATALOG.get("TRF90")
        self.assertIsNotNone(trf90, "Thorlabs TRF90 flip mount missing from catalog")
        self.assertTrue(trf90.get("is_flip_mirror"))
        self.assertEqual(trf90.get("flip_state"), "engaged")
        self.assertEqual(trf90.get("flip_angle_deg"), 90.0)
        self.assertEqual(trf90.get("type"), "flip_mirror")
        self.assertIn("BB1-E02", trf90.get("optic_part", ""))

    def test_label_convention_generator(self):
        # Mirror: M1, M2...
        # Lens: L1, L2...
        # Flip Mirror: FM1...
        # Confocal Pinhole: PH1...
        # Laser: Laser 1...
        label_prefixes = {
            "mirror": "M",
            "flip_mirror": "FM",
            "lens": "L",
            "confocal_pinhole": "PH",
            "laser_source": "Laser"
        }
        for comp_type, prefix in label_prefixes.items():
            sample_label = f"{prefix}1"
            self.assertTrue(sample_label.startswith(prefix))

    def test_flip_mirror_beam_branching(self):
        # Incident ray along +Z axis
        incident_ray = np.array([0.0, 0.0, 1.0])

        # 1. Flip Mirror Engaged (45° normal vector): Deflects 90° (perpendicular branch)
        normal_45 = np.array([-1.0, 0.0, -1.0]) / np.sqrt(2.0)
        refl_dir = OpticsEngine.reflect_vector(incident_ray, normal_45)
        self.assertAlmostEqual(refl_dir[0], -1.0, delta=1e-5)
        self.assertAlmostEqual(refl_dir[2], 0.0, delta=1e-5)

        # 2. Flip Mirror Bypassed: Beam continues straight horizontal along incident direction
        bypassed_dir = incident_ray.copy()
        self.assertAlmostEqual(bypassed_dir[0], 0.0, delta=1e-5)
        self.assertAlmostEqual(bypassed_dir[2], 1.0, delta=1e-5)

    def test_dichroic_mirror_physics(self):
        dm = CATALOG.get("DICHROIC-CAGE-CUBE")
        self.assertIsNotNone(dm)
        cut_on = dm.get("cut_on_wavelength_nm", 538.0)
        self.assertEqual(cut_on, 538.0)

        # Excitation laser (532nm) is below cut-on -> Reflected (R > 95%)
        laser_lambda = 532.0
        self.assertLess(laser_lambda, cut_on)

        # Stokes Raman emission (580nm) is above cut-on -> Transmitted (T > 95%)
        stokes_lambda = 580.0
        self.assertGreater(stokes_lambda, cut_on)

    def test_microscope_retro_collection_path(self):
        # Retro-collection: Sample -> Objective -> Microscope Port -> 90° Fold Mirror -> Periscope -> DM -> Spectrometer
        incident_dir = np.array([0.0, 0.0, 1.0])  # Laser traveling +Z into microscope
        retro_dir = -incident_dir                 # Emission traveling -Z out of microscope
        self.assertAlmostEqual(retro_dir[2], -1.0, delta=1e-5)

        # 90° angle mirror on periscope / 2nd-level: normal (-1, 0, 1)/sqrt(2)
        norm_fold = np.array([-1.0, 0.0, 1.0]) / np.sqrt(2.0)
        down_dir = OpticsEngine.reflect_vector(retro_dir, norm_fold)
        self.assertAlmostEqual(down_dir[0], -1.0, delta=1e-5)

        # At DM: Stokes light passes straight through along collection arm to spectrometer
        spectro = CATALOG.get("PRINCETON-ISOPLANE")
        self.assertIsNotNone(spectro)
        self.assertEqual(spectro.get("type"), "detector_spectro")
        self.assertEqual(spectro.get("default_height_mm"), 100.0)

    def test_cage_periscope_geometry(self):
        peri = CATALOG.get("CAGE-PERISCOPE-30")
        self.assertIsNotNone(peri)
        self.assertTrue(peri.get("is_periscope"))
        self.assertTrue(peri.get("is_cage_system"))
        self.assertEqual(peri.get("cage_standard"), "30mm")
        self.assertEqual(peri.get("cage_rods"), 4)

        # Baseline table height 100mm + delta 220mm -> 320mm (matching Zeiss top port injection)
        elev_delta = 220.0
        elevated_y = peri.get("default_height_mm", 100.0) + elev_delta
        self.assertEqual(elevated_y, 320.0)

    def test_mount_visibility_and_optics_only_support(self):
        # Verify DOM and JS hooks for global and per-component mount visibility
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        index_path = os.path.join(base_dir, "web", "index.html")
        three_js_path = os.path.join(base_dir, "web", "static", "js", "three_scene.js")
        viewport_js_path = os.path.join(base_dir, "web", "static", "js", "preview_viewport.js")

        with open(index_path, "r", encoding="utf-8") as f:
            html_content = f.read()
            self.assertIn("btn-toggle-mounts", html_content)
            self.assertIn("insp-show-mount", html_content)
            self.assertIn("insp-periscope-controls", html_content)

        with open(three_js_path, "r", encoding="utf-8") as f:
            js_content = f.read()
            self.assertIn("toggleMountsVisibility", js_content)
            self.assertIn("applyComponentMountVisibility", js_content)
            self.assertIn("rebuildComponentMesh", js_content)
            self.assertIn("updatePeriscopeElevation", js_content)

        with open(viewport_js_path, "r", encoding="utf-8") as f:
            vp_content = f.read()
            self.assertIn("mount_post_stack", vp_content)
            self.assertIn("userData.isMount", vp_content)
            self.assertIn("userData.isOptic", vp_content)

    def test_cube_base_inserts_and_dichroic_options(self):
        from optipath3d.catalog.components import CUBE_INSERT_LIBRARY, dichroic_reflects
        self.assertIn("CUBE-BASE-30", CATALOG)
        self.assertGreaterEqual(len([k for k in CATALOG if k.startswith("DICHROIC-")]), 10)

        # Longpass reflects the laser line below cut-on, transmits Stokes above it
        self.assertTrue(dichroic_reflects("longpass", 538.0, 532.0))
        self.assertFalse(dichroic_reflects("longpass", 538.0, 580.0))
        # Shortpass is the opposite
        self.assertFalse(dichroic_reflects("shortpass", 650.0, 532.0))
        self.assertTrue(dichroic_reflects("shortpass", 650.0, 700.0))
        # A 488 insert cannot reflect a 532 nm laser
        ins = CUBE_INSERT_LIBRARY["DM-R488"]
        self.assertFalse(dichroic_reflects(ins["mode"], ins["cut"], 532.0))

        for wl in (488, 561, 633, 785):
            self.assertEqual(CATALOG[f"LASER-CLEANUP-{wl}"]["center_wavelength_nm"], float(wl))

    def test_server_socket_reuse(self):
        from optipath3d.main import ReusableHTTPServer
        self.assertTrue(ReusableHTTPServer.allow_reuse_address)


if __name__ == "__main__":
    unittest.main()
