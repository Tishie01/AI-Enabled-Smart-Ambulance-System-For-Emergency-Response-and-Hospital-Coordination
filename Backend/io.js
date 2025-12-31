const Session = require('./models/Session');
const { spawn } = require('child_process');
const path = require('path');

// Function to call AI prediction
async function predictRisk(healthData, patientAge) {
  return new Promise((resolve, reject) => {
    const inputData = {
      "Heart Rate": healthData.heartRate || 0,
      "Body Temperature": healthData.bodyTemperature || 0,
      "SpO2": healthData.bloodOxygen || 0,
      "Age": patientAge || 0,
      "Gender": 1  // Default to male, can be enhanced later
    };

    console.log('🎯 Calling Python predictor with data:', inputData);

    // Use the properly trained ML model (predictor.py with Random Forest + StandardScaler)
    const pythonScript = path.join(__dirname, 'AI-Model', 'predictor.py');
    console.log('📁 Python script path:', pythonScript);
    
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
        console.error('❌ Python prediction error (exit code ' + code + '):', error);
        resolve(null); // Return null on error, don't break the flow
      } else {
        try {
          console.log('📥 Python output:', result);
          const prediction = JSON.parse(result);
          console.log('✅ Parsed prediction:', prediction);
          resolve({
            prediction: prediction.prediction,
            riskScore: prediction.risk_score,
            timestamp: new Date()
          });
        } catch (parseError) {
          console.error('❌ Parse error:', parseError, 'Raw output:', result);
          resolve(null);
        }
      }
    });
  });
}

function setupIO(io){
  io.on('connection', socket=>{
    console.log('socket connected', socket.id);

    socket.on('joinSession', async ({sessionId, role})=>{
      socket.join(sessionId);
      console.log('joined', sessionId, role);
    });

    socket.on('health:update', async ({sessionId, point})=>{
      console.log('📊 Health update received:', point);
      const s = await Session.findById(sessionId);
      if (!s) {
        console.error('❌ Session not found:', sessionId);
        return;
      }
      
      console.log('🔮 Calling AI prediction for patient age:', s.patientAge);
      // Get AI risk prediction
      const riskPrediction = await predictRisk(point, s.patientAge);
      
      console.log('✅ AI Prediction result:', riskPrediction);
      
      // Add risk prediction to health point
      if (riskPrediction) {
        point.riskPrediction = riskPrediction;
        console.log('✅ Risk prediction added to health point');
      } else {
        console.warn('⚠️ No risk prediction returned from AI model');
      }
      
      s.healthPoints.push(point);
      await s.save();
      
      console.log('📤 Emitting health update with prediction:', point.riskPrediction);
      // Emit health update with risk prediction to all clients
      io.to(sessionId).emit('health:update', point);
    });

    socket.on('chat:send', async ({sessionId, sender, text})=>{
      const s = await Session.findById(sessionId);
      if (!s) return;
      const msg = { sender, text, timestamp: new Date() };
      s.chat.push(msg);
      await s.save();
      io.to(sessionId).emit('chat:message', msg);
    });

    socket.on('status:update', async ({sessionId, status})=>{
      const s = await Session.findById(sessionId);
      if (!s) return;
      s.status = status;
      if (status === 'arriving') s.endedAt = new Date();
      await s.save();
      io.to(sessionId).emit('status:changed', {status});
    });

  });
}

module.exports = setupIO;
