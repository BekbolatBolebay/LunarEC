#!/usr/bin/env python3
import unittest
import os
import sys

# Ensure current directory is in path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from esf_1c_exporter import ESFInvoice, ESFItem

class TestQATaxCompliance(unittest.TestCase):
    def setUp(self):
        self.items = [
            ESFItem(name="Серверлік POS терминал Lunar-X", tnved="8471300000", unit="дана", quantity=5.0, unit_price_kzt=200000.0),
            ESFItem(name="Бағдарламалық жасақтама лицензиясы", tnved="8523491000", unit="дана", quantity=1.0, unit_price_kzt=500000.0),
        ]
        self.invoice = ESFInvoice(
            invoice_num="ESF-2026-QA-001",
            turnover_date="2026-10-10",
            seller_bin="980540001234",
            seller_name="ТОО Lunar Enterprise Solutions",
            customer_bin="010240005678",
            customer_name="АО Kaspi Logistics KZ",
            items=self.items
        )

    def test_qa_esf_totals_and_12_percent_vat(self):
        totals = self.invoice.calculate_totals()
        # Item 1: 5 * 200,000 = 1,000,000. VAT 12% = 120,000
        # Item 2: 1 * 500,000 = 500,000. VAT 12% = 60,000
        # Subtotal: 1,500,000. VAT: 180,000. Total with VAT: 1,680,000
        self.assertEqual(totals["subtotal"], 1500000.0)
        self.assertEqual(totals["vat_amount"], 180000.0)
        self.assertEqual(totals["total_with_vat"], 1680000.0)

    def test_qa_esf_xml_tags_and_tnved_validation(self):
        xml_str = self.invoice.to_esf_xml()
        self.assertIn("esf:invoice", xml_str)
        self.assertIn("ESF-2026-QA-001", xml_str)
        self.assertIn("980540001234", xml_str)
        self.assertIn("010240005678", xml_str)
        self.assertIn("8471300000", xml_str)
        self.assertIn("8523491000", xml_str)
        self.assertIn("1680000.0", xml_str)

    def test_qa_1c_commerceml_format(self):
        cml_str = self.invoice.to_1c_commerceml_xml()
        self.assertIn("КоммерческаяИнформация", cml_str)
        self.assertIn("ВерсияСхемы=\"2.09\"", cml_str)
        self.assertIn("Серверлік POS терминал Lunar-X", cml_str)
        self.assertIn("1680000.0", cml_str)

if __name__ == "__main__":
    unittest.main()
