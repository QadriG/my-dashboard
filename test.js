import fetch from 'node-fetch';
import crypto from 'crypto';

const apiKey = "751d92a76fd95a1573adc2c8a5f7d950";
const secretKey = "c47ef32c9610264f70a1fef0bbad1361";

const endpoint = '/api/spot/v1/user/account';
const method = 'GET';
const timestamp = Date.now().toString();
const nonce = crypto.randomBytes(16).toString('hex');

// For GET, no query params and no body
const queryParams = '';  // empty since GET and no query string
const body = '';          // empty string

// Step 1: digest = SHA256(nonce + timestamp + apiKey + queryParams + body)
const digestInput = nonce + timestamp + apiKey + queryParams + body;
const digest = crypto.createHash('sha256').update(digestInput).digest('hex');

// Step 2: sign = SHA256(digest + secretKey)
const signInput = digest + secretKey;
const sign = crypto.createHash('sha256').update(signInput).digest('hex');

const url = `https://openapi.bitunix.com${endpoint}`;

const response = await fetch(url, {
  method,
  headers: {
    'api-key': apiKey,
    'nonce': nonce,
    'timestamp': timestamp,
    'sign': sign,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
console.log(data);
