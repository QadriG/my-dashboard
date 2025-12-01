import hmac
import hashlib
import time
import requests

# 🔴 NEVER hardcode keys in production — this is for local testing only
API_KEY = "f9TJVV26jQd6VnExgK9ppDCMtL3RUkp16K2MwKFmR3YzJuqX9877sWzbbR7Uavy1"
API_SECRET = "ZpGBMLWhCbXNNCORykKtf3UNCGbq04bHrN4YfTjyjI70Kd80pIXFsweqZEDHI8UU"

timestamp = int(time.time() * 1000)
recv_window = 60000

query_string = f"timestamp={timestamp}&recvWindow={recv_window}"
signature = hmac.new(
    API_SECRET.encode('utf-8'),
    query_string.encode('utf-8'),
    hashlib.sha256
).hexdigest()

url = f"https://api.binance.com/api/v3/account?{query_string}&signature={signature}"
headers = {"X-MBX-APIKEY": API_KEY}

print("Request URL:", url)
print("Making request...")

response = requests.get(url, headers=headers)

print("\n--- Response ---")
print("Status Code:", response.status_code)
print("Response Body:")
print(response.text)