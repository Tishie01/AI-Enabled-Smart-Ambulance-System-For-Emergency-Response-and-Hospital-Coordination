"""
Helper script to check if .env file exists and guide setup
"""
from pathlib import Path
import os

BASE_DIR = Path(__file__).parent
ENV_FILE = BASE_DIR / ".env"

print("=" * 60)
print("OpenWeatherMap API Key Configuration Check")
print("=" * 60)

# Check if .env file exists
if ENV_FILE.exists():
    print(f"\n✓ .env file found at: {ENV_FILE}")
    
    # Try to load and check the key
    from dotenv import load_dotenv
    load_dotenv(ENV_FILE)
    
    api_key = os.getenv('OPENWEATHER_API_KEY', '')
    if api_key:
        print(f"✓ API key is configured (length: {len(api_key)})")
        print("\nYour API key is ready to use!")
    else:
        print("⚠ API key not found in .env file")
        print("\nPlease add the following line to your .env file:")
        print("OPENWEATHER_API_KEY=your_api_key_here")
else:
    print(f"\n⚠ .env file not found at: {ENV_FILE}")
    print("\nTo fix this:")
    print("1. Create a new file named '.env' in the backend directory")
    print("2. Add the following line:")
    print("   OPENWEATHER_API_KEY=your_api_key_here")
    print("3. Replace 'your_api_key_here' with your actual API key")
    print("\nGet your free API key at: https://openweathermap.org/api")
    
    # Check if API key is set as environment variable
    api_key = os.getenv('OPENWEATHER_API_KEY', '')
    if api_key:
        print(f"\n✓ However, API key is set as environment variable (length: {len(api_key)})")
        print("This will work, but creating a .env file is recommended for persistence.")

print("\n" + "=" * 60)

