import urllib.request
import time
import json

def test_endpoint(url, name, timeout=15):
    try:
        with urllib.request.urlopen(url, timeout=timeout) as response:
            body = response.read().decode('utf-8')
            data = json.loads(body)
            if isinstance(data, list): count = len(data)
            elif isinstance(data, dict) and "ticks" in data: count = len(data["ticks"])
            else: count = "N/A"
            return True, count
    except Exception as e:
        return False, str(e)

def main():
    base_url = "http://localhost:8000/api"
    
    print("Step 1: Triggering background refresh...")
    ok, count = test_endpoint(f"{base_url}/investments/market", "Market Trigger")
    print(f"Trigger call returned count: {count}")
    
    print("Step 2: Waiting 30s for background fetch to progress...")
    time.sleep(30)
    
    print("Step 3: Checking Market Data again...")
    ok, count = test_endpoint(f"{base_url}/investments/market", "Market Check")
    print(f"Market Check count: {count}")
    
    print("Step 4: Checking Live Ticks...")
    ok, t_count = test_endpoint(f"{base_url}/investments/market/live-tick", "Live Tick")
    print(f"Live Tick count: {t_count}")
    
    if count > 0 and t_count > 0:
        print("\nSUCCESS: Background refresh is working and data is populated.")
    else:
        print("\nSTILL EMPTY: Check backend logs or wait longer.")

if __name__ == "__main__":
    main()
