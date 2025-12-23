const express = require('express');
const router = express.Router();
const { spawn } = require('child_process');
const path = require('path');
const Session = require('../models/Session');

// Predict risk from health data
router.post('/predict', async (req, res) => {
  try {
    const { heartRate, bodyTemperature, bloodOxygen, age, gender } = req.body;

    // Prepare data for Python model
    // Gender: 0 = Female, 1 = Male (default to 1 if not provided)
    const inputData = {
      "Heart Rate": heartRate || 0,
      "Body Temperature": bodyTemperature || 0,
      "SpO2": bloodOxygen || 0,
      "Age": age || 0,
      "Gender": gender || 1
    };

    // Call Python predictor (using rule-based for now)
    const pythonScript = path.join(__dirname, '..', 'AI-Model', 'predictor_rules.py');
    const pythonProcess = spawn('python', [pythonScript, JSON.stringify(inputData)]);

    let result = '';
    let error = '';

    pythonProcess.stdout.on('data', (data) => {
      result += data.toString();
    });

    pythonProcess.stderr.on('data', (data) => {
      error += data.toString();
    });

    pythonProcess.on('close', (code) => {
      if (code !== 0) {
        console.error('Python script error:', error);
        return res.status(500).json({ 
          error: 'Prediction failed', 
          details: error 
        });
      }

      try {
        const prediction = JSON.parse(result);
        res.json({
          success: true,
          prediction: prediction.prediction,
          riskScore: prediction.risk_score,
          inputData
        });
      } catch (parseError) {
        console.error('Parse error:', parseError, 'Result:', result);
        res.status(500).json({ 
          error: 'Failed to parse prediction result',
          details: result
        });
      }
    });

  } catch (err) {
    console.error('Prediction error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get session with latest prediction
router.get('/session/:sessionId', async (req, res) => {
  try {
    const session = await Session.findById(req.params.sessionId);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Get the latest health point with prediction
    const latestHealth = session.healthPoints[session.healthPoints.length - 1];
    
    res.json({
      success: true,
      session,
      latestPrediction: latestHealth?.riskPrediction || null
    });
  } catch (err) {
    console.error('Error fetching session:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
