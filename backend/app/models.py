from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Hospital(Base):
    __tablename__ = "hospitals"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    address = Column(String(500), nullable=True)
    total_bed_capacity = Column(Integer, nullable=False)
    icu_availability = Column(String(10), nullable=False)  # Yes/No
    number_of_specialties = Column(Integer, nullable=False)
    key_specialty_presence = Column(Text, nullable=True)
    ct_mri_available = Column(String(10), nullable=False)  # Yes/No
    specialist_doctor_count = Column(Integer, nullable=False)
    emergency_trauma_services = Column(String(10), nullable=False)  # Yes/No
    teaching_tertiary_status = Column(String(10), nullable=False)  # Yes/No
    readiness_score = Column(Float, nullable=True)  # From evaluation system (0.0 to 1.5)
    evaluation_date = Column(DateTime, nullable=True)  # Date of last evaluation
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    status = relationship("HospitalStatus", back_populates="hospital", uselist=False)

class HospitalStatus(Base):
    __tablename__ = "hospital_status"
    
    id = Column(Integer, primary_key=True, index=True)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=False, unique=True)
    er_load = Column(Float, default=0.0)  # 0.0 to 1.0
    bed_availability = Column(Integer, nullable=False)
    icu_available = Column(Boolean, default=True)
    specialties_available = Column(JSON, nullable=True)  # List of available specialties
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    
    # Relationships
    hospital = relationship("Hospital", back_populates="status")

class Ambulance(Base):
    __tablename__ = "ambulances"
    
    id = Column(Integer, primary_key=True, index=True)
    vehicle_number = Column(String(50), unique=True, nullable=False)
    current_latitude = Column(Float, nullable=True)
    current_longitude = Column(Float, nullable=True)
    assigned_hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=True)
    status = Column(String(50), default="available")  # available, on_route, at_hospital
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(Integer, primary_key=True, index=True)
    ambulance_id = Column(Integer, ForeignKey("ambulances.id"), nullable=False)
    hospital_id = Column(Integer, ForeignKey("hospitals.id"), nullable=True)
    name = Column(String(255), nullable=True)
    age = Column(Integer, nullable=True)
    condition = Column(String(255), nullable=True)
    pre_triage_result = Column(JSON, nullable=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

class VitalSigns(Base):
    __tablename__ = "vital_signs"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    ecg = Column(Float, nullable=True)
    blood_pressure_systolic = Column(Integer, nullable=True)
    blood_pressure_diastolic = Column(Integer, nullable=True)
    spo2 = Column(Float, nullable=True)
    heart_rate = Column(Integer, nullable=True)
    timestamp = Column(DateTime, server_default=func.now())

class VideoStream(Base):
    __tablename__ = "video_streams"
    
    id = Column(Integer, primary_key=True, index=True)
    patient_id = Column(Integer, ForeignKey("patients.id"), nullable=False)
    stream_url = Column(String(500), nullable=False)
    status = Column(String(50), default="active")  # active, paused, stopped
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

