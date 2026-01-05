import { useState } from 'react'
import axios from 'axios'
import './HospitalFinder.css'

const API_BASE_URL = 'http://localhost:5000'

function HospitalFinder() {
  const [formData, setFormData] = useState({
    minBedCapacity: '',
    requireICU: false,
    requireCTMRI: false,
    requireEmergencyTrauma: false,
    preferTeaching: false,
    minSpecialistDoctors: '',
    minSpecialties: '',
    requiredSpecialties: {
      general: false,
      cardiac: false,
      cancer: false,
      neuro: false,
      multiSpecialty: false
    },
    minReadinessScore: '',
    limit: 10
  })

  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSpecialtyChange = (specialty) => {
    setFormData(prev => ({
      ...prev,
      requiredSpecialties: {
        ...prev.requiredSpecialties,
        [specialty]: !prev.requiredSpecialties[specialty]
      }
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResults(null)

    try {
      // Get all hospitals from the API
      const response = await axios.get(`${API_BASE_URL}/api/hospitals/best`, {
        params: {
          limit: 1000, // Get all hospitals to filter
          min_score: formData.minReadinessScore || 0
        }
      })

      let hospitals = response.data.hospitals || []

      // Filter hospitals based on user preferences
      hospitals = hospitals.filter(hospital => {
        // Bed capacity filter
        if (formData.minBedCapacity && hospital.total_bed_capacity < parseInt(formData.minBedCapacity)) {
          return false
        }

        // ICU requirement
        if (formData.requireICU && hospital.icu_availability === 'No') {
          return false
        }

        // CT/MRI requirement
        if (formData.requireCTMRI && hospital.ct_mri_available === 'No') {
          return false
        }

        // Emergency & Trauma requirement
        if (formData.requireEmergencyTrauma && hospital.emergency_trauma_services === 'No') {
          return false
        }

        // Teaching preference
        if (formData.preferTeaching && hospital.teaching_tertiary_status === 'No') {
          return false
        }

        // Minimum specialist doctors
        if (formData.minSpecialistDoctors && hospital.specialist_doctor_count < parseInt(formData.minSpecialistDoctors)) {
          return false
        }

        // Minimum specialties
        if (formData.minSpecialties && hospital.number_of_specialties < parseInt(formData.minSpecialties)) {
          return false
        }

        // Required specialties filter
        const specialties = hospital.key_specialty_presence.toLowerCase()
        if (formData.requiredSpecialties.general && !specialties.includes('general')) {
          return false
        }
        if (formData.requiredSpecialties.cardiac && !specialties.includes('cardiac')) {
          return false
        }
        if (formData.requiredSpecialties.cancer && !specialties.includes('cancer')) {
          return false
        }
        if (formData.requiredSpecialties.neuro && !specialties.includes('neuro')) {
          return false
        }
        if (formData.requiredSpecialties.multiSpecialty && !specialties.includes('multi-specialty')) {
          return false
        }

        return true
      })

      // Sort by readiness score (already sorted from API, but ensure it)
      hospitals.sort((a, b) => b.predicted_readiness_score - a.predicted_readiness_score)

      // Limit results
      hospitals = hospitals.slice(0, parseInt(formData.limit) || 10)

      // Update rank
      hospitals = hospitals.map((hospital, index) => ({
        ...hospital,
        rank: index + 1
      }))

      setResults({
        total_matching: hospitals.length,
        hospitals: hospitals
      })
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch hospitals')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      minBedCapacity: '',
      requireICU: false,
      requireCTMRI: false,
      requireEmergencyTrauma: false,
      preferTeaching: false,
      minSpecialistDoctors: '',
      minSpecialties: '',
      requiredSpecialties: {
        general: false,
        cardiac: false,
        cancer: false,
        neuro: false,
        multiSpecialty: false
      },
      minReadinessScore: '',
      limit: 10
    })
    setResults(null)
    setError(null)
  }

  return (
    <div className="hospital-finder">
      <div className="container">
        <header className="header">
          <div className="header-icon">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M19 8H18V5C18 3.34 16.66 2 15 2H9C7.34 2 6 3.34 6 5V8H5C3.34 8 2 9.34 2 11V19C2 20.66 3.34 22 5 22H19C20.66 22 22 20.66 22 19V11C22 9.34 20.66 8 19 8ZM8 5C8 4.45 8.45 4 9 4H15C15.55 4 16 4.45 16 5V8H8V5ZM20 19C20 19.55 19.55 20 19 20H5C4.45 20 4 19.55 4 19V11C4 10.45 4.45 10 5 10H19C19.55 10 20 10.45 20 11V19Z" fill="currentColor"/>
              <path d="M12 12.5C11.17 12.5 10.5 13.17 10.5 14C10.5 14.83 11.17 15.5 12 15.5C12.83 15.5 13.5 14.83 13.5 14C13.5 13.17 12.83 12.5 12 12.5ZM13 17H11V15H13V17ZM15 13H9V11H15V13Z" fill="currentColor"/>
            </svg>
          </div>
          <h1>Find Best Hospital</h1>
          <p>Enter your preferences to find the best hospital for your needs</p>
        </header>

        <form onSubmit={handleSubmit} className="preferences-form">
          <div className="form-section">
            <h2>Basic Requirements</h2>
            
            <div className="form-group">
              <label htmlFor="minBedCapacity">Minimum Bed Capacity</label>
              <input
                type="number"
                id="minBedCapacity"
                name="minBedCapacity"
                value={formData.minBedCapacity}
                onChange={handleInputChange}
                min="0"
                placeholder="e.g., 100"
              />
            </div>

            <div className="form-group">
              <label htmlFor="minSpecialistDoctors">Minimum Specialist Doctors</label>
              <input
                type="number"
                id="minSpecialistDoctors"
                name="minSpecialistDoctors"
                value={formData.minSpecialistDoctors}
                onChange={handleInputChange}
                min="0"
                placeholder="e.g., 20"
              />
            </div>

            <div className="form-group">
              <label htmlFor="minSpecialties">Minimum Number of Specialties</label>
              <input
                type="number"
                id="minSpecialties"
                name="minSpecialties"
                value={formData.minSpecialties}
                onChange={handleInputChange}
                min="0"
                placeholder="e.g., 10"
              />
            </div>

            <div className="form-group">
              <label htmlFor="minReadinessScore">Minimum Readiness Score</label>
              <input
                type="number"
                id="minReadinessScore"
                name="minReadinessScore"
                value={formData.minReadinessScore}
                onChange={handleInputChange}
                min="0"
                max="1.5"
                step="0.1"
                placeholder="e.g., 0.8"
              />
            </div>
          </div>

          <div className="form-section">
            <h2>Required Services</h2>
            
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="requireICU"
                  checked={formData.requireICU}
                  onChange={handleInputChange}
                />
                <span>ICU Availability Required</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="requireCTMRI"
                  checked={formData.requireCTMRI}
                  onChange={handleInputChange}
                />
                <span>CT or MRI Available Required</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="requireEmergencyTrauma"
                  checked={formData.requireEmergencyTrauma}
                  onChange={handleInputChange}
                />
                <span>Emergency & Trauma Services Required</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  name="preferTeaching"
                  checked={formData.preferTeaching}
                  onChange={handleInputChange}
                />
                <span>Prefer Teaching/Tertiary Hospital</span>
              </label>
            </div>
          </div>

          <div className="form-section">
            <h2>Required Specialties</h2>
            
            <div className="checkbox-group">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.requiredSpecialties.general}
                  onChange={() => handleSpecialtyChange('general')}
                />
                <span>General Medicine</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.requiredSpecialties.cardiac}
                  onChange={() => handleSpecialtyChange('cardiac')}
                />
                <span>Cardiac</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.requiredSpecialties.cancer}
                  onChange={() => handleSpecialtyChange('cancer')}
                />
                <span>Cancer</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.requiredSpecialties.neuro}
                  onChange={() => handleSpecialtyChange('neuro')}
                />
                <span>Neuro</span>
              </label>

              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={formData.requiredSpecialties.multiSpecialty}
                  onChange={() => handleSpecialtyChange('multiSpecialty')}
                />
                <span>Multi-specialty</span>
              </label>
            </div>
          </div>

          <div className="form-section">
            <div className="form-group">
              <label htmlFor="limit">Number of Results to Show</label>
              <input
                type="number"
                id="limit"
                name="limit"
                value={formData.limit}
                onChange={handleInputChange}
                min="1"
                max="50"
              />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Searching...' : 'Find Best Hospitals'}
            </button>
            <button type="button" className="btn-secondary" onClick={resetForm}>
              Reset Form
            </button>
          </div>
        </form>

        {error && (
          <div className="error-message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '8px', verticalAlign: 'middle' }}>
              <circle cx="12" cy="12" r="10" fill="currentColor" opacity="0.1"/>
              <path d="M12 8V12M12 16H12.01M22 12C22 17.5228 17.5228 22 12 22C6.47715 22 2 17.5228 2 12C2 6.47715 6.47715 2 12 2C17.5228 2 22 6.47715 22 12Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            {error}
          </div>
        )}

        {results && (
          <div className="results-section">
            <h2>Results</h2>
            <p className="results-summary">
              Found <strong>{results.total_matching}</strong> hospital(s) matching your preferences
            </p>

            {results.hospitals.length === 0 ? (
              <div className="no-results">
                <p>No hospitals found matching your criteria. Try adjusting your preferences.</p>
              </div>
            ) : (
              <div className="hospitals-list">
                {results.hospitals.map((hospital) => (
                  <div key={hospital.rank} className="hospital-card">
                    <div className="hospital-header">
                      <div className="hospital-rank">#{hospital.rank}</div>
                      <h3>{hospital.hospital_name}</h3>
                      <div className={`score-badge ${hospital.category.toLowerCase().replace(' ', '-')}`}>
                        {hospital.predicted_readiness_score.toFixed(4)}
                      </div>
                    </div>
                    
                    <div className="hospital-category">
                      <span className={`category-badge ${hospital.category.toLowerCase().replace(' ', '-')}`}>
                        {hospital.category}
                      </span>
                    </div>

                    <div className="hospital-details">
                      <div className="detail-item">
                        <span className="detail-label">Bed Capacity:</span>
                        <span className="detail-value">{hospital.total_bed_capacity}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Specialist Doctors:</span>
                        <span className="detail-value">{hospital.specialist_doctor_count}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Specialties:</span>
                        <span className="detail-value">{hospital.number_of_specialties}</span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">ICU:</span>
                        <span className={`detail-value ${hospital.icu_availability === 'Yes' ? 'available' : 'not-available'}`}>
                          {hospital.icu_availability}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">CT/MRI:</span>
                        <span className={`detail-value ${hospital.ct_mri_available === 'Yes' ? 'available' : 'not-available'}`}>
                          {hospital.ct_mri_available}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Emergency & Trauma:</span>
                        <span className={`detail-value ${hospital.emergency_trauma_services === 'Yes' ? 'available' : 'not-available'}`}>
                          {hospital.emergency_trauma_services}
                        </span>
                      </div>
                      <div className="detail-item">
                        <span className="detail-label">Teaching/Tertiary:</span>
                        <span className={`detail-value ${hospital.teaching_tertiary_status === 'Yes' ? 'available' : 'not-available'}`}>
                          {hospital.teaching_tertiary_status}
                        </span>
                      </div>
                      <div className="detail-item full-width">
                        <span className="detail-label">Key Specialties:</span>
                        <span className="detail-value">{hospital.key_specialty_presence}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default HospitalFinder

