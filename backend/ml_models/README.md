# ML Models for Hospital Evaluation

This directory contains the machine learning pipeline for hospital evaluation and selection.

## Structure

```
ml_models/
├── data/              # Processed data (train/val/test splits)
├── models/            # Trained models
├── notebooks/         # Jupyter notebooks for interactive training
│   ├── 01_data_preparation.ipynb
│   ├── 02_eda.ipynb
│   └── 03_train_model.ipynb
├── data_preparation.py # Data preprocessing pipeline (alternative to notebook)
├── eda.py             # Exploratory data analysis (alternative to notebook)
└── train_model.py     # Model training script (alternative to notebook)
```

## Usage with Jupyter Notebook (Recommended)

### 1. Start Jupyter Notebook

```bash
cd backend
jupyter notebook
```

Or use JupyterLab:
```bash
jupyter lab
```

### 2. Open and Run the Complete Pipeline

Open **`notebooks/hospital_ml_training.ipynb`** - This comprehensive notebook includes:

1. **Data Preparation** (Parts 1-7)
   - Loads hospital_dataset.xlsx
   - Cleans and encodes data
   - Creates feature engineering
   - Prepares features and target

2. **Exploratory Data Analysis** (Part 8)
   - Distribution plots
   - Correlation matrix
   - Teaching vs non-teaching comparisons
   - Visualizations saved to `data/eda_plots/`

3. **Data Splitting** (Part 9)
   - Splits into train/val/test sets
   - Saves processed data

4. **Model Training** (Parts 11-15)
   - Trains multiple models (Linear Regression, Random Forest, Gradient Boosting, XGBoost)
   - Compares model performance
   - Feature importance analysis
   - Selects best model
   - Evaluates on test set
   - Saves model to `models/`

**Simply run all cells in order from top to bottom!**

## Alternative: Using Python Scripts

If you prefer scripts over notebooks:

### 1. Data Preparation

```bash
cd backend
python ml_models/data_preparation.py
```

### 2. Exploratory Data Analysis (Optional)

```bash
python ml_models/eda.py
```

### 3. Train Models

```bash
python ml_models/train_model.py
```

## Output Files

### Processed Data
- `X_train.joblib`, `X_val.joblib`, `X_test.joblib` - Feature sets
- `y_train.joblib`, `y_val.joblib`, `y_test.joblib` - Target variables
- `feature_columns.joblib` - List of feature names
- `processed_data.csv` - Full processed dataset

### Trained Model
- `hospital_evaluation_model.joblib` - Best trained model
- `feature_importance.csv` - Feature importance rankings
- `model_metadata.joblib` - Model metadata and performance

## Model Usage

To use the trained model in your application:

```python
import joblib
from pathlib import Path

# Load model
model_path = Path('ml_models/models/hospital_evaluation_model.joblib')
model = joblib.load(model_path)

# Load feature columns
feature_columns = joblib.load(Path('ml_models/data/feature_columns.joblib'))

# Prepare hospital data (same preprocessing as training)
# ... preprocess hospital features ...

# Predict hospital suitability score
suitability_score = model.predict([hospital_features])
```

