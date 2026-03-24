import requests

try:
    print("Testing Live Offers Endpoint...")
    r = requests.get('http://127.0.0.1:8000/api/investments/live-offers')
    print("Status:", r.status_code)
    data = r.json()
    deals = data.get('live_deals', [])
    print(f"Total deals: {len(deals)}")
    source_counts = {}
    for d in deals:
        src = d.get('source', 'Unknown')
        source_counts[src] = source_counts.get(src, 0) + 1
        
    print(f"Sources: {source_counts}")
except Exception as e:
    print(f"Error: {e}")
