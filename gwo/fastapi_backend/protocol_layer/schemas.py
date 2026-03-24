from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

class UserCreate(BaseModel):
    name: str # Added name
    email: EmailStr
    password: str = Field(min_length=6)
    salary: float = 0.0
    riskAppetite: str = "medium"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserOut(BaseModel):
    name: str = "User"
    email: EmailStr
    salary: float = 0.0
    riskAppetite: str = "medium"

class UserInDB(UserCreate):
    id: str
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str



class AssetModel(BaseModel):
    name: str
    type: str
    value: float
    allocationPercent: Optional[float] = None

class ExpenseModel(BaseModel):
    name: str
    category: str
    amount: float
    date: datetime = Field(default_factory=datetime.utcnow)

class SalaryAllocation(BaseModel):
    investment: float
    expenses: float
    savings: float

class ProfilerRequest(BaseModel):
    savings_budget: float # replacing salary with dynamic user-driven savings for filtering
    risk_profile: str

class UserDataSync(BaseModel):
    income: Optional[float] = None
    riskProfile: Optional[str] = None
    expenses: Optional[list] = None
    savingsGoals: Optional[list] = None
