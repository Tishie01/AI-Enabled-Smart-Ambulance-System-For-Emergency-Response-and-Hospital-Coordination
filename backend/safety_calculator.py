"""
Safety Calculator Module
Calculates safety scores and recommendations based on weather and hazards
No external APIs required
"""
from typing import Dict, List


def calculate_safety_score(weather_condition: str, hazard_count: int, 
                          highest_hazard_severity: str, 
                          weather_data: Dict = None) -> Dict:
    """
    Calculate overall safety score based on conditions
    
    Args:
        weather_condition: Weather condition (e.g., 'rainy', 'sunny')
        hazard_count: Number of detected hazards
        highest_hazard_severity: Highest severity level ('low', 'medium', 'high', 'critical')
        weather_data: Optional weather data dictionary
    
    Returns:
        Dictionary with safety score and rating
    """
    # Base score (0-100)
    base_score = 100.0
    
    # Weather impact
    weather_lower = weather_condition.lower() if weather_condition else 'unknown'
    weather_penalties = {
        'sunny': 0,
        'partly_cloudy': 5,
        'cloudy': 10,
        'drizzly': 20,
        'rainy': 25,
        'foggy': 35,
        'snowy': 45
    }
    
    weather_penalty = weather_penalties.get(weather_lower, 15)
    base_score -= weather_penalty
    
    # Additional weather penalties (wind, precipitation)
    if weather_data:
        wind_speed = weather_data.get('wind', 0.0)
        precipitation = weather_data.get('precipitation', 0.0)
        
        if wind_speed > 50:
            base_score -= 10
        if precipitation > 10:
            base_score -= 5
    
    # Hazard impact
    hazard_penalties = {
        'low': 5,
        'medium': 15,
        'high': 30,
        'critical': 50
    }
    
    hazard_penalty = hazard_penalties.get(highest_hazard_severity, 0)
    base_score -= hazard_penalty
    
    # Multiple hazards penalty
    if hazard_count > 1:
        base_score -= min(10, (hazard_count - 1) * 2)
    
    # Ensure score is between 0 and 100
    safety_score = max(0, min(100, base_score))
    
    # Determine rating
    if safety_score >= 80:
        rating = 'excellent'
        color = 'green'
    elif safety_score >= 60:
        rating = 'good'
        color = 'blue'
    elif safety_score >= 40:
        rating = 'moderate'
        color = 'yellow'
    elif safety_score >= 20:
        rating = 'poor'
        color = 'orange'
    else:
        rating = 'critical'
        color = 'red'
    
    return {
        'safety_score': round(safety_score, 1),
        'rating': rating,
        'color': color,
        'penalties': {
            'weather': weather_penalty,
            'hazard': hazard_penalty,
            'multiple_hazards': min(10, (hazard_count - 1) * 2) if hazard_count > 1 else 0
        }
    }


def get_safety_recommendations(weather_condition: str, hazards: List[Dict], 
                               safety_score: float) -> List[str]:
    """
    Generate safety recommendations based on conditions
    
    Args:
        weather_condition: Current weather condition
        hazards: List of detected hazards
        safety_score: Calculated safety score
    
    Returns:
        List of recommendation strings
    """
    recommendations = []
    
    # Weather-based recommendations
    weather_lower = weather_condition.lower() if weather_condition else ''
    if weather_lower in ['rainy', 'drizzly']:
        recommendations.append("Reduce speed and increase following distance due to wet conditions")
        recommendations.append("Use headlights for better visibility")
    elif weather_lower == 'foggy':
        recommendations.append("Use fog lights and reduce speed significantly")
        recommendations.append("Avoid sudden maneuvers and maintain safe distance")
    elif weather_lower == 'snowy':
        recommendations.append("Extreme caution required - icy conditions possible")
        recommendations.append("Consider delaying travel if possible")
    
    # Hazard-based recommendations
    critical_hazards = [h for h in hazards if h.get('severity') == 'critical']
    high_hazards = [h for h in hazards if h.get('severity') == 'high']
    
    if critical_hazards:
        recommendations.append("CRITICAL: Multiple critical hazards detected - consider alternate route")
        recommendations.append("Exercise extreme caution and reduce speed")
    
    if high_hazards and not critical_hazards:
        recommendations.append("High severity hazards present - drive with extra caution")
    
    # Score-based recommendations
    if safety_score < 40:
        recommendations.append("Safety conditions are poor - consider delaying travel")
        recommendations.append("If driving is necessary, use extreme caution and reduce speed")
    elif safety_score < 60:
        recommendations.append("Moderate safety conditions - drive carefully")
        recommendations.append("Stay alert and maintain safe following distance")
    elif safety_score >= 80:
        recommendations.append("Good driving conditions - maintain normal safe driving practices")
    
    # General recommendations
    if len(hazards) > 3:
        recommendations.append("Multiple hazards detected - consider using alternate route if available")
    
    return recommendations


def get_safety_summary(weather_condition: str, weather_data: Dict,
                      hazards: List[Dict], safety_score_data: Dict) -> Dict:
    """
    Generate complete safety summary
    
    Args:
        weather_condition: Current weather condition
        weather_data: Weather data dictionary
        hazards: List of detected hazards
        safety_score_data: Safety score calculation result
    
    Returns:
        Complete safety summary
    """
    recommendations = get_safety_recommendations(
        weather_condition,
        hazards,
        safety_score_data['safety_score']
    )
    
    highest_severity = max([h.get('severity', 'low') for h in hazards], 
                          key=lambda x: ['low', 'medium', 'high', 'critical'].index(x) 
                          if x in ['low', 'medium', 'high', 'critical'] else 0) if hazards else 'none'
    
    return {
        'safety_score': safety_score_data['safety_score'],
        'rating': safety_score_data['rating'],
        'color': safety_score_data['color'],
        'weather_condition': weather_condition,
        'hazard_count': len(hazards),
        'highest_hazard_severity': highest_severity,
        'recommendations': recommendations,
        'penalties': safety_score_data['penalties'],
        'summary_text': f"Safety rating: {safety_score_data['rating'].upper()} ({safety_score_data['safety_score']}/100)"
    }

