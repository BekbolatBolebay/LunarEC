import unittest
from datetime import date
from customer_rfm_segmenter import CustomerRFMEngine


class TestCustomerRFMEngine(unittest.TestCase):
    def setUp(self):
        self.engine = CustomerRFMEngine(reference_date=date(2026, 9, 21))

    def test_vip_champion_segment(self):
        result = self.engine.calculate_rfm_score(
            last_order_date=date(2026, 9, 18),
            total_orders_count=25,
            total_spent_amount=750000.0,
        )
        self.assertEqual(result["segment"], "Champions (VIP)")
        self.assertEqual(result["r_score"], 5)
        self.assertEqual(result["f_score"], 5)
        self.assertEqual(result["m_score"], 5)

    def test_at_risk_segment(self):
        result = self.engine.calculate_rfm_score(
            last_order_date=date(2026, 5, 10),
            total_orders_count=12,
            total_spent_amount=150000.0,
        )
        self.assertEqual(result["segment"], "At Risk (Need Attention)")
        self.assertEqual(result["r_score"], 1)
        self.assertEqual(result["f_score"], 4)

    def test_new_potential_customer(self):
        result = self.engine.calculate_rfm_score(
            last_order_date=date(2026, 9, 20),
            total_orders_count=1,
            total_spent_amount=15000.0,
        )
        self.assertEqual(result["segment"], "New Potential")
        self.assertEqual(result["r_score"], 5)
        self.assertEqual(result["f_score"], 1)


if __name__ == "__main__":
    unittest.main()
