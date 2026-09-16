"""
LunarEC Time-Series Revenue & Peak Hour Forecasting (Python)
"""

from typing import List, Dict

class TimeSeriesForecast:
    def __init__(self, hourly_traffic: List[int]):
        self.traffic = hourly_traffic

    def exponential_smoothing(self, alpha: float = 0.3) -> List[float]:
        """Simple exponential smoothing for restaurant traffic."""
        if not self.traffic:
            return []
        smoothed = [float(self.traffic[0])]
        for t in range(1, len(self.traffic)):
            s = alpha * self.traffic[t] + (1 - alpha) * smoothed[t - 1]
            smoothed.append(round(s, 2))
        return smoothed

    def detect_peak_hours(self, threshold_multiplier: float = 1.25) -> List[int]:
        """Detects hours (0-23) where guest count exceeds 125% of the daily mean."""
        if not self.traffic:
            return []
        mean_traffic = sum(self.traffic) / len(self.traffic)
        peak_hours = []
        for hour, count in enumerate(self.traffic):
            if count >= mean_traffic * threshold_multiplier:
                peak_hours.append(hour)
        return peak_hours
