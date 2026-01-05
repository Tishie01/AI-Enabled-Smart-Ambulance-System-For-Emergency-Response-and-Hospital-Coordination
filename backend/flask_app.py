"""
Flask API for Hospital Evaluation System
Provides ML-based hospital evaluation and selection endpoints
"""
from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib
import pandas as pd
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional
import os

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Paths
BASE_DIR = Path(__file__).parent
MODEL_DIR = BASE_DIR / "models"
DATA_DIR = BASE_DIR / "ml_models" / "data"
DATA_PATH = BASE_DIR.parent / "hospital_dataset.xlsx"

# Load model and metadata on startup
loaded_model = None
model_metadata = None
feature_columns = None

def load_model():
    """Load the trained ML model and metadata"""
    global loaded_model, model_metadata, feature_columns
    
    try:
        model_path = MODEL_DIR / 'hospital_evaluation_model.joblib'
        metadata_path = MODEL_DIR / 'model_metadata.joblib'
        
        if not model_path.exists():
            raise FileNotFoundError(f"Model file not found: {model_path}")
        if not metadata_path.exists():
            raise FileNotFoundError(f"Metadata file not found: {metadata_path}")
        
        loaded_model = joblib.load(model_path)
        model_metadata = joblib.load(metadata_path)
        feature_columns = model_metadata.get('feature_columns', [])
        
        print(f"✓ Model loaded: {model_metadata.get('model_name', 'Unknown')}")
        print(f"✓ Features: {len(feature_columns)}")
        return True
    except Exception as e:
        print(f"Error loading model: {str(e)}")
        return False

def preprocess_hospital_data(hospital_data: Dict) -> pd.DataFrame:
    """Preprocess hospital data for prediction (same as training)"""
    df = pd.DataFrame([hospital_data])
    
    # Encode categorical variables (convert in place)
    binary_columns = [
        'ICU Availability',
        'CT or MRI available',
        'Emergency & Trauma Services',
        'Teaching / Tertiary Status'
    ]
    
    for col in binary_columns:
        if col in df.columns:
            df[col] = df[col].map({'Yes': 1, 'No': 0, 1: 1, 0: 0}).fillna(0)
    
    # Parse specialty presence
    if 'Key Specialty Presence' in df.columns:
        df['Has_General'] = df['Key Specialty Presence'].str.contains('General', case=False, na=False).astype(int)
        df['Has_Cardiac'] = df['Key Specialty Presence'].str.contains('Cardiac', case=False, na=False).astype(int)
        df['Has_Cancer'] = df['Key Specialty Presence'].str.contains('Cancer', case=False, na=False).astype(int)
        df['Has_Neuro'] = df['Key Specialty Presence'].str.contains('Neuro', case=False, na=False).astype(int)
        df['Has_Multi-specialty'] = df['Key Specialty Presence'].str.contains('Multi-specialty', case=False, na=False).astype(int)
    
    # Feature engineering
    if 'Total Bed Capacity' in df.columns and 'Specialist Doctor Count' in df.columns:
        df['Bed_to_Doctor_Ratio'] = df['Total Bed Capacity'] / (df['Specialist Doctor Count'] + 1)
    
    if 'Number of Medical Specialties' in df.columns and 'Total Bed Capacity' in df.columns:
        df['Specialty_Density'] = df['Number of Medical Specialties'] / (df['Total Bed Capacity'] + 1)
    
    # Prepare features in same order as training
    if feature_columns:
        # Ensure columns are in exact order
        X = df[feature_columns].copy()
        X = X[feature_columns]  # Reorder to match exactly
        # Convert to numpy array to match training format and avoid feature name issues
        X = X.values
    else:
        X = df.values if isinstance(df, pd.DataFrame) else df
    
    return X

@app.route('/', methods=['GET'])
def root():
    """API root endpoint"""
    return jsonify({
        "message": "Hospital Evaluation API",
        "status": "running",
        "model_loaded": loaded_model is not None,
        "version": "1.0.0"
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        "status": "healthy",
        "model_loaded": loaded_model is not None
    })

@app.route('/api/hospitals/predict', methods=['POST'])
def predict_readiness_score():
    """
    Predict readiness score for a hospital
    
    Request body:
    {
        "Total Bed Capacity": 500,
        "ICU Availability": "Yes",
        "Number of Medical Specialties": 30,
        "Key Specialty Presence": "General, Cardiac, Cancer, Neuro, Multi-specialty",
        "CT or MRI available": "Yes",
        "Specialist Doctor Count": 120,
        "Emergency & Trauma Services": "Yes",
        "Teaching / Tertiary Status": "Yes"
    }
    """
    if loaded_model is None:
        return jsonify({"error": "Model not loaded"}), 503
    
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
        
        # Preprocess data
        X = preprocess_hospital_data(data)
        
        # Make prediction
        prediction = loaded_model.predict(X)[0]
        
        # Categorize readiness
        if prediction >= 1.2:
            category = "Excellent"
        elif prediction >= 1.0:
            category = "Very Good"
        elif prediction >= 0.8:
            category = "Good"
        elif prediction >= 0.6:
            category = "Fair"
        else:
            category = "Needs Improvement"
        
        return jsonify({
            "predicted_readiness_score": float(prediction),
            "category": category,
            "model_name": model_metadata.get('model_name', 'Unknown'),
            "model_type": model_metadata.get('model_type', 'Unknown')
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/hospitals/best', methods=['GET'])
def get_best_hospitals():
    """
    Get best hospitals from dataset based on predicted readiness scores
    
    Query parameters:
    - limit: Number of top hospitals to return (default: 10)
    - min_score: Minimum readiness score threshold (optional)
    """
    if loaded_model is None:
        return jsonify({"error": "Model not loaded"}), 503
    
    if feature_columns is None or len(feature_columns) == 0:
        return jsonify({"error": "Feature columns not loaded from model metadata"}), 503
    
    try:
        limit = int(request.args.get('limit', 10))
        min_score = float(request.args.get('min_score', 0.0)) if request.args.get('min_score') else None
        
        # Load dataset
        if not DATA_PATH.exists():
            return jsonify({"error": "Dataset file not found"}), 404
        
        df = pd.read_excel(DATA_PATH)
        
        # Preprocess all hospitals
        df_processed = df.copy()
        
        # Encode categorical variables
        binary_columns = [
            'ICU Availability',
            'CT or MRI available',
            'Emergency & Trauma Services',
            'Teaching / Tertiary Status'
        ]
        
        for col in binary_columns:
            if col in df_processed.columns:
                df_processed[col] = df_processed[col].map({'Yes': 1, 'No': 0}).fillna(0)
        
        # Parse specialty presence
        if 'Key Specialty Presence' in df_processed.columns:
            df_processed['Has_General'] = df_processed['Key Specialty Presence'].str.contains('General', case=False, na=False).astype(int)
            df_processed['Has_Cardiac'] = df_processed['Key Specialty Presence'].str.contains('Cardiac', case=False, na=False).astype(int)
            df_processed['Has_Cancer'] = df_processed['Key Specialty Presence'].str.contains('Cancer', case=False, na=False).astype(int)
            df_processed['Has_Neuro'] = df_processed['Key Specialty Presence'].str.contains('Neuro', case=False, na=False).astype(int)
            df_processed['Has_Multi-specialty'] = df_processed['Key Specialty Presence'].str.contains('Multi-specialty', case=False, na=False).astype(int)
        
        # Feature engineering
        df_processed['Bed_to_Doctor_Ratio'] = df_processed['Total Bed Capacity'] / (df_processed['Specialist Doctor Count'] + 1)
        df_processed['Specialty_Density'] = df_processed['Number of Medical Specialties'] / (df_processed['Total Bed Capacity'] + 1)
        
        # Prepare features - check if all required columns exist
        missing_cols = [col for col in feature_columns if col not in df_processed.columns]
        if missing_cols:
            return jsonify({
                "error": f"Missing required columns in dataset: {missing_cols}",
                "available_columns": list(df_processed.columns),
                "required_columns": feature_columns
            }), 500
        
        # Ensure features are in the exact same order as training
        # Select columns in the exact order
        X_all = df_processed[feature_columns].copy()
        # Reorder columns to match training order exactly
        X_all = X_all[feature_columns]
        
        # Convert to numpy array to avoid feature name checking issues
        # The model was likely trained with numpy array or we need to match exactly
        # Try with DataFrame first, if it fails, convert to numpy
        try:
            predictions = loaded_model.predict(X_all)
        except ValueError as ve:
            # If feature name error, convert to numpy array (preserves order)
            if "feature names" in str(ve).lower():
                X_all_numpy = X_all.values  # Convert to numpy array, preserves column order
                predictions = loaded_model.predict(X_all_numpy)
            else:
                raise
        except Exception as e:
            import traceback
            return jsonify({
                "error": f"Prediction error: {str(e)}",
                "data_shape": X_all_numpy.shape,
                "feature_columns": feature_columns,
                "traceback": traceback.format_exc()
            }), 500
        
        df_processed['Predicted_Readiness_Score'] = predictions
        
        # Filter by min_score if provided
        if min_score is not None:
            df_processed = df_processed[df_processed['Predicted_Readiness_Score'] >= min_score]
        
        # Get top hospitals
        top_hospitals = df_processed.nlargest(limit, 'Predicted_Readiness_Score')
        
        # Format response
        results = []
        for idx, row in top_hospitals.iterrows():
            hospital_data = {
                "rank": len(results) + 1,
                "hospital_name": str(row.get('Hospital Name', 'Unknown')),
                "predicted_readiness_score": float(row['Predicted_Readiness_Score']),
                "total_bed_capacity": int(row.get('Total Bed Capacity', 0)),
                "icu_availability": "Yes" if row.get('ICU Availability') == 1 else "No",
                "number_of_specialties": int(row.get('Number of Medical Specialties', 0)),
                "specialist_doctor_count": int(row.get('Specialist Doctor Count', 0)),
                "emergency_trauma_services": "Yes" if row.get('Emergency & Trauma Services') == 1 else "No",
                "teaching_tertiary_status": "Yes" if row.get('Teaching / Tertiary Status') == 1 else "No",
                "key_specialty_presence": str(row.get('Key Specialty Presence', '')),
                "ct_mri_available": "Yes" if row.get('CT or MRI available') == 1 else "No"
            }
            
            # Categorize readiness
            score = hospital_data['predicted_readiness_score']
            if score >= 1.2:
                hospital_data['category'] = "Excellent"
            elif score >= 1.0:
                hospital_data['category'] = "Very Good"
            elif score >= 0.8:
                hospital_data['category'] = "Good"
            elif score >= 0.6:
                hospital_data['category'] = "Fair"
            else:
                hospital_data['category'] = "Needs Improvement"
            
            results.append(hospital_data)
        
        return jsonify({
            "total_hospitals": len(df),
            "returned": len(results),
            "hospitals": results
        })
    
    except Exception as e:
        import traceback
        error_trace = traceback.format_exc()
        print(f"Error in get_best_hospitals: {str(e)}")
        print(error_trace)
        return jsonify({
            "error": str(e),
            "type": type(e).__name__
        }), 500

@app.route('/api/hospitals/evaluate', methods=['POST'])
def evaluate_hospitals():
    """
    Evaluate multiple hospitals and return ranked list
    
    Request body:
    {
        "hospitals": [
            {
                "name": "Hospital 1",
                "Total Bed Capacity": 500,
                ...
            },
            ...
        ]
    }
    """
    if loaded_model is None:
        return jsonify({"error": "Model not loaded"}), 503
    
    try:
        data = request.get_json()
        hospitals = data.get('hospitals', [])
        
        if not hospitals:
            return jsonify({"error": "No hospitals provided"}), 400
        
        results = []
        
        for hospital in hospitals:
            try:
                # Preprocess
                X = preprocess_hospital_data(hospital)
                
                # Predict
                prediction = loaded_model.predict(X)[0]
                
                # Categorize
                if prediction >= 1.2:
                    category = "Excellent"
                elif prediction >= 1.0:
                    category = "Very Good"
                elif prediction >= 0.8:
                    category = "Good"
                elif prediction >= 0.6:
                    category = "Fair"
                else:
                    category = "Needs Improvement"
                
                results.append({
                    "name": hospital.get('name', hospital.get('Hospital Name', 'Unknown')),
                    "predicted_readiness_score": float(prediction),
                    "category": category
                })
            except Exception as e:
                results.append({
                    "name": hospital.get('name', hospital.get('Hospital Name', 'Unknown')),
                    "error": str(e)
                })
        
        # Sort by score (descending)
        results = sorted([r for r in results if 'error' not in r], 
                        key=lambda x: x['predicted_readiness_score'], 
                        reverse=True)
        
        return jsonify({
            "total_evaluated": len(hospitals),
            "successful": len([r for r in results if 'error' not in r]),
            "hospitals": results
        })
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/model/info', methods=['GET'])
def get_model_info():
    """Get information about the loaded ML model"""
    if loaded_model is None:
        return jsonify({"error": "Model not loaded"}), 503
    
    return jsonify({
        "model_name": model_metadata.get('model_name', 'Unknown'),
        "model_type": model_metadata.get('model_type', 'Unknown'),
        "test_r2": model_metadata.get('test_r2', None),
        "test_rmse": model_metadata.get('test_rmse', None),
        "test_mae": model_metadata.get('test_mae', None),
        "val_r2": model_metadata.get('val_r2', None),
        "num_features": len(feature_columns) if feature_columns else 0,
        "features": feature_columns if feature_columns else []
    })

# Load model on startup
if __name__ == '__main__':
    print("Loading ML model...")
    if load_model():
        print("✓ Model loaded successfully")
        app.run(host='0.0.0.0', port=5000, debug=True)
    else:
        print("✗ Failed to load model. API will not function properly.")
        app.run(host='0.0.0.0', port=5000, debug=True)
else:
    # Load model when imported (e.g., by gunicorn)
    load_model()

