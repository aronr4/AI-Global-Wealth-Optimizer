from fastapi import APIRouter
from protocol_layer.schemas import ProfilerRequest
from model_layer.scikit_predictor import predictor_engine
from model_layer.risk_calculator import calculate_risk_score
from model_layer.portfolio_optimizer import optimize_allocation
from model_layer.rag_service import retrieve_context

router = APIRouter(prefix="/api/ai", tags=["AI Recommendation"])

@router.post("/recommend")
async def get_ai_recommendation(request: ProfilerRequest):
    """
    MCP Architecture Endpoint:
    Protocol Layer receives and validates the schema.
    Context metadata is extracted from request schemas.
    Model Layer performs the heavy intelligence processing.
    """
    # 1. Model Layer: Calculate absolute numerical risk score
    # Note: since salary was replaced, use savings_budget as a proxy for the math function
    risk_score = calculate_risk_score(request.risk_profile, request.savings_budget)
    
    # 2. Model Layer: Scikit-learn predicts historical volatility return
    predicted_return = predictor_engine.predict_yield(volatility_index=risk_score)
    
    # 3. Model Layer: Optimize Portfolio Allocation dynamically
    allocation = optimize_allocation(request.savings_budget, risk_score)
    
    # 4. Model Layer: RAG FAISS vectors retrieve context based on strict budget rules!
    rag_results = retrieve_context(request.risk_profile, request.savings_budget)
    
    return {
        "status": "success",
        "context_analyzed": {
            "savings_budget": request.savings_budget,
            "risk_profile": request.risk_profile,
            "computed_numeric_risk": risk_score
        },
        "model_predictions": {
            "portfolio_allocation": allocation,
            "expected_yield_percentage": predicted_return,
            "rag_recommended_tickers": rag_results.get("stocks", []),
            "stock_tiers": rag_results.get("stock_tiers", {}),
            "rag_recommended_mutual_funds": rag_results.get("mutual_funds", [])
        }
    }
