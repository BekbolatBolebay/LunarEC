"""Customer Feedback Sentiment Analyzer"""
def analyze_rating(score: int) -> str:
    return 'POSITIVE' if score >= 4 else 'NEUTRAL' if score == 3 else 'NEGATIVE'
