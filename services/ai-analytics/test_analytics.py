import unittest
from analytics import DemandPredictor

class TestDemandPredictor(unittest.TestCase):
    def test_moving_average(self):
        predictor = DemandPredictor([100, 200, 300])
        avg = predictor.calculate_moving_average(window_size=3)
        self.assertEqual(avg, 200.0)

    def test_forecast_next_day(self):
        predictor = DemandPredictor([100, 100, 100])
        forecast = predictor.forecast_next_day(growth_factor=1.10)
        self.assertEqual(forecast, 110)

    def test_ingredient_demand(self):
        predictor = DemandPredictor([50, 50, 50])
        demand = predictor.calculate_ingredient_demand(predicted_dishes=100, gram_per_portion=200.0)
        self.assertEqual(demand["required_kg"], 20.0)
        self.assertEqual(demand["recommended_order_kg"], 22.0)

if __name__ == '__main__':
    unittest.main()
