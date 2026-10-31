"""
OptiPath 3D - Confocal Microscopy & Filter Physics Engine
=========================================================
Calculates:
- Airy disk diameters in object and image conjugate planes
- Optimal pinhole size (1 Airy Unit) based on wavelength, objective NA, and tube lens
- Confocal optical sectioning (lateral and axial FWHM resolution)
- Pinhole transmission efficiency & out-of-focus background rejection
- Laser clean-up and Raman edge/notch filter spectral parameters
"""

import math
from typing import Dict, Any, Tuple, Optional


class ConfocalPhysicsEngine:
    """Rigorous physical calculations for confocal filtering and laser cleanup."""

    @staticmethod
    def calculate_airy_disk(wavelength_nm: float,
                            objective_na: float,
                            magnification: float = 100.0,
                            tube_lens_focal_mm: float = 180.0,
                            pinhole_lens_focal_mm: Optional[float] = None) -> Dict[str, Any]:
        """
        Calculates Airy disk dimensions at the sample (focal plane)
        and at the confocal pinhole plane (image plane).
        
        Formula:
        r_Airy (sample) = 0.61 * lambda / NA
        d_Airy (pinhole plane) = 2 * r_Airy * Total_System_Magnification
        """
        lambda_um = wavelength_nm * 1e-3  # convert to microns
        na = max(0.05, float(objective_na))
        mag = max(1.0, float(magnification))

        # 1. Diffraction-limited Airy radius at specimen plane (microns)
        r_airy_sample_um = (0.61 * lambda_um) / na
        d_airy_sample_um = 2.0 * r_airy_sample_um

        # 2. System magnification adjustment if using external pinhole focusing lens
        effective_mag = mag
        if pinhole_lens_focal_mm and tube_lens_focal_mm > 0:
            # If relay optics are used before the pinhole: M_relay = f_pinhole / f_tube
            effective_mag = mag * (pinhole_lens_focal_mm / tube_lens_focal_mm)

        # 3. 1 Airy Unit (1 AU) pinhole diameter at detector plane (microns)
        d_pinhole_1au_um = d_airy_sample_um * effective_mag

        # Available standard pinhole sizes (Thorlabs P-series / MPH16)
        standard_pinholes_um = [5.0, 10.0, 15.0, 20.0, 25.0, 30.0, 50.0, 75.0, 100.0, 150.0, 200.0]
        # Find closest commercial pinhole
        best_pinhole = min(standard_pinholes_um, key=lambda p: abs(p - d_pinhole_1au_um))

        # Airy Units for the selected commercial pinhole
        actual_au = best_pinhole / max(1e-3, d_pinhole_1au_um)

        return {
            "wavelength_nm": wavelength_nm,
            "objective_na": na,
            "magnification": mag,
            "r_airy_sample_um": round(r_airy_sample_um, 3),
            "d_airy_sample_um": round(d_airy_sample_um, 3),
            "ideal_pinhole_1au_um": round(d_pinhole_1au_um, 1),
            "recommended_standard_pinhole_um": best_pinhole,
            "actual_airy_units": round(actual_au, 2),
            "thorlabs_part": f"P{int(best_pinhole)}S" if best_pinhole >= 10 else f"P{int(best_pinhole)}D"
        }

    @staticmethod
    def calculate_resolution(wavelength_nm: float,
                             objective_na: float,
                             refractive_index: float = 1.0,
                             pinhole_au: float = 1.0) -> Dict[str, Any]:
        """
        Calculates theoretical lateral and axial resolution (FWHM) of the confocal system.
        
        Widefield:
          FWHM_xy = 0.51 * lambda / NA
          FWHM_z = 2.0 * lambda * n / (NA^2)
          
        Confocal (pinhole <= 1 AU):
          FWHM_xy = 0.37 * lambda / NA  (~1.4x improvement over widefield)
          FWHM_z = 1.4 * lambda * n / (NA^2) (~1.4x improvement over widefield)
        """
        lambda_um = wavelength_nm * 1e-3
        na = max(0.05, float(objective_na))
        n = max(1.0, float(refractive_index))

        # Resolution scaling factor based on pinhole diameter in AU
        # For AU <= 1, full confocal sharpening applies; for large pinhole, approaches widefield
        au_factor_xy = 0.37 if pinhole_au <= 1.0 else min(0.51, 0.37 + 0.14 * (pinhole_au - 1.0) / 2.0)
        au_factor_z = 1.4 if pinhole_au <= 1.0 else min(2.0, 1.4 + 0.6 * (pinhole_au - 1.0) / 2.0)

        fwhm_xy_um = (au_factor_xy * lambda_um) / na
        fwhm_z_um = (au_factor_z * lambda_um * n) / (na ** 2)

        return {
            "lateral_fwhm_xy_um": round(fwhm_xy_um, 3),
            "axial_fwhm_z_um": round(fwhm_z_um, 3),
            "confocal_volume_femtoliters": round((math.pi / 6.0) * (fwhm_xy_um ** 2) * fwhm_z_um * 1e3, 3)
        }

    @staticmethod
    def calculate_pinhole_throughput(pinhole_diameter_um: float,
                                     ideal_1au_diameter_um: float) -> Dict[str, Any]:
        """
        Calculates signal transmission efficiency and out-of-focus background rejection.
        Based on integrated 2D Gaussian/Bessel beam profile through pinhole aperture.
        """
        ratio = pinhole_diameter_um / max(1e-3, ideal_1au_diameter_um)
        # Fraction of in-focus light transmitted through pinhole: 1 - exp(-2 * (d/d0)^2)
        in_focus_transmission = 1.0 - math.exp(-2.0 * (ratio ** 2))
        # Background rejection (relative to 1 AU baseline)
        bg_rejection_factor = 1.0 / max(0.01, ratio ** 2)

        return {
            "in_focus_throughput_percent": round(in_focus_transmission * 100.0, 1),
            "relative_background_rejection": round(bg_rejection_factor, 2),
            "optical_sectioning_quality": "High Contrast (Confocal)" if ratio <= 1.2 else ("Moderate Sectioning" if ratio <= 2.5 else "Degraded (Near Widefield)")
        }
