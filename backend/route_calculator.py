"""
Route Calculator Module
Calculates distance and estimated travel time between coordinates
Uses Haversine formula for distance calculation
No external APIs required
"""
import math
from typing import List, Tuple, Dict


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points on Earth
    using the Haversine formula
    
    Args:
        lat1, lon1: Latitude and longitude of first point (in degrees)
        lat2, lon2: Latitude and longitude of second point (in degrees)
    
    Returns:
        Distance in kilometers
    """
    # Earth radius in kilometers
    R = 6371.0
    
    # Convert degrees to radians
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)
    
    # Haversine formula
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    
    distance = R * c
    
    return distance


def calculate_route_distance(waypoints: List[Tuple[float, float]]) -> Dict:
    """
    Calculate total distance for a route with multiple waypoints
    
    Args:
        waypoints: List of (lat, lon) tuples
    
    Returns:
        Dictionary with distance information
    """
    if len(waypoints) < 2:
        return {
            'total_distance_km': 0.0,
            'total_distance_miles': 0.0,
            'segments': [],
            'error': 'At least 2 waypoints required'
        }
    
    total_distance = 0.0
    segments = []
    
    for i in range(len(waypoints) - 1):
        lat1, lon1 = waypoints[i]
        lat2, lon2 = waypoints[i + 1]
        
        segment_distance = haversine_distance(lat1, lon1, lat2, lon2)
        total_distance += segment_distance
        
        segments.append({
            'from': {'lat': lat1, 'lon': lon1},
            'to': {'lat': lat2, 'lon': lon2},
            'distance_km': round(segment_distance, 2),
            'distance_miles': round(segment_distance * 0.621371, 2)
        })
    
    return {
        'total_distance_km': round(total_distance, 2),
        'total_distance_miles': round(total_distance * 0.621371, 2),
        'segments': segments,
        'waypoint_count': len(waypoints)
    }


def estimate_travel_time(distance_km: float, average_speed_kmh: float = 50.0, 
                        weather_condition: str = None, has_hazards: bool = False) -> Dict:
    """
    Estimate travel time based on distance and conditions
    
    Args:
        distance_km: Distance in kilometers
        average_speed_kmh: Average speed in km/h (default 50 km/h)
        weather_condition: Weather condition (e.g., 'rainy', 'foggy')
        has_hazards: Whether hazards are present
    
    Returns:
        Dictionary with time estimates
    """
    # Adjust speed based on conditions
    speed_multiplier = 1.0
    
    if weather_condition:
        weather_lower = weather_condition.lower()
        if weather_lower in ['rainy', 'drizzly']:
            speed_multiplier = 0.8  # 20% slower
        elif weather_lower == 'foggy':
            speed_multiplier = 0.6  # 40% slower
        elif weather_lower == 'snowy':
            speed_multiplier = 0.5  # 50% slower
    
    if has_hazards:
        speed_multiplier *= 0.9  # 10% additional slowdown
    
    adjusted_speed = average_speed_kmh * speed_multiplier
    
    # Calculate time
    time_hours = distance_km / adjusted_speed
    time_minutes = time_hours * 60
    
    # Base time (without conditions)
    base_time_hours = distance_km / average_speed_kmh
    base_time_minutes = base_time_hours * 60
    
    # Delay due to conditions
    delay_minutes = time_minutes - base_time_minutes
    
    return {
        'estimated_time_minutes': round(time_minutes, 1),
        'estimated_time_hours': round(time_hours, 2),
        'base_time_minutes': round(base_time_minutes, 1),
        'delay_minutes': round(delay_minutes, 1),
        'average_speed_kmh': round(adjusted_speed, 1),
        'base_speed_kmh': average_speed_kmh,
        'speed_adjustment': f"{((1 - speed_multiplier) * 100):.0f}% slower due to conditions"
    }


def calculate_route(origin_lat: float, origin_lon: float, 
                   dest_lat: float, dest_lon: float,
                   waypoints: List[Tuple[float, float]] = None,
                   average_speed_kmh: float = 50.0,
                   weather_condition: str = None,
                   has_hazards: bool = False) -> Dict:
    """
    Complete route calculation with distance and time estimates
    
    Args:
        origin_lat, origin_lon: Starting point coordinates
        dest_lat, dest_lon: Destination coordinates
        waypoints: Optional list of intermediate waypoints
        average_speed_kmh: Average speed assumption
        weather_condition: Current weather condition
        has_hazards: Whether hazards are detected
    
    Returns:
        Complete route information
    """
    # Build waypoint list
    all_waypoints = [(origin_lat, origin_lon)]
    if waypoints:
        all_waypoints.extend(waypoints)
    all_waypoints.append((dest_lat, dest_lon))
    
    # Calculate distance
    distance_info = calculate_route_distance(all_waypoints)
    
    # Estimate time
    time_info = estimate_travel_time(
        distance_info['total_distance_km'],
        average_speed_kmh,
        weather_condition,
        has_hazards
    )
    
    return {
        'origin': {'lat': origin_lat, 'lon': origin_lon},
        'destination': {'lat': dest_lat, 'lon': dest_lon},
        'waypoints': waypoints or [],
        'distance': distance_info,
        'time': time_info,
        'route_summary': {
            'total_distance_km': distance_info['total_distance_km'],
            'total_distance_miles': distance_info['total_distance_miles'],
            'estimated_time_minutes': time_info['estimated_time_minutes'],
            'estimated_time_hours': time_info['estimated_time_hours'],
            'base_time_minutes': time_info['base_time_minutes'],
            'delay_minutes': time_info['delay_minutes']
        }
    }

