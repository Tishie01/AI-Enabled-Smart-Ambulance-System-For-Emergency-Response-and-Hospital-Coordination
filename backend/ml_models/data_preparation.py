"""
ML Data Preparation and Preprocessing
Phase 4A: Prepare hospital dataset for ML training
"""
import pandas as pd
import numpy as np
from pathlib import Path
import joblib
from sklearn.model_selection import train_test_split
import warnings
warnings.filterwarnings('ignore')

class HospitalDataPreprocessor:
    """Preprocess hospital dataset for ML training"""
    
    def __init__(self, data_path):
        self.data_path = Path(data_path)
        self.df = None
        self.processed_df = None
        self.feature_columns = []
        self.target_column = None
        
    def load_data(self):
        """Load hospital dataset from Excel"""
        print("Loading hospital dataset...")
        self.df = pd.read_excel(self.data_path)
        print(f"Loaded {len(self.df)} hospitals")
        print(f"Columns: {list(self.df.columns)}")
        return self.df
    
    def explore_data(self):
        """Perform exploratory data analysis"""
        print("\n=== Data Exploration ===")
        print(f"\nDataset Shape: {self.df.shape}")
        print(f"\nMissing Values:")
        print(self.df.isnull().sum())
        print(f"\nData Types:")
        print(self.df.dtypes)
        print(f"\nBasic Statistics:")
        print(self.df.describe())
        print(f"\nCategorical Value Counts:")
        for col in ['ICU Availability', 'CT or MRI available', 'Emergency & Trauma Services', 
                    'Teaching / Tertiary Status']:
            print(f"\n{col}:")
            print(self.df[col].value_counts())
        
        return self.df
    
    def clean_data(self):
        """Clean and handle missing values"""
        print("\n=== Data Cleaning ===")
        df = self.df.copy()
        
        # Check for missing values
        missing = df.isnull().sum()
        if missing.sum() > 0:
            print(f"Missing values found: {missing[missing > 0]}")
            # Fill missing values if any
            df = df.ffill().bfill()
        else:
            print("No missing values found")
        
        # Remove duplicates if any
        initial_len = len(df)
        df = df.drop_duplicates()
        if len(df) < initial_len:
            print(f"Removed {initial_len - len(df)} duplicate rows")
        
        self.df = df
        return df
    
    def encode_categorical_variables(self):
        """Encode categorical variables to numeric"""
        print("\n=== Encoding Categorical Variables ===")
        df = self.df.copy()
        
        # Binary encoding for Yes/No columns
        binary_columns = [
            'ICU Availability',
            'CT or MRI available',
            'Emergency & Trauma Services',
            'Teaching / Tertiary Status'
        ]
        
        for col in binary_columns:
            df[col] = df[col].map({'Yes': 1, 'No': 0})
            print(f"{col}: Yes=1, No=0")
        
        self.df = df
        return df
    
    def parse_specialty_features(self):
        """Parse Key Specialty Presence into binary features"""
        print("\n=== Parsing Specialty Features ===")
        df = self.df.copy()
        
        # Get all unique specialties
        all_specialties = set()
        for specialties_str in df['Key Specialty Presence'].dropna():
            specialties_list = [s.strip() for s in str(specialties_str).split(',')]
            all_specialties.update(specialties_list)
        
        print(f"Found specialties: {sorted(all_specialties)}")
        
        # Create binary features for each specialty
        for specialty in all_specialties:
            col_name = f"Has_{specialty.replace(' ', '_')}"
            df[col_name] = df['Key Specialty Presence'].apply(
                lambda x: 1 if specialty in str(x) else 0
            )
            print(f"Created feature: {col_name}")
        
        self.df = df
        return df, list(all_specialties)
    
    def create_feature_engineering(self):
        """Create engineered features"""
        print("\n=== Feature Engineering ===")
        df = self.df.copy()
        
        # Bed to doctor ratio
        df['Bed_to_Doctor_Ratio'] = df['Total Bed Capacity'] / (df['Specialist Doctor Count'] + 1)
        print("Created: Bed_to_Doctor_Ratio")
        
        # Specialty density (specialties per bed)
        df['Specialty_Density'] = df['Number of Medical Specialties'] / (df['Total Bed Capacity'] + 1)
        print("Created: Specialty_Density")
        
        # Hospital capacity score (normalized)
        df['Capacity_Score'] = (df['Total Bed Capacity'] - df['Total Bed Capacity'].min()) / \
                              (df['Total Bed Capacity'].max() - df['Total Bed Capacity'].min())
        print("Created: Capacity_Score")
        
        # Equipment score (sum of ICU, CT/MRI)
        df['Equipment_Score'] = df['ICU Availability'] + df['CT or MRI available']
        print("Created: Equipment_Score")
        
        # Service score (sum of Emergency, Teaching)
        df['Service_Score'] = df['Emergency & Trauma Services'] + df['Teaching / Tertiary Status']
        print("Created: Service_Score")
        
        # Overall readiness score (weighted combination)
        df['Readiness_Score'] = (
            df['Capacity_Score'] * 0.3 +
            df['Equipment_Score'] * 0.3 +
            df['Service_Score'] * 0.2 +
            (df['Number of Medical Specialties'] / 30) * 0.2
        )
        print("Created: Readiness_Score")
        
        self.df = df
        return df
    
    def prepare_features(self):
        """Prepare feature set for ML training"""
        print("\n=== Preparing Features ===")
        df = self.df.copy()
        
        # Base features
        base_features = [
            'Total Bed Capacity',
            'ICU Availability',
            'Number of Medical Specialties',
            'CT or MRI available',
            'Specialist Doctor Count',
            'Emergency & Trauma Services',
            'Teaching / Tertiary Status'
        ]
        
        # Engineered features
        engineered_features = [
            'Bed_to_Doctor_Ratio',
            'Specialty_Density',
            'Capacity_Score',
            'Equipment_Score',
            'Service_Score',
            'Readiness_Score'
        ]
        
        # Specialty binary features
        specialty_features = [col for col in df.columns if col.startswith('Has_')]
        
        # Combine all features
        self.feature_columns = base_features + engineered_features + specialty_features
        
        # Remove Key Specialty Presence (already parsed)
        if 'Key Specialty Presence' in self.feature_columns:
            self.feature_columns.remove('Key Specialty Presence')
        
        # Remove Hospital Name (not a feature)
        if 'Hospital Name' in self.feature_columns:
            self.feature_columns.remove('Hospital Name')
        
        print(f"Total features: {len(self.feature_columns)}")
        print(f"Feature list: {self.feature_columns}")
        
        # Create feature dataframe
        X = df[self.feature_columns].copy()
        
        # Create target variable (Hospital Suitability Score)
        # This will be used for regression or can be binned for classification
        y = df['Readiness_Score'].copy()
        
        self.processed_df = df
        return X, y
    
    def split_data(self, X, y, test_size=0.2, val_size=0.2, random_state=42):
        """Split data into train, validation, and test sets"""
        print("\n=== Splitting Data ===")
        
        # First split: train+val and test
        X_train_val, X_test, y_train_val, y_test = train_test_split(
            X, y, test_size=test_size, random_state=random_state, shuffle=True
        )
        
        # Second split: train and validation
        val_size_adjusted = val_size / (1 - test_size)  # Adjust for already split data
        X_train, X_val, y_train, y_val = train_test_split(
            X_train_val, y_train_val, test_size=val_size_adjusted, random_state=random_state, shuffle=True
        )
        
        print(f"Training set: {X_train.shape[0]} samples")
        print(f"Validation set: {X_val.shape[0]} samples")
        print(f"Test set: {X_test.shape[0]} samples")
        
        return X_train, X_val, X_test, y_train, y_val, y_test
    
    def save_processed_data(self, X_train, X_val, X_test, y_train, y_val, y_test, output_dir):
        """Save processed data splits"""
        output_dir = Path(output_dir)
        output_dir.mkdir(parents=True, exist_ok=True)
        
        print(f"\n=== Saving Processed Data ===")
        
        # Save as CSV
        X_train.to_csv(output_dir / 'X_train.csv', index=False)
        X_val.to_csv(output_dir / 'X_val.csv', index=False)
        X_test.to_csv(output_dir / 'X_test.csv', index=False)
        y_train.to_csv(output_dir / 'y_train.csv', index=False)
        y_val.to_csv(output_dir / 'y_val.csv', index=False)
        y_test.to_csv(output_dir / 'y_test.csv', index=False)
        
        # Save as joblib for faster loading
        joblib.dump(X_train, output_dir / 'X_train.joblib')
        joblib.dump(X_val, output_dir / 'X_val.joblib')
        joblib.dump(X_test, output_dir / 'X_test.joblib')
        joblib.dump(y_train, output_dir / 'y_train.joblib')
        joblib.dump(y_val, output_dir / 'y_val.joblib')
        joblib.dump(y_test, output_dir / 'y_test.joblib')
        
        # Save feature columns
        joblib.dump(self.feature_columns, output_dir / 'feature_columns.joblib')
        
        # Save processed dataframe
        self.processed_df.to_csv(output_dir / 'processed_data.csv', index=False)
        
        print(f"Data saved to {output_dir}")
    
    def run_full_pipeline(self, output_dir='ml_models/data'):
        """Run complete data preparation pipeline"""
        print("=" * 50)
        print("Hospital Data Preparation Pipeline")
        print("=" * 50)
        
        # Load data
        self.load_data()
        
        # Explore data
        self.explore_data()
        
        # Clean data
        self.clean_data()
        
        # Encode categorical variables
        self.encode_categorical_variables()
        
        # Parse specialty features
        specialties, _ = self.parse_specialty_features()
        
        # Feature engineering
        self.create_feature_engineering()
        
        # Prepare features
        X, y = self.prepare_features()
        
        # Split data
        X_train, X_val, X_test, y_train, y_val, y_test = self.split_data(X, y)
        
        # Save processed data
        self.save_processed_data(X_train, X_val, X_test, y_train, y_val, y_test, output_dir)
        
        print("\n" + "=" * 50)
        print("Data Preparation Complete!")
        print("=" * 50)
        
        return X_train, X_val, X_test, y_train, y_val, y_test

if __name__ == "__main__":
    # Path to hospital dataset
    data_path = Path(__file__).parent.parent.parent / "hospital_dataset.xlsx"
    
    # Initialize preprocessor
    preprocessor = HospitalDataPreprocessor(data_path)
    
    # Run full pipeline
    X_train, X_val, X_test, y_train, y_val, y_test = preprocessor.run_full_pipeline()

