"""
AI Model Training Script for Smart Ambulance System
Trains a Random Forest classifier with proper preprocessing pipeline
"""
import pandas as pd
import joblib
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score, confusion_matrix, roc_auc_score
from sklearn.pipeline import Pipeline
import os

def train_model():
    print("=" * 60)
    print("Training AI Model for Emergency Risk Prediction")
    print("=" * 60)
    
    # Get script directory and construct dataset path
    script_dir = os.path.dirname(os.path.abspath(__file__))
    dataset_path = os.path.join(script_dir, 'AI-ML', 'DataSet', 
                                'Health_Monitoring_and Disease_Prediction_Clean_dataset(Cleaned_set).csv')
    
    # 1. Load Dataset
    print("\n[1/6] Loading dataset...")
    df = pd.read_csv(dataset_path)
    print(f"✓ Loaded {len(df)} records")
    print(f"✓ Features: {', '.join(df.columns.tolist())}")
    
    # 2. Preprocessing
    print("\n[2/6] Preprocessing data...")
    # Map Risk Category to binary (High Risk = 1, Low Risk = 0)
    df['Risk Category'] = df['Risk Category'].map({'High Risk': 1, 'Low Risk': 0})
    
    # Separate features and target
    X = df.drop(['Risk Category'], axis=1)
    y = df['Risk Category'].astype('int')
    
    print(f"✓ Risk distribution: High={sum(y==1)}, Low={sum(y==0)}")
    
    # 3. Split data
    print("\n[3/6] Splitting dataset (80% train, 20% test)...")
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    print(f"✓ Training samples: {len(X_train)}")
    print(f"✓ Testing samples: {len(X_test)}")
    
    # 4. Create Pipeline (StandardScaler + RandomForest)
    print("\n[4/6] Training Random Forest model with StandardScaler...")
    model_pipeline = Pipeline([
        ('scaler', StandardScaler()),
        ('classifier', RandomForestClassifier(
            n_estimators=100,
            max_depth=20,
            min_samples_split=10,
            min_samples_leaf=5,
            random_state=42,
            n_jobs=-1
        ))
    ])
    
    model_pipeline.fit(X_train, y_train)
    print("✓ Model training complete")
    
    # 5. Evaluate
    print("\n[5/6] Evaluating model performance...")
    y_pred = model_pipeline.predict(X_test)
    y_proba = model_pipeline.predict_proba(X_test)[:, 1]
    
    accuracy = accuracy_score(y_test, y_pred)
    auc = roc_auc_score(y_test, y_proba)
    
    print(f"✓ Accuracy: {accuracy:.4f} ({accuracy*100:.2f}%)")
    print(f"✓ AUC-ROC: {auc:.4f}")
    
    print("\nClassification Report:")
    print(classification_report(y_test, y_pred, target_names=['Low Risk', 'High Risk']))
    
    print("\nConfusion Matrix:")
    cm = confusion_matrix(y_test, y_pred)
    print(f"  True Negatives:  {cm[0,0]:>6}")
    print(f"  False Positives: {cm[0,1]:>6}")
    print(f"  False Negatives: {cm[1,0]:>6}")
    print(f"  True Positives:  {cm[1,1]:>6}")
    
    # 6. Save Model
    print("\n[6/6] Saving model...")
    model_path = os.path.join(script_dir, 'risk_prediction_model.pkl')
    joblib.dump(model_pipeline, model_path)
    print(f"✓ Model saved to: {model_path}")
    
    # Test with sample data
    print("\n" + "=" * 60)
    print("Testing with sample data:")
    print("=" * 60)
    
    test_cases = [
        {"Heart Rate": 70, "Body Temperature": 37.0, "SpO2": 98, "Age": 35, "Gender": 1},  # Healthy
        {"Heart Rate": 135, "Body Temperature": 39.5, "SpO2": 88, "Age": 65, "Gender": 0},  # Critical
        {"Heart Rate": 95, "Body Temperature": 38.0, "SpO2": 92, "Age": 50, "Gender": 1},  # Moderate
    ]
    
    for i, case in enumerate(test_cases, 1):
        df_test = pd.DataFrame([case])
        pred = model_pipeline.predict(df_test)[0]
        proba = model_pipeline.predict_proba(df_test)[0][1]
        result = "High Risk" if pred == 1 else "Low Risk"
        print(f"\nTest {i}: {case}")
        print(f"  → Prediction: {result} (Risk Score: {proba:.2%})")
    
    print("\n" + "=" * 60)
    print("✓ Model training and testing complete!")
    print("=" * 60)

if __name__ == "__main__":
    train_model()
