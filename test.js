import fetch from 'node-fetch';
import crypto from 'crypto';

const apiKey = "751d92a76fd95a1573adc2c8a5f7d950";
const secretKey = "c47ef32c9610264f70a1fef0bbad1361";

const endpoint = '/api/spot/v1/user/account';
const method = 'GET';
const timestamp = Date.now().toString();
const nonce = crypto.randomBytes(16).toString('hex');

// For GET, body is empty string
const body = '';
const payload = timestamp + method + endpoint + nonce + body;

// Correct signature: HMAC SHA256 of payload with secret
const sign = crypto.createHmac('sha256', secretKey).update(payload).digest('hex');

const url = `https://openapi.bitunix.com${endpoint}`;

try {
  const res = await fetch(url, {
    method,
    headers: {
      'api-key': apiKey,
      'timestamp': timestamp,
      'nonce': nonce,
      'sign': sign,
      'Content-Type': 'application/json',
    },
  });

  const data = await res.json();
  console.log(data);
} catch (err) {
  console.error('Error fetching balance:', err);
}

