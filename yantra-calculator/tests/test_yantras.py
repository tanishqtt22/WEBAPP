"""
Test suite for validating yantra calculations against known historical data.

This module tests the accuracy of our mathematical models by comparing
calculated dimensions with known measurements from historical sites.
"""

import sys
import os
import unittest
import math

# Add src directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'src'))

from yantras import YantraCalculator, SamratYantra, get_historical_sites
from astronomy import AstronomicalCalculator


class TestAstronomicalCalculations(unittest.TestCase):
    """Test astronomical calculation accuracy."""
    
    def setUp(self):
        # Test with Jaipur coordinates (known reference site)
        self.jaipur_calc = AstronomicalCalculator(26.9247, 75.8244)
    
    def test_solar_declination_range(self):
        """Test that solar declination stays within expected bounds."""
        for day in range(1, 366):
            declination = self.jaipur_calc.solar_declination(day)
            self.assertGreaterEqual(declination, -23.5, 
                                  f"Declination too low on day {day}: {declination}")
            self.assertLessEqual(declination, 23.5, 
                               f"Declination too high on day {day}: {declination}")
    
    def test_summer_solstice_declination(self):
        """Test declination on summer solstice (day 172)."""
        declination = self.jaipur_calc.solar_declination(172)  # June 21
        self.assertAlmostEqual(declination, 23.44, delta=0.1,
                              msg="Summer solstice declination incorrect")
    
    def test_winter_solstice_declination(self):
        """Test declination on winter solstice (day 355)."""
        declination = self.jaipur_calc.solar_declination(355)  # December 21
        self.assertAlmostEqual(declination, -23.44, delta=0.1,
                              msg="Winter solstice declination incorrect")
    
    def test_equinox_declination(self):
        """Test declination on equinoxes should be near zero."""
        # Spring equinox (day 80)
        spring_decl = self.jaipur_calc.solar_declination(80)
        self.assertAlmostEqual(spring_decl, 0, delta=1.0,
                              msg="Spring equinox declination should be near 0")
        
        # Fall equinox (day 263)
        fall_decl = self.jaipur_calc.solar_declination(263)
        self.assertAlmostEqual(fall_decl, 0, delta=1.0,
                              msg="Fall equinox declination should be near 0")
    
    def test_sunrise_sunset_symmetry(self):
        """Test that sunrise and sunset are symmetric around noon."""
        sunrise, sunset = self.jaipur_calc.sunrise_sunset_times(172)  # Summer solstice
        noon = 12.0
        morning_diff = noon - sunrise
        evening_diff = sunset - noon
        self.assertAlmostEqual(morning_diff, evening_diff, delta=0.1,
                              msg="Sunrise and sunset should be symmetric around noon")
    
    def test_daylight_hours_seasonal_variation(self):
        """Test that daylight hours vary correctly with seasons."""
        summer_sunrise, summer_sunset = self.jaipur_calc.sunrise_sunset_times(172)
        winter_sunrise, winter_sunset = self.jaipur_calc.sunrise_sunset_times(355)
        
        summer_daylight = summer_sunset - summer_sunrise
        winter_daylight = winter_sunset - winter_sunrise
        
        self.assertGreater(summer_daylight, winter_daylight,
                          "Summer should have more daylight hours than winter")


class TestSamratYantraCalculations(unittest.TestCase):
    """Test Samrat Yantra dimension calculations."""
    
    def setUp(self):
        # Test locations
        self.jaipur_lat, self.jaipur_lng = 26.9247, 75.8244
        self.delhi_lat, self.delhi_lng = 28.6269, 77.2164
        self.ujjain_lat, self.ujjain_lng = 23.1793, 75.7849
    
    def test_gnomon_angle_equals_latitude(self):
        """Test that gnomon angle equals latitude for all locations."""
        test_locations = [
            (self.jaipur_lat, self.jaipur_lng),
            (self.delhi_lat, self.delhi_lng), 
            (self.ujjain_lat, self.ujjain_lng)
        ]
        
        for lat, lng in test_locations:
            yantra = SamratYantra(lat, lng)
            specs = yantra.calculate_dimensions()
            
            self.assertAlmostEqual(specs.angles['gnomon_inclination'], lat, delta=0.001,
                                 msg=f"Gnomon angle should equal latitude for {lat}, {lng}")
    
    def test_jaipur_samrat_yantra_dimensions(self):
        """Test against known Jaipur Samrat Yantra dimensions."""
        # The actual Jaipur Samrat Yantra gnomon height is approximately 27.4 meters
        yantra = SamratYantra(self.jaipur_lat, self.jaipur_lng, scale=1.0)
        specs = yantra.calculate_dimensions()
        
        expected_height = 27.4  # meters (historical measurement)
        calculated_height = specs.dimensions['gnomon_height']
        
        self.assertAlmostEqual(calculated_height, expected_height, delta=1.0,
                              msg=f"Jaipur gnomon height: expected {expected_height}m, got {calculated_height}m")
    
    def test_geometric_relationships(self):
        """Test geometric relationships in Samrat Yantra."""
        yantra = SamratYantra(self.jaipur_lat, self.jaipur_lng)
        specs = yantra.calculate_dimensions()
        
        height = specs.dimensions['gnomon_height']
        hypotenuse = specs.dimensions['gnomon_hypotenuse']
        base = specs.dimensions['gnomon_base']
        angle_rad = math.radians(specs.angles['gnomon_inclination'])
        
        # Test trigonometric relationships
        self.assertAlmostEqual(height, hypotenuse * math.sin(angle_rad), delta=0.01,
                              msg="Height = hypotenuse × sin(angle)")
        
        self.assertAlmostEqual(base, hypotenuse * math.cos(angle_rad), delta=0.01,
                              msg="Base = hypotenuse × cos(angle)")
        
        self.assertAlmostEqual(height, base * math.tan(angle_rad), delta=0.01,
                              msg="Height = base × tan(angle)")
    
    def test_scale_factor_application(self):
        """Test that scale factor is applied correctly."""
        scale_factors = [0.5, 1.0, 2.0, 5.0]
        
        for scale in scale_factors:
            yantra = SamratYantra(self.jaipur_lat, self.jaipur_lng, scale=scale)
            specs = yantra.calculate_dimensions()
            
            expected_height = 27.4 * scale
            actual_height = specs.dimensions['gnomon_height']
            
            self.assertAlmostEqual(actual_height, expected_height, delta=0.01,
                                 msg=f"Scale {scale}: expected height {expected_height}, got {actual_height}")


class TestYantraCalculatorIntegration(unittest.TestCase):
    """Integration tests for the complete YantraCalculator."""
    
    def setUp(self):
        self.calculator = YantraCalculator(26.9247, 75.8244)  # Jaipur
        self.historical_sites = get_historical_sites()
    
    def test_all_yantra_types_calculated(self):
        """Test that all yantra types are calculated."""
        results = self.calculator.calculate_all_yantras()
        
        expected_yantras = ['samrat', 'rama', 'digamsa', 'dhruva']
        for yantra_type in expected_yantras:
            self.assertIn(yantra_type, results, f"Missing yantra type: {yantra_type}")
            self.assertIsNotNone(results[yantra_type], f"Null result for {yantra_type}")
    
    def test_site_analysis_completeness(self):
        """Test that site analysis includes all required data."""
        analysis = self.calculator.get_site_analysis()
        
        required_keys = ['location', 'astronomical_data', 'construction_considerations']
        for key in required_keys:
            self.assertIn(key, analysis, f"Missing key in site analysis: {key}")
        
        # Check location data
        location = analysis['location']
        self.assertEqual(location['latitude'], 26.9247)
        self.assertEqual(location['longitude'], 75.8244)
        self.assertIn('coordinates_dms', location)
        
        # Check astronomical data
        astro_data = analysis['astronomical_data']
        self.assertIn('max_sun_elevation', astro_data)
        self.assertIn('min_sun_elevation', astro_data)
    
    def test_historical_site_coordinates(self):
        """Test that historical site coordinates are reasonable."""
        for site_name, site_data in self.historical_sites.items():
            lat = site_data['latitude']
            lng = site_data['longitude']
            
            # All sites should be in India
            self.assertGreater(lat, 8, f"Latitude too low for {site_name}: {lat}")
            self.assertLess(lat, 37, f"Latitude too high for {site_name}: {lat}")
            self.assertGreater(lng, 68, f"Longitude too low for {site_name}: {lng}")
            self.assertLess(lng, 98, f"Longitude too high for {site_name}: {lng}")
    
    def test_different_locations_different_results(self):
        """Test that different locations produce different results."""
        jaipur_calc = YantraCalculator(26.9247, 75.8244)
        delhi_calc = YantraCalculator(28.6269, 77.2164)
        
        jaipur_results = jaipur_calc.calculate_all_yantras()
        delhi_results = delhi_calc.calculate_all_yantras()
        
        # Gnomon angles should be different (equal to latitude)
        jaipur_angle = jaipur_results['samrat'].angles['gnomon_inclination']
        delhi_angle = delhi_results['samrat'].angles['gnomon_inclination']
        
        self.assertNotAlmostEqual(jaipur_angle, delhi_angle, places=3,
                                 msg="Different locations should produce different gnomon angles")


class TestEdgeCases(unittest.TestCase):
    """Test edge cases and boundary conditions."""
    
    def test_equatorial_location(self):
        """Test calculations at equator."""
        calculator = YantraCalculator(0.0, 77.0)  # Equator
        results = calculator.calculate_all_yantras()
        
        # At equator, gnomon should be horizontal (0 degrees)
        samrat_angle = results['samrat'].angles['gnomon_inclination']
        self.assertAlmostEqual(samrat_angle, 0.0, delta=0.001,
                              msg="At equator, gnomon angle should be 0°")
    
    def test_polar_location(self):
        """Test calculations at high latitude."""
        # Test at 60° North (reasonable high latitude)
        calculator = YantraCalculator(60.0, 30.0)
        results = calculator.calculate_all_yantras()
        
        # Gnomon angle should be 60°
        samrat_angle = results['samrat'].angles['gnomon_inclination']
        self.assertAlmostEqual(samrat_angle, 60.0, delta=0.001,
                              msg="At 60°N, gnomon angle should be 60°")
    
    def test_southern_hemisphere(self):
        """Test calculations in southern hemisphere."""
        # Test in southern India (still northern hemisphere but close to equator)
        calculator = YantraCalculator(8.0, 77.0)  # Southern India
        results = calculator.calculate_all_yantras()
        
        # Should still work normally
        samrat_angle = results['samrat'].angles['gnomon_inclination']
        self.assertAlmostEqual(samrat_angle, 8.0, delta=0.001,
                              msg="Southern locations should work correctly")
    
    def test_extreme_scale_factors(self):
        """Test with extreme scale factors."""
        calculator = YantraCalculator(26.9247, 75.8244, scale=0.1)
        results = calculator.calculate_all_yantras()
        
        # Very small scale should still work
        height = results['samrat'].dimensions['gnomon_height']
        self.assertGreater(height, 0, "Even tiny scale should produce positive dimensions")
        
        # Large scale
        calculator_large = YantraCalculator(26.9247, 75.8244, scale=10.0)
        results_large = calculator_large.calculate_all_yantras()
        
        height_large = results_large['samrat'].dimensions['gnomon_height']
        self.assertLess(height_large, 1000, "Large scale should be reasonable")


class TestCalculationAccuracy(unittest.TestCase):
    """Test the overall accuracy of calculations."""
    
    def test_precision_consistency(self):
        """Test that repeated calculations are consistent."""
        calculator = YantraCalculator(26.9247, 75.8244)
        
        # Run calculations multiple times
        results1 = calculator.calculate_all_yantras()
        results2 = calculator.calculate_all_yantras()
        
        # Should be identical
        height1 = results1['samrat'].dimensions['gnomon_height']
        height2 = results2['samrat'].dimensions['gnomon_height']
        
        self.assertEqual(height1, height2, "Repeated calculations should be identical")
    
    def test_known_historical_accuracy(self):
        """Test accuracy against known historical measurements."""
        # Known data from Jaipur Jantar Mantar
        jaipur_calculator = YantraCalculator(26.9247, 75.8244)
        results = jaipur_calculator.calculate_all_yantras()
        
        # The Jaipur Samrat Yantra specifications
        calculated_height = results['samrat'].dimensions['gnomon_height']
        calculated_angle = results['samrat'].angles['gnomon_inclination']
        
        # Historical measurements (approximate)
        expected_height = 27.4  # meters
        expected_angle = 26.9247  # degrees (latitude)
        
        self.assertAlmostEqual(calculated_height, expected_height, delta=2.0,
                              msg=f"Height deviation too large: {abs(calculated_height - expected_height)}m")
        
        self.assertAlmostEqual(calculated_angle, expected_angle, delta=0.01,
                              msg=f"Angle deviation too large: {abs(calculated_angle - expected_angle)}°")


def run_validation_report():
    """Generate a comprehensive validation report."""
    print("=" * 60)
    print("YANTRA CALCULATOR VALIDATION REPORT")
    print("=" * 60)
    
    # Test historical sites
    historical_sites = get_historical_sites()
    print(f"\nTesting {len(historical_sites)} historical sites:")
    
    for site_name, site_data in historical_sites.items():
        calculator = YantraCalculator(site_data['latitude'], site_data['longitude'])
        results = calculator.calculate_all_yantras()
        
        print(f"\n{site_name.replace('_', ' ')}:")
        print(f"  Location: {site_data['latitude']:.4f}°N, {site_data['longitude']:.4f}°E")
        print(f"  Samrat Yantra Gnomon Height: {results['samrat'].dimensions['gnomon_height']:.2f}m")
        print(f"  Gnomon Angle: {results['samrat'].angles['gnomon_inclination']:.2f}°")
        print(f"  Rama Yantra Base Radius: {results['rama'].dimensions['base_radius']:.2f}m")
    
    print("\n" + "=" * 60)
    print("VALIDATION COMPLETE")
    print("=" * 60)


if __name__ == '__main__':
    # Run the test suite
    unittest.main(verbosity=2, exit=False)
    
    # Generate validation report
    print("\n\n")
    run_validation_report()
