"""
OptiPath 3D - Optical Propagation & Physics Engine
==================================================
Handles:
- 3D geometric ray tracing (reflection, Snell's law refraction, beamsplitters)
- Gaussian beam parameter propagation (waist, Rayleigh range, divergence, ABCD matrices)
- Polarization tracking using Jones calculus
- Aperture clipping detection & warnings
"""

import math
import numpy as np
from typing import List, Dict, Tuple, Optional, Any


class BeamPhysics:
    """Analytical calculations for laser beams."""

    @staticmethod
    def rayleigh_range(waist_radius_mm: float, wavelength_nm: float) -> float:
        """Calculate Rayleigh range z_R in mm."""
        lambda_mm = wavelength_nm * 1e-6
        return (math.pi * (waist_radius_mm ** 2)) / lambda_mm

    @staticmethod
    def beam_divergence_half_angle(waist_radius_mm: float, wavelength_nm: float) -> float:
        """Calculate far-field beam divergence half-angle theta in radians."""
        lambda_mm = wavelength_nm * 1e-6
        return lambda_mm / (math.pi * waist_radius_mm)

    @staticmethod
    def beam_radius_at_z(z_distance_mm: float, waist_radius_mm: float, wavelength_nm: float) -> float:
        """Calculate beam radius w(z) at distance z from waist."""
        z_r = BeamPhysics.rayleigh_range(waist_radius_mm, wavelength_nm)
        return waist_radius_mm * math.sqrt(1.0 + (z_distance_mm / z_r) ** 2)

    @staticmethod
    def wavelength_to_rgb(wavelength_nm: float) -> Tuple[int, int, int]:
        """Convert wavelength in nm (380-780) to approximate sRGB tuple (0-255)."""
        w = float(wavelength_nm)
        if w < 380:
            return (138, 43, 226)  # UV / Violet
        elif 380 <= w < 440:
            r = -(w - 440) / (440 - 380)
            g = 0.0
            b = 1.0
        elif 440 <= w < 490:
            r = 0.0
            g = (w - 440) / (490 - 440)
            b = 1.0
        elif 490 <= w < 510:
            r = 0.0
            g = 1.0
            b = -(w - 510) / (510 - 490)
        elif 510 <= w < 580:
            r = (w - 510) / (580 - 510)
            g = 1.0
            b = 0.0
        elif 580 <= w < 645:
            r = 1.0
            g = -(w - 645) / (645 - 580)
            b = 0.0
        elif 645 <= w <= 780:
            r = 1.0
            g = 0.0
            b = 0.0
        else:  # Near Infrared (e.g. 785nm, 1064nm)
            return (180, 20, 20)

        # Intensity factor near vision limits
        if 380 <= w < 420:
            factor = 0.3 + 0.7 * (w - 380) / (420 - 380)
        elif 420 <= w <= 700:
            factor = 1.0
        elif 700 < w <= 780:
            factor = 0.3 + 0.7 * (780 - w) / (780 - 700)
        else:
            factor = 0.5

        return (
            int(max(0, min(255, round(255 * (r * factor))))),
            int(max(0, min(255, round(255 * (g * factor))))),
            int(max(0, min(255, round(255 * (b * factor)))))
        )


class JonesCalculus:
    """Jones calculus matrices for polarization state tracking."""

    @staticmethod
    def linear_polarizer(angle_rad: float) -> np.ndarray:
        c = math.cos(angle_rad)
        s = math.sin(angle_rad)
        return np.array([
            [c * c, c * s],
            [c * s, s * s]
        ], dtype=complex)

    @staticmethod
    def waveplate(retardance_rad: float, fast_axis_rad: float) -> np.ndarray:
        c = math.cos(fast_axis_rad)
        s = math.sin(fast_axis_rad)
        r = retardance_rad
        phase_pos = np.exp(1j * r / 2.0)
        phase_neg = np.exp(-1j * r / 2.0)

        c2 = c * c
        s2 = s * s
        cs = c * s

        m00 = phase_pos * c2 + phase_neg * s2
        m01 = (phase_pos - phase_neg) * cs
        m10 = (phase_pos - phase_neg) * cs
        m11 = phase_pos * s2 + phase_neg * c2

        return np.array([[m00, m01], [m10, m11]], dtype=complex)

    @staticmethod
    def half_wave_plate(fast_axis_rad: float) -> np.ndarray:
        return JonesCalculus.waveplate(math.pi, fast_axis_rad)

    @staticmethod
    def quarter_wave_plate(fast_axis_rad: float) -> np.ndarray:
        return JonesCalculus.waveplate(math.pi / 2.0, fast_axis_rad)

    @staticmethod
    def get_polarization_description(jones_vector: np.ndarray) -> Dict[str, Any]:
        """Describe the polarization state (Linear, Circular, Elliptical)."""
        norm = np.linalg.norm(jones_vector)
        if norm < 1e-12:
            return {"type": "Depolarized/Zero", "ratio": 0.0, "angle_deg": 0.0}

        jv = jones_vector / norm
        ex, ey = jv[0], jv[1]
        phase_diff = np.angle(ey) - np.angle(ex)

        abs_x = abs(ex)
        abs_y = abs(ey)

        if abs_x < 1e-4:
            return {"type": "Linear Vertical (90°)", "angle_deg": 90.0, "ellipticity": 0.0}
        if abs_y < 1e-4:
            return {"type": "Linear Horizontal (0°)", "angle_deg": 0.0, "ellipticity": 0.0}

        # Check for linear (phase difference is 0 or pi)
        if abs(abs(phase_diff) - math.pi) < 0.05 or abs(phase_diff) < 0.05:
            deg = math.degrees(math.atan2(abs_y, abs_x))
            return {"type": f"Linear ({deg:.1f}°)", "angle_deg": deg, "ellipticity": 0.0}

        # Check for circular (equal amplitudes and phase diff pi/2 or -pi/2)
        if abs(abs_x - abs_y) < 0.1 and abs(abs(phase_diff) - math.pi / 2.0) < 0.1:
            handedness = "Right Circular" if phase_diff > 0 else "Left Circular"
            return {"type": handedness, "angle_deg": 45.0, "ellipticity": 1.0}

        return {
            "type": "Elliptical",
            "angle_deg": math.degrees(math.atan2(abs_y, abs_x)),
            "phase_diff_deg": math.degrees(phase_diff)
        }


class RaySegment:
    """A segment of an optical ray path in 3D space."""

    def __init__(self,
                 start_pos: Tuple[float, float, float],
                 direction: Tuple[float, float, float],
                 wavelength_nm: float = 532.0,
                 beam_waist_mm: float = 1.0,
                 length_mm: float = 100.0,
                 intensity: float = 1.0,
                 jones_vector: Optional[np.ndarray] = None):
        self.start_pos = np.array(start_pos, dtype=float)
        # Normalize direction
        d = np.array(direction, dtype=float)
        norm = np.linalg.norm(d)
        self.direction = d / norm if norm > 1e-9 else np.array([1.0, 0.0, 0.0])
        self.wavelength_nm = wavelength_nm
        self.beam_waist_mm = beam_waist_mm
        self.length_mm = length_mm
        self.intensity = intensity
        self.jones_vector = jones_vector if jones_vector is not None else np.array([1.0, 0.0], dtype=complex)
        self.clipped = False
        self.clip_warning = ""

    @property
    def end_pos(self) -> np.ndarray:
        return self.start_pos + self.direction * self.length_mm

    def to_dict(self) -> Dict[str, Any]:
        rgb = BeamPhysics.wavelength_to_rgb(self.wavelength_nm)
        pol_info = JonesCalculus.get_polarization_description(self.jones_vector)
        return {
            "start": self.start_pos.tolist(),
            "end": self.end_pos.tolist(),
            "direction": self.direction.tolist(),
            "length_mm": float(self.length_mm),
            "wavelength_nm": float(self.wavelength_nm),
            "rgb": rgb,
            "beam_waist_mm": float(self.beam_waist_mm),
            "intensity": float(self.intensity),
            "clipped": bool(self.clipped),
            "clip_warning": self.clip_warning,
            "polarization": pol_info
        }


class OpticsEngine:
    """Coordinates ray tracing, component interaction, and beam clipping."""

    @staticmethod
    def reflect_vector(incident_dir: np.ndarray, surface_normal: np.ndarray) -> np.ndarray:
        """Law of reflection: r = d - 2(d . n)n."""
        n = surface_normal / np.linalg.norm(surface_normal)
        d = incident_dir / np.linalg.norm(incident_dir)
        refl = d - 2.0 * np.dot(d, n) * n
        return refl / np.linalg.norm(refl)

    @staticmethod
    def refract_vector(incident_dir: np.ndarray, surface_normal: np.ndarray,
                       n1: float, n2: float) -> Optional[np.ndarray]:
        """Snell's Law in 3D. Returns None on Total Internal Reflection (TIR)."""
        d = incident_dir / np.linalg.norm(incident_dir)
        n = surface_normal / np.linalg.norm(surface_normal)
        cos_i = -np.dot(n, d)
        if cos_i < 0:
            # Normal is pointing in opposite direction
            n = -n
            cos_i = -cos_i

        eta = n1 / n2
        k = 1.0 - eta * eta * (1.0 - cos_i * cos_i)
        if k < 0.0:
            return None  # Total Internal Reflection

        refracted = eta * d + (eta * cos_i - math.sqrt(k)) * n
        return refracted / np.linalg.norm(refracted)

    @staticmethod
    def check_aperture_clipping(beam_radius_mm: float, aperture_radius_mm: float) -> Tuple[bool, str]:
        """Check if Gaussian beam clips an optical aperture."""
        ratio = beam_radius_mm / max(1e-4, aperture_radius_mm)
        if ratio > 0.85:
            return True, f"Severe clipping: Beam radius ({beam_radius_mm:.2f}mm) is {ratio*100:.0f}% of aperture ({aperture_radius_mm:.2f}mm)"
        elif ratio > 0.65:
            return False, f"Noticeable edge diffraction: Beam radius ({beam_radius_mm:.2f}mm) is {ratio*100:.0f}% of aperture ({aperture_radius_mm:.2f}mm)"
        return False, "Clear aperture OK (Beam within 1/e² margin)"
