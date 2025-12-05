import hmac
import hashlib
import time
import requests
from datetime import datetime

API_KEY = "f9TJVV26jQd6VnExgK9ppDCMtL3RUkp16K2MwKFmR3YzJuqX9877sWzbbR7Uavy1"
API_SECRET = "ZpGBMLWhCbXNNCORykKtf3UNCGbq04bHrN4YfTjyjI70Kd80pIXFsweqZEDHI8UU"

def sign(query_string, secret):
    return hmac.new(secret.encode(), query_string.encode(), hashlib.sha256).hexdigest()

def fetch_spot_balance():
    timestamp = int(time.time() * 1000)
    recv_window = 60000
    query = f"timestamp={timestamp}&recvWindow={recv_window}"
    signature = sign(query, API_SECRET)
    url = f"https://api.binance.com/api/v3/account?{query}&signature={signature}"

    print(f"[TEST] Fetching spot balance from: {url}")

    try:
        response = requests.get(url, headers={"X-MBX-APIKEY": API_KEY}, timeout=10)
        print(f"[TEST] Status: {response.status_code}")

        data = response.json()
        if data.get("code") not in (None, 0):
            print(f"[TEST] API Error: {data.get('msg')}")
            return False

        # Filter non-zero assets
        balances = [
            asset for asset in data["balances"]
            if (float(asset["free"]) + float(asset["locked"])) > 0
        ]

        print(f"\n[TEST] Non-zero assets ({len(balances)} found):")
        for asset in balances:
            print(f"  {asset['asset']}: Free={asset['free']}, Locked={asset['locked']}")

        return {"success": True, "balances": balances}

    except Exception as e:
        print(f"[TEST] Error: {e}")
        return {"success": False, "error": str(e)}

def generate_spot_positions():
    result = fetch_spot_balance()
    if not result["success"]:
        return result

    balances = result["balances"]
    assets_to_price = [
        f"{asset['asset']}USDT"
        for asset in balances
        if asset["asset"] != "USDT"
    ]

    # Fetch current prices
    price_map = {}
    if assets_to_price:
        symbols = "[" + ",".join(f'"{s}"' for s in assets_to_price) + "]"
        price_url = f"https://api.binance.com/api/v3/ticker/price?symbols={symbols}"
        try:
            price_res = requests.get(price_url, timeout=5)
            if price_res.status_code == 200:
                for ticker in price_res.json():
                    price_map[ticker["symbol"]] = float(ticker["price"])
        except Exception as e:
            print(f"[TEST] Price fetch error: {e}")

    # Generate positions
    positions = []
    for asset in balances:
        total = float(asset["free"]) + float(asset["locked"])
        if total <= 0:
            continue

        symbol = f"{asset['asset']}USDT"
        price = price_map.get(symbol, 0)
        order_value = total * price

        positions.append({
            "symbol": symbol,
            "side": "buy",
            "amount": total,
            "orderValue": round(order_value, 2),
            "openPrice": price,
            "status": "open",
            "openDate": datetime.now().strftime("%m/%d/%Y, %H:%M"),
            "unrealizedPnl": 0
        })

    print(f"\n[TEST] Generated positions ({len(positions)} found):")
    for pos in positions:
        print(f"  Symbol: {pos['symbol']}, Amount: {pos['amount']}, Value: ${pos['orderValue']}")

    return {"success": True, "positions": positions}

if __name__ == "__main__":
    print("🚀 Starting Binance Spot Test (Python version)...")
    generate_spot_positions()