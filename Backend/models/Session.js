const mongoose = require('mongoose');

const HealthPointSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  heartRate: Number,
  bodyTemperature: Number,
  bloodOxygen: Number,
  note: String,
  riskPrediction: {
    prediction: String,  // "High Risk" or "Low Risk"
    riskScore: Number,   // Probability score (0-1)
    timestamp: Date
  }
});

const SessionSchema = new mongoose.Schema({
  ambulanceId: { type: String, required: true },
  paramedicName: String,
  paramedicId: String,
  patientName: String,
  patientAge: Number,
  patientGender: { type: Number, enum: [0, 1], default: 1 },  // 0=Female, 1=Male
  guardianNIC: String,
  guardianContact: String,
  mode: { type: String, enum: ['automatic','manual'], default: 'manual' },
  status: { type: String, enum: ['draft','ongoing','arriving','ended'], default: 'draft' },
  startedAt: Date,
  endedAt: Date,
  guardianOTP: String,
  guardianVerified: { type: Boolean, default: false },
  healthPoints: [HealthPointSchema],
  chat: [{sender:String, text:String, timestamp:Date}]
});

module.exports = mongoose.model('Session', SessionSchema);
