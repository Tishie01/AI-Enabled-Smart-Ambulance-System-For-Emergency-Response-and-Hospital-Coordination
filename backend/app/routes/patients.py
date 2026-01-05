from fastapi import APIRouter, HTTPException
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()

class PatientResponse(BaseModel):
    id: int
    ambulance_id: int
    hospital_id: Optional[int]
    name: Optional[str]
    age: Optional[int]
    condition: Optional[str]
    pre_triage_result: Optional[dict]

@router.get("/", response_model=List[PatientResponse])
async def get_patients():
    """Get all patients"""
    # TODO: Implement database query
    return []

@router.get("/{patient_id}", response_model=PatientResponse)
async def get_patient(patient_id: int):
    """Get patient by ID"""
    # TODO: Implement database query
    raise HTTPException(status_code=404, detail="Patient not found")

