import requests

res = requests.post("http://127.0.0.1:8000/api/expenses/add", json={
    "user_id": "user_123",
    "category": "Housing",
    "amount": 100,
    "name": "Test Expense"
})
print("STATUS CODE:", res.status_code)
print("RESPONSE BODY:", res.text)
