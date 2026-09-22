"""
LunarEC Menu Engineering & ABC Analysis (Python)
Classifies dishes based on Profitability (Contribution Margin) and Popularity (Volume Sold).
"""

from typing import List, Dict, Any


class MenuItem:
    def __init__(self, name: str, quantity_sold: int, sale_price: float, cost_price: float):
        self.name = name
        self.quantity_sold = max(0, quantity_sold)
        self.sale_price = max(0.0, sale_price)
        self.cost_price = max(0.0, cost_price)
        self.margin = self.sale_price - self.cost_price
        self.total_revenue = self.quantity_sold * self.sale_price
        self.total_profit = self.quantity_sold * self.margin


class MenuEngineeringAnalyzer:
    def __init__(self, items: List[MenuItem]):
        self.items = items

    def run_abc_analysis(self) -> List[Dict[str, Any]]:
        if not self.items:
            return []

        total_rev = sum(i.total_revenue for i in self.items)
        if total_rev == 0.0:
            return [
                {
                    "name": item.name,
                    "revenue": 0.0,
                    "share_pct": 0.0,
                    "abc_category": "C",
                }
                for item in self.items
            ]

        # Sort descending by revenue
        sorted_items = sorted(self.items, key=lambda x: x.total_revenue, reverse=True)

        cumulative = 0.0
        results = []
        for item in sorted_items:
            cumulative += item.total_revenue
            cum_percent = (cumulative / total_rev) * 100.0

            # ABC Category: A (0-80%), B (80-95%), C (95-100%)
            if cum_percent <= 80.0:
                category = "A"
            elif cum_percent <= 95.0:
                category = "B"
            else:
                category = "C"

            results.append({
                "name": item.name,
                "revenue": item.total_revenue,
                "share_pct": round((item.total_revenue / total_rev) * 100, 2),
                "abc_category": category,
            })
        return results

    def run_bcg_matrix(self) -> List[Dict[str, Any]]:
        if not self.items:
            return []

        avg_popularity = sum(i.quantity_sold for i in self.items) / len(self.items)
        avg_margin = sum(i.margin for i in self.items) / len(self.items)

        matrix = []
        for item in self.items:
            high_pop = item.quantity_sold >= avg_popularity
            high_margin = item.margin >= avg_margin

            if high_pop and high_margin:
                classification = "STAR"          # Жұлдыз: Жоғары сұраныс, жоғары пайда
                action = "Сапасын сақтау, белсенді ұсыну"
            elif high_pop and not high_margin:
                classification = "PLOWHORSE"     # Жұмысшы ат: Жоғары сұраныс, төмен пайда
                action = "Бағасын сәл көтеру немесе өзіндік құнын азайту"
            elif not high_pop and high_margin:
                classification = "PUZZLE"        # Жұмбақ: Төмен сұраныс, жоғары пайда
                action = "Маркетингпен жарнамалау, даяшыларға ұсынуды тапсыру"
            else:
                classification = "DOG"           # Ит: Төмен сұраныс, төмен пайда
                action = "Мәзірден алып тастау немесе жаңарту"

            matrix.append({
                "dish": item.name,
                "classification": classification,
                "action": action,
                "margin": item.margin,
                "sales_count": item.quantity_sold
            })
        return matrix
