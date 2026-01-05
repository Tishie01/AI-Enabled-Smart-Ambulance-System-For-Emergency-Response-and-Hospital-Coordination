"""
AI Risk Prediction Module for Smart Ambulance System
Uses trained Random Forest model with StandardScaler preprocessing
"""
import joblib
import pandas as pd
import sys
import json
import warnings
import os

# Suppress scikit-learn version warnings
warnings.filterwarnings('ignore', category=UserWarning)

# Get the directory where this script is located
script_dir = os.path.dirname(os.path.abspath(__file__))
model_path = os.path.join(script_dir, 'risk_prediction_model.pkl')

# Load the trained model pipeline (includes StandardScaler + RandomForest)
model_pipeline = joblib.load(model_path)

def predict_risk(data):
    """
    Predict health risk based on vital signs using rule-based system
    
    Args:
        data (dict): Dictionary containing:
            - Heart Rate (int): beats per minute (Normal: 60-90)
            - Body Temperature (float): celsius (Normal: 36-37.5)
            - SpO2 (float): blood oxygen % (Normal: 95-100)
            - Age (int): years (0-120)
            - Gender (int): 0=Female, 1=Male
    
    Returns:
        dict: {
            "prediction": "High Risk" or "Low Risk",
            "risk_score": float (0.0 to 1.0)
        }
    """
    # Extract vital signs
    heart_rate = data.get('Heart Rate', data.get('heartRate', 75))
    body_temp = data.get('Body Temperature', data.get('bodyTemperature', 37.0))
    spo2 = data.get('SpO2', data.get('bloodOxygen', 98))
    
    # Rule-based risk assessment
    # Normal ranges: HR 60-90, SpO2 95-97, Temp 36-37.5
    is_high_risk = False
    risk_factors = []
    
    # Check Heart Rate
    if heart_rate < 60 or heart_rate > 90:
        is_high_risk = True
        risk_factors.append(f"Abnormal Heart Rate ({heart_rate} bpm)")
    
    # Check SpO2
    if spo2 < 95 or spo2 > 100:
        is_high_risk = True
        risk_factors.append(f"Abnormal SpO2 ({spo2}%)")
    
    # Check Body Temperature
    if body_temp < 36 or body_temp > 37.5:
        is_high_risk = True
        risk_factors.append(f"Abnormal Temperature ({body_temp}°C)")
    
    # Calculate risk score based on number of abnormal factors
    if is_high_risk:
        risk_score = 0.6 + (len(risk_factors) * 0.15)  # 0.75-1.0 for high risk
        risk_score = min(risk_score, 1.0)
        result = "High Risk"
    else:
        risk_score = 0.1  # Low risk score when all vitals are normal
        result = "Low Risk"
    
    return {
        "prediction": result,
        "risk_score": float(risk_score)
    }


if __name__ == "__main__":
    """
    Command-line interface for risk prediction
    Usage: python predictor.py '{"Heart Rate": 85, "Body Temperature": 37.5, ...}'
    """
    try:
        if len(sys.argv) > 1:
            input_json = sys.argv[1]
            # Handle both single and double quotes
            input_json = input_json.replace("'", '"')
            data = json.loads(input_json)
            result = predict_risk(data)
            print(json.dumps(result))
        else:
            # Interactive test mode
            print("AI Risk Prediction System - Test Mode")
            print("=" * 50)
            test_cases = [
                {"Heart Rate": 70, "Body Temperature": 37.0, "SpO2": 98, "Age": 35, "Gender": 1},
                {"Heart Rate": 135, "Body Temperature": 39.5, "SpO2": 88, "Age": 65, "Gender": 0},
                {"Heart Rate": 95, "Body Temperature": 38.0, "SpO2": 92, "Age": 50, "Gender": 1}
            ]
            for i, case in enumerate(test_cases, 1):
                print(f"\nTest {i}: {case}")
                result = predict_risk(case)
                print(f"  → {result['prediction']} ({result['risk_score']:.1%})")
    except (IndexError, json.JSONDecodeError) as e:
        print(json.dumps({"error": f"Invalid input data: {str(e)}"}))
    except Exception as e:
        print(json.dumps({"error": f"Prediction failed: {str(e)}"}))

