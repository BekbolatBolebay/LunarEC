"""
Exponential Smoothing & Moving Average Demand Forecaster
"""
from typing import List

class DemandForecaster:
    @staticmethod
    def moving_average(sales_history: List[float], window: int = 3) -> float:
        if not sales_history:
            return 0.0
        if window <= 0:
            window = 1
        relevant = sales_history[-window:]
        return sum(relevant) / len(relevant)

    @staticmethod
    def exponential_smoothing(sales_history: List[float], alpha: float = 0.3) -> float:
        if not sales_history:
            return 0.0
        alpha = max(0.01, min(0.99, alpha))
        forecast = sales_history[0]
        for val in sales_history[1:]:
            forecast = alpha * val + (1.0 - alpha) * forecast
        return round(forecast, 2)
