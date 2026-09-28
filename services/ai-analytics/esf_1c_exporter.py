"""
Kazakhstan Electronic Tax Invoice (ЭСФ) & 1C:Enterprise CommerceML Exporter
Compliant with State Revenue Committee (МКД) v2 XML and 1C 8.3 CommerceML v2.09
"""

import xml.etree.ElementTree as ET
from datetime import datetime, timezone
from typing import List, Dict, Any


class ESFItem:
    def __init__(self, name: str, tnved: str, unit: str, quantity: float, unit_price_kzt: float):
        self.name = name
        self.tnved = tnved  # 10-таңбалы ТН ВЭД коды
        self.unit = unit
        self.quantity = quantity
        self.unit_price_kzt = unit_price_kzt

    @property
    def price_without_vat(self) -> float:
        return round(self.quantity * self.unit_price_kzt, 2)

    @property
    def vat_rate(self) -> float:
        return 12.0  # Қазақстан Республикасы ҚҚС мөлшерлемесі

    @property
    def vat_amount(self) -> float:
        return round(self.price_without_vat * (self.vat_rate / 100.0), 2)

    @property
    def total_with_vat(self) -> float:
        return round(self.price_without_vat + self.vat_amount, 2)


class ESFInvoice:
    """Қазақстан Республикасының Электрондық шот-фактура (ЭСФ) құжаты"""
    def __init__(
        self,
        invoice_num: str,
        turnover_date: str,
        seller_bin: str,
        seller_name: str,
        customer_bin: str,
        customer_name: str,
        items: List[ESFItem]
    ):
        self.invoice_num = invoice_num
        self.turnover_date = turnover_date
        self.seller_bin = seller_bin
        self.seller_name = seller_name
        self.customer_bin = customer_bin
        self.customer_name = customer_name
        self.items = items

    def calculate_totals(self) -> Dict[str, float]:
        subtotal = sum(i.price_without_vat for i in self.items)
        vat = sum(i.vat_amount for i in self.items)
        total = sum(i.total_with_vat for i in self.items)
        return {
            "subtotal": round(subtotal, 2),
            "vat_amount": round(vat, 2),
            "total_with_vat": round(total, 2)
        }

    def to_esf_xml(self) -> str:
        """МКД ЭСФ v2 форматындағы XML генерациясы"""
        root = ET.Element("esf:invoice", {
            "xmlns:esf": "esf",
            "version": "2.0"
        })

        # А бөлімі: Жалпы мәліметтер
        sec_a = ET.SubElement(root, "dateAndNum")
        ET.SubElement(sec_a, "num").text = self.invoice_num
        ET.SubElement(sec_a, "date").text = datetime.now(timezone.utc).strftime("%Y-%m-%d")
        ET.SubElement(sec_a, "turnoverDate").text = self.turnover_date

        # В бөлімі: Сатушы (Реквизиты поставщика)
        sec_b = ET.SubElement(root, "seller")
        ET.SubElement(sec_b, "tin").text = self.seller_bin
        ET.SubElement(sec_b, "name").text = self.seller_name

        # С бөлімі: Сатып алушы (Реквизиты получателя)
        sec_c = ET.SubElement(root, "customer")
        ET.SubElement(sec_c, "tin").text = self.customer_bin
        ET.SubElement(sec_c, "name").text = self.customer_name

        # G бөлімі: Тауарлар мен қызметтер тізімі
        sec_g = ET.SubElement(root, "productSet")
        totals = self.calculate_totals()
        ET.SubElement(sec_g, "totalPriceWithoutTax").text = str(totals["subtotal"])
        ET.SubElement(sec_g, "totalVatAmount").text = str(totals["vat_amount"])
        ET.SubElement(sec_g, "totalInvoiceAmount").text = str(totals["total_with_vat"])

        products = ET.SubElement(sec_g, "products")
        for idx, item in enumerate(self.items, start=1):
            p = ET.SubElement(products, "product")
            ET.SubElement(p, "rowNumber").text = str(idx)
            ET.SubElement(p, "name").text = item.name
            ET.SubElement(p, "tnvedCode").text = item.tnved
            ET.SubElement(p, "unitCode").text = item.unit
            ET.SubElement(p, "quantity").text = str(item.quantity)
            ET.SubElement(p, "unitPrice").text = str(item.unit_price_kzt)
            ET.SubElement(p, "priceWithoutTax").text = str(item.price_without_vat)
            ET.SubElement(p, "vatRate").text = f"{item.vat_rate}%"
            ET.SubElement(p, "vatAmount").text = str(item.vat_amount)
            ET.SubElement(p, "priceWithTax").text = str(item.total_with_vat)

        return ET.tostring(root, encoding="utf-8", xml_declaration=True).decode("utf-8")

    def to_1c_commerceml_xml(self) -> str:
        """1C:Предприятие 8.3 CommerceML v2.09 импорт форматы"""
        root = ET.Element("КоммерческаяИнформация", {
            "ВерсияСхемы": "2.09",
            "ДатаФормирования": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S")
        })

        doc = ET.SubElement(root, "Документ")
        ET.SubElement(doc, "Ид").text = f"ESF-{self.invoice_num}"
        ET.SubElement(doc, "Номер").text = self.invoice_num
        ET.SubElement(doc, "Дата").text = self.turnover_date
        ET.SubElement(doc, "ХозяйственнаяОперация").text = "РеализацияТоваров"
        ET.SubElement(doc, "Роль").text = "Продавец"
        ET.SubElement(doc, "Валюта").text = "KZT"

        totals = self.calculate_totals()
        ET.SubElement(doc, "Сумма").text = str(totals["total_with_vat"])

        # Контрагенты
        counterparties = ET.SubElement(doc, "Контрагенты")
        buyer = ET.SubElement(counterparties, "Контрагент")
        ET.SubElement(buyer, "Роль").text = "Покупатель"
        ET.SubElement(buyer, "Наименование").text = self.customer_name
        ET.SubElement(buyer, "ИИН_БИН").text = self.customer_bin

        # Товары
        goods = ET.SubElement(doc, "Товары")
        for item in self.items:
            g = ET.SubElement(goods, "Товар")
            ET.SubElement(g, "Наименование").text = item.name
            ET.SubElement(g, "Артикул").text = item.tnved
            ET.SubElement(g, "БазоваяЕдиница").text = item.unit
            ET.SubElement(g, "ЦенаЗаЕдиницу").text = str(item.unit_price_kzt)
            ET.SubElement(g, "Количество").text = str(item.quantity)
            ET.SubElement(g, "Сумма").text = str(item.total_with_vat)
            ET.SubElement(g, "СтавкаНДС").text = "12"
            ET.SubElement(g, "СуммаНДС").text = str(item.vat_amount)

        return ET.tostring(root, encoding="utf-8", xml_declaration=True).decode("utf-8")
