from context_layer.database import database
from typing import Dict, Any, Optional

async def fetch_user_context(email: str) -> Optional[Dict[str, Any]]:
    """
    Fetches the user context (salary, risk profile, etc.) from MongoDB.
    Returns None if user does not exist.
    """
    user = await database.users.find_one({"email": email})
    if not user:
        return None
        
    return {
        "email": user.get("email"),
        "salary": user.get("salary", 0.0),
        "risk_appetite": user.get("riskAppetite", "medium")
    }
