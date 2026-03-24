import jwt

token = "MOCK_GOOGLE_TOKEN"

try:
    idinfo = jwt.decode(token, options={"verify_signature": False})
    print(idinfo)
except Exception as e:
    print(f"Error decoding: {e}")
