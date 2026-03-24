def calculate_risk_score(risk_appetite: str, salary: float) -> float:
    """
    Computes a normalized risk score multiplier (0.5 to 2.5)
    """
    base_score = 1.0
    if risk_appetite == "high":
        base_score = 2.0
    elif risk_appetite == "low":
        base_score = 0.5
        
    # Slightly increase risk tolerance for very high salaries (safety net)
    if salary > 10000:
        base_score += 0.2
        
    return round(base_score, 2)
