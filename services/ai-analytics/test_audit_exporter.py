import unittest
from audit_exporter import AuditExporter

class TestAuditExporter(unittest.TestCase):
    def test_audit_calculation(self):
        items = [
            {"item_id": "BEEF-01", "item_name": "Ribeye", "system_qty": 50, "physical_qty": 48, "unit_cost": 4500},
            {"item_id": "MILK-02", "item_name": "Milk 3.2%", "system_qty": 100, "physical_qty": 102, "unit_cost": 450},
            {"item_id": "BUN-03", "item_name": "Brioche Bun", "system_qty": 200, "physical_qty": 200, "unit_cost": 150},
        ]

        summary = AuditExporter.generate_audit_summary(items)
        self.assertEqual(summary["total_shortage_value"], 9000.0) # 2 * 4500
        self.assertEqual(summary["total_surplus_value"], 900.0)   # 2 * 450
        self.assertAlmostEqual(summary["net_discrepancy"], -8100.0)
        self.assertTrue(summary["accuracy_rate_pct"] > 90.0)

        csv_out = AuditExporter.export_csv(summary)
        self.assertIn("Ribeye", csv_out)
        self.assertIn("SHORTAGE", csv_out)

if __name__ == "__main__":
    unittest.main()
