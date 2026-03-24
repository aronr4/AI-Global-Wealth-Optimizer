import requests
from pymongo import MongoClient
import os

print("Connecting to MongoDB locally...")
client = MongoClient("mongodb://127.0.0.1:27017")
db = client.global_wealth_optimizer

# Fetch one old user that lacks a name
u = db.users.find_one({"name": {"$exists": False}})
if u:
    print(f"Found old user: {u['email']}")
    
    # Let's login using a fake token from auth_utils
    from protocol_layer.auth_utils import create_access_token
    t_data = {"sub": u["email"], "id": str(u["_id"])}
    token = create_access_token(t_data)
    
    # Request /auth/me
    print("Testing /auth/me ... ")
    r = requests.get(
        'http://127.0.0.1:8000/api/auth/me',
        headers={"Authorization": f"Bearer {token}"}
    )
    print("Status:", r.status_code)
    try:
         print(r.json())
    except:
         print(r.text)
else:
    print("No old users found without name.")
