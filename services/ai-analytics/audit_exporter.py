"""
Inventory Audit Snapshot & Compliance Exporter.
Generates structured audit sheets, calculating discrepancy variances and total financial loss/gain.
"""

from typing import List, Dict, Any
import json
import csv
import io

class AuditExporter:
    @staticmethod
    def generate_audit_summary(audit_items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Calculates variance between system stock and physical count.
        """
        total_system_value = 0.0
        total_physical_value = 0.0
        total_shortage_value = 0.0
        total_surplus_value = 0.0

        processed_items = []
        for item in audit_items:
            sys_qty = float(item["system_qty"])
            phys_qty = float(item["physical_qty"])
            unit_cost = float(item["unit_cost"])

            diff_qty = phys_qty - sys_qty
            diff_val = diff_qty * unit_cost

            sys_val = sys_qty * unit_cost
            phys_val = phys_qty * unit_cost

            total_system_value += sys_val
            total_physical_value += phys_val

            if diff_qty < 0:
                total_shortage_value += abs(diff_val)
                status = "SHORTAGE"
            elif diff_qty > 0:
                total_surplus_value += diff_val
                status = "SURPLUS"
            else:
                status = "EXACT"

            processed_items.append({
                "item_id": item["item_id"],
                "item_name": item["item_name"],
                "system_qty": sys_qty,
                "physical_qty": phys_qty,
                "unit_cost": unit_cost,
                "diff_qty": diff_qty,
                "diff_val": diff_val,
                "status": status
            })

        net_discrepancy = total_physical_value - total_system_value
        accuracy_rate = 100.0
        if total_system_value > 0:
            accuracy_rate = max(0.0, 100.0 - (total_shortage_value / total_system_value * 100.0))

        return {
            "items": processed_items,
            "total_system_value": round(total_system_value, 2),
            "total_physical_value": round(total_physical_value, 2),
            "total_shortage_value": round(total_shortage_value, 2),
            "total_surplus_value": round(total_surplus_value, 2),
            "net_discrepancy": round(net_discrepancy, 2),
            "accuracy_rate_pct": round(accuracy_rate, 1)
        }

    @staticmethod
    def export_csv(audit_summary: Dict[str, Any]) -> str:
        output = io.StringIO()
        writer = csv.writer(output)
        writer.writerow(["Item ID", "Item Name", "System Qty", "Physical Qty", "Diff Qty", "Unit Cost", "Diff Val (KZT)", "Status"])
        for it in audit_summary["items"]:
            writer.writerow([it["item_id"], it["item_name"], it["system_qty"], it["physical_qty"], it["diff_qty"], it["unit_cost"], it["diff_val"], it["status"]])
        return output.getvalue()
