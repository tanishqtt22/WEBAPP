"""
Mathematical models for Indian astronomical instruments (Yantras).

This module contains the specific mathematical formulations for calculating
the dimensions and orientations of various yantras based on geographical
location and astronomical parameters.
"""

import math
import numpy as np
from typing import Dict, List, Tuple, Any
from dataclasses import dataclass
from astronomy import AstronomicalCalculator


@dataclass
class YantraSpecs:
    """Specifications for a yantra instrument."""
    name: str
    description: str
    dimensions: Dict[str, float]
    angles: Dict[str, float]
    materials: List[str]
    construction_notes: str


class SamratYantra:
    """
    Samrat Yantra (The Supreme Instrument) - Giant sundial.
    
    The most prominent yantra, essentially a giant gnomon (sundial) that
    casts shadows to tell time with remarkable precision.
    """
    
    def __init__(self, latitude: float, longitude: float, scale: float = 1.0):
        """
        Initialize Samrat Yantra for specific location.
        
        Args:
            latitude: Latitude in decimal degrees
            longitude: Longitude in decimal degrees  
            scale: Scale factor for the instrument (1.0 = standard size)
        """
        self.latitude = latitude
        self.longitude = longitude
        self.scale = scale
        self.latitude_rad = math.radians(latitude)
        
    def calculate_dimensions(self) -> YantraSpecs:
        """
        Calculate the dimensions of Samrat Yantra for the given location.
        
        Returns:
            YantraSpecs object with all dimensions and specifications
        """
        # Base gnomon height (can be scaled)
        base_height = 27.4 * self.scale  # meters (based on Jaipur Samrat Yantra)
        
        # The gnomon wall must be inclined at the angle equal to latitude
        # for proper shadow casting
        gnomon_angle = self.latitude
        
        # Hypotenuse length of the gnomon triangle
        gnomon_hypotenuse = base_height / math.sin(self.latitude_rad)
        
        # Base width of the gnomon
        gnomon_base = base_height / math.tan(self.latitude_rad)
        
        # Quadrant radius - semicircular scales on either side
        quadrant_radius = gnomon_hypotenuse
        
        # Wall thickness (structural requirement)
        wall_thickness = max(0.6 * self.scale, 0.3)  # minimum 30cm
        
        # Step dimensions for the scale
        hour_step_angle = 15  # degrees per hour
        minute_step_angle = 0.25  # degrees per minute
        
        # Scale markings
        total_scale_length = 2 * quadrant_radius  # both quadrants
        scale_width = 3.0 * self.scale  # width of the hour scales
        
        dimensions = {
            'gnomon_height': base_height,
            'gnomon_angle': gnomon_angle,
            'gnomon_hypotenuse': gnomon_hypotenuse,
            'gnomon_base': gnomon_base,
            'quadrant_radius': quadrant_radius,
            'wall_thickness': wall_thickness,
            'total_length': gnomon_base + 2 * quadrant_radius,
            'total_width': 2 * quadrant_radius,
            'scale_width': scale_width,
            'hour_markings_count': 24,
            'minute_markings_count': 1440  # 24 * 60
        }
        
        angles = {
            'gnomon_inclination': gnomon_angle,
            'latitude_alignment': self.latitude,
            'meridian_orientation': 0,  # aligned to true north-south
            'hour_step_angle': hour_step_angle,
            'minute_step_angle': minute_step_angle
        }
        
        materials = [
            'Red sandstone (traditional)',
            'Marble (for precision surfaces)', 
            'Metal inlays (for fine markings)',
            'Concrete (modern alternative)'
        ]
        
        construction_notes = f"""
        The Samrat Yantra must be precisely aligned to true north.
        The gnomon wall is inclined at {gnomon_angle:.1f}° (equal to latitude).
        Time accuracy can reach ±20 seconds when properly constructed.
        The instrument works by casting shadows on the curved quadrant scales.
        Local solar time can be read directly from shadow position.
        """
        
        return YantraSpecs(
            name="Samrat Yantra",
            description="Giant sundial and primary timekeeping instrument",
            dimensions=dimensions,
            angles=angles,
            materials=materials,
            construction_notes=construction_notes
        )


class RamaYantra:
    """
    Rama Yantra - Cylindrical instrument for measuring altitude and azimuth.
    
    Consists of cylindrical structures with radial walls to measure
    the altitude and azimuth of celestial objects.
    """
    
    def __init__(self, latitude: float, longitude: float, scale: float = 1.0):
        self.latitude = latitude
        self.longitude = longitude
        self.scale = scale
        self.latitude_rad = math.radians(latitude)
        
    def calculate_dimensions(self) -> YantraSpecs:
        """Calculate dimensions for Rama Yantra."""
        
        # Base radius of the cylindrical structure
        base_radius = 6.0 * self.scale  # meters
        
        # Height of the central pillar
        pillar_height = 4.5 * self.scale  # meters
        
        # Number of radial divisions
        radial_divisions = 12  # for 12 directions
        radial_angle_step = 360 / radial_divisions
        
        # Wall height and thickness
        wall_height = 2.5 * self.scale
        wall_thickness = 0.3 * self.scale
        
        # Altitude scale markings
        altitude_scale_divisions = 90  # 0° to 90°
        altitude_step = 1  # degree per step
        
        dimensions = {
            'base_radius': base_radius,
            'pillar_height': pillar_height,
            'wall_height': wall_height,
            'wall_thickness': wall_thickness,
            'total_diameter': 2 * base_radius,
            'radial_divisions': radial_divisions,
            'altitude_scale_length': pillar_height,
            'scale_precision': altitude_step
        }
        
        angles = {
            'radial_step_angle': radial_angle_step,
            'altitude_range': 90,
            'azimuth_range': 360,
            'latitude_correction': self.latitude
        }
        
        materials = [
            'Stone masonry',
            'Metal scale markings',
            'Plaster finish (smooth surface)'
        ]
        
        construction_notes = f"""
        Rama Yantra measures celestial coordinates in the horizontal system.
        Each radial wall represents a different azimuth direction.
        The height of shadow on the central pillar indicates altitude.
        Requires precise leveling and north-south alignment.
        Best used for tracking star positions and planetary observations.
        """
        
        return YantraSpecs(
            name="Rama Yantra",
            description="Cylindrical instrument for altitude-azimuth measurements",
            dimensions=dimensions,
            angles=angles,
            materials=materials,
            construction_notes=construction_notes
        )


class DigamsaYantra:
    """
    Digamsa Yantra - Direction finding instrument.
    
    Used to measure the azimuth (direction) of celestial objects
    with high precision.
    """
    
    def __init__(self, latitude: float, longitude: float, scale: float = 1.0):
        self.latitude = latitude
        self.longitude = longitude
        self.scale = scale
        
    def calculate_dimensions(self) -> YantraSpecs:
        """Calculate dimensions for Digamsa Yantra."""
        
        # Main circular platform
        platform_radius = 4.0 * self.scale  # meters
        platform_thickness = 0.5 * self.scale
        
        # Central gnomon
        gnomon_height = 2.0 * self.scale
        gnomon_thickness = 0.1 * self.scale
        
        # Directional markings
        primary_directions = 4  # N, S, E, W
        secondary_directions = 8  # NE, SE, SW, NW, etc.
        fine_divisions = 360  # degree markings
        
        # Scale rings
        outer_ring_width = 0.5 * self.scale
        inner_ring_width = 0.3 * self.scale
        
        dimensions = {
            'platform_radius': platform_radius,
            'platform_thickness': platform_thickness,
            'platform_diameter': 2 * platform_radius,
            'gnomon_height': gnomon_height,
            'gnomon_thickness': gnomon_thickness,
            'outer_ring_width': outer_ring_width,
            'inner_ring_width': inner_ring_width,
            'scale_divisions': fine_divisions
        }
        
        angles = {
            'primary_angle_step': 90,  # cardinal directions
            'secondary_angle_step': 45,  # sub-cardinal directions  
            'fine_angle_step': 1,  # degree markings
            'precision': 0.1  # decimal degrees
        }
        
        materials = [
            'Marble platform',
            'Bronze gnomon',
            'Engraved direction markings'
        ]
        
        construction_notes = """
        Digamsa Yantra must be perfectly level and aligned to magnetic north.
        The gnomon casts shadows indicating azimuth angles.
        Precision depends on gnomon height and scale quality.
        Used primarily for surveying and navigation purposes.
        Can measure directions with accuracy up to 6 arc-minutes.
        """
        
        return YantraSpecs(
            name="Digamsa Yantra",
            description="Precision azimuth/direction measuring instrument",
            dimensions=dimensions,
            angles=angles,
            materials=materials,
            construction_notes=construction_notes
        )


class DhruvaYantra:
    """
    Dhruva-Protha-Chakra Yantra - Polar alignment instrument.
    
    Used to determine the position of the pole star and maintain
    accurate north-south orientation.
    """
    
    def __init__(self, latitude: float, longitude: float, scale: float = 1.0):
        self.latitude = latitude
        self.longitude = longitude
        self.scale = scale
        self.latitude_rad = math.radians(latitude)
        
    def calculate_dimensions(self) -> YantraSpecs:
        """Calculate dimensions for Dhruva Yantra."""
        
        # The main structure is aligned to the celestial pole
        # The angle equals the latitude of the location
        pole_angle = self.latitude
        
        # Base circle radius
        base_radius = 3.0 * self.scale
        
        # Polar axis length (inclined at latitude angle)
        polar_axis_length = 5.0 * self.scale
        
        # Ring system for tracking pole star
        outer_ring_radius = 2.5 * self.scale
        inner_ring_radius = 1.5 * self.scale
        ring_thickness = 0.2 * self.scale
        
        # Sighting mechanism
        sight_tube_length = 1.0 * self.scale
        sight_tube_diameter = 0.05 * self.scale
        
        dimensions = {
            'base_radius': base_radius,
            'polar_axis_length': polar_axis_length,
            'outer_ring_radius': outer_ring_radius,
            'inner_ring_radius': inner_ring_radius,
            'ring_thickness': ring_thickness,
            'sight_tube_length': sight_tube_length,
            'sight_tube_diameter': sight_tube_diameter,
            'base_diameter': 2 * base_radius
        }
        
        angles = {
            'pole_inclination_angle': pole_angle,
            'latitude_alignment': self.latitude,
            'celestial_pole_angle': 90 - self.latitude,  # altitude of celestial pole
            'precision_arc_minutes': 2
        }
        
        materials = [
            'Bronze or brass (for rings)',
            'Steel (for polar axis)',
            'Stone base platform'
        ]
        
        construction_notes = f"""
        Dhruva Yantra is inclined at {pole_angle:.1f}° to align with celestial pole.
        The polar axis must point directly at Polaris (Dhruva).
        Used for precise determination of true north.
        Essential for aligning other yantras correctly.
        Requires adjustment for precession over centuries.
        """
        
        return YantraSpecs(
            name="Dhruva-Protha-Chakra Yantra",
            description="Polar alignment and north-finding instrument",
            dimensions=dimensions,
            angles=angles,
            materials=materials,
            construction_notes=construction_notes
        )


class YantraCalculator:
    """Main calculator class that orchestrates all yantra calculations."""
    
    def __init__(self, latitude: float, longitude: float, scale: float = 1.0):
        """
        Initialize the calculator for a specific location.
        
        Args:
            latitude: Latitude in decimal degrees
            longitude: Longitude in decimal degrees
            scale: Scale factor for all instruments
        """
        self.latitude = latitude
        self.longitude = longitude
        self.scale = scale
        self.astro_calc = AstronomicalCalculator(latitude, longitude)
        
        # Initialize all yantra types
        self.yantras = {
            'samrat': SamratYantra(latitude, longitude, scale),
            'rama': RamaYantra(latitude, longitude, scale),
            'digamsa': DigamsaYantra(latitude, longitude, scale),
            'dhruva': DhruvaYantra(latitude, longitude, scale)
        }
    
    def calculate_all_yantras(self) -> Dict[str, YantraSpecs]:
        """
        Calculate specifications for all yantra types.
        
        Returns:
            Dictionary mapping yantra names to their specifications
        """
        results = {}
        for name, yantra in self.yantras.items():
            results[name] = yantra.calculate_dimensions()
        return results
    
    def get_site_analysis(self) -> Dict[str, Any]:
        """
        Get comprehensive site analysis including astronomical parameters.
        
        Returns:
            Dictionary with site analysis data
        """
        # Sample calculations for different times of year
        summer_solstice = self.astro_calc.get_celestial_coordinates(172, 12)  # June 21, noon
        winter_solstice = self.astro_calc.get_celestial_coordinates(355, 12)  # Dec 21, noon
        equinox = self.astro_calc.get_celestial_coordinates(80, 12)  # March 21, noon
        
        return {
            'location': {
                'latitude': self.latitude,
                'longitude': self.longitude,
                'coordinates_dms': self._decimal_to_dms(self.latitude, self.longitude)
            },
            'astronomical_data': {
                'summer_solstice': summer_solstice,
                'winter_solstice': winter_solstice,
                'spring_equinox': equinox,
                'max_sun_elevation': 90 - abs(self.latitude - 23.44),
                'min_sun_elevation': 90 - abs(self.latitude + 23.44),
            },
            'construction_considerations': {
                'magnetic_declination': 'Requires local survey',
                'foundation_requirements': 'Stable, level stone foundation',
                'alignment_precision': '±1 arc-minute for optimal accuracy',
                'material_weathering': 'Consider local climate conditions'
            }
        }
    
    def _decimal_to_dms(self, lat: float, lon: float) -> Dict[str, str]:
        """Convert decimal degrees to degrees-minutes-seconds format."""
        def dd_to_dms(decimal_deg: float, is_latitude: bool = True) -> str:
            direction = ""
            if is_latitude:
                direction = "N" if decimal_deg >= 0 else "S"
            else:
                direction = "E" if decimal_deg >= 0 else "W"
            
            decimal_deg = abs(decimal_deg)
            degrees = int(decimal_deg)
            minutes = int((decimal_deg - degrees) * 60)
            seconds = ((decimal_deg - degrees) * 60 - minutes) * 60
            
            return f"{degrees}°{minutes}'{seconds:.1f}\"{direction}"
        
        return {
            'latitude_dms': dd_to_dms(lat, True),
            'longitude_dms': dd_to_dms(lon, False)
        }


def get_historical_sites() -> Dict[str, Dict[str, float]]:
    """
    Get coordinates of historical yantra sites in India.
    
    Returns:
        Dictionary mapping site names to their coordinates
    """
    return {
        'Jaipur_Jantar_Mantar': {
            'latitude': 26.9247,
            'longitude': 75.8244,
            'description': 'Largest and best-preserved yantra collection'
        },
        'Delhi_Jantar_Mantar': {
            'latitude': 28.6269,
            'longitude': 77.2164,
            'description': 'Historic observatory in the capital'
        },
        'Varanasi_Jantar_Mantar': {
            'latitude': 25.3181,
            'longitude': 83.0104,
            'description': 'Ancient astronomical observatory'
        },
        'Ujjain_Jantar_Mantar': {
            'latitude': 23.1793,
            'longitude': 75.7849,
            'description': 'Reference point for ancient Indian timekeeping'
        },
        'Mathura_Yantra': {
            'latitude': 27.4924,
            'longitude': 77.6737,
            'description': 'Lesser-known but historically significant site'
        }
    }
