from fastapi import APIRouter, Depends, HTTPException
from typing import Dict, Any
from context_layer.database import database
from protocol_layer.schemas import UserDataSync, UserOut
from protocol_layer.routers.auth_routes import get_current_user
from bson import ObjectId

router = APIRouter(prefix="/api/sync", tags=["Data Sync"])

@router.get("/get_data", response_model=UserDataSync)
async def get_user_data(current_user: dict = Depends(get_current_user)):
    """
    Fetches the current user's localized state from MongoDB.
    """
    try:
        # User is already verified and fetched by get_current_user dependency
        return UserDataSync(
            income=current_user.get("income"),
            riskProfile=current_user.get("riskProfile", "medium"),
            expenses=current_user.get("expenses", []),
            savingsGoals=current_user.get("savingsGoals", [])
        )
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to fetch user data")

@router.post("/save_data")
async def save_user_data(data: UserDataSync, current_user: dict = Depends(get_current_user)):
    """
    Saves/Upserts the user's localized state to MongoDB.
    Allows partial updates - only provided fields are updated.
    """
    try:
        update_doc = {}
        if data.income is not None:
            update_doc["income"] = data.income
        if data.riskProfile is not None:
            update_doc["riskProfile"] = data.riskProfile
        if data.expenses is not None:
            update_doc["expenses"] = data.expenses
        if data.savingsGoals is not None:
            update_doc["savingsGoals"] = data.savingsGoals

        if not update_doc:
            return {"status": "success", "message": "No data to update"}

        result = await database.users.update_one(
            {"_id": current_user["_id"]},
            {"$set": update_doc}
        )
        
        return {"status": "success", "updated": True}
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail="Failed to save user data")
