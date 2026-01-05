from fastapi import APIRouter
from app.routes import hospitals, ambulances, patients, vital_signs, video

api_router = APIRouter()

# Include all route modules
api_router.include_router(hospitals.router, prefix="/hospitals", tags=["hospitals"])
api_router.include_router(ambulances.router, prefix="/ambulances", tags=["ambulances"])
api_router.include_router(patients.router, prefix="/patients", tags=["patients"])
api_router.include_router(vital_signs.router, prefix="/vital-signs", tags=["vital-signs"])
api_router.include_router(video.router, prefix="/video", tags=["video"])

