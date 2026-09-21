"""
LunarEC AI Analytics - Customer RFM (Recency, Frequency, Monetary) Segmentation Engine
Calculates dynamic customer loyalty tiers, churn risk, and VIP retention segments.
"""

from datetime import datetime, date
from typing import List, Dict, Any


class CustomerRFMEngine:
    def __init__(self, reference_date: date = None):
        self.reference_date = reference_date or date.today()

    def calculate_rfm_score(
        self,
        last_order_date: date,
        total_orders_count: int,
        total_spent_amount: float,
    ) -> Dict[str, Any]:
        """
        Calculates R, F, M quintile scores (1 to 5) and assigns actionable segment.
        """
        if isinstance(last_order_date, str):
            last_order_date = datetime.strptime(last_order_date, "%Y-%m-%d").date()

        days_since_last_order = (self.reference_date - last_order_date).days
        days_since_last_order = max(0, days_since_last_order)

        # 1. Recency Score (5 is recent, 1 is long ago)
        if days_since_last_order <= 7:
            r_score = 5
        elif days_since_last_order <= 30:
            r_score = 4
        elif days_since_last_order <= 60:
            r_score = 3
        elif days_since_last_order <= 120:
            r_score = 2
        else:
            r_score = 1

        # 2. Frequency Score (5 is frequent, 1 is one-time)
        if total_orders_count >= 20:
            f_score = 5
        elif total_orders_count >= 10:
            f_score = 4
        elif total_orders_count >= 5:
            f_score = 3
        elif total_orders_count >= 2:
            f_score = 2
        else:
            f_score = 1

        # 3. Monetary Score (5 is high spender, 1 is low spender in KZT)
        if total_spent_amount >= 500000.0:
            m_score = 5
        elif total_spent_amount >= 200000.0:
            m_score = 4
        elif total_spent_amount >= 80000.0:
            m_score = 3
        elif total_spent_amount >= 20000.0:
            m_score = 2
        else:
            m_score = 1

        # Composite Segment Tagging
        composite_score = f"{r_score}{f_score}{m_score}"
        avg_score = (r_score + f_score + m_score) / 3.0

        if r_score >= 4 and f_score >= 4 and m_score >= 4:
            segment = "Champions (VIP)"
            action = "Exclusive VIP perks, early menu access, personal manager"
        elif r_score >= 3 and f_score >= 3:
            segment = "Loyal Customers"
            action = "Upsell higher margin items, loyalty reward points"
        elif r_score >= 4 and f_score <= 2:
            segment = "New Potential"
            action = "Welcome onboarding promo, 2nd purchase coupon"
        elif r_score <= 2 and f_score >= 3:
            segment = "At Risk (Need Attention)"
            action = "Reactivation push notification, special discount offer"
        elif r_score == 1 and f_score <= 2:
            segment = "Hibernating / Churned"
            action = "Standard seasonal broadcast campaign"
        else:
            segment = "Promising Regulars"
            action = "Recommend personalized menu favorites"

        return {
            "days_since_last_order": days_since_last_order,
            "r_score": r_score,
            "f_score": f_score,
            "m_score": m_score,
            "composite_score": composite_score,
            "avg_score": round(avg_score, 2),
            "segment": segment,
            "recommended_action": action,
        }
