"""
Rule-based hazard detection module
Combines weather conditions, time, and location to detect potential hazards
"""
from datetime import datetime
import uuid


def detect_hazards(lat, lon, weather_prediction, weather_data=None, current_time=None, radius_km=5.0):
    """
    Detect hazards using rule-based logic
    
    Args:
        lat (float): Latitude
        lon (float): Longitude
        weather_prediction (str): Weather condition from ML model (e.g., 'rainy', 'sunny', 'foggy')
        weather_data (dict): Optional weather data dictionary with precipitation, wind, etc.
        current_time (datetime): Optional current time (defaults to now)
        radius_km (float): Search radius in kilometers (for future use)
    
    Returns:
        list: List of hazard dictionaries
    """
    if current_time is None:
        current_time = datetime.now()
    
    hazards = []
    hour = current_time.hour
    day_of_week = current_time.weekday()  # 0=Monday, 6=Sunday
    is_weekend = day_of_week >= 5
    month = current_time.month
    
    # Normalize weather prediction to lowercase
    weather_lower = weather_prediction.lower() if weather_prediction else ''
    
    # Extract weather metrics if available
    precipitation = 0.0
    wind_speed = 0.0
    if weather_data:
        precipitation = weather_data.get('precipitation', 0.0)
        wind_speed = weather_data.get('wind', 0.0)
    
    # ============================================
    # Rule 1: Weather-based hazards
    # ============================================
    
    # Heavy rain / Rainy conditions
    if weather_lower in ['rainy', 'drizzly']:
        if precipitation > 10.0:  # Heavy rain (>10mm)
            hazards.append({
                'id': str(uuid.uuid4()),
                'type': 'weather_hazard',
                'severity': 'high',
                'location': {'lat': lat, 'lon': lon},
                'description': f'Heavy rain conditions ({precipitation:.1f}mm) - Increased risk of hydroplaning and reduced visibility',
                'distance_km': 0.0,
                'estimated_delay_min': 0,
                'source': 'rule_based',
                'confidence': 0.85,
                'timestamp': current_time.isoformat(),
                'expires_at': None,
                'recommendations': ['Reduce speed', 'Increase following distance', 'Use headlights']
            })
        else:
            hazards.append({
                'id': str(uuid.uuid4()),
                'type': 'weather_hazard',
                'severity': 'medium',
                'location': {'lat': lat, 'lon': lon},
                'description': f'Rainy conditions ({precipitation:.1f}mm) - Wet roads and reduced visibility',
                'distance_km': 0.0,
                'estimated_delay_min': 0,
                'source': 'rule_based',
                'confidence': 0.75,
                'timestamp': current_time.isoformat(),
                'expires_at': None,
                'recommendations': ['Drive cautiously', 'Maintain safe distance']
            })
    
    # Foggy conditions
    if weather_lower == 'foggy':
        hazards.append({
            'id': str(uuid.uuid4()),
            'type': 'visibility_hazard',
            'severity': 'high',
            'location': {'lat': lat, 'lon': lon},
            'description': 'Foggy conditions - Significantly reduced visibility',
            'distance_km': 0.0,
            'estimated_delay_min': 0,
            'source': 'rule_based',
            'confidence': 0.90,
            'timestamp': current_time.isoformat(),
            'expires_at': None,
            'recommendations': ['Use fog lights', 'Reduce speed significantly', 'Avoid sudden maneuvers']
        })
    
    # Snowy conditions
    if weather_lower == 'snowy':
        hazards.append({
            'id': str(uuid.uuid4()),
            'type': 'weather_hazard',
            'severity': 'critical',
            'location': {'lat': lat, 'lon': lon},
            'description': 'Snowy conditions - Icy roads and extremely reduced visibility',
            'distance_km': 0.0,
            'estimated_delay_min': 0,
            'source': 'rule_based',
            'confidence': 0.95,
            'timestamp': current_time.isoformat(),
            'expires_at': None,
            'recommendations': ['Drive very slowly', 'Use winter tires', 'Avoid unnecessary travel']
        })
    
    # Strong wind
    if wind_speed > 50.0:  # Strong wind (>50 km/h)
        hazards.append({
            'id': str(uuid.uuid4()),
            'type': 'weather_hazard',
            'severity': 'medium',
            'location': {'lat': lat, 'lon': lon},
            'description': f'Strong wind conditions ({wind_speed:.1f} km/h) - Risk of vehicle instability, especially for high-profile vehicles',
            'distance_km': 0.0,
            'estimated_delay_min': 0,
            'source': 'rule_based',
            'confidence': 0.70,
            'timestamp': current_time.isoformat(),
            'expires_at': None,
            'recommendations': ['Maintain firm grip on steering', 'Watch for debris on road']
        })
    
    # ============================================
    # Rule 2: Time-based hazards
    # ============================================
    
    # Night driving (6 PM to 6 AM)
    if hour < 6 or hour >= 18:
        if weather_lower in ['rainy', 'drizzly', 'foggy']:
            # Already covered by weather hazards with high severity
            pass
        else:
            hazards.append({
                'id': str(uuid.uuid4()),
                'type': 'visibility_hazard',
                'severity': 'low',
                'location': {'lat': lat, 'lon': lon},
                'description': 'Night time driving - Reduced visibility and increased fatigue risk',
                'distance_km': 0.0,
                'estimated_delay_min': 0,
                'source': 'rule_based',
                'confidence': 0.60,
                'timestamp': current_time.isoformat(),
                'expires_at': None,
                'recommendations': ['Use headlights', 'Stay alert', 'Take breaks if tired']
            })
    
    # Rush hour (7-9 AM and 5-7 PM on weekdays)
    if not is_weekend and ((7 <= hour <= 9) or (17 <= hour <= 19)):
        hazards.append({
            'id': str(uuid.uuid4()),
            'type': 'traffic_hazard',
            'severity': 'low',
            'location': {'lat': lat, 'lon': lon},
            'description': 'Rush hour traffic - Increased traffic density and accident risk',
            'distance_km': 0.0,
            'estimated_delay_min': 15,
            'source': 'rule_based',
            'confidence': 0.65,
            'timestamp': current_time.isoformat(),
            'expires_at': None,
            'recommendations': ['Expect delays', 'Allow extra time', 'Be patient with other drivers']
        })
    
    # ============================================
    # Rule 3: Combined weather + time hazards
    # ============================================
    
    # Fog + Night = Critical visibility hazard
    if weather_lower == 'foggy' and (hour < 6 or hour >= 18):
        # Remove the regular foggy hazard and add critical one
        hazards = [h for h in hazards if h.get('type') != 'visibility_hazard' or 'foggy' not in h.get('description', '').lower()]
        hazards.append({
            'id': str(uuid.uuid4()),
            'type': 'visibility_hazard',
            'severity': 'critical',
            'location': {'lat': lat, 'lon': lon},
            'description': 'Foggy conditions at night - Extremely reduced visibility, exercise extreme caution',
            'distance_km': 0.0,
            'estimated_delay_min': 0,
            'source': 'rule_based',
            'confidence': 0.95,
            'timestamp': current_time.isoformat(),
            'expires_at': None,
            'recommendations': ['Drive very slowly', 'Use fog lights', 'Consider delaying travel', 'Frequent stops to rest eyes']
        })
    
    # Rain + Night = Higher risk
    if weather_lower in ['rainy', 'drizzly'] and (hour < 6 or hour >= 18):
        # Update severity of rainy hazard if present
        for hazard in hazards:
            if hazard.get('type') == 'weather_hazard' and 'rain' in hazard.get('description', '').lower():
                if hazard.get('severity') == 'medium':
                    hazard['severity'] = 'high'
                    hazard['description'] += ' (at night - increased risk)'
                    hazard['confidence'] = 0.85
    
    # ============================================
    # Rule 4: Weekend/Time-based patterns
    # ============================================
    
    # Weekend evening (Friday/Saturday 8 PM - 2 AM) - Increased accident risk
    if is_weekend and (day_of_week == 4 or day_of_week == 5) and (20 <= hour or hour < 2):
        hazards.append({
            'id': str(uuid.uuid4()),
            'type': 'traffic_hazard',
            'severity': 'medium',
            'location': {'lat': lat, 'lon': lon},
            'description': 'Weekend evening - Higher risk of impaired drivers and increased traffic',
            'distance_km': 0.0,
            'estimated_delay_min': 10,
            'source': 'rule_based',
            'confidence': 0.70,
            'timestamp': current_time.isoformat(),
            'expires_at': None,
            'recommendations': ['Stay extra vigilant', 'Watch for erratic drivers', 'Maintain defensive driving']
        })
    
    # ============================================
    # Rule 5: Extreme weather combinations
    # ============================================
    
    # Heavy rain + strong wind
    if weather_lower in ['rainy', 'drizzly'] and precipitation > 10.0 and wind_speed > 40.0:
        hazards.append({
            'id': str(uuid.uuid4()),
            'type': 'weather_hazard',
            'severity': 'critical',
            'location': {'lat': lat, 'lon': lon},
            'description': f'Heavy rain with strong winds ({wind_speed:.1f} km/h) - Extreme driving conditions',
            'distance_km': 0.0,
            'estimated_delay_min': 0,
            'source': 'rule_based',
            'confidence': 0.90,
            'timestamp': current_time.isoformat(),
            'expires_at': None,
            'recommendations': ['Avoid driving if possible', 'If driving, use extreme caution', 'Watch for flooding']
        })
    
    return hazards


def get_hazard_summary(hazards):
    """
    Generate summary information about detected hazards
    
    Args:
        hazards (list): List of hazard dictionaries
    
    Returns:
        dict: Summary with count, highest severity, recommendation
    """
    if not hazards:
        return {
            'hazard_count': 0,
            'highest_severity': None,
            'recommendation': 'No hazards detected. Safe driving conditions.'
        }
    
    severities = ['low', 'medium', 'high', 'critical']
    severity_priority = {s: i for i, s in enumerate(severities)}
    
    highest_severity = max(hazards, key=lambda h: severity_priority.get(h.get('severity', 'low'), 0))
    highest_severity_level = highest_severity.get('severity', 'low')
    
    # Generate recommendation based on highest severity
    recommendations_map = {
        'low': 'Minor hazards detected. Drive with normal caution.',
        'medium': 'Moderate hazards detected. Exercise increased caution.',
        'high': 'Significant hazards detected. Drive carefully and consider alternate routes if possible.',
        'critical': 'Critical hazards detected. Consider delaying travel or using alternate routes. Extreme caution required.'
    }
    
    return {
        'hazard_count': len(hazards),
        'highest_severity': highest_severity_level,
        'recommendation': recommendations_map.get(highest_severity_level, 'Drive with caution.')
    }

