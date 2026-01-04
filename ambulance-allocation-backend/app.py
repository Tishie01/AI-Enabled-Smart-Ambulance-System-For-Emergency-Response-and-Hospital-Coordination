from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from utils import estimate_variables_from_inputs
from pydantic import BaseModel
from typing import List
import pandas as pd
import numpy as np
import joblib

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Load trained models
model_s1 = joblib.load("models/ambulance_model_s1.pkl")
model_s2 = joblib.load("models/ambulance_model_s2.pkl")

# load historical dataset (for scaling logic)
df = pd.read_csv("data/district_flood_data.csv")

df.columns = (
    df.columns
    .str.strip()
    .str.lower()
    .str.replace(" ", "_")
)


class Gauge(BaseModel):
    name: str
    water: float
    minor: float
    major: float
    rain: float

class PredictRequest(BaseModel):
    district: str
    gauges: List[Gauge]


def estimate_from_inputs(rain_mm, scenario):

    if scenario == "FLOOD_S2":
        affected = 3500 + 4 * rain_mm
        road = 5
        severity = 5
    else:
        affected = 1200 + 2 * rain_mm
        road = 3
        severity = 3

    return int(affected), road, severity


@app.post("/predict")
def predict(req: PredictRequest):

    results = []
    total_ambulances = 0

    for g in req.gauges:

        # ---------- scenario from gauge ----------
        # major > minor > warning > normal
        if g.water >= g.major:
            scenario = "FLOOD_S2"

        elif g.water >= g.minor:
            scenario = "FLOOD_S1"

        elif g.water >= 0.8 * g.minor:
            scenario = "PRE_WARNING"

        else:
            scenario = "NO_FLOOD"

        # ---------- no flood case ----------
        if scenario == "NO_FLOOD":
            ambulances = 0

        else:
            # ---- estimate hidden variables from rainfall ----
            affected, road, severity = estimate_variables_from_inputs(
                df=df,
                scenario=scenario,
                avg_rainfall_mm=g.rain
            )

            # ---- model input row ----
            row = pd.DataFrame([{
                "flood_event_count": 2,
                "affected_population": affected,
                "severity_index": severity,
                "avg_rainfall_mm": g.rain,
                "road_disruption_level": road
            }])

            # ---- choose model ----
            if scenario in ["FLOOD_S1", "PRE_WARNING"]:
                base_pred = model_s1.predict(row)[0]
            else:
                base_pred = model_s2.predict(row)[0]

            # ---- continuous gauge scaling ----
            risk_factor = g.water / g.major if g.major > 0 else 1
            risk_factor = max(0.7, min(risk_factor, 1.6))

            adjusted = base_pred * risk_factor

            # PRE-WARNING = fewer ambulances
            if scenario == "PRE_WARNING":
                adjusted *= 0.6

            ambulances = int(np.ceil(adjusted))

        total_ambulances += ambulances

        results.append({
            "gauge": g.name,
            "water_level": g.water,
            "rain_mm": g.rain,
            "scenario": scenario,
            "predicted_ambulances": ambulances
        })

    return {
        "district": req.district,
        "per_gauge_results": results,
        "total_ambulances": total_ambulances
    }
