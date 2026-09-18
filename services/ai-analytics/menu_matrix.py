"""
Menu Engineering Matrix (BCG / Kasavana-Smith Model) & Rush Hour Demand Forecaster.
Classifies menu items into Stars, Plowhorses, Puzzles, and Dogs.
"""

from typing import List, Dict, Any

class MenuEngineeringAnalyzer:
    @staticmethod
    def classify_menu(items: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Classifies items based on Popularity (Sales Volume) and Profitability (Contribution Margin).
        Categories:
        - Stars (⭐): High Popularity, High Margin
        - Plowhorses (🐎): High Popularity, Low Margin
        - Puzzles (🧩): Low Popularity, High Margin
        - Dogs (🐕): Low Popularity, Low Margin
        """
        if not items:
            return {"items": [], "average_margin": 0, "average_volume": 0}

        total_volume = sum(item["volume"] for item in items)
        avg_volume = total_volume / len(items)
        
        total_margin = sum(item["selling_price"] - item["cogs"] for item in items)
        avg_margin = total_margin / len(items)

        classified = []
        for item in items:
            margin = item["selling_price"] - item["cogs"]
            vol = item["volume"]
            revenue = item["selling_price"] * vol
            profit = margin * vol

            is_high_vol = vol >= avg_volume
            is_high_margin = margin >= avg_margin

            if is_high_vol and is_high_margin:
                category = "Star"
                action = "Promote and maintain quality standards"
            elif is_high_vol and not is_high_margin:
                category = "Plowhorse"
                action = "Reprice slightly or reduce portion cost"
            elif not is_high_vol and is_high_margin:
                category = "Puzzle"
                action = "Feature in marketing, improve visibility"
            else:
                category = "Dog"
                action = "Consider removing from menu or reinventing"

            classified.append({
                "id": item["id"],
                "name": item["name"],
                "category": category,
                "margin": margin,
                "volume": vol,
                "revenue": revenue,
                "profit": profit,
                "recommended_action": action
            })

        return {
            "items": classified,
            "average_margin": round(avg_margin, 2),
            "average_volume": round(avg_volume, 2),
            "total_revenue": sum(c["revenue"] for c in classified),
            "total_profit": sum(c["profit"] for c in classified)
        }

    @staticmethod
    def predict_rush_hours(hourly_order_counts: List[int]) -> Dict[str, Any]:
        """
        Identifies peak rush hours from hourly order distribution.
        """
        if not hourly_order_counts:
            return {"peak_hour": None, "average_hourly": 0, "rush_hours": []}

        avg_load = sum(hourly_order_counts) / len(hourly_order_counts)
        rush_hours = [
            hour for hour, count in enumerate(hourly_order_counts)
            if count > avg_load * 1.3
        ]

        peak_hour = max(range(len(hourly_order_counts)), key=lambda h: hourly_order_counts[h])

        return {
            "average_hourly": round(avg_load, 1),
            "peak_hour": peak_hour,
            "peak_volume": hourly_order_counts[peak_hour],
            "rush_hours": rush_hours
        }
