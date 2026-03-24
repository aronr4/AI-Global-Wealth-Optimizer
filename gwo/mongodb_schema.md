# MongoDB Schema Documentation

Although MongoDB is a NoSQL schema-less database, the **Global Wealth Optimizer** enforces strict data integrity using **Pydantic** validation models within the Protocol layer.

Below are the exact data structures expected and validated within the NoSQL collections:

## 1. `users` Collection
Stores authentication node profiles and explicit API metadata constraints.
```json
{
  "_id": ObjectId("64eb8c39e2..."),
  "name": "Alex Optimizer",
  "email": "alex@example.com",
  "hashed_password": "$2b$12$SecureBcryptHash...",
  "risk_appetite": "medium",
  "salary": 6500.00
}
```

## 2. `expenses` Collection
Stores segmented financial outflows mapped closely to individual users.
```json
{
  "_id": ObjectId("64eb9d1aa1..."),
  "user_id": "64eb8c39e2...",
  "category": "Food & Dining",
  "amount": "145.50",
  "date": ISODate("2026-03-01T14:30:00Z"),
  "notes": "Trader Joes groceries"
}
```

## 3. `portfolios` Collection
*(Planned expansion table for storing explicit multi-asset states)*
```json
{
  "_id": ObjectId("64eb..."),
  "user_id": "64eb8c39e2...",
  "asset_name": "S&P 500 Index ETF",
  "asset_ticker": "SPY",
  "total_value": 75000.00,
  "allocation_percentage": 55.0,
  "type": "equity"
}
```

## 4. `investment_recommendations` Collection
*(Stores historical snapshots of the RAG Model output vectors)*
```json
{
  "_id": ObjectId("64ff..."),
  "user_id": "64eb8c39e2...",
  "generated_at": ISODate("2026-03-04T02:15:00Z"),
  "risk_score_matrix": 7.4,
  "expected_yield": 20.47,
  "rag_vectors": ["AAPL", "NVDA", "SPY"]
}
```
