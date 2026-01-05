"""
Exploratory Data Analysis (EDA)
Generate visualizations and insights from hospital dataset
"""
import pandas as pd
import numpy as np
import matplotlib.pyplot as plt
import seaborn as sns
from pathlib import Path
import warnings
warnings.filterwarnings('ignore')

# Set style
sns.set_style("whitegrid")
plt.rcParams['figure.figsize'] = (12, 8)

class HospitalEDA:
    """Perform EDA on hospital dataset"""
    
    def __init__(self, data_path):
        self.data_path = Path(data_path)
        self.df = None
        self.output_dir = Path(__file__).parent / "data" / "eda_plots"
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
    def load_data(self):
        """Load hospital dataset"""
        print("Loading data...")
        self.df = pd.read_excel(self.data_path)
        print(f"Loaded {len(self.df)} hospitals")
        return self.df
    
    def plot_distributions(self):
        """Plot distributions of numerical features"""
        print("\n=== Plotting Distributions ===")
        
        numerical_cols = [
            'Total Bed Capacity',
            'Number of Medical Specialties',
            'Specialist Doctor Count'
        ]
        
        fig, axes = plt.subplots(1, 3, figsize=(18, 5))
        
        for idx, col in enumerate(numerical_cols):
            axes[idx].hist(self.df[col], bins=30, edgecolor='black', alpha=0.7)
            axes[idx].set_title(f'Distribution of {col}', fontsize=12, fontweight='bold')
            axes[idx].set_xlabel(col)
            axes[idx].set_ylabel('Frequency')
            axes[idx].grid(True, alpha=0.3)
        
        plt.tight_layout()
        plt.savefig(self.output_dir / 'distributions.png', dpi=300, bbox_inches='tight')
        print("Saved: distributions.png")
        plt.close()
    
    def plot_categorical_counts(self):
        """Plot counts of categorical variables"""
        print("\n=== Plotting Categorical Counts ===")
        
        categorical_cols = [
            'ICU Availability',
            'CT or MRI available',
            'Emergency & Trauma Services',
            'Teaching / Tertiary Status'
        ]
        
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        axes = axes.flatten()
        
        for idx, col in enumerate(categorical_cols):
            counts = self.df[col].value_counts()
            axes[idx].bar(counts.index, counts.values, color=['#3498db', '#e74c3c'])
            axes[idx].set_title(f'{col} Distribution', fontsize=12, fontweight='bold')
            axes[idx].set_xlabel(col)
            axes[idx].set_ylabel('Count')
            axes[idx].grid(True, alpha=0.3, axis='y')
            
            # Add value labels on bars
            for i, v in enumerate(counts.values):
                axes[idx].text(i, v, str(v), ha='center', va='bottom', fontweight='bold')
        
        plt.tight_layout()
        plt.savefig(self.output_dir / 'categorical_counts.png', dpi=300, bbox_inches='tight')
        print("Saved: categorical_counts.png")
        plt.close()
    
    def plot_correlations(self):
        """Plot correlation matrix"""
        print("\n=== Plotting Correlations ===")
        
        # Prepare data for correlation
        df_numeric = self.df.copy()
        
        # Encode categorical variables
        binary_cols = ['ICU Availability', 'CT or MRI available', 
                      'Emergency & Trauma Services', 'Teaching / Tertiary Status']
        for col in binary_cols:
            df_numeric[col] = df_numeric[col].map({'Yes': 1, 'No': 0})
        
        # Select numeric columns
        numeric_cols = [
            'Total Bed Capacity',
            'ICU Availability',
            'Number of Medical Specialties',
            'CT or MRI available',
            'Specialist Doctor Count',
            'Emergency & Trauma Services',
            'Teaching / Tertiary Status'
        ]
        
        corr_matrix = df_numeric[numeric_cols].corr()
        
        plt.figure(figsize=(12, 10))
        sns.heatmap(corr_matrix, annot=True, fmt='.2f', cmap='coolwarm', 
                   center=0, square=True, linewidths=1, cbar_kws={"shrink": 0.8})
        plt.title('Correlation Matrix of Hospital Features', fontsize=14, fontweight='bold', pad=20)
        plt.tight_layout()
        plt.savefig(self.output_dir / 'correlation_matrix.png', dpi=300, bbox_inches='tight')
        print("Saved: correlation_matrix.png")
        plt.close()
    
    def plot_teaching_vs_non_teaching(self):
        """Compare teaching vs non-teaching hospitals"""
        print("\n=== Comparing Teaching vs Non-Teaching Hospitals ===")
        
        teaching = self.df[self.df['Teaching / Tertiary Status'] == 'Yes']
        non_teaching = self.df[self.df['Teaching / Tertiary Status'] == 'No']
        
        fig, axes = plt.subplots(2, 2, figsize=(15, 12))
        
        # Bed Capacity
        axes[0, 0].hist([non_teaching['Total Bed Capacity'], teaching['Total Bed Capacity']], 
                        bins=30, label=['Non-Teaching', 'Teaching'], alpha=0.7, edgecolor='black')
        axes[0, 0].set_title('Bed Capacity Distribution', fontweight='bold')
        axes[0, 0].set_xlabel('Bed Capacity')
        axes[0, 0].set_ylabel('Frequency')
        axes[0, 0].legend()
        axes[0, 0].grid(True, alpha=0.3)
        
        # Number of Specialties
        axes[0, 1].hist([non_teaching['Number of Medical Specialties'], 
                        teaching['Number of Medical Specialties']], 
                       bins=30, label=['Non-Teaching', 'Teaching'], alpha=0.7, edgecolor='black')
        axes[0, 1].set_title('Number of Specialties Distribution', fontweight='bold')
        axes[0, 1].set_xlabel('Number of Specialties')
        axes[0, 1].set_ylabel('Frequency')
        axes[0, 1].legend()
        axes[0, 1].grid(True, alpha=0.3)
        
        # Specialist Count
        axes[1, 0].hist([non_teaching['Specialist Doctor Count'], 
                        teaching['Specialist Doctor Count']], 
                       bins=30, label=['Non-Teaching', 'Teaching'], alpha=0.7, edgecolor='black')
        axes[1, 0].set_title('Specialist Doctor Count Distribution', fontweight='bold')
        axes[1, 0].set_xlabel('Specialist Doctor Count')
        axes[1, 0].set_ylabel('Frequency')
        axes[1, 0].legend()
        axes[1, 0].grid(True, alpha=0.3)
        
        # Comparison box plot
        comparison_data = pd.DataFrame({
            'Non-Teaching': [
                non_teaching['Total Bed Capacity'].mean(),
                non_teaching['Number of Medical Specialties'].mean(),
                non_teaching['Specialist Doctor Count'].mean()
            ],
            'Teaching': [
                teaching['Total Bed Capacity'].mean(),
                teaching['Number of Medical Specialties'].mean(),
                teaching['Specialist Doctor Count'].mean()
            ]
        }, index=['Bed Capacity', 'Specialties', 'Specialists'])
        
        comparison_data.plot(kind='bar', ax=axes[1, 1], color=['#e74c3c', '#3498db'])
        axes[1, 1].set_title('Average Comparison', fontweight='bold')
        axes[1, 1].set_ylabel('Average Value')
        axes[1, 1].legend()
        axes[1, 1].grid(True, alpha=0.3, axis='y')
        axes[1, 1].tick_params(axis='x', rotation=45)
        
        plt.tight_layout()
        plt.savefig(self.output_dir / 'teaching_comparison.png', dpi=300, bbox_inches='tight')
        print("Saved: teaching_comparison.png")
        plt.close()
    
    def plot_size_categories(self):
        """Analyze hospital size categories"""
        print("\n=== Analyzing Hospital Size Categories ===")
        
        # Categorize by bed capacity
        self.df['Size_Category'] = pd.cut(
            self.df['Total Bed Capacity'],
            bins=[0, 150, 400, float('inf')],
            labels=['Small (<150)', 'Medium (150-400)', 'Large (>400)']
        )
        
        fig, axes = plt.subplots(1, 3, figsize=(18, 5))
        
        size_categories = ['Small (<150)', 'Medium (150-400)', 'Large (>400)']
        metrics = ['Number of Medical Specialties', 'Specialist Doctor Count', 'Total Bed Capacity']
        
        for idx, metric in enumerate(metrics):
            data_by_size = [self.df[self.df['Size_Category'] == cat][metric].values 
                           for cat in size_categories]
            axes[idx].boxplot(data_by_size, labels=size_categories)
            axes[idx].set_title(f'{metric} by Hospital Size', fontweight='bold')
            axes[idx].set_ylabel(metric)
            axes[idx].grid(True, alpha=0.3, axis='y')
        
        plt.tight_layout()
        plt.savefig(self.output_dir / 'size_categories.png', dpi=300, bbox_inches='tight')
        print("Saved: size_categories.png")
        plt.close()
    
    def generate_summary_report(self):
        """Generate text summary report"""
        print("\n=== Generating Summary Report ===")
        
        report = []
        report.append("=" * 60)
        report.append("HOSPITAL DATASET EDA SUMMARY REPORT")
        report.append("=" * 60)
        report.append(f"\nTotal Hospitals: {len(self.df)}")
        report.append(f"\nTotal Features: {len(self.df.columns)}")
        
        report.append("\n\n--- Numerical Features Statistics ---")
        numerical_cols = ['Total Bed Capacity', 'Number of Medical Specialties', 'Specialist Doctor Count']
        for col in numerical_cols:
            report.append(f"\n{col}:")
            report.append(f"  Mean: {self.df[col].mean():.2f}")
            report.append(f"  Median: {self.df[col].median():.2f}")
            report.append(f"  Std: {self.df[col].std():.2f}")
            report.append(f"  Min: {self.df[col].min()}")
            report.append(f"  Max: {self.df[col].max()}")
        
        report.append("\n\n--- Categorical Features Distribution ---")
        categorical_cols = ['ICU Availability', 'CT or MRI available', 
                          'Emergency & Trauma Services', 'Teaching / Tertiary Status']
        for col in categorical_cols:
            report.append(f"\n{col}:")
            for val, count in self.df[col].value_counts().items():
                pct = (count / len(self.df)) * 100
                report.append(f"  {val}: {count} ({pct:.1f}%)")
        
        report.append("\n\n--- Teaching vs Non-Teaching Comparison ---")
        teaching = self.df[self.df['Teaching / Tertiary Status'] == 'Yes']
        non_teaching = self.df[self.df['Teaching / Tertiary Status'] == 'No']
        
        report.append(f"\nTeaching Hospitals: {len(teaching)}")
        report.append(f"  Avg Bed Capacity: {teaching['Total Bed Capacity'].mean():.1f}")
        report.append(f"  Avg Specialties: {teaching['Number of Medical Specialties'].mean():.1f}")
        report.append(f"  Avg Specialists: {teaching['Specialist Doctor Count'].mean():.1f}")
        
        report.append(f"\nNon-Teaching Hospitals: {len(non_teaching)}")
        report.append(f"  Avg Bed Capacity: {non_teaching['Total Bed Capacity'].mean():.1f}")
        report.append(f"  Avg Specialties: {non_teaching['Number of Medical Specialties'].mean():.1f}")
        report.append(f"  Avg Specialists: {non_teaching['Specialist Doctor Count'].mean():.1f}")
        
        report_text = "\n".join(report)
        
        # Save report
        report_path = self.output_dir / 'eda_summary_report.txt'
        with open(report_path, 'w') as f:
            f.write(report_text)
        
        print(f"Saved: {report_path}")
        print("\n" + report_text)
    
    def run_full_eda(self):
        """Run complete EDA pipeline"""
        print("=" * 60)
        print("HOSPITAL DATASET EXPLORATORY DATA ANALYSIS")
        print("=" * 60)
        
        # Load data
        self.load_data()
        
        # Generate all plots
        self.plot_distributions()
        self.plot_categorical_counts()
        self.plot_correlations()
        self.plot_teaching_vs_non_teaching()
        self.plot_size_categories()
        
        # Generate summary report
        self.generate_summary_report()
        
        print("\n" + "=" * 60)
        print("EDA Complete! All plots saved to:", self.output_dir)
        print("=" * 60)

if __name__ == "__main__":
    # Path to hospital dataset
    data_path = Path(__file__).parent.parent.parent / "hospital_dataset.xlsx"
    
    # Initialize EDA
    eda = HospitalEDA(data_path)
    
    # Run full EDA
    eda.run_full_eda()

