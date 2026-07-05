[README.md](https://github.com/user-attachments/files/29673823/README.md)
# 💰 AI Global Wealth Optimizer

An automated wealth management platform that delivers personalized stock and mutual fund recommendations based on user risk profiles, forecasts annual investment yields using market volatility, and dynamically schedules capital allocations to help users meet savings goals.

---

## 🚀 Project Overview

Built on a strict **Model-Context-Protocol (MCP)** architecture, the AI Global Wealth Optimizer combines a **LangChain-FAISS RAG** recommendation engine and a **Scikit-Learn Random Forest Regressor** to provide intelligent, data-driven financial planning. Users can track expenses, set savings goals, and receive AI-curated investment portfolios — all within a sleek, interactive dashboard.

---

## ✨ Key Features

- 🧠 **AI Portfolio Recommendation** — Semantic vector search using LangChain + FAISS + HuggingFace embeddings to match users with high-yield stocks and mutual funds based on risk appetite and budget.
- 📈 **Yield Prediction Model** — Scikit-Learn Random Forest Regressor trained on Yahoo Finance historical data to forecast 1-year investment yields using 30-day volatility and moving averages.
- 💼 **Capital Allocation Engine** — Automated budgeting system that dynamically distributes user income across investments, expenses, and savings goals.
- 📊 **Interactive Dashboard** — Glassmorphic React UI with real-time Recharts visualizations for asset allocation, goal tracking, and expense analytics.
- 🔐 **Secure Authentication** — JWT-based login/register flow with bcrypt password hashing and Pydantic-validated API schemas.
- 🗄️ **NoSQL Data Layer** — Async MongoDB (via Motor) for storing user profiles, expenses, portfolios, and AI recommendation history.

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, React Router, Recharts, Lucide Icons |
| Backend | Python, FastAPI, Uvicorn |
| AI / ML | LangChain, FAISS Vector DB, HuggingFace Embeddings, Scikit-Learn |
| Data | Yahoo Finance API (yfinance), Pandas, NumPy |
| Database | MongoDB Atlas, Motor (async) |
| Auth | JWT (python-jose), Passlib, Bcrypt |
| Scraping | BeautifulSoup4, Requests |
| Deployment | Vercel (Frontend), Render (Backend) |

---

## 🏗️ Architecture — MCP Pattern

```
┌─────────────────────────────────────────────┐
│           Presentation Layer (React)         │
│   Dashboard | Portfolio | Expenses | Goals   │
└─────────────────────┬───────────────────────┘
                       │ JSON REST API
┌─────────────────────▼───────────────────────┐
│         Protocol Layer (FastAPI Routers)     │
│  auth | investment | expense | salary | sync │
└──────────┬──────────────────────┬───────────┘
           │                      │
┌──────────▼──────────┐  ┌───────▼──────────┐
│   Model Layer       │  │  Context Layer   │
│ RAG Service (FAISS) │  │ MongoDB (Motor)  │
│ Random Forest (.pkl)│  │ User / Expense   │
│ Risk Calculator     │  │ Context Queries  │
└─────────────────────┘  └──────────────────┘
```

---

## ⚙️ Local Setup & Running

### Prerequisites
- Python 3.10+
- Node.js 18+
- MongoDB (local or Atlas URI in `.env`)

### 1. Clone the Repository
```bash
git clone https://github.com/YourUsername/AI-Global-Wealth-Optimizer.git
cd AI-Global-Wealth-Optimizer/gwo
```

### 2. Setup Environment Variables
Create a `.env` file inside `fastapi_backend/`:
```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
```

### 3. Run the Project (One Command)
```bash
# Windows
run_project.bat
```

This will:
- Auto-create Python virtual environment
- Install all backend dependencies
- Install all frontend dependencies
- Launch FastAPI backend at `http://localhost:8000`
- Launch React frontend at `http://localhost:5173`

### 4. Manual Run (Optional)

**Backend:**
```bash
cd fastapi_backend
venv\Scripts\python.exe -m uvicorn main:app --host 0.0.0.0 --reload
```

**Frontend:**
```bash
cd frontend
npm run dev
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | Login and receive JWT |
| GET | `/investment/recommendations` | Get AI portfolio picks |
| POST | `/expense/add` | Add an expense entry |
| GET | `/salary/allocation` | Get income allocation split |
| POST | `/sync/data` | Sync user financial data |
| GET | `/docs` | Interactive Swagger API Docs |

---

## 🗂️ Project Structure

```
gwo/
├── fastapi_backend/
│   ├── model_layer/          # ML models, RAG service, stock universe
│   │   ├── rag_service.py    # LangChain + FAISS vector pipeline
│   │   ├── scikit_predictor.py  # Random Forest yield prediction
│   │   ├── stock_universe.py # NSE/global stock metadata
│   │   └── stock_ml_model.pkl   # Pre-trained model weights
│   ├── context_layer/        # Database connections and queries
│   │   ├── database.py       # MongoDB async client
│   │   ├── user_context.py   # User CRUD operations
│   │   └── expense_context.py
│   ├── protocol_layer/       # API routers and Pydantic schemas
│   │   ├── routers/
│   │   │   ├── auth_routes.py
│   │   │   ├── investment_routes.py
│   │   │   ├── expense_routes.py
│   │   │   └── ...
│   │   └── schemas.py
│   ├── main.py               # FastAPI app entry point
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── pages/            # Dashboard, Portfolio, Expenses, Goals
│   │   ├── components/       # Reusable UI components
│   │   └── layouts/
│   └── package.json
├── README.md
├── architecture.mmd          # System architecture diagram
├── mongodb_schema.md         # Database schema reference
└── deployment_guide.md       # Production deployment steps
```

---

## 🌐 Deployment

| Service | Platform |
|---------|----------|
| Frontend | [Vercel](https://vercel.com) |
| Backend | [Render](https://render.com) |
| Database | [MongoDB Atlas](https://cloud.mongodb.com) |

See [`deployment_guide.md`](./deployment_guide.md) for step-by-step production deployment instructions.

---

## 🔒 Security Notes

- `.env` file is **excluded from version control** via `.gitignore`.
- Never commit your `MONGO_URI` or `JWT_SECRET` to GitHub.
- Use environment variables on your deployment platform (Render / Vercel) to inject secrets securely.

---

## 📄 License

This project is for educational and portfolio demonstration purposes.

---

> Built with ❤️ by Aron
