"""
Astronomical calculations for Indian Yantra instruments.

This module contains the fundamental astronomical calculations needed
to determine the dimensions and orientations of various yantras based
on geographical location.
"""

import math
import numpy as np
from datetime import datetime, timezone
from typing import Tuple, Dict, Any


class AstronomicalCalculator:
    """Core astronomical calculations for yantra design."""
    
    # Constants
    EARTH_OBLIQUITY = 23.43929  # degrees, obliquity of ecliptic
    TROPICAL_YEAR = 365.24219  # days
    
    def __init__(self, latitude: float, longitude: float):
        """
        Initialize calculator for a specific location.
        
        Args:
            latitude: Latitude in decimal degrees (positive for North)
            longitude: Longitude in decimal degrees (positive for East)
        """
        self.latitude = latitude
        self.longitude = longitude
        self.latitude_rad = math.radians(latitude)
        self.longitude_rad = math.radians(longitude)
    
    def solar_declination(self, day_of_year: int) -> float:
        """
        Calculate solar declination for given day of year.
        
        Args:
            day_of_year: Day of year (1-365)
            
        Returns:
            Solar declination in degrees
        """
        # Using the standard formula for solar declination
        declination = self.EARTH_OBLIQUITY * math.sin(
            math.radians(360 * (284 + day_of_year) / 365)
        )
        return declination
    
    def equation_of_time(self, day_of_year: int) -> float:
        """
        Calculate equation of time for given day of year.
        
        Args:
            day_of_year: Day of year (1-365)
            
        Returns:
            Equation of time in minutes
        """
        b = 2 * math.pi * (day_of_year - 81) / 365
        eot = 9.87 * math.sin(2 * b) - 7.53 * math.cos(b) - 1.5 * math.sin(b)
        return eot
    
    def solar_hour_angle(self, local_solar_time: float) -> float:
        """
        Calculate solar hour angle.
        
        Args:
            local_solar_time: Local solar time in hours (0-24)
            
        Returns:
            Hour angle in degrees
        """
        return 15 * (local_solar_time - 12)
    
    def solar_elevation_azimuth(self, day_of_year: int, local_solar_time: float) -> Tuple[float, float]:
        """
        Calculate solar elevation and azimuth angles.
        
        Args:
            day_of_year: Day of year (1-365)
            local_solar_time: Local solar time in hours
            
        Returns:
            Tuple of (elevation, azimuth) in degrees
        """
        declination = math.radians(self.solar_declination(day_of_year))
        hour_angle = math.radians(self.solar_hour_angle(local_solar_time))
        
        # Solar elevation
        sin_elevation = (math.sin(declination) * math.sin(self.latitude_rad) + 
                        math.cos(declination) * math.cos(self.latitude_rad) * 
                        math.cos(hour_angle))
        elevation = math.degrees(math.asin(sin_elevation))
        
        # Solar azimuth
        cos_azimuth = ((math.sin(declination) * math.cos(self.latitude_rad) - 
                       math.cos(declination) * math.sin(self.latitude_rad) * 
                       math.cos(hour_angle)) / math.cos(math.radians(elevation)))
        
        azimuth = math.degrees(math.acos(np.clip(cos_azimuth, -1, 1)))
        
        # Adjust azimuth for afternoon hours
        if hour_angle > 0:
            azimuth = 360 - azimuth
            
        return elevation, azimuth
    
    def sunrise_sunset_times(self, day_of_year: int) -> Tuple[float, float]:
        """
        Calculate sunrise and sunset times for given day.
        
        Args:
            day_of_year: Day of year (1-365)
            
        Returns:
            Tuple of (sunrise_time, sunset_time) in hours
        """
        declination = math.radians(self.solar_declination(day_of_year))
        
        # Hour angle at sunrise/sunset
        cos_hour_angle = -math.tan(self.latitude_rad) * math.tan(declination)
        
        # Check for polar day/night
        if cos_hour_angle < -1:
            return 0, 24  # Polar day
        elif cos_hour_angle > 1:
            return 12, 12  # Polar night
        
        hour_angle = math.degrees(math.acos(cos_hour_angle))
        
        sunrise = 12 - hour_angle / 15
        sunset = 12 + hour_angle / 15
        
        return sunrise, sunset
    
    def get_celestial_coordinates(self, day_of_year: int, local_solar_time: float) -> Dict[str, float]:
        """
        Get comprehensive celestial coordinates for yantra calculations.
        
        Args:
            day_of_year: Day of year (1-365)
            local_solar_time: Local solar time in hours
            
        Returns:
            Dictionary containing all relevant astronomical parameters
        """
        declination = self.solar_declination(day_of_year)
        eot = self.equation_of_time(day_of_year)
        hour_angle = self.solar_hour_angle(local_solar_time)
        elevation, azimuth = self.solar_elevation_azimuth(day_of_year, local_solar_time)
        sunrise, sunset = self.sunrise_sunset_times(day_of_year)
        
        return {
            'latitude': self.latitude,
            'longitude': self.longitude,
            'day_of_year': day_of_year,
            'local_solar_time': local_solar_time,
            'solar_declination': declination,
            'equation_of_time': eot,
            'hour_angle': hour_angle,
            'solar_elevation': elevation,
            'solar_azimuth': azimuth,
            'sunrise_time': sunrise,
            'sunset_time': sunset,
            'daylight_hours': sunset - sunrise
        }


def get_ujjain_reference() -> Dict[str, float]:
    """
    Get the historical reference coordinates for Ujjain.
    
    Returns:
        Dictionary with Ujjain's coordinates and zero meridian reference
    """
    return {
        'latitude': 23.1793,  # Ujjain latitude
        'longitude': 75.7849,  # Ujjain longitude  
        'reference_meridian': 75.0,  # Historical Indian standard meridian
        'local_name': 'Ujjain (Dongla)',
        'historical_significance': 'Prime Meridian of ancient India'
    }


def convert_to_ujjain_time(longitude: float, local_time: float) -> float:
    """
    Convert local time to Ujjain reference time.
    
    Args:
        longitude: Local longitude in degrees
        local_time: Local solar time in hours
        
    Returns:
        Equivalent time at Ujjain meridian
    """
    ujjain_longitude = 75.7849
    time_diff = (longitude - ujjain_longitude) / 15.0  # 15 degrees per hour
    return local_time - time_diff
