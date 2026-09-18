import unittest
from menu_matrix import MenuEngineeringAnalyzer

class TestMenuEngineering(unittest.TestCase):
    def test_menu_classification(self):
        sample_menu = [
            {"id": "1", "name": "Angus Burger", "selling_price": 3600, "cogs": 1200, "volume": 180},
            {"id": "2", "name": "French Fries", "selling_price": 1200, "cogs": 300, "volume": 250},
            {"id": "3", "name": "Truffle Steak", "selling_price": 12000, "cogs": 5000, "volume": 20},
            {"id": "4", "name": "Basic Salad", "selling_price": 1500, "cogs": 900, "volume": 30},
        ]

        result = MenuEngineeringAnalyzer.classify_menu(sample_menu)
        self.assertEqual(len(result["items"]), 4)
        
        # Check classification exists
        categories = {item["name"]: item["category"] for item in result["items"]}
        self.assertIn("Angus Burger", categories)
        self.assertIn("French Fries", categories)

    def test_rush_hour_prediction(self):
        # 24 hours of orders
        hourly_orders = [
            0, 0, 0, 0, 0, 0, 5, 12, 25, 45, 80, 150, 
            165, 90, 40, 35, 50, 110, 180, 195, 130, 70, 30, 10
        ]
        prediction = MenuEngineeringAnalyzer.predict_rush_hours(hourly_orders)
        self.assertEqual(prediction["peak_hour"], 19) # 19:00 (7 PM)
        self.assertIn(12, prediction["rush_hours"]) # Lunch rush
        self.assertIn(19, prediction["rush_hours"]) # Dinner rush

if __name__ == "__main__":
    unittest.main()
