from flask import Flask, render_template, request, jsonify
from flask_cors import CORS
from pathlib import Path
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
import requests
import os
from dotenv import load_dotenv
from hazard_detection import detect_hazards, get_hazard_summary
from safety_calculator import calculate_safety_score, get_safety_summary

app = Flask(__name__)
CORS(app)  # Enable CORS for API requests

# Paths
BASE_DIR = Path(__file__).parent
MODEL_DIR = BASE_DIR / "models"
ENV_FILE = BASE_DIR / ".env"

# Load environment variables - try multiple locations
load_dotenv(ENV_FILE)  # Try backend/.env first
load_dotenv()  # Also try current directory and parent directories

# OpenWeatherMap API Key (set in .env file or environment variable)
OPENWEATHER_API_KEY = os.getenv('OPENWEATHER_API_KEY', '')

# Debug: Check if API key is loaded (don't print the actual key)
if OPENWEATHER_API_KEY:
    print(f"✓ OpenWeatherMap API key loaded (length: {len(OPENWEATHER_API_KEY)})")
else:
    print("⚠ Warning: OpenWeatherMap API key not found!")
    print(f"   Please create a .env file in {BASE_DIR} with:")
    print(f"   OPENWEATHER_API_KEY=your_api_key_here")
    print(f"   Or set it as an environment variable: OPENWEATHER_API_KEY")

# Load model and components
model = None
scaler = None
label_encoder = None
feature_columns = None
metadata = None

def load_model():
    """Load the trained model and preprocessing components"""
    global model, scaler, label_encoder, feature_columns, metadata
    
    try:
        model = joblib.load(MODEL_DIR / "weather_model.joblib")
        scaler = joblib.load(MODEL_DIR / "weather_scaler.joblib")
        label_encoder = joblib.load(MODEL_DIR / "weather_label_encoder.joblib")
        feature_columns = joblib.load(MODEL_DIR / "weather_feature_columns.joblib")
        metadata = joblib.load(MODEL_DIR / "weather_model_metadata.joblib")
        print("Model loaded successfully")
        print(f"Model: {metadata.get('model_name', 'Unknown')}")
        print(f"Features: {len(feature_columns)}")
        return True
    except Exception as e:
        print(f"Error loading model: {e}")
        return False

# Load model on startup
load_model()

def get_weather_from_api(lat, lon):
    """Fetch current weather data from OpenWeatherMap API"""
    if not OPENWEATHER_API_KEY:
        return {'error': 'OpenWeatherMap API key not configured. Please set OPENWEATHER_API_KEY in .env file'}
    
    try:
        # Current weather endpoint
        url = "http://api.openweathermap.org/data/2.5/weather"
        params = {
            'lat': lat,
            'lon': lon,
            'appid': OPENWEATHER_API_KEY,
            'units': 'metric'
        }
        
        response = requests.get(url, params=params, timeout=10)
        
        if response.status_code != 200:
            try:
                error_data = response.json()
                error_message = error_data.get('message', 'Unknown error')
            except:
                error_message = response.text or 'Unknown error'
            
            if response.status_code == 401:
                return {
                    'error': f'Invalid API key (401 Unauthorized). The API key may be incorrect or not activated. '
                            f'Error message: {error_message}. '
                            f'Please check your API key at https://home.openweathermap.org/api_keys and make sure it is activated.'
                }
            elif response.status_code == 429:
                return {
                    'error': 'API rate limit exceeded. Free tier allows 1,000 calls/day. Please try again later.'
                }
            else:
                return {
                    'error': f'Weather API error ({response.status_code}): {error_message}'
                }
        
        data = response.json()
        
        # Extract and format data for our model
        # The model needs: precipitation, temp_max, temp_min, wind
        temp = data['main']['temp']
        temp_max = temp + 3  # Approximate max temp (can be improved)
        temp_min = temp - 3  # Approximate min temp (can be improved)
        wind_speed = data['wind'].get('speed', 0) * 3.6  # Convert m/s to km/h
        precipitation = data.get('rain', {}).get('1h', 0)  # mm in last hour
        
        weather_data = {
            'precipitation': precipitation,
            'temp_max': temp_max,
            'temp_min': temp_min,
            'wind': wind_speed,
            'temperature': temp,
            'humidity': data['main']['humidity'],
            'pressure': data['main']['pressure'],
            'description': data['weather'][0]['description'],
            'weather_main': data['weather'][0]['main']
        }
        
        return weather_data
        
    except Exception as e:
        return {'error': f'Error fetching weather data: {str(e)}'}


@app.route('/')
def index():
    """Render the prediction form"""
    return render_template('weather_prediction.html')

@app.route('/hazards')
def hazards():
    """Render the hazard detection page"""
    return render_template('hazard_detection.html')

@app.route('/safety-dashboard')
def safety_dashboard():
    """Render the safety dashboard page"""
    return render_template('safety_dashboard.html')

@app.route('/api/weather', methods=['GET'])
def get_weather():
    """API endpoint to fetch weather data from coordinates"""
    try:
        lat = float(request.args.get('lat'))
        lon = float(request.args.get('lon'))
        
        # Get weather data from API
        weather_data = get_weather_from_api(lat, lon)
        
        if 'error' in weather_data:
            return jsonify({
                'success': False,
                'error': weather_data['error']
            }), 400
        
        # Get current date/time
        now = datetime.now()
        day_of_year = now.timetuple().tm_yday
        day_of_week = now.weekday()
        is_weekend = 1 if day_of_week >= 5 else 0
        month = now.month
        
        # Prepare response with all data needed for prediction
        response_data = {
            'success': True,
            'weather': weather_data,
            'temporal': {
                'year': now.year,
                'month': month,
                'day': now.day,
                'hour': now.hour,
                'day_of_year': day_of_year,
                'day_of_week': day_of_week,
                'is_weekend': is_weekend
            }
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/predict', methods=['POST'])
def predict():
    """Handle prediction request"""
    try:
        # Get form data
        data = request.get_json() if request.is_json else request.form.to_dict()
        
        # Extract and validate required fields
        precipitation = float(data.get('precipitation', 0.0))
        temp_max = float(data.get('temp_max', 25.0))
        temp_min = float(data.get('temp_min', 15.0))
        wind = float(data.get('wind', 5.0))
        
        # Get date information
        year = int(data.get('year', datetime.now().year))
        month = int(data.get('month', datetime.now().month))
        day = int(data.get('day', datetime.now().day))
        day_of_year = int(data.get('day_of_year', datetime.now().timetuple().tm_yday))
        day_of_week = int(data.get('day_of_week', datetime.now().weekday()))
        is_weekend = int(data.get('is_weekend', 1 if datetime.now().weekday() >= 5 else 0))
        
        # Calculate derived features
        temp_avg = (temp_max + temp_min) / 2
        temp_range = temp_max - temp_min
        
        # Create input data dictionary matching the model's feature order
        input_data = {
            'precipitation': precipitation,
            'temp_max': temp_max,
            'temp_min': temp_min,
            'wind': wind,
            'month': month,
            'year': year,
            'day': day,
            'day_of_year': day_of_year,
            'day_of_week': day_of_week,
            'is_weekend': is_weekend,
            'temp_avg': temp_avg,
            'temp_range': temp_range
        }
        
        # Create DataFrame with exact feature order
        df = pd.DataFrame([input_data])
        
        # Ensure columns are in the correct order as expected by the model
        df = df[feature_columns]
        
        # Scale if required
        if metadata.get('requires_scaling', False):
            df_scaled = scaler.transform(df)
            df_scaled = pd.DataFrame(df_scaled, columns=feature_columns)
            prediction_input = df_scaled.values
        else:
            prediction_input = df.values
        
        # Make prediction
        prediction = model.predict(prediction_input)
        predicted_class = label_encoder.inverse_transform(prediction)[0]
        
        # Get prediction probabilities if available
        probabilities = None
        if hasattr(model, 'predict_proba'):
            proba = model.predict_proba(prediction_input)[0]
            classes = label_encoder.classes_
            probabilities = {classes[i]: float(prob) for i, prob in enumerate(proba)}
        
        return jsonify({
            'success': True,
            'prediction': predicted_class,
            'probabilities': probabilities,
            'model_name': metadata.get('model_name', 'Unknown'),
            'test_accuracy': metadata.get('test_accuracy', 0)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/hazards', methods=['GET'])
def get_hazards():
    """API endpoint to detect hazards for given coordinates"""
    try:
        lat = float(request.args.get('lat'))
        lon = float(request.args.get('lon'))
        radius = float(request.args.get('radius', 5.0))  # Default 5km radius
        
        # Get current weather data from API
        weather_data = get_weather_from_api(lat, lon)
        
        # Get weather prediction using ML model
        weather_prediction = None
        if 'error' not in weather_data:
            # Prepare data for weather prediction
            now = datetime.now()
            day_of_year = now.timetuple().tm_yday
            day_of_week = now.weekday()
            is_weekend = 1 if day_of_week >= 5 else 0
            
            # Create input data for weather model
            input_data = {
                'precipitation': weather_data.get('precipitation', 0.0),
                'temp_max': weather_data.get('temp_max', 25.0),
                'temp_min': weather_data.get('temp_min', 15.0),
                'wind': weather_data.get('wind', 5.0),
                'month': now.month,
                'year': now.year,
                'day': now.day,
                'day_of_year': day_of_year,
                'day_of_week': day_of_week,
                'is_weekend': is_weekend,
                'temp_avg': (weather_data.get('temp_max', 25.0) + weather_data.get('temp_min', 15.0)) / 2,
                'temp_range': weather_data.get('temp_max', 25.0) - weather_data.get('temp_min', 15.0)
            }
            
            # Make weather prediction
            if model is not None:
                try:
                    df = pd.DataFrame([input_data])
                    df = df[feature_columns]
                    
                    if metadata.get('requires_scaling', False):
                        df_scaled = scaler.transform(df)
                        df_scaled = pd.DataFrame(df_scaled, columns=feature_columns)
                        prediction_input = df_scaled.values
                    else:
                        prediction_input = df.values
                    
                    prediction = model.predict(prediction_input)
                    weather_prediction = label_encoder.inverse_transform(prediction)[0]
                except Exception as e:
                    print(f"Error making weather prediction: {e}")
                    weather_prediction = weather_data.get('weather_main', 'unknown').lower()
            else:
                weather_prediction = weather_data.get('weather_main', 'unknown').lower()
        else:
            # If weather API fails, use default prediction or skip
            weather_prediction = 'unknown'
        
        # Detect hazards using rule-based logic
        current_time = datetime.now()
        hazards = detect_hazards(
            lat=lat,
            lon=lon,
            weather_prediction=weather_prediction,
            weather_data=weather_data if 'error' not in weather_data else None,
            current_time=current_time,
            radius_km=radius
        )
        
        # Get hazard summary
        summary = get_hazard_summary(hazards)
        
        # Prepare response
        response_data = {
            'success': True,
            'query_location': {
                'lat': lat,
                'lon': lon
            },
            'hazards': hazards,
            'hazard_count': summary['hazard_count'],
            'highest_severity': summary['highest_severity'],
            'recommendation': summary['recommendation'],
            'weather_prediction': weather_prediction,
            'timestamp': current_time.isoformat()
        }
        
        return jsonify(response_data)
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

@app.route('/api/safety-dashboard', methods=['GET'])
def safety_dashboard_endpoint():
    """API endpoint to get comprehensive safety analysis"""
    try:
        lat = float(request.args.get('lat'))
        lon = float(request.args.get('lon'))
        
        # Get weather data
        weather_data = get_weather_from_api(lat, lon)
        
        # Get weather prediction
        weather_prediction = None
        if 'error' not in weather_data:
            now = datetime.now()
            day_of_year = now.timetuple().tm_yday
            day_of_week = now.weekday()
            is_weekend = 1 if day_of_week >= 5 else 0
            
            input_data = {
                'precipitation': weather_data.get('precipitation', 0.0),
                'temp_max': weather_data.get('temp_max', 25.0),
                'temp_min': weather_data.get('temp_min', 15.0),
                'wind': weather_data.get('wind', 5.0),
                'month': now.month,
                'year': now.year,
                'day': now.day,
                'day_of_year': day_of_year,
                'day_of_week': day_of_week,
                'is_weekend': is_weekend,
                'temp_avg': (weather_data.get('temp_max', 25.0) + weather_data.get('temp_min', 15.0)) / 2,
                'temp_range': weather_data.get('temp_max', 25.0) - weather_data.get('temp_min', 15.0)
            }
            
            if model is not None:
                try:
                    df = pd.DataFrame([input_data])
                    df = df[feature_columns]
                    
                    if metadata.get('requires_scaling', False):
                        df_scaled = scaler.transform(df)
                        df_scaled = pd.DataFrame(df_scaled, columns=feature_columns)
                        prediction_input = df_scaled.values
                    else:
                        prediction_input = df.values
                    
                    prediction = model.predict(prediction_input)
                    weather_prediction = label_encoder.inverse_transform(prediction)[0]
                except Exception as e:
                    print(f"Error making weather prediction: {e}")
                    weather_prediction = weather_data.get('weather_main', 'unknown').lower()
            else:
                weather_prediction = weather_data.get('weather_main', 'unknown').lower()
        else:
            weather_prediction = 'unknown'
        
        # Get hazards
        current_time = datetime.now()
        hazards = detect_hazards(
            lat=lat,
            lon=lon,
            weather_prediction=weather_prediction,
            weather_data=weather_data if 'error' not in weather_data else None,
            current_time=current_time,
            radius_km=5.0
        )
        
        hazard_summary = get_hazard_summary(hazards)
        
        # Calculate safety score
        safety_score_data = calculate_safety_score(
            weather_condition=weather_prediction,
            hazard_count=len(hazards),
            highest_hazard_severity=hazard_summary['highest_severity'] or 'low',
            weather_data=weather_data if 'error' not in weather_data else None
        )
        
        # Get safety summary
        safety_summary = get_safety_summary(
            weather_condition=weather_prediction,
            weather_data=weather_data if 'error' not in weather_data else None,
            hazards=hazards,
            safety_score_data=safety_score_data
        )
        
        return jsonify({
            'success': True,
            'safety': safety_summary,
            'weather': {
                'weather_prediction': weather_prediction,
                'weather_data': weather_data if 'error' not in weather_data else None
            },
            'hazards': {
                'hazards': hazards,
                'hazard_count': len(hazards),
                'highest_severity': hazard_summary['highest_severity'],
                'recommendation': hazard_summary['recommendation']
            },
            'timestamp': current_time.isoformat()
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 400

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
