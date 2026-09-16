"""
LunarEC AI Analytics & Demand Forecasting Module (Python 3)
"""

from typing import List, Dict, Any

class DemandPredictor:
    """
    Analyzes historical order volumes and predicts future ingredient & dish demand.
    """
    def __init__(self, historical_daily_sales: List[int]):
        self.sales = historical_daily_sales

    def calculate_moving_average(self, window_size: int = 3) -> float:
        if not self.sales:
            return 0.0
        window = self.sales[-window_size:] if len(self.sales) >= window_size else self.sales
        return round(sum(window) / len(window), 2)

    def forecast_next_day(self, growth_factor: float = 1.05) -> int:
        avg = self.calculate_moving_average()
        return max(1, int(round(avg * growth_factor)))

    def calculate_ingredient_demand(self, predicted_dishes: int, gram_per_portion: float) -> Dict[str, Any]:
        total_kg = round((predicted_dishes * gram_per_portion) / 1000.0, 3)
        return {
            "predicted_portions": predicted_dishes,
            "required_kg": total_kg,
            "recommended_order_kg": round(total_kg * 1.1, 3)  # 10% safety buffer
        }

if __name__ == "__main__":
    # Sample run
    sales_history = [120, 135, 140, 160, 155, 180, 210]
    predictor = DemandPredictor(sales_history)
    predicted_next = predictor.forecast_next_day()
    demand = predictor.calculate_ingredient_demand(predicted_next, 180.0)
    print(f"🐍 [LunarEC Python AI] Predicted Next Day Sales: {predicted_next} portions")
    print(f"📦 Beef Required: {demand['required_kg']} kg (Order: {demand['recommended_order_kg']} kg)")
