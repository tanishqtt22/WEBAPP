"""
Main Flask application for the Ancient Indian Yantra Calculator.

This application provides a web interface for calculating the dimensions
of various astronomical instruments based on geographical location.
"""

import os
import sys
import json
from flask import Flask, render_template, request, jsonify, send_from_directory
from flask_cors import CORS

# Add src directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'src'))

from yantras import YantraCalculator, get_historical_sites
from astronomy import get_ujjain_reference

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'your-secret-key-here')
app.config['DEBUG'] = True


@app.route('/')
def index():
    """Main page with the yantra calculator interface."""
    historical_sites = get_historical_sites()
    ujjain_ref = get_ujjain_reference()
    
    return render_template('index.html', 
                         historical_sites=historical_sites,
                         ujjain_reference=ujjain_ref)


@app.route('/api/calculate', methods=['POST'])
def calculate_yantras():
    """
    API endpoint to calculate yantra dimensions for given coordinates.
    
    Expected JSON payload:
    {
        "latitude": float,
        "longitude": float,
        "scale": float (optional, default 1.0)
    }
    """
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'error': 'No data provided'}), 400
            
        latitude = data.get('latitude')
        longitude = data.get('longitude')
        scale = data.get('scale', 1.0)
        
        # Validate inputs
        if latitude is None or longitude is None:
            return jsonify({'error': 'Latitude and longitude are required'}), 400
            
        if not (-90 <= latitude <= 90):
            return jsonify({'error': 'Latitude must be between -90 and 90 degrees'}), 400
            
        if not (-180 <= longitude <= 180):
            return jsonify({'error': 'Longitude must be between -180 and 180 degrees'}), 400
            
        if not (0.1 <= scale <= 10.0):
            return jsonify({'error': 'Scale must be between 0.1 and 10.0'}), 400
        
        # Create calculator and compute results
        calculator = YantraCalculator(latitude, longitude, scale)
        yantra_specs = calculator.calculate_all_yantras()
        site_analysis = calculator.get_site_analysis()
        
        # Convert YantraSpecs objects to dictionaries for JSON serialization
        results = {}
        for name, specs in yantra_specs.items():
            results[name] = {
                'name': specs.name,
                'description': specs.description,
                'dimensions': specs.dimensions,
                'angles': specs.angles,
                'materials': specs.materials,
                'construction_notes': specs.construction_notes
            }
        
        response_data = {
            'success': True,
            'location': {
                'latitude': latitude,
                'longitude': longitude,
                'scale': scale
            },
            'yantras': results,
            'site_analysis': site_analysis,
            'timestamp': '2024-01-01T00:00:00Z'  # You might want to use actual timestamp
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': f'Calculation error: {str(e)}'
        }), 500


@app.route('/api/historical-sites')
def get_historical_sites_api():
    """API endpoint to get historical yantra sites."""
    try:
        sites = get_historical_sites()
        return jsonify({
            'success': True,
            'sites': sites
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/site-details/<site_name>')
def get_site_details(site_name):
    """Get detailed calculations for a specific historical site."""
    try:
        sites = get_historical_sites()
        
        if site_name not in sites:
            return jsonify({'error': 'Site not found'}), 404
            
        site_data = sites[site_name]
        calculator = YantraCalculator(site_data['latitude'], site_data['longitude'])
        
        yantra_specs = calculator.calculate_all_yantras()
        site_analysis = calculator.get_site_analysis()
        
        # Convert to serializable format
        results = {}
        for name, specs in yantra_specs.items():
            results[name] = {
                'name': specs.name,
                'description': specs.description,
                'dimensions': specs.dimensions,
                'angles': specs.angles,
                'materials': specs.materials,
                'construction_notes': specs.construction_notes
            }
        
        return jsonify({
            'success': True,
            'site_name': site_name,
            'site_info': site_data,
            'yantras': results,
            'site_analysis': site_analysis
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/api/compare-sites', methods=['POST'])
def compare_sites():
    """Compare yantra dimensions across multiple sites."""
    try:
        data = request.get_json()
        site_names = data.get('sites', [])
        
        if not site_names:
            return jsonify({'error': 'No sites specified for comparison'}), 400
            
        historical_sites = get_historical_sites()
        comparison_results = {}
        
        for site_name in site_names:
            if site_name in historical_sites:
                site_data = historical_sites[site_name]
                calculator = YantraCalculator(site_data['latitude'], site_data['longitude'])
                yantra_specs = calculator.calculate_all_yantras()
                
                # Extract key dimensions for comparison
                comparison_results[site_name] = {
                    'location': site_data,
                    'samrat_gnomon_height': yantra_specs['samrat'].dimensions['gnomon_height'],
                    'samrat_gnomon_angle': yantra_specs['samrat'].angles['gnomon_inclination'],
                    'rama_base_radius': yantra_specs['rama'].dimensions['base_radius'],
                    'dhruva_pole_angle': yantra_specs['dhruva'].angles['pole_inclination_angle']
                }
        
        return jsonify({
            'success': True,
            'comparison': comparison_results
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500


@app.route('/docs')
def documentation():
    """Documentation page explaining the yantras and calculations."""
    return render_template('documentation.html')


@app.route('/about')
def about():
    """About page with historical context and project information."""
    return render_template('about.html')


@app.errorhandler(404)
def not_found_error(error):
    return render_template('404.html'), 404


@app.errorhandler(500)
def internal_error(error):
    return render_template('500.html'), 500


if __name__ == '__main__':
    # Create necessary directories if they don't exist
    os.makedirs('templates', exist_ok=True)
    os.makedirs('static/css', exist_ok=True)
    os.makedirs('static/js', exist_ok=True)
    
    app.run(debug=True, host='0.0.0.0', port=5000)
