from fastapi import APIRouter
from protocol_layer.schemas import ExpenseModel
from context_layer.database import database
from context_layer.expense_context import fetch_monthly_expenses

router = APIRouter(prefix="/api/expenses", tags=["Expense Tracker"])

MOCK_EXPENSES = {
    "Housing": 40000.0,
    "Food & Dining": 15000.0,
    "Transportation": 8000.0,
    "Entertainment": 6000.0
}

@router.post("/add")
async def add_expense(expense: ExpenseModel):
    # Simulate successful insertion
    print(f"Simulating addition of expense: {expense.dict()}")
    if expense.category in MOCK_EXPENSES:
        MOCK_EXPENSES[expense.category] += expense.amount
    else:
        MOCK_EXPENSES[expense.category] = expense.amount
    return {"status": "success", "inserted_id": "mocked_id_12345"}

@router.get("/summary/{user_id}")
async def expense_summary(user_id: str, month: int = 1, year: int = 2026):
    return MOCK_EXPENSES
