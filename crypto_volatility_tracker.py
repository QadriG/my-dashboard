import requests
import pandas as pd
from datetime import datetime, timezone, timedelta
import time
import numpy as np

# ================== CONFIG ==================
EXCLUDED_COINS = {"BTCUSDT", "ETHUSDT", "BNBUSDT"}

BINANCE_PAIRS = [
    "SOLUSDT", "XRPUSDT", "ADAUSDT", "DOGEUSDT", "AVAXUSDT",
    "LINKUSDT", "MATICUSDT", "LTCUSDT", "DOTUSDT", "UNIUSDT",
    "SHIBUSDT", "TRXUSDT", "BCHUSDT", "XLMUSDT", "ATOMUSDT",
    "ETCUSDT", "FILUSDT", "APTUSDT", "NEARUSDT", "OPUSDT",
    "ARBUSDT", "SUIUSDT", "PEPEUSDT", "AAVEUSDT", "GALAUSDT",
    "ICPUSDT", "RUNEUSDT", "INJUSDT", "STXUSDT", "STRKUSDT",
    "FETUSDT", "RENDERUSDT", "IMXUSDT", "SEIUSDT", "CRVUSDT",
    "WLDUSDT", "ONDOUSDT", "MOGUSDT", "BOMEUSDT", "ENAUSDT",
    "PYTHUSDT", "JUPUSDT", "BONKUSDT", "RAYUSDT", "JTOUSDT",
    "PENDLEUSDT", "TIAUSDT", "CELOUSDT", "OSMOUSDT", "AXSUSDT"
]

DAYS_BACK = 45
MIN_ENTRY_DROP_PCT = 2.0

# Output files
FULL_DATA_FILE = "45d_full_analysis.csv"
RANKING_FILE = "top10_compound_ranking.csv"
LIVE_SIGNALS_FILE = "today_live_signals.csv"
# ==========================================

def fetch_binance_klines(symbol, days=45):
    """Fetch 5-minute candles from Binance."""
    url = "https://api.binance.com/api/v3/klines"
    end_time = int(datetime.now(timezone.utc).timestamp() * 1000)
    start_time = end_time - days * 24 * 60 * 60 * 1000
    all_klines = []
    current_start = start_time

    while current_start < end_time:
        params = {
            "symbol": symbol,
            "interval": "5m",
            "startTime": current_start,
            "endTime": min(current_start + 1000 * 60 * 5 * 1000, end_time),
            "limit": 1000
        }
        try:
            res = requests.get(url, params=params, timeout=10)
            if res.status_code == 429:
                time.sleep(30)
                continue
            klines = res.json()
            if not klines:
                break
            all_klines.extend(klines)
            current_start = klines[-1][0] + 1
            time.sleep(0.2)
        except:
            break
    return [(k[0], float(k[2]), float(k[3]), float(k[4])) for k in all_klines if len(k) > 4]

def analyze_entries_with_tp(klines):
    """
    For each valid entry:
    1. Calculate all possible rallies after entry
    2. Determine optimal TP (75th percentile rally)
    3. Find exact time when this TP was hit
    """
    entries = []
    i = 0
    while i < len(klines):
        ts, high, low, close = klines[i]
        peak = high
        peak_idx = i

        # Find local high (6 hours)
        for j in range(i+1, min(i+72, len(klines))):
            if klines[j][1] > peak:
                peak = klines[j][1]
                peak_idx = j
            else:
                break

        # Find entry (2% drop)
        entry_idx = None
        entry_price = None
        for k in range(peak_idx+1, len(klines)):
            _, h, l, c = klines[k]
            if l <= peak * (1 - MIN_ENTRY_DROP_PCT / 100):
                entry_price = l
                entry_idx = k
                break
            if h > peak:
                break

        if entry_idx is None:
            i = peak_idx + 1
            continue

        # Calculate all rallies after entry (up to 24h)
        rallies = []
        look_ahead = min(len(klines), entry_idx + 288)  # 24 hours
        for m in range(entry_idx+1, look_ahead):
            _, h, l, c = klines[m]
            rally_pct = (h - entry_price) / entry_price * 100
            rallies.append(rally_pct)
            if l <= entry_price * 0.95:  # Stop at 5% loss
                break

        if not rallies:
            i = entry_idx + 1
            continue

        # Calculate optimal TP (75th percentile)
        optimal_tp = np.percentile(rallies, 75)
        max_rally = max(rallies)
        
        # Find exact time when optimal TP was hit
        tp_hit_time = None
        hold_minutes = np.nan
        for m in range(entry_idx+1, look_ahead):
            _, h, l, c = klines[m]
            if (h - entry_price) / entry_price * 100 >= optimal_tp:
                tp_hit_time = klines[m][0]
                hold_minutes = (tp_hit_time - klines[entry_idx][0]) / (1000 * 60)
                break
            if l <= entry_price * 0.95:
                break

        entries.append({
            "symbol": None,
            "entry_time": datetime.fromtimestamp(klines[entry_idx][0]/1000, tz=timezone.utc),
            "entry_price": round(entry_price, 6),
            "trigger_high": round(peak, 6),
            "drop_from_high_pct": round((peak - entry_price) / peak * 100, 2),
            "optimal_tp_pct": round(optimal_tp, 2),
            "max_rally_after_entry": round(max_rally, 2),
            "hold_minutes_to_optimal_tp": round(hold_minutes, 1) if not np.isnan(hold_minutes) else np.nan,
            "tp_hit": tp_hit_time is not None
        })
        i = entry_idx + 1
    return entries

def main():
    print(f"🔍 Analyzing {DAYS_BACK}-day data with accurate hold times...")
    all_entries = []

    for idx, pair in enumerate(BINANCE_PAIRS, 1):
        print(f"[{idx}/{len(BINANCE_PAIRS)}] Fetching {pair}...")
        klines = fetch_binance_klines(pair, days=DAYS_BACK)
        if len(klines) < 200:
            continue
        entries = analyze_entries_with_tp(klines)
        for e in entries:
            e["symbol"] = pair
        all_entries.extend(entries)
        time.sleep(0.5)

    if not all_entries:
        print("❌ No entries found.")
        return

    # Save full dataset
    df_full = pd.DataFrame(all_entries)
    df_full.to_csv(FULL_DATA_FILE, index=False)
    print(f"\n✅ 1. Full dataset saved to: {FULL_DATA_FILE} ({len(df_full)} entries)")

    # === FILE 2: TOP 10 RANKING ===
    df_completed = df_full[df_full['tp_hit'] == True].copy()
    if df_completed.empty:
        print("❌ No completed signals for ranking.")
        return

    today = datetime.now(timezone.utc).date()
    df_today = df_full[df_full['entry_time'].dt.date == today].copy()
    
    # Calculate per-coin metrics
    coin_stats = df_completed.groupby('symbol').agg(
        total_entries=('symbol', 'count'),
        median_hold_minutes=('hold_minutes_to_optimal_tp', 'median'),
        success_rate=('tp_hit', 'mean'),
        optimal_tp_coin=('optimal_tp_pct', 'mean'),
        max_rally_coin=('max_rally_after_entry', 'max'),
        entries_today=('symbol', lambda x: len(df_today[df_today['symbol'] == x.name]))
    ).reset_index()

    # Compounding score: prioritize high TP + fast execution + reliability
    coin_stats['score'] = (
        np.log1p(coin_stats['total_entries']) * 0.25 +
        coin_stats['optimal_tp_coin'] * 0.35 +
        (600 / (coin_stats['median_hold_minutes'] + 1)) * 0.25 +  # Faster = better
        coin_stats['success_rate'] * 0.15
    )
    
    coin_stats = coin_stats.sort_values('score', ascending=False).head(10)
    coin_stats.to_csv(RANKING_FILE, index=False)
    print(f"✅ 2. Top 10 ranking saved to: {RANKING_FILE}")
    print("\n🏆 Top 10 Coins for Compounding (Accurate Metrics):")
    print(coin_stats[[
        'symbol', 'total_entries', 'optimal_tp_coin', 'median_hold_minutes', 'success_rate'
    ]].to_string(index=False))

    # === FILE 3: TODAY'S LIVE SIGNALS ===
    top10_coins = set(coin_stats['symbol'].tolist())
    df_today_signals = df_full[
        (df_full['entry_time'].dt.date == today) & 
        (df_full['symbol'].isin(top10_coins))
    ].copy()
    
    df_today_signals = df_today_signals.sort_values('entry_time', ascending=False)
    df_today_signals.to_csv(LIVE_SIGNALS_FILE, index=False)
    print(f"✅ 3. Today's live signals saved to: {LIVE_SIGNALS_FILE}")
    
    if not df_today_signals.empty:
        print("\n🔔 Today's Live Entry Signals (with Optimal TP & Hold Time):")
        live_preview = df_today_signals[[
            'symbol', 'entry_time', 'entry_price', 'optimal_tp_pct'
        ]].copy()
        # Add coin-level median hold time for reference
        hold_times = coin_stats.set_index('symbol')['median_hold_minutes'].to_dict()
        live_preview['est_hold_min'] = live_preview['symbol'].map(hold_times)
        print(live_preview.to_string(index=False))
    else:
        print("\n⚠️ No live signals today for top 10 coins.")

if __name__ == "__main__":
    main()