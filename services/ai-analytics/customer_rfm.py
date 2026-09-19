"""
RFM (Recency, Frequency, Monetary) Customer Segmentation Analyzer.
"""
from typing import List, Dict, Any

class RFMAnalyzer:
    @staticmethod
    def segment_customer(recency_days: int, frequency: int, total_spent: float) -> str:
        if recency_days <= 14 and frequency >= 5 and total_spent >= 50000:
            return "VIP Champions"
        elif recency_days <= 30 and frequency >= 2:
            return "Loyal Regulars"
        elif recency_days > 60:
            return "At Risk / Inactive"
        return "Potential Loyalists"
