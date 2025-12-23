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
    Predict health risk based on vital signs
    
    Args:
        data (dict): Dictionary containing:
            - Heart Rate (int): beats per minute (40-200)
            - Body Temperature (float): celsius (35-42)
            - SpO2 (float): blood oxygen % (70-100)
            - Age (int): years (0-120)
            - Gender (int): 0=Female, 1=Male
    
    Returns:
        dict: {
            "prediction": "High Risk" or "Low Risk",
            "risk_score": float (0.0 to 1.0)
        }
    """
    # Convert to DataFrame with exact column order used during training
    df = pd.DataFrame([{
        'Heart Rate': data.get('Heart Rate', data.get('heartRate', 75)),
        'Body Temperature': data.get('Body Temperature', data.get('bodyTemperature', 37.0)),
        'SpO2': data.get('SpO2', data.get('bloodOxygen', 98)),
        'Age': data.get('Age', data.get('age', 40)),
        'Gender': data.get('Gender', data.get('gender', 1))
    }])
    
    # Make prediction using the pipeline (automatically applies StandardScaler)
    prediction = model_pipeline.predict(df)[0]
    probability = model_pipeline.predict_proba(df)[0][1]  # Probability of High Risk
    
    result = "High Risk" if prediction == 1 else "Low Risk"
    
    return {
        "prediction": result,
        "risk_score": float(probability)
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

