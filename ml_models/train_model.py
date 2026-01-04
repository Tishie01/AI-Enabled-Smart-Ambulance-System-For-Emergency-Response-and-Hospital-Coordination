"""
ML Model Training for Hospital Evaluation
Phase 10A: Train ML models for hospital suitability prediction
"""
import pandas as pd
import numpy as np
import joblib
from pathlib import Path
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.model_selection import GridSearchCV, cross_val_score
import xgboost as xgb
import warnings
warnings.filterwarnings('ignore')

class HospitalModelTrainer:
    """Train ML models for hospital evaluation"""
    
    def __init__(self, data_dir='ml_models/data'):
        self.data_dir = Path(data_dir)
        self.models = {}
        self.best_model = None
        self.best_model_name = None
        self.feature_importance = {}
        self.results = {}
        
    def load_data(self):
        """Load processed training data"""
        print("Loading processed data...")
        
        X_train = joblib.load(self.data_dir / 'X_train.joblib')
        X_val = joblib.load(self.data_dir / 'X_val.joblib')
        X_test = joblib.load(self.data_dir / 'X_test.joblib')
        y_train = joblib.load(self.data_dir / 'y_train.joblib')
        y_val = joblib.load(self.data_dir / 'y_val.joblib')
        y_test = joblib.load(self.data_dir / 'y_test.joblib')
        feature_columns = joblib.load(self.data_dir / 'feature_columns.joblib')
        
        print(f"Training set: {X_train.shape}")
        print(f"Validation set: {X_val.shape}")
        print(f"Test set: {X_test.shape}")
        print(f"Features: {len(feature_columns)}")
        
        return X_train, X_val, X_test, y_train, y_val, y_test, feature_columns
    
    def train_models(self, X_train, y_train, X_val, y_val):
        """Train multiple ML models"""
        print("\n" + "=" * 60)
        print("Training ML Models")
        print("=" * 60)
        
        # Initialize models
        models_to_train = {
            'Linear Regression': LinearRegression(),
            'Random Forest': RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1),
            'Gradient Boosting': GradientBoostingRegressor(n_estimators=100, random_state=42),
            'XGBoost': xgb.XGBRegressor(n_estimators=100, random_state=42, n_jobs=-1)
        }
        
        # Train each model
        for name, model in models_to_train.items():
            print(f"\nTraining {name}...")
            model.fit(X_train, y_train)
            
            # Predictions
            y_train_pred = model.predict(X_train)
            y_val_pred = model.predict(X_val)
            
            # Metrics
            train_rmse = np.sqrt(mean_squared_error(y_train, y_train_pred))
            val_rmse = np.sqrt(mean_squared_error(y_val, y_val_pred))
            train_mae = mean_absolute_error(y_train, y_train_pred)
            val_mae = mean_absolute_error(y_val, y_val_pred)
            train_r2 = r2_score(y_train, y_train_pred)
            val_r2 = r2_score(y_val, y_val_pred)
            
            # Cross-validation score
            cv_scores = cross_val_score(model, X_train, y_train, cv=5, scoring='r2')
            
            self.models[name] = {
                'model': model,
                'train_rmse': train_rmse,
                'val_rmse': val_rmse,
                'train_mae': train_mae,
                'val_mae': val_mae,
                'train_r2': train_r2,
                'val_r2': val_r2,
                'cv_mean': cv_scores.mean(),
                'cv_std': cv_scores.std()
            }
            
            print(f"  Train RMSE: {train_rmse:.4f}")
            print(f"  Val RMSE: {val_rmse:.4f}")
            print(f"  Train R²: {train_r2:.4f}")
            print(f"  Val R²: {val_r2:.4f}")
            print(f"  CV R²: {cv_scores.mean():.4f} (+/- {cv_scores.std() * 2:.4f})")
            
            # Feature importance (if available)
            if hasattr(model, 'feature_importances_'):
                importances = model.feature_importances_
                feature_names = X_train.columns
                self.feature_importance[name] = pd.DataFrame({
                    'feature': feature_names,
                    'importance': importances
                }).sort_values('importance', ascending=False)
    
    def select_best_model(self):
        """Select best model based on validation R²"""
        print("\n" + "=" * 60)
        print("Model Comparison")
        print("=" * 60)
        
        best_r2 = -np.inf
        best_name = None
        
        comparison_data = []
        
        for name, metrics in self.models.items():
            comparison_data.append({
                'Model': name,
                'Train RMSE': metrics['train_rmse'],
                'Val RMSE': metrics['val_rmse'],
                'Train R²': metrics['train_r2'],
                'Val R²': metrics['val_r2'],
                'CV R² Mean': metrics['cv_mean'],
                'CV R² Std': metrics['cv_std']
            })
            
            if metrics['val_r2'] > best_r2:
                best_r2 = metrics['val_r2']
                best_name = name
        
        comparison_df = pd.DataFrame(comparison_data)
        print("\n" + comparison_df.to_string(index=False))
        
        self.best_model = self.models[best_name]['model']
        self.best_model_name = best_name
        
        print(f"\n✓ Best Model: {best_name} (Val R²: {best_r2:.4f})")
        
        return comparison_df
    
    def evaluate_on_test(self, X_test, y_test):
        """Evaluate best model on test set"""
        print("\n" + "=" * 60)
        print("Test Set Evaluation")
        print("=" * 60)
        
        y_test_pred = self.best_model.predict(X_test)
        
        test_rmse = np.sqrt(mean_squared_error(y_test, y_test_pred))
        test_mae = mean_absolute_error(y_test, y_test_pred)
        test_r2 = r2_score(y_test, y_test_pred)
        
        self.results['test'] = {
            'rmse': test_rmse,
            'mae': test_mae,
            'r2': test_r2
        }
        
        print(f"Test RMSE: {test_rmse:.4f}")
        print(f"Test MAE: {test_mae:.4f}")
        print(f"Test R²: {test_r2:.4f}")
        
        return test_rmse, test_mae, test_r2
    
    def hyperparameter_tuning(self, X_train, y_train, X_val, y_val):
        """Perform hyperparameter tuning on best model"""
        print("\n" + "=" * 60)
        print("Hyperparameter Tuning")
        print("=" * 60)
        
        if 'XGBoost' in self.best_model_name or 'Random Forest' in self.best_model_name:
            if 'XGBoost' in self.best_model_name:
                print("Tuning XGBoost...")
                param_grid = {
                    'n_estimators': [100, 200, 300],
                    'max_depth': [3, 5, 7],
                    'learning_rate': [0.01, 0.1, 0.2],
                    'subsample': [0.8, 1.0]
                }
                base_model = xgb.XGBRegressor(random_state=42, n_jobs=-1)
            else:
                print("Tuning Random Forest...")
                param_grid = {
                    'n_estimators': [100, 200, 300],
                    'max_depth': [10, 20, None],
                    'min_samples_split': [2, 5, 10],
                    'min_samples_leaf': [1, 2, 4]
                }
                base_model = RandomForestRegressor(random_state=42, n_jobs=-1)
            
            grid_search = GridSearchCV(
                base_model,
                param_grid,
                cv=5,
                scoring='r2',
                n_jobs=-1,
                verbose=1
            )
            
            grid_search.fit(X_train, y_train)
            
            print(f"Best parameters: {grid_search.best_params_}")
            print(f"Best CV score: {grid_search.best_score_:.4f}")
            
            # Evaluate tuned model
            tuned_model = grid_search.best_estimator_
            y_val_pred = tuned_model.predict(X_val)
            val_r2 = r2_score(y_val, y_val_pred)
            
            print(f"Tuned model Val R²: {val_r2:.4f}")
            
            # Update best model if tuned version is better
            if val_r2 > self.models[self.best_model_name]['val_r2']:
                self.best_model = tuned_model
                print("✓ Using tuned model")
            else:
                print("✓ Keeping original model")
        else:
            print("Skipping hyperparameter tuning for this model type")
    
    def save_model(self, output_dir='ml_models/models'):
        """Save trained model and metadata"""
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        print("\n" + "=" * 60)
        print("Saving Model")
        print("=" * 60)
        
        # Save model
        model_path = output_dir / 'hospital_evaluation_model.joblib'
        joblib.dump(self.best_model, model_path)
        print(f"Saved model: {model_path}")
        
        # Save feature importance
        if self.best_model_name in self.feature_importance:
            importance_path = output_dir / 'feature_importance.csv'
            self.feature_importance[self.best_model_name].to_csv(importance_path, index=False)
            print(f"Saved feature importance: {importance_path}")
        
        # Save model metadata
        metadata = {
            'model_name': self.best_model_name,
            'model_type': type(self.best_model).__name__,
            'test_rmse': self.results.get('test', {}).get('rmse'),
            'test_mae': self.results.get('test', {}).get('mae'),
            'test_r2': self.results.get('test', {}).get('r2')
        }
        
        metadata_path = output_dir / 'model_metadata.joblib'
        joblib.dump(metadata, metadata_path)
        print(f"Saved metadata: {metadata_path}")
        
        return model_path
    
    def run_full_training(self):
        """Run complete training pipeline"""
        print("=" * 60)
        print("HOSPITAL EVALUATION MODEL TRAINING")
        print("=" * 60)
        
        # Load data
        X_train, X_val, X_test, y_train, y_val, y_test, feature_columns = self.load_data()
        
        # Train models
        self.train_models(X_train, y_train, X_val, y_val)
        
        # Select best model
        comparison_df = self.select_best_model()
        
        # Optional: Hyperparameter tuning
        # self.hyperparameter_tuning(X_train, y_train, X_val, y_val)
        
        # Evaluate on test set
        self.evaluate_on_test(X_test, y_test)
        
        # Save model
        model_path = self.save_model()
        
        print("\n" + "=" * 60)
        print("Training Complete!")
        print("=" * 60)
        
        return self.best_model, comparison_df

if __name__ == "__main__":
    # Initialize trainer
    trainer = HospitalModelTrainer()
    
    # Run full training pipeline
    model, comparison = trainer.run_full_training()

