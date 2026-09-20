"""Sales Anomaly Detection"""
def is_anomaly(value: float, avg: float, std: float) -> bool:
    return abs(value - avg) > 2.5 * std
