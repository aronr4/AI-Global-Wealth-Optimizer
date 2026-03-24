from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from protocol_layer.routers import ai_routes, auth_routes, salary_routes, investment_routes, expense_routes, sync_routes
from model_layer import rag_service
from contextlib import asynccontextmanager
import logging

logging.basicConfig(level=logging.INFO)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize FAISS and yfinance stock data from the Model Layer
    from context_layer.database import check_db_connection
    await check_db_connection()
    import asyncio
    # Run RAG initialization in the background
    asyncio.create_task(asyncio.to_thread(rag_service.init_rag_pipeline))
    yield

app = FastAPI(
    title="MCP Global Wealth Optimizer API",
    description="FastAPI backend utilizing strict Model, Context, and Protocol abstraction layers.",
    version="2.0.0",
    lifespan=lifespan
)

# Enable CORS for React Frontend Integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Temporarily permissive for local dev debugging
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Modular Routers from Protocol Layer
app.include_router(ai_routes.router)
app.include_router(auth_routes.router)
app.include_router(salary_routes.router)
app.include_router(investment_routes.router)
app.include_router(expense_routes.router)
app.include_router(sync_routes.router)

@app.get("/")
async def root():
    return {"message": "MCP Refactored API is running. Visit /docs to see the Swagger Documentation."}
