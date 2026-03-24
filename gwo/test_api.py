import requests
import json

try:
    print("Testing /api/investments/market")
    r1 = requests.get("http://localhost:8000/api/investments/market")
    print(r1.status_code)
    print(r1.text[:200])
except Exception as e:
    print(e)
    
try:
    print("\nTesting /api/ai/recommend")
    r2 = requests.post("http://localhost:8000/api/ai/recommend", json={"salary": 50000, "risk_profile": "medium"})
    print(r2.status_code)
    print(r2.text[:200])
except Exception as e:
    print(e)
    
