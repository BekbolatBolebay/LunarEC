import unittest
from esf_1c_exporter import ESFInvoice, ESFItem

class TestESF1CExporter(unittest.TestCase):
    def setUp(self):
        self.items = [
            ESFItem(name="Кофе дәндері Арабика", tnved="0901210000", unit="кг", quantity=10.0, unit_price_kzt=6500.0),
            ESFItem(name="Сүт 3.2%", tnved="0401201100", unit="л", quantity=20.0, unit_price_kzt=480.0)
        ]
        self.invoice = ESFInvoice(
            invoice_num="ESF-2026-0089",
            turnover_date="2026-09-27",
            seller_bin="200540019283",
            seller_name="ЖШС Lunar Enterprise Almaty",
            customer_bin="190440023412",
            customer_name="ЖШС Qazaq Retail Group",
            items=self.items
        )

    def test_totals_calculation(self):
        totals = self.invoice.calculate_totals()
        # Item 1: 10 * 6500 = 65,000 KZT. VAT 12% = 7,800. Total = 72,800 KZT
        # Item 2: 20 * 480 = 9,600 KZT. VAT 12% = 1,152. Total = 10,752 KZT
        # Subtotal: 65000 + 9600 = 74600.0
        # VAT: 7800 + 1152 = 8952.0
        # Total: 72800 + 10752 = 83552.0
        self.assertEqual(totals["subtotal"], 74600.0)
        self.assertEqual(totals["vat_amount"], 8952.0)
        self.assertEqual(totals["total_with_vat"], 83552.0)

    def test_esf_xml_generation(self):
        xml_str = self.invoice.to_esf_xml()
        self.assertIn("esf:invoice", xml_str)
        self.assertIn("ESF-2026-0089", xml_str)
        self.assertIn("200540019283", xml_str)
        self.assertIn("0901210000", xml_str)
        self.assertIn("83552.0", xml_str)

    def test_1c_commerceml_xml_generation(self):
        xml_str = self.invoice.to_1c_commerceml_xml()
        self.assertIn("КоммерческаяИнформация", xml_str)
        self.assertIn("ВерсияСхемы=\"2.09\"", xml_str)
        self.assertIn("Кофе дәндері Арабика", xml_str)
        self.assertIn("Qazaq Retail Group", xml_str)
        self.assertIn("83552.0", xml_str)

if __name__ == '__main__':
    unittest.main()
