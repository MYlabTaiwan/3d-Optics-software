"""
OptiPath 3D - Post Math & Mechanical Grounding Engine
=====================================================
Calculates discrete physical heights using standard Thorlabs optomechanics:
- Bases: BA2 (10mm), Direct Stud (0mm), Pedestal Base (CF125)
- Post Holders: PH20, PH30, PH50, PH75, PH100
- Posts: TR20, TR30, TR50, TR75, TR100, TR150
- Mount Optical Axis Offsets: KM100 (25.4mm), LMR1 (25.4mm), etc.
- Tapped Hole Grid (Metric 25mm M6 / Imperial 1" 1/4"-20) Clamping Verification
"""

import math
from typing import Dict, List, Tuple, Any, Optional


class PostMathResolver:
    """Solves achievable discrete mechanical stacks for given beam heights."""

    # Standard Thorlabs heights in mm
    POST_HOLDERS = [
        {"part": "PH20", "length_mm": 20.0, "min_travel": 5.0, "max_travel": 18.0},
        {"part": "PH30", "length_mm": 30.0, "min_travel": 5.0, "max_travel": 26.0},
        {"part": "PH50", "length_mm": 50.0, "min_travel": 8.0, "max_travel": 45.0},
        {"part": "PH75", "length_mm": 75.0, "min_travel": 10.0, "max_travel": 68.0},
        {"part": "PH100", "length_mm": 100.0, "min_travel": 15.0, "max_travel": 90.0},
    ]

    POSTS = [
        {"part": "TR20", "length_mm": 20.0},
        {"part": "TR30", "length_mm": 30.0},
        {"part": "TR50", "length_mm": 50.0},
        {"part": "TR75", "length_mm": 75.0},
        {"part": "TR100", "length_mm": 100.0},
        {"part": "TR150", "length_mm": 150.0},
    ]

    BASES = [
        {"part": "BA2", "name": "Mounting Base (BA2)", "thickness_mm": 10.0},
        {"part": "DIRECT", "name": "Direct Table Stud", "thickness_mm": 0.0},
        {"part": "CF125", "name": "Clamping Fork Pedestal Base", "thickness_mm": 12.5},
    ]

    @classmethod
    def resolve_stack(cls,
                      target_optical_height_mm: float,
                      mount_optical_center_offset_mm: float = 25.4,
                      preferred_base: str = "BA2") -> Dict[str, Any]:
        """
        Finds the optimal, most rigid Thorlabs post & holder combination
        to hit the target optical height.
        """
        target = float(target_optical_height_mm)
        mount_offset = float(mount_optical_center_offset_mm)
        # Required mechanical support height from table to bottom of mount
        req_mech_height = target - mount_offset

        if req_mech_height < 15.0:
            return {
                "achievable": False,
                "error": f"Target optical height {target:.1f}mm is too low for standard post mounts (min ~40mm). Use a low-profile base.",
                "target_height_mm": target,
                "best_match": None
            }

        candidates = []

        # Filter base choices
        base_options = [b for b in cls.BASES if b["part"] == preferred_base] or cls.BASES

        for base in base_options:
            base_t = base["thickness_mm"]
            for ph in cls.POST_HOLDERS:
                ph_len = ph["length_mm"]
                for tr in cls.POSTS:
                    tr_len = tr["length_mm"]

                    protrusion = req_mech_height - (base_t + ph_len)
                    if protrusion < 4.0:
                        continue  # Mount cannot mount flush against collar without clearance

                    engagement = tr_len - protrusion
                    min_engagement = 14.0  # mm inside post holder for safe clamping

                    # Engagement must be >= min_engagement and cannot exceed holder length by more than tolerance
                    if engagement >= min_engagement and engagement <= (ph_len + 2.0):
                        # Rigidity score: high engagement ratio in holder, shorter overall post
                        rigidity_score = (engagement / ph_len) - (tr_len / 250.0)
                        candidates.append({
                            "base": base,
                            "post_holder": ph,
                            "post": tr,
                            "base_thickness_mm": base_t,
                            "post_holder_len_mm": ph_len,
                            "post_len_mm": tr_len,
                            "protrusion_mm": protrusion,
                            "engagement_mm": engagement,
                            "total_optical_height_mm": base_t + ph_len + protrusion + mount_offset,
                            "stability_score": rigidity_score
                        })

        if not candidates:
            # Fallback to closest match
            best_diff = 1e9
            best_fallback = None
            for base in base_options:
                base_t = base["thickness_mm"]
                for ph in cls.POST_HOLDERS:
                    for tr in cls.POSTS:
                        nom = base_t + ph["length_mm"] + 15.0 + mount_offset
                        diff = abs(nom - target)
                        if diff < best_diff:
                            best_diff = diff
                            best_fallback = {
                                "base": base,
                                "post_holder": ph,
                                "post": tr,
                                "base_thickness_mm": base_t,
                                "post_holder_len_mm": ph["length_mm"],
                                "post_len_mm": tr["length_mm"],
                                "protrusion_mm": max(5.0, req_mech_height - (base_t + ph["length_mm"])),
                                "engagement_mm": 20.0,
                                "total_optical_height_mm": target,
                                "stability_score": 0.5
                            }
            return {
                "achievable": True,
                "warning": "Custom collar adjustment or shim required for exact height.",
                "target_height_mm": target,
                "best_match": best_fallback
            }

        # Sort by stability score (higher is more rigid)
        candidates.sort(key=lambda c: -c["stability_score"])
        best = candidates[0]

        return {
            "achievable": True,
            "target_height_mm": target,
            "best_match": best,
            "summary_text": f"Thorlabs {best['base']['part']} + {best['post_holder']['part']} + {best['post']['part']} (Extension: +{best['protrusion_mm']:.1f}mm)"
        }

    @classmethod
    def check_table_hole_snap(cls,
                              x_mm: float,
                              y_mm: float,
                              grid_pitch_mm: float = 25.0) -> Dict[str, Any]:
        """
        Checks distance to the nearest M6/1/4"-20 tapped hole on the optical table.
        Standard clamping fork (Thorlabs CF125) allows continuous adjustment within
        30mm - 55mm radial reach from an adjacent hole.
        """
        nearest_nx = round(x_mm / grid_pitch_mm)
        nearest_ny = round(y_mm / grid_pitch_mm)
        hole_x = nearest_nx * grid_pitch_mm
        hole_y = nearest_ny * grid_pitch_mm

        dx = x_mm - hole_x
        dy = y_mm - hole_y
        dist = math.sqrt(dx * dx + dy * dy)

        is_direct_hit = dist < 2.0
        can_clamp_fork = dist <= 55.0

        return {
            "nearest_hole": [hole_x, hole_y],
            "distance_mm": round(dist, 2),
            "is_direct_hole_tapped": is_direct_hit,
            "clamping_fork_reachable": can_clamp_fork,
            "grid_coordinates": f"({nearest_nx:+d}, {nearest_ny:+d})",
            "status": "Direct Tapped Hole" if is_direct_hit else ("Clamping Fork Reachable" if can_clamp_fork else "Out of reach of grid hole")
        }
