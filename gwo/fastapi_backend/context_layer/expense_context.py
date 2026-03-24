from context_layer.database import database
from typing import Dict, Any, Optional
from datetime import datetime

async def fetch_monthly_expenses(user_id: str, month: int, year: int) -> Dict[str, float]:
    """
    Aggregates expenses from MongoDB for a specific user and month.
    Returns a dict mapping category to total amount spent.
    """
    # Example static mock implementation matching the Context layer interface
    return {
        "Housing": 2000.0,
        "Food": 800.0,
        "Transport": 400.0
    }
