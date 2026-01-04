const express = require('express');
const router = express.Router();
const Ambulance = require('../models/Ambulance');
const Session = require('../models/Session');
const jwt = require('jsonwebtoken');
router.post('/signup', async (req, res) => {
  const { ambulanceId, password } = req.body;
  if (!ambulanceId || !password) return res.status(400).json({error:'ambulanceId and password required'});
  try {
    const a = new Ambulance({ ambulanceId });
    await a.setPassword(password);
    await a.save();
    res.json({ok:true});
  } catch (err) {
    res.status(500).json({error: err.message});
  }
});

router.post('/login', async (req,res)=>{
  const { ambulanceId, password } = req.body;
  const a = await Ambulance.findOne({ ambulanceId });
  if (!a) return res.status(401).json({error:'invalid'});
  const valid = await a.validatePassword(password);
  if (!valid) return res.status(401).json({error:'invalid'});
  const token = jwt.sign({ ambulanceId }, process.env.JWT_SECRET || 'dev', {expiresIn:'12h'});
  res.json({token});
});

router.post('/session/start', async (req,res)=>{
  const { ambulanceId, paramedicName,paramedicId,patientName,patientAge,guardianNIC,guardianContact,mode } = req.body;
  if (!ambulanceId) return res.status(400).json({error:'ambulanceId required'});
  const session = new Session({ ambulanceId, paramedicName,paramedicId,patientName,patientAge,guardianNIC,guardianContact,mode, status:'ongoing', startedAt:new Date() });
  await session.save();
  res.json({session});
});

router.post('/session/:id/stop', async (req,res)=>{
  const { id } = req.params;
  const s = await Session.findById(id);
  if (!s) return res.status(404).json({error:'not found'});
  s.status = 'arriving';
  s.endedAt = new Date();
  await s.save();
  res.json({ok:true});
});

router.post('/session/:id/end', async (req,res)=>{
  const { id } = req.params;
  const { sendSMS } = require('../utils/twilio');
  const s = await Session.findById(id);
  if (!s) return res.status(404).json({error:'not found'});
  s.status = 'ended';
  await s.save();
  
  // Build detailed summary with last health record
  let summary = `Hospital Arrival: ${s.patientName} (Age ${s.patientAge}) has arrived safely.\n\n`;
  
  // Include last health record if available
  if (s.healthPoints && s.healthPoints.length > 0) {
    const lastHealth = s.healthPoints[s.healthPoints.length - 1];
    summary += `Final Vitals:\n`;
    summary += `Heart Rate: ${lastHealth.heartRate} bpm, Temp: ${lastHealth.bodyTemperature}C, SpO2: ${lastHealth.bloodOxygen}%\n`;
    
    // Include AI prediction if available
    if (lastHealth.riskPrediction) {
      summary += `AI Risk: ${lastHealth.riskPrediction.prediction}\n`;
    }
    
    summary += `Total readings: ${s.healthPoints.length}\n\n`;
  } else {
    summary += `Total readings: ${s.healthPoints.length}\n\n`;
  }
  
  summary += `Please stay calm. Your loved one is now receiving professional medical care.`;
  
  await sendSMS(s.guardianContact, summary);
  res.json({ok:true});
});

router.get('/sessions/:ambulanceId', async (req,res)=>{
  const { ambulanceId } = req.params;
  const sessions = await Session.find({ ambulanceId }).sort({ startedAt: -1 }).limit(20);
  res.json({sessions});
});

router.get('/session/active/:ambulanceId', async (req,res)=>{
  const { ambulanceId } = req.params;
  const activeSession = await Session.findOne({
    ambulanceId, 
    status: { $in: ['ongoing', 'arriving'] } 
  }).sort({ startedAt: -1 });
  res.json({ session: activeSession });
});

module.exports = router;