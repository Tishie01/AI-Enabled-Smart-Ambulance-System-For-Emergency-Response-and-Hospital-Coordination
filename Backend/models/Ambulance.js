const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const AmbulanceSchema = new mongoose.Schema({
  ambulanceId: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

AmbulanceSchema.methods.setPassword = async function(password) {
  this.passwordHash = await bcrypt.hash(password, 10);
}

AmbulanceSchema.methods.validatePassword = async function(password) {
  return bcrypt.compare(password, this.passwordHash);
}

module.exports = mongoose.model('Ambulance', AmbulanceSchema);
