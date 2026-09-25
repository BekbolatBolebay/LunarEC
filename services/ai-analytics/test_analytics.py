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

from demand_forecaster import DemandForecaster

class TestDemandForecaster(unittest.TestCase):
    def test_moving_average_calculation(self):
        avg = DemandForecaster.moving_average([10.0, 20.0, 30.0], window=3)
        self.assertEqual(avg, 20.0)

    def test_exponential_smoothing(self):
        forecast = DemandForecaster.exponential_smoothing([100.0, 110.0, 120.0], alpha=0.5)
        self.assertGreater(forecast, 100.0)

if __name__ == '__main__':
    unittest.main()
