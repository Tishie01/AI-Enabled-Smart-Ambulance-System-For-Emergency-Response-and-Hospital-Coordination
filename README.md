🚑 AI-Enabled Smart Ambulance System for Emergency Response and Hospital Coordination

📌 Overview

The AI-Enabled Smart Ambulance System is an integrated decision-support platform designed to enhance emergency medical services in Sri Lanka using artificial intelligence, predictive analytics, and intelligent coordination mechanisms.

The system addresses critical challenges in emergency response such as ambulance availability, disaster preparedness, safe routing, patient pre-triage, and hospital selection. It follows a modular and extensible architecture, allowing individual components to operate independently while contributing to a unified emergency response workflow.

System Components (Operational Flow)

🧩 Component 01: Predictive Ambulance Reallocation and Coordination Engine (Flood-Based Allocation)

This component manages ambulance availability, positioning, and coordination during emergency situations and acts as the entry point of the system, ensuring preparedness before incidents and adaptive response when operational disruptions occur.

Flood scenarios are used as a reference implementation due to their significant impact on ambulance availability, road accessibility, and response reliability. The underlying architecture is designed to be extensible to other natural and man-made disasters in future phases.

Key Functions

• Predicts district-level ambulance demand by classifying flood severity into predefined scenarios and applying scenario-specific machine learning models.

• Performs zone-level pre-positioning of ambulances at hospitals before flood incidents occur to support disaster preparedness.

• Allocates ambulances across zones based on scenario severity and road accessibility conditions.

• Determines the most suitable hospital zones from which ambulances should be allocated for a specific flood scenario and incident location
(allocation decision logic; full dispatch execution planned for PP2).

• Estimates expected ambulance response time to an incident location using distance-based and accessibility-based assumptions.

• Triggers adaptive reallocation decisions by identifying alternative hospital zones when the estimated response time cannot be met due to accessibility constraints
(swarm-based coordination logic planned for PP2).

• Operates as a decision-support engine, providing interpretable allocation and reallocation recommendations rather than fully automating dispatch decisions.

🧩 Component 02: AR Navigation System with Weather Prediction and Hazard Detection

This component ensures safe and reliable routing for ambulances during emergency response by combining machine learning–based weather prediction with intelligent hazard detection.

Key Functions

• Predicts weather conditions using trained ML models and real-time API data.

• Detects potential hazards such as flooding, landslides, reduced visibility, and slippery roads.
    
• Calculates a unified safety score to evaluate route risk.

• Supports GPS-based automatic location detection.

• Provides real-time route safety insights to emergency responders.

🧩 Component 03: AI-Driven Pre-Triage System Using Mobile Vital Sensors

This component manages patient pre-triage and real-time communication once an ambulance reaches the patient, improving transparency and preparedness before hospital arrival.

Key Functions

 • Collects patient vitals using IoT medical devices or manual paramedic input.

 • Transmits vital data in real time to a secure web platform.

 • Allows guardian access via OTP-based, time-limited links.

 • Uses AI models to predict patient urgency (e.g., High Risk / Low Risk).

 • Displays live vital trends using clear visual indicators.

 • Ensures patient privacy through session-based access control.

🧩 Component 04: ML-Powered Hospital Evaluation System for Emergency Medical Services

This component supports patient routing and hospital selection by evaluating hospital readiness using machine learning techniques.

Key Functions

• Predicts hospital readiness scores using ML models.

• Evaluates hospitals based on bed capacity, ICU availability, specialist coverage, and emergency services.

• Provides ranked hospital recommendations based on patient needs and urgency.

• Displays hospital analytics through an interactive dashboard.

• Supports informed decision-making for emergency medical personnel.

🎯 Project Scope (Current Implementation – PP1)

✔️ Flood-based scenario classification and predictive ambulance demand estimation

✔️ District-level prediction with zone-level ambulance pre-allocation

✔️ Route safety analysis and hazard detection

✔️ Real-time patient pre-triage and guardian communication

✔️ ML-based hospital readiness evaluation

✔️ REST-based backend using FastAPI and React frontend

🧠 Key Concepts

Disaster preparedness and emergency planning


Scenario-based predictive modeling


Hierarchical resource allocation (District → Zone)


Intelligent route safety assessment and hazard-aware navigation


Real-time patient pre-triage and vital data communication


AI-assisted hospital readiness evaluation and patient routing


Decision-support systems for emergency response


Modular and extensible system architecture

🛠️ Technology Stack
Backend

Python

FastAPI

Scikit-learn

Pandas, NumPy

Joblib

Frontend

React

Axios

Chart.js

Responsive UI design

📊 Data

The system uses a combination of simulated, historical, and derived datasets to support different components of the emergency response workflow.

Component 01 – Predictive Ambulance Reallocation and Coordination

• Scenario-based simulated flood datasets at district and zone levels

• Flood impact indicators (e.g., affected population, rainfall intensity, road disruption levels)

• Derived flood severity scores and scenario labels (e.g., FLOOD_S1, FLOOD_S2)

Component 02 – AR Navigation and Hazard Detection

• Historical and real-time weather datasets

• Derived hazard indicators (flood-prone areas, reduced visibility, road risk levels)

• Location-based environmental features used for safety scoring

Component 03 – AI-Driven Pre-Triage System

• Simulated patient vital sign datasets (heart rate, temperature, SpO₂)

• Time-series vital data for urgency prediction and trend analysis

Component 04 – ML-Powered Hospital Evaluation System

• Hospital readiness datasets including bed capacity, ICU availability, specialist coverage, and emergency services

• Derived hospital readiness scores used for ranking and recommendation

🎓 Academic Context

This project is developed as part of a final-year undergraduate research project, focusing on AI-driven decision support for emergency medical services.

Flood disasters are used as a reference scenario to validate predictive allocation and adaptive coordination logic under high operational stress.

⚠️ Disclaimer

This system is a research and decision-support prototype developed for academic purposes only.
It is not intended for real-world emergency deployment without further validation, regulatory approval, and integration with live emergency service infrastructure.

🔮 Future Enhancements

• Support for man-made disasters (explosions)

• Real-time swarm-based ambulance coordination

• Live GPS and traffic data integration

• Multi-incident prioritization and optimization logic


