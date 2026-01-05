const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const { sendSMS } = require('../utils/twilio');
const jwt = require('jsonwebtoken');

function genOTP() {
  return Math.floor(100000 + Math.random()*900000).toString();
}

router.post('/session/:id/send-guardian-link', async (req,res)=>{
  const { id } = req.params;
  const s = await Session.findById(id);
  if (!s) return res.status(404).json({error:'not found'});
  const otp = genOTP();
  s.guardianOTP = otp;
  await s.save();
  // Frontend URL instead of backend
  const link = `http://localhost:5173/?sessionId=${s._id}`;
  const body = `Ambulance emergency alert! Access patient monitoring: ${link}\nYour OTP: ${otp}.`;
  await sendSMS(s.guardianContact, body);
  res.json({ok:true, link});
});

router.post('/verify', async (req,res)=>{
  const { sessionId, nic, otp, patientGender } = req.body;
  const s = await Session.findById(sessionId);
  if (!s) return res.status(404).json({error:'not found'});
  if (s.guardianNIC !== nic || s.guardianOTP !== otp) return res.status(401).json({error:'invalid'});
  s.guardianVerified = true;
  // Update patient gender if provided
  if (patientGender !== undefined) {
    s.patientGender = patientGender;
  }
  await s.save();
  const token = jwt.sign({ sessionId }, process.env.JWT_SECRET || 'dev', {expiresIn:'4h'});
  // Return session data including existing health points and chat history
  res.json({
    token,
    session: {
      _id: s._id,
      status: s.status,
      patientName: s.patientName,
      patientAge: s.patientAge,
      ambulanceId: s.ambulanceId,
      paramedicName: s.paramedicName
    },
    healthPoints: s.healthPoints || [],
    chat: s.chat || []
  });
});

module.exports = router;
