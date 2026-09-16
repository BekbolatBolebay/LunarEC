import unittest
from abc_matrix import MenuItem, MenuEngineeringAnalyzer
from time_series import TimeSeriesForecast
from odoo_sync_worker import OdooPayloadBuilder

class TestAdvancedAnalytics(unittest.TestCase):
    def test_abc_analysis(self):
        items = [
            MenuItem("Burger", 100, 3000, 1000),  # 300,000 rev
            MenuItem("Coffee", 200, 1000, 300),   # 200,000 rev
            MenuItem("Fries", 50, 800, 200),      # 40,000 rev -> 540k total
        ]
        analyzer = MenuEngineeringAnalyzer(items)
        abc = analyzer.run_abc_analysis()
        self.assertEqual(len(abc), 3)
        self.assertEqual(abc[0]["name"], "Burger")
        self.assertEqual(abc[0]["abc_category"], "A")

    def test_bcg_matrix(self):
        items = [
            MenuItem("Steak", 50, 8000, 3000), # High margin
            MenuItem("Bread", 10, 200, 150),   # Low margin, low volume
        ]
        analyzer = MenuEngineeringAnalyzer(items)
        matrix = analyzer.run_bcg_matrix()
        self.assertEqual(matrix[0]["classification"], "STAR")
        self.assertEqual(matrix[1]["classification"], "DOG")

    def test_time_series_peaks(self):
        # 24 hours of traffic with lunch (13h) and dinner (19h, 20h) peaks
        traffic = [2] * 24
        traffic[13] = 45
        traffic[19] = 60
        traffic[20] = 55
        ts = TimeSeriesForecast(traffic)
        peaks = ts.detect_peak_hours(threshold_multiplier=2.0)
        self.assertIn(13, peaks)
        self.assertIn(19, peaks)
        self.assertIn(20, peaks)

    def test_odoo_payload(self):
        payload = OdooPayloadBuilder.build_sale_order_payload(
            order_ref="ORD-999",
            partner_id=42,
            order_lines=[{"odoo_product_id": 10, "qty": 2, "unit_price": 2500}]
        )
        self.assertEqual(payload["client_order_ref"], "ORD-999")
        self.assertEqual(payload["partner_id"], 42)
        self.assertEqual(len(payload["order_line"]), 1)

if __name__ == '__main__':
    unittest.main()
