const axios = require('axios');

// Text.lk SMS Service Configuration
const TEXT_LK_API_URL = 'https://app.text.lk/api/v3/sms/send';
let isConfigured = false;

if (process.env.TEXT_LK_API_KEY) {
  isConfigured = true;
  console.log('[text.lk] SMS service configured successfully');
} else {
  console.log('[text.lk] Not configured - SMS will be logged to console only');
  console.log('[text.lk] Please set TEXT_LK_API_KEY in .env file');
}

async function sendSMS(to, body) {
  if (!isConfigured) {
    console.log('[text.lk] SMS not sent (no API key configured)');
    console.log('[text.lk] To:', to);
    console.log('[text.lk] Message:', body);
    return null;
  }

  try {
    // Format phone number - remove leading 0 if present and add 94 country code
    let formattedNumber = to.replace(/\s+/g, ''); // Remove spaces
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '94' + formattedNumber.substring(1);
    } else if (formattedNumber.startsWith('+94')) {
      formattedNumber = formattedNumber.substring(1);
    } else if (!formattedNumber.startsWith('94')) {
      formattedNumber = '94' + formattedNumber;
    }

    console.log('[text.lk] Attempting to send SMS to:', formattedNumber);
    console.log('[text.lk] Using Sender ID:', process.env.TEXT_LK_SENDER_ID || 'NotSet');

    const response = await axios.post(
      TEXT_LK_API_URL,
      {
        recipient: formattedNumber,
        sender_id: process.env.TEXT_LK_SENDER_ID || 'TextLK',
        message: body
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.TEXT_LK_API_KEY}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        timeout: 10000
      }
    );

    if (response.data.status === 'error') {
      console.error('[text.lk] ❌ SMS API returned error:', response.data.message);
      console.error('[text.lk] 📋 ACTION REQUIRED:');
      console.error('[text.lk]    1. Login to https://app.text.lk');
      console.error('[text.lk]    2. Go to Settings → Sender IDs');
      console.error('[text.lk]    3. Check your approved Sender IDs');
      console.error('[text.lk]    4. Update TEXT_LK_SENDER_ID in .env file with an approved ID');
      return null;
    }

    console.log('[text.lk] ✅ SMS sent successfully!');
    console.log('[text.lk] Response:', response.data);
    return response.data;
  } catch (err) {
    if (err.response) {
      console.error('[text.lk] SMS failed with status:', err.response.status);
      console.error('[text.lk] Error response:', err.response.data);
    } else if (err.request) {
      console.error('[text.lk] No response received:', err.message);
    } else {
      console.error('[text.lk] Error:', err.message);
    }
    return null;
  }
}

module.exports = { sendSMS };
