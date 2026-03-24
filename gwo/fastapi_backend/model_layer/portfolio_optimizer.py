def optimize_allocation(salary: float, risk_score: float):
    """
    Core logic applying the 50/30/20 rule, dynamically adjusted by ML model risk score
    """
    base_investment = salary * 0.30
    expenses = salary * 0.50
    savings = salary * 0.20
    
    # Inside investment bucket, optimize Equities vs Bonds using risk_score
    equity_ratio = min(0.9, 0.4 * risk_score)  # Higher risk = higher equity
    bond_ratio = 1.0 - equity_ratio
    
    return {
        "monthly_investment_budget": base_investment,
        "living_expenses": expenses,
        "liquid_savings": savings,
        "suggested_portfolio": {
            "equities": round(base_investment * equity_ratio, 2),
            "safe_bonds": round(base_investment * bond_ratio, 2)
        }
    }
