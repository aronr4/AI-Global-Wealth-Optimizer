from fastapi import APIRouter, HTTPException, Depends
from fastapi.security import OAuth2PasswordBearer
from context_layer.database import database
from protocol_layer.schemas import UserCreate, UserLogin, UserOut, Token
from protocol_layer.auth_utils import get_password_hash, verify_password, create_access_token
import logging

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/auth/login")

async def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        from jose import jwt
        from protocol_layer.auth_utils import SECRET_KEY, ALGORITHM
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
        
    try:
        user = await database.users.find_one({"email": email})
        if user is None:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except Exception as e:
        logger.error(f"Error fetching user {email}: {e}")
        raise HTTPException(status_code=401, detail="User not found")

@router.post("/register", response_model=Token)
async def register(user: UserCreate):
    try:
        existing_user = await database.users.find_one({"email": user.email})
        if existing_user:
            raise HTTPException(status_code=400, detail="the email already exits")

        hashed_pwd = get_password_hash(user.password)
        user_dict = user.dict()
        user_dict.pop("password")
        user_dict["hashed_password"] = hashed_pwd

        result = await database.users.insert_one(user_dict)
        
        access_token = create_access_token(data={"sub": user.email, "id": str(result.inserted_id)})
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/login", response_model=Token)
async def login(user: UserLogin):
    try:
        db_user = await database.users.find_one({"email": user.email})
        if not db_user or not verify_password(user.password, db_user["hashed_password"]):
            raise HTTPException(status_code=400, detail="Incorrect email or password")
        
        access_token = create_access_token(data={"sub": db_user["email"], "id": str(db_user["_id"])})
        return {"access_token": access_token, "token_type": "bearer"}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/me", response_model=UserOut)
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user


