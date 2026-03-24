from fastapi import APIRouter
from protocol_layer.schemas import SalaryAllocation
from model_layer.portfolio_optimizer import optimize_allocation

router = APIRouter(prefix="/api/salary", tags=["Salary Optimization"])

@router.get("/optimize/{salary}", response_model=SalaryAllocation)
async def optimize_salary(salary: float):
    # Delegate complex optimization logic to the Model Layer
    allocation = optimize_allocation(salary, risk_score=1.0)
    return {
        "investment": allocation["monthly_investment_budget"],
        "expenses": allocation["living_expenses"],
        "savings": allocation["liquid_savings"]
    }
