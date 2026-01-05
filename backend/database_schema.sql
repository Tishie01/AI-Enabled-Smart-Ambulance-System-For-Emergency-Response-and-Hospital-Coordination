-- Emergency Data Relay System Database Schema
-- MySQL Database Schema for XAMPP

CREATE DATABASE IF NOT EXISTS emergency_relay_db;
USE emergency_relay_db;

-- Hospitals Table
CREATE TABLE IF NOT EXISTS hospitals (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address VARCHAR(500) DEFAULT NULL,
    total_bed_capacity INT NOT NULL,
    icu_availability VARCHAR(10) NOT NULL,
    number_of_specialties INT NOT NULL,
    key_specialty_presence TEXT,
    ct_mri_available VARCHAR(10) NOT NULL,
    specialist_doctor_count INT NOT NULL,
    emergency_trauma_services VARCHAR(10) NOT NULL,
    teaching_tertiary_status VARCHAR(10) NOT NULL,
    readiness_score DECIMAL(4,3) DEFAULT NULL COMMENT 'Hospital readiness score from evaluation system (0.0 to 1.5)',
    evaluation_date DATE DEFAULT NULL COMMENT 'Date of last evaluation',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_name (name),
    INDEX idx_specialties (number_of_specialties),
    INDEX idx_readiness_score (readiness_score)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Hospital Status Table (Real-time status)
CREATE TABLE IF NOT EXISTS hospital_status (
    id INT AUTO_INCREMENT PRIMARY KEY,
    hospital_id INT NOT NULL UNIQUE,
    er_load DECIMAL(3,2) DEFAULT 0.00 COMMENT '0.00 to 1.00',
    bed_availability INT NOT NULL,
    icu_available BOOLEAN DEFAULT TRUE,
    specialties_available JSON,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE CASCADE,
    INDEX idx_hospital_id (hospital_id),
    INDEX idx_er_load (er_load),
    INDEX idx_bed_availability (bed_availability)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Ambulances Table
CREATE TABLE IF NOT EXISTS ambulances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    vehicle_number VARCHAR(50) UNIQUE NOT NULL,
    current_latitude DECIMAL(10, 8),
    current_longitude DECIMAL(11, 8),
    assigned_hospital_id INT,
    status VARCHAR(50) DEFAULT 'available',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL,
    INDEX idx_vehicle_number (vehicle_number),
    INDEX idx_status (status),
    INDEX idx_location (current_latitude, current_longitude)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Patients Table
CREATE TABLE IF NOT EXISTS patients (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ambulance_id INT NOT NULL,
    hospital_id INT,
    name VARCHAR(255),
    age INT,
    condition VARCHAR(255),
    pre_triage_result JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (ambulance_id) REFERENCES ambulances(id) ON DELETE CASCADE,
    FOREIGN KEY (hospital_id) REFERENCES hospitals(id) ON DELETE SET NULL,
    INDEX idx_ambulance_id (ambulance_id),
    INDEX idx_hospital_id (hospital_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Vital Signs Table
CREATE TABLE IF NOT EXISTS vital_signs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    ecg DECIMAL(10, 2),
    blood_pressure_systolic INT,
    blood_pressure_diastolic INT,
    spo2 DECIMAL(5, 2),
    heart_rate INT,
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    INDEX idx_patient_id (patient_id),
    INDEX idx_timestamp (timestamp)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Video Streams Table
CREATE TABLE IF NOT EXISTS video_streams (
    id INT AUTO_INCREMENT PRIMARY KEY,
    patient_id INT NOT NULL,
    stream_url VARCHAR(500) NOT NULL,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE,
    INDEX idx_patient_id (patient_id),
    INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

