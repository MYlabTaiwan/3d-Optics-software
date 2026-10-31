"""
OptiPath 3D - Bill of Materials (BOM) & Thorlabs Order Generator
================================================================
Aggregates all placed components, mechanical posts, bases, cage rods,
and fasteners into an exact Thorlabs shopping and order list.
"""

import csv
import io
from typing import List, Dict, Any


class BOMGenerator:
    """Generates structured Bill of Materials from optical layout state."""

    @classmethod
    def generate_bom(cls, scene_components: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Takes a list of component instances from the scene and aggregates
        part numbers, quantities, descriptions, and categories.
        """
        item_counts: Dict[str, Dict[str, Any]] = {}
        total_parts = 0

        def add_item(part_no: str, description: str, category: str, qty: int = 1, vendor: str = "Thorlabs"):
            nonlocal total_parts
            if not part_no:
                return
            if part_no in item_counts:
                item_counts[part_no]["quantity"] += qty
            else:
                item_counts[part_no] = {
                    "part_no": part_no,
                    "description": description,
                    "category": category,
                    "quantity": qty,
                    "vendor": vendor,
                    "url": f"https://www.thorlabs.com/thorproduct.cfm?partnumber={part_no}" if vendor == "Thorlabs" else ""
                }
            total_parts += qty

        m6_screw_count = 0

        for comp in scene_components:
            part_no = comp.get("catalog_part", "")
            cat = comp.get("category", "Optomechanics")
            name = comp.get("name", part_no)
            vendor = comp.get("vendor", "Thorlabs")

            # Add primary item
            add_item(part_no, name, cat, 1, vendor)

            # Check if this item uses mechanical posts & bases
            mech = comp.get("mechanical_stack", {})
            if mech:
                base = mech.get("base", {}).get("part", "BA2")
                if base and base != "DIRECT":
                    add_item(base, f"Mounting Base ({base})", "Mounting Hardware", 1, "Thorlabs")
                    m6_screw_count += 1

                ph = mech.get("post_holder", {}).get("part", "PH50")
                if ph:
                    add_item(ph, f"Pedestal Post Holder ({ph})", "Posts & Holders", 1, "Thorlabs")
                    m6_screw_count += 1

                tr = mech.get("post", {}).get("part", "TR75")
                if tr:
                    add_item(tr, f"Optical Post Ø1/2in ({tr})", "Posts & Holders", 1, "Thorlabs")

            # Check if it has an optic (e.g., KM100 houses BB1-E02 dielectric mirror)
            optic_part = comp.get("optic_part", "")
            if optic_part:
                add_item(optic_part, comp.get("optic_desc", "1in Broadband Dielectric Mirror"), "Optics", 1, "Thorlabs")

            # Cage system parts if applicable
            if comp.get("is_cage_system", False):
                cage_rods = comp.get("cage_rods", 4)
                rod_part = comp.get("cage_rod_part", "ER6")
                add_item(rod_part, f"Cage Assembly Rod Ø6mm ({rod_part})", "Cage Systems", cage_rods, "Thorlabs")

                cage_plates = comp.get("cage_plates", 2)
                plate_part = comp.get("cage_plate_part", "CP33")
                add_item(plate_part, f"30mm Cage Plate ({plate_part})", "Cage Systems", cage_plates, "Thorlabs")

            # Periscopes
            if comp.get("is_periscope", False):
                add_item("RS99", "Periscope Assembly System", "Periscope Systems", 1, "Thorlabs")
                add_item("BB1-E02", "1in Broadband Dielectric Mirror 400-750nm", "Optics", 2, "Thorlabs")
                add_item("KM100", "1in Kinematic Mirror Mount", "Mounts", 2, "Thorlabs")
                m6_screw_count += 4

        # Add hardware screws
        if m6_screw_count > 0:
            add_item("SH6MS16", "M6 Socket Head Cap Screws, 16mm (Pack of 50)", "Hardware & Fasteners", 1, "Thorlabs")

        items_list = list(item_counts.values())
        # Sort by category then part_no
        items_list.sort(key=lambda x: (x["category"], x["part_no"]))

        return {
            "total_distinct_items": len(items_list),
            "total_components": total_parts,
            "items": items_list
        }

    @classmethod
    def to_csv(cls, bom_data: Dict[str, Any]) -> str:
        """Export BOM as RFC-4180 CSV string."""
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Part Number", "Description", "Category", "Quantity", "Vendor", "Catalog URL"])
        for item in bom_data.get("items", []):
            writer.writerow([
                item["part_no"],
                item["description"],
                item["category"],
                item["quantity"],
                item["vendor"],
                item["url"]
            ])
        return output.getvalue()

    @classmethod
    def to_markdown(cls, bom_data: Dict[str, Any]) -> str:
        """Export BOM as formatted markdown table."""
        lines = [
            "# OptiPath 3D - Optical Setup Bill of Materials (BOM)",
            f"**Total Distinct Parts:** {bom_data.get('total_distinct_items', 0)}  |  **Total Count:** {bom_data.get('total_components', 0)}\n",
            "| Category | Part Number | Description | Qty | Vendor |",
            "| :--- | :--- | :--- | :---: | :--- |"
        ]
        for item in bom_data.get("items", []):
            lines.append(f"| {item['category']} | `{item['part_no']}` | {item['description']} | **{item['quantity']}** | {item['vendor']} |")
        return "\n".join(lines)
