const Twilio = require('twilio');

let client = null;

// Only initialize Twilio if valid credentials are provided
if (process.env.TWILIO_ACCOUNT_SID && 
    process.env.TWILIO_AUTH_TOKEN && 
    process.env.TWILIO_ACCOUNT_SID.startsWith('AC')) {
  try {
    client = Twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    console.log('[twilio] Client initialized successfully');
  } catch (err) {
    console.log('[twilio] Failed to initialize:', err.message);
  }
} else {
  console.log('[twilio] Not configured - SMS will be logged to console only');
}

async function sendSMS(to, body) {
  if (!client) {
    console.log('[twilio] SMS not sent (no client):', to, body);
    return null;
  }
  try {
    const message = await client.messages.create({
      from: process.env.TWILIO_PHONE_NUMBER,
      to,
      body
    });
    console.log('[twilio] SMS sent:', message.sid);
    return message;
  } catch (err) {
    console.log('[twilio] SMS failed:', err.message);
    return null;
  }
}

module.exports = { sendSMS };
